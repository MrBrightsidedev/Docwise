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

    // Check if user signed in with Google (has Google OAuth tokens)
    const isGoogleUser = user.app_metadata?.provider === 'google';
    
    if (!isGoogleUser) {
      return new Response(
        JSON.stringify({ 
          error: 'Google account not connected. Please sign in with Google to export to Google Workspace.',
          requires_auth: true 
        }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // TODO: Implement actual Google Docs/Sheets API integration
    // For now, return a success response indicating the feature is ready
    const mockResponse = {
      success: true,
      message: `Document "${title}" is ready to be exported to Google ${export_type === 'docs' ? 'Docs' : 'Sheets'}. Full integration coming soon!`,
      google_url: `https://docs.google.com/${export_type === 'docs' ? 'document' : 'spreadsheets'}/d/mock-document-id/edit`,
      export_type,
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