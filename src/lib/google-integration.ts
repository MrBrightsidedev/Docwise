import { supabase } from './supabase';

export interface GoogleExportResponse {
  success: boolean;
  message: string;
  google_url?: string;
  export_type: 'docs' | 'sheets';
  google_document_id?: string;
  error?: string;
  requires_auth?: boolean;
}

/**
 * Check if user is connected to Google (signed in via Google OAuth)
 */
export function isGoogleConnected(): boolean {
  // Check if current user signed in with Google OAuth
  const user = supabase.auth.getUser();
  return user.then(({ data }) => {
    return data.user?.app_metadata?.provider === 'google';
  }).catch(() => false);
}

/**
 * Export document to Google Docs or Sheets
 */
export async function exportToGoogle(
  documentId: string,
  title: string,
  content: string,
  exportType: 'docs' | 'sheets' = 'docs'
): Promise<GoogleExportResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-docs-export`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          document_id: documentId,
          title,
          content,
          export_type: exportType,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to export document');
    }

    return response.json();
  } catch (error) {
    console.error('Error exporting to Google:', error);
    return {
      success: false,
      message: 'Failed to export document',
      export_type: exportType,
      error: error instanceof Error ? error.message : 'Export failed'
    };
  }
}