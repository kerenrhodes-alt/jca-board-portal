// Phase 5: list files in a Drive folder using the JCA service account.
//
// Auth: two layers. (1) Supabase platform-level JWT verification rejects
// unauthenticated requests before this code runs. (2) We additionally
// confirm the caller is an *active* board_members row before talking to
// Drive — belt-and-suspenders given Drive content can be sensitive.

import { createClient } from 'npm:@supabase/supabase-js@2';

interface ServiceAccountCreds {
  client_email: string;
  private_key: string;
}

const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function base64UrlEncode(input: string | Uint8Array): string {
  const bytes =
    typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const cleaned = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '');
  const der = Uint8Array.from(atob(cleaned), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    der.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

async function getDriveAccessToken(creds: ServiceAccountCreds): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: creds.client_email,
    scope: SCOPES,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const signingInput =
    `${base64UrlEncode(JSON.stringify(header))}.` +
    `${base64UrlEncode(JSON.stringify(payload))}`;
  const key = await importPrivateKey(creds.private_key);
  const sig = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signingInput),
  );
  const jwt = `${signingInput}.${base64UrlEncode(new Uint8Array(sig))}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!tokenRes.ok) {
    const detail = await tokenRes.text();
    throw new Error(
      `Google token exchange failed (${tokenRes.status}): ${detail}`,
    );
  }
  const data = (await tokenRes.json()) as { access_token: string };
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ---- Auth gate: caller must be an active board member.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Not authenticated' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse({ error: 'Supabase not configured' }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return jsonResponse({ error: 'Invalid token' }, 401);
    }

    const { data: memberRow, error: memberErr } = await supabase
      .from('board_members')
      .select('status')
      .eq('auth_user_id', userData.user.id)
      .maybeSingle();

    if (memberErr) {
      console.error('board_members lookup error:', memberErr);
      return jsonResponse({ error: 'Member lookup failed' }, 500);
    }
    if (!memberRow || memberRow.status !== 'active') {
      return jsonResponse({ error: 'Not an active board member' }, 403);
    }

    // ---- Request body
    const { folderId } = (await req.json()) as { folderId?: string };
    if (!folderId) {
      return jsonResponse({ error: 'folderId is required' }, 400);
    }

    // ---- Drive call
    const credsRaw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!credsRaw) {
      return jsonResponse(
        { error: 'GOOGLE_SERVICE_ACCOUNT_JSON secret is not set' },
        500,
      );
    }
    const creds: ServiceAccountCreds = JSON.parse(credsRaw);
    const accessToken = await getDriveAccessToken(creds);

    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('q', `'${folderId}' in parents and trashed = false`);
    url.searchParams.set(
      'fields',
      'files(id, name, mimeType, modifiedTime, webViewLink, iconLink, size)',
    );
    url.searchParams.set('orderBy', 'name');
    // Without these flags, files inside a shared drive silently return
    // as an empty list — Drive's most common foot-gun for service
    // accounts.
    url.searchParams.set('supportsAllDrives', 'true');
    url.searchParams.set('includeItemsFromAllDrives', 'true');

    const driveRes = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!driveRes.ok) {
      const detail = await driveRes.text();
      return jsonResponse(
        { error: 'Drive API error', status: driveRes.status, detail },
        driveRes.status,
      );
    }

    return jsonResponse(await driveRes.json());
  } catch (e) {
    console.error('drive-list-folder error:', e);
    return jsonResponse(
      { error: 'Internal error', detail: String(e) },
      500,
    );
  }
});
