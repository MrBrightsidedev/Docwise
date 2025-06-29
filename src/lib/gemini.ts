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

export interface GenerateRequest {
  prompt: string;
  document_type: string;
  country?: string;
  business_type?: string;
}

export interface GenerateResponse {
  success: boolean;
  content?: string;
  document_type?: string;
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

/**
 * Generate legal document content using Gemini AI
 */
export async function generateDocument(
  prompt: string,
  documentType: string,
  country: string = 'US',
  businessType: string = 'startup'
): Promise<GenerateResponse> {
  try {
    // Input validation with detailed logging
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      console.error('Invalid prompt provided:', { prompt, type: typeof prompt, length: prompt?.length });
      return {
        success: false,
        error: 'Prompt is missing, empty, or invalid'
      };
    }

    if (!documentType || typeof documentType !== 'string' || documentType.trim().length === 0) {
      console.error('Invalid document type provided:', { documentType, type: typeof documentType });
      return {
        success: false,
        error: 'Document type is missing or invalid'
      };
    }

    console.log('Generating document with params:', {
      prompt: prompt.substring(0, 100) + '...',
      documentType,
      country,
      businessType
    });

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      console.error('No authentication session found');
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    const requestBody = {
      prompt: prompt.trim(),
      document_type: documentType.trim(),
      country,
      business_type: businessType,
    };

    console.log('Sending request to Supabase Edge Function:', requestBody);

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log('Edge function response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Edge function error response:', errorData);
      return {
        success: false,
        error: errorData.error || `Request failed with status ${response.status}`,
        limit_reached: errorData.limit_reached
      };
    }

    const result = await response.json();
    console.log('Edge function success response:', result);

    return result;
  } catch (error) {
    console.error('Error in generateDocument:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate document'
    };
  }
}