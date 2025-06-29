import { supabase } from './supabase';

export interface SummarizeRequest {
  document_id: string;
  content: string;
  summary_type?: 'brief' | 'detailed' | 'key_points';
}

export interface SummarizeResponse {
  success: boolean;
  summary?: string;
  summary_type?: string;
  usage?: {
    used: number;
    limit: number;
    plan: string;
  };
  error?: string;
  limit_reached?: boolean;
}

/**
 * Summarize document content using Gemini AI
 */
export async function summarizeDocument(
  documentId: string,
  content: string,
  summaryType: 'brief' | 'detailed' | 'key_points' = 'brief'
): Promise<SummarizeResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-summarize`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          document_id: documentId,
          content,
          summary_type: summaryType,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to summarize document');
    }

    return response.json();
  } catch (error) {
    console.error('Error summarizing document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to summarize document'
    };
  }
}