import type { Database } from './types';

// Clean aliases for the board_* tables. Kept separate from types.ts
// so that file stays a clean regen target — `supabase gen types` can
// be re-run without losing these aliases.

type Tables = Database['public']['Tables'];
type Enums = Database['public']['Enums'];

// Members
export type BoardMember = Tables['board_members']['Row'];
export type BoardMemberInsert = Tables['board_members']['Insert'];
export type BoardMemberUpdate = Tables['board_members']['Update'];

// Meetings
export type BoardMeeting = Tables['board_meetings']['Row'];
export type BoardMeetingInsert = Tables['board_meetings']['Insert'];
export type BoardMeetingUpdate = Tables['board_meetings']['Update'];

// Discussions
export type BoardThread = Tables['board_threads']['Row'];
export type BoardThreadInsert = Tables['board_threads']['Insert'];
export type BoardThreadUpdate = Tables['board_threads']['Update'];

export type BoardPost = Tables['board_posts']['Row'];
export type BoardPostInsert = Tables['board_posts']['Insert'];
export type BoardPostUpdate = Tables['board_posts']['Update'];

export type BoardThreadRead = Tables['board_thread_reads']['Row'];
export type BoardThreadReadInsert = Tables['board_thread_reads']['Insert'];

// Voting (fully transparent — no anonymous flag by design)
export type BoardPoll = Tables['board_polls']['Row'];
export type BoardPollInsert = Tables['board_polls']['Insert'];
export type BoardPollUpdate = Tables['board_polls']['Update'];

export type BoardPollOption = Tables['board_poll_options']['Row'];
export type BoardPollOptionInsert = Tables['board_poll_options']['Insert'];

export type BoardPollVote = Tables['board_poll_votes']['Row'];
export type BoardPollVoteInsert = Tables['board_poll_votes']['Insert'];

// Financial dashboard (Supabase Storage bucket: board-financials)
export type BoardFinancialUpload = Tables['board_financial_uploads']['Row'];
export type BoardFinancialUploadInsert =
  Tables['board_financial_uploads']['Insert'];

// Engagement tracking (record-level views — no separate engagement table)
export type BoardDocumentView = Tables['board_document_views']['Row'];
export type BoardDocumentViewInsert = Tables['board_document_views']['Insert'];

// Enums
export type BoardMemberRole = Enums['board_member_role']; // 'member' | 'admin'
export type BoardMemberStatus = Enums['board_member_status']; // 'active' | 'inactive'
export type BoardPollStatus = Enums['board_poll_status']; // 'draft' | 'open' | 'closed'
