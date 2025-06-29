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

// Gemini API configuration - Updated to use Gemini 1.5 Flash
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface SummarizeRequest {
  document_id: string;
  content: string;
  summary_type?: 'brief' | 'detailed' | 'key_points';
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

    // Check if Gemini API key is configured
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Gemini API not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
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

    const { document_id, content, summary_type = 'brief' }: SummarizeRequest = await req.json();

    // Validate request
    if (!document_id || !content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: document_id and content' }), 
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

    // Check user's AI generation usage
    const { data: usage, error: usageError } = await supabase
      .from('user_usage')
      .select('ai_generations_used, plan')
      .eq('user_id', user.id)
      .single();

    if (usageError) {
      return new Response(
        JSON.stringify({ error: 'Failed to check usage limits' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check usage limits
    const limits = {
      free: 1,
      pro: 10,
      business: -1 // unlimited
    };

    const userLimit = limits[usage.plan as keyof typeof limits] || 1;
    
    if (userLimit > 0 && usage.ai_generations_used >= userLimit) {
      return new Response(
        JSON.stringify({ 
          error: 'AI generation limit reached. Please upgrade your plan to continue.',
          limit_reached: true 
        }), 
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create prompt based on summary type
    let prompt = '';
    switch (summary_type) {
      case 'brief':
        prompt = `Please provide a brief summary (2-3 sentences) of the following legal document:\n\n${content}`;
        break;
      case 'detailed':
        prompt = `Please provide a detailed summary of the following legal document, including key terms, obligations, and important clauses:\n\n${content}`;
        break;
      case 'key_points':
        prompt = `Please extract the key points from the following legal document as a bulleted list:\n\n${content}`;
        break;
    }

    console.log('Sending summarization request to Gemini 1.5 Flash');

    // Call Gemini 1.5 Flash API
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error('Gemini 1.5 Flash API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to generate summary. Please try again.' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const geminiData = await geminiResponse.json();
    
    // Extract the generated text
    const summary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate summary';

    console.log('Successfully generated summary with Gemini 1.5 Flash');

    // Update user's AI generation usage
    const { error: updateError } = await supabase
      .from('user_usage')
      .update({ 
        ai_generations_used: usage.ai_generations_used + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating usage:', updateError);
      // Don't fail the request if usage update fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        summary_type,
        usage: {
          used: usage.ai_generations_used + 1,
          limit: userLimit,
          plan: usage.plan
        }
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Summarize error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});