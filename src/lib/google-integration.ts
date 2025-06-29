import { supabase } from './supabase';

export interface GoogleAuthResponse {
  auth_url?: string;
  success?: boolean;
  message?: string;
  error?: string;
  requires_auth?: boolean;
}

export interface GoogleExportResponse {
  success: boolean;
  message: string;
  google_url?: string;
  export_type: 'docs' | 'sheets';
  google_document_id?: string;
  error?: string;
  requires_auth?: boolean;
}

export interface GoogleTokenStatus {
  connected: boolean;
  expires_at?: string;
  scope?: string;
}

/**
 * Get Google OAuth authorization URL
 */
export async function getGoogleAuthUrl(): Promise<GoogleAuthResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-auth?action=auth_url`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get authorization URL');
    }

    return response.json();
  } catch (error) {
    console.error('Error getting Google auth URL:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to get authorization URL'
    };
  }
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeGoogleCode(code: string): Promise<GoogleAuthResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-auth?action=exchange_code`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ code }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to exchange authorization code');
    }

    return response.json();
  } catch (error) {
    console.error('Error exchanging Google code:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to connect Google account'
    };
  }
}

/**
 * Disconnect Google account
 */
export async function disconnectGoogleAccount(): Promise<GoogleAuthResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-auth?action=disconnect`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to disconnect Google account');
    }

    return response.json();
  } catch (error) {
    console.error('Error disconnecting Google account:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to disconnect Google account'
    };
  }
}

/**
 * Check Google token status
 */
export async function getGoogleTokenStatus(): Promise<GoogleTokenStatus> {
  try {
    const { data, error } = await supabase
      .from('google_tokens')
      .select('expires_at, scope')
      .single();

    if (error || !data) {
      return { connected: false };
    }

    return {
      connected: true,
      expires_at: data.expires_at,
      scope: data.scope
    };
  } catch (error) {
    console.error('Error checking Google token status:', error);
    return { connected: false };
  }
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