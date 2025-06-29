import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TODO: Set these in your Supabase environment variables
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
const GOOGLE_REDIRECT_URI = Deno.env.get('GOOGLE_REDIRECT_URI');

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (req.method === 'GET' && action === 'auth_url') {
      // Generate Google OAuth URL
      if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
        return new Response(
          JSON.stringify({ error: 'Google OAuth not configured' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const scopes = [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/spreadsheets'
      ].join(' ');

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scopes);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');

      return new Response(
        JSON.stringify({ auth_url: authUrl.toString() }), 
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (req.method === 'POST' && action === 'exchange_code') {
      // Exchange authorization code for tokens
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

      const { code } = await req.json();

      if (!code) {
        return new Response(
          JSON.stringify({ error: 'Authorization code required' }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // TODO: Exchange code for tokens with Google
      // This is a placeholder implementation
      const mockTokenResponse = {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.file'
      };

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + (mockTokenResponse.expires_in * 1000));

      // Store tokens in database
      const { error: storeError } = await supabase
        .from('google_tokens')
        .upsert({
          user_id: user.id,
          access_token: mockTokenResponse.access_token,
          refresh_token: mockTokenResponse.refresh_token,
          token_type: mockTokenResponse.token_type,
          expires_at: expiresAt.toISOString(),
          scope: mockTokenResponse.scope,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (storeError) {
        console.error('Error storing tokens:', storeError);
        return new Response(
          JSON.stringify({ error: 'Failed to store authentication tokens' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Google account connected successfully' 
        }), 
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (req.method === 'POST' && action === 'disconnect') {
      // Disconnect Google account
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

      // Delete stored tokens
      const { error: deleteError } = await supabase
        .from('google_tokens')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting tokens:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to disconnect Google account' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Google account disconnected successfully' 
        }), 
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }), 
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Google auth error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});