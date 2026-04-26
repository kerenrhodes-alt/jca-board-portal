// Phase 5: list files in a Drive folder using the JCA service account.
// Returns the meeting folder's top-level files plus a one-level-deep
// listing of any subfolders. Resolves Drive shortcuts so committees
// sharing live documents across folders work transparently.
//
// Shortcut policy:
//   - shortcut → folder: surfaced as a subfolder. The shortcut's name
//     becomes the section title (admin's chosen label); the target
//     folder's contents are listed.
//   - shortcut → file: target metadata is fetched via files.get so
//     the row shows the real name, icon, and webViewLink.
//   - shortcut → another shortcut: not handled (Drive doesn't
//     normally allow chained shortcuts).
//   - malformed shortcut (no targetId): skipped with a warning log.
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

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink: string;
  iconLink?: string;
  size?: string;
  shortcutDetails?: {
    targetId?: string;
    targetMimeType?: string;
    targetResourceKey?: string;
  };
}

const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const SHORTCUT_MIME = 'application/vnd.google-apps.shortcut';
const FILE_FIELDS =
  'id, name, mimeType, modifiedTime, webViewLink, iconLink, size, shortcutDetails';

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

async function listFolder(
  folderId: string,
  accessToken: string,
): Promise<DriveItem[]> {
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', `'${folderId}' in parents and trashed = false`);
  url.searchParams.set('fields', `files(${FILE_FIELDS})`);
  url.searchParams.set('orderBy', 'name');
  url.searchParams.set('supportsAllDrives', 'true');
  url.searchParams.set('includeItemsFromAllDrives', 'true');

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      `Drive API error (${res.status}) for folder ${folderId}: ${detail}`,
    );
  }
  const data = (await res.json()) as { files?: DriveItem[] };
  return data.files ?? [];
}

async function getFile(
  fileId: string,
  accessToken: string,
): Promise<DriveItem> {
  const url = new URL(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
  );
  url.searchParams.set('fields', FILE_FIELDS);
  url.searchParams.set('supportsAllDrives', 'true');

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      `Drive API error (${res.status}) for file ${fileId}: ${detail}`,
    );
  }
  return (await res.json()) as DriveItem;
}

type Subfolder = { id: string; name: string; files: DriveItem[] };
type ShortcutResolution =
  | { kind: 'subfolder'; subfolder: Subfolder }
  | { kind: 'file'; file: DriveItem }
  | { kind: 'skip' };

async function resolveShortcut(
  sc: DriveItem,
  accessToken: string,
): Promise<ShortcutResolution> {
  const targetId = sc.shortcutDetails?.targetId;
  const targetMime = sc.shortcutDetails?.targetMimeType;
  if (!targetId) {
    console.warn(
      `Shortcut ${sc.id} (${sc.name}) has no targetId; skipping`,
    );
    return { kind: 'skip' };
  }
  if (targetMime === FOLDER_MIME) {
    const children = await listFolder(targetId, accessToken);
    return {
      kind: 'subfolder',
      subfolder: {
        id: targetId,
        // Use the shortcut's name as the section title — that's the
        // label the admin chose when they placed it in this folder.
        name: sc.name,
        files: children.filter(
          (i) =>
            i.mimeType !== FOLDER_MIME && i.mimeType !== SHORTCUT_MIME,
        ),
      },
    };
  }
  // Target is a file (or another shortcut, which we treat as a file
  // for v1 — Drive doesn't normally allow chained shortcuts).
  const target = await getFile(targetId, accessToken);
  return { kind: 'file', file: target };
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

    // ---- Drive calls
    const credsRaw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!credsRaw) {
      return jsonResponse(
        { error: 'GOOGLE_SERVICE_ACCOUNT_JSON secret is not set' },
        500,
      );
    }
    const creds: ServiceAccountCreds = JSON.parse(credsRaw);
    const accessToken = await getDriveAccessToken(creds);

    const topItems = await listFolder(folderId, accessToken);

    // Partition into the three kinds we care about.
    const regularFiles: DriveItem[] = [];
    const realSubfolderItems: DriveItem[] = [];
    const shortcutItems: DriveItem[] = [];
    for (const item of topItems) {
      if (item.mimeType === FOLDER_MIME) realSubfolderItems.push(item);
      else if (item.mimeType === SHORTCUT_MIME) shortcutItems.push(item);
      else regularFiles.push(item);
    }

    // Resolve real subfolders and shortcuts in parallel. Promise.all
    // means any single Drive call failure propagates to the top-level
    // error path — predictable for v1.
    const [realSubfolders, shortcutResolutions] = await Promise.all([
      Promise.all(
        realSubfolderItems.map(async (sf) => {
          const children = await listFolder(sf.id, accessToken);
          return {
            id: sf.id,
            name: sf.name,
            files: children.filter(
              (i) =>
                i.mimeType !== FOLDER_MIME && i.mimeType !== SHORTCUT_MIME,
            ),
          };
        }),
      ),
      Promise.all(
        shortcutItems.map((sc) => resolveShortcut(sc, accessToken)),
      ),
    ]);

    // Merge resolved shortcuts back into top files / subfolders.
    const finalTopFiles: DriveItem[] = [...regularFiles];
    const finalSubfolders: Subfolder[] = [...realSubfolders];
    for (const r of shortcutResolutions) {
      if (r.kind === 'file') finalTopFiles.push(r.file);
      else if (r.kind === 'subfolder') finalSubfolders.push(r.subfolder);
      // 'skip' is intentional no-op
    }

    // Re-sort after merge so resolved shortcut items aren't orphaned
    // at the end of the alphabetical listing.
    finalTopFiles.sort((a, b) => a.name.localeCompare(b.name));
    finalSubfolders.sort((a, b) => a.name.localeCompare(b.name));

    return jsonResponse({
      files: finalTopFiles,
      subfolders: finalSubfolders,
    });
  } catch (e) {
    console.error('drive-list-folder error:', e);
    return jsonResponse(
      { error: 'Internal error', detail: String(e) },
      500,
    );
  }
});
