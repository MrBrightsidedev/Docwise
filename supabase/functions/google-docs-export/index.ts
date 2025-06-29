import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  document_id: string;
  title: string;
  content: string;
  export_type: 'docs' | 'sheets';
}

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: getUserError } = await supabase.auth.getUser(token);

    if (getUserError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { document_id, title, content, export_type }: ExportRequest = await req.json();

    // Validate request
    if (!document_id || !title || !content || !export_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify user owns the document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id')
      .eq('id', document_id)
      .eq('user_id', user.id)
      .single();

    if (docError || !document) {
      return new Response(
        JSON.stringify({ error: 'Document not found or access denied' }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user's Google tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('google_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (tokensError || !tokens) {
      return new Response(
        JSON.stringify({ 
          error: 'Google account not connected. Please connect your Google account first.',
          requires_auth: true 
        }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if token is expired
    const isExpired = new Date(tokens.expires_at) < new Date();
    if (isExpired && !tokens.refresh_token) {
      return new Response(
        JSON.stringify({ 
          error: 'Google token expired. Please reconnect your Google account.',
          requires_auth: true 
        }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // TODO: Implement token refresh logic if expired
    let accessToken = tokens.access_token;
    if (isExpired && tokens.refresh_token) {
      // TODO: Refresh the access token using refresh_token
      // This would involve calling Google's token refresh endpoint
      console.log('Token refresh needed - implement in production');
    }

    // TODO: Implement actual Google Docs/Sheets API integration
    // For now, return a placeholder response
    const mockResponse = {
      success: true,
      message: `Document "${title}" would be exported to Google ${export_type === 'docs' ? 'Docs' : 'Sheets'}`,
      google_url: `https://docs.google.com/document/d/mock-document-id/edit`,
      export_type,
      // TODO: Replace with actual Google API response
      google_document_id: 'mock-document-id'
    };

    return new Response(
      JSON.stringify(mockResponse), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});