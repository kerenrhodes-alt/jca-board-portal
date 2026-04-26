import { supabase } from './supabase';

// Fire-and-forget insertion into board_document_views. Errors are
// logged but never thrown — view tracking is non-essential and must
// never block opening a file.
export function recordDocumentView(
  driveFileId: string,
  memberId: string,
): void {
  void (async () => {
    const { error } = await supabase
      .from('board_document_views')
      .insert({ drive_file_id: driveFileId, member_id: memberId });
    if (error) {
      console.warn('[recordDocumentView] failed to log view:', error);
    }
  })();
}
