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

interface GenerateRequest {
  prompt: string;
  document_type: string;
  country?: string;
  business_type?: string;
}

// Legal AI instruction prompt
const LEGAL_AI_INSTRUCTION = `You are a professional legal AI assistant specialized in drafting and reviewing business contracts. Your goal is to generate complete, legally sound documents based on the user's input.

GUIDELINES:
- Always include clear clauses for parties, terms, confidentiality, responsibilities, and signatures
- Use simple, human-readable legal language while maintaining legal precision
- Adjust templates based on country-specific laws when applicable (default to US/International standards)
- Keep formatting clean and professional with proper sections and numbering
- Assume documents are for small startups or freelancers unless otherwise specified
- Include standard legal disclaimers and review recommendations
- Provide complete documents, not just outlines or summaries
- Use markdown formatting for better readability

DOCUMENT STRUCTURE:
1. Title and parties identification
2. Purpose and scope
3. Terms and conditions
4. Rights and obligations
5. Duration and termination
6. Governing law and jurisdiction
7. Signature blocks
8. Legal disclaimer

Remember: Always recommend legal review before use.`;

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
      console.error('Gemini API key not configured');
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
      console.error('Authentication error:', getUserError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const requestBody = await req.json();
    console.log('Request body received:', requestBody);

    const { prompt, document_type, country = 'US', business_type = 'startup' }: GenerateRequest = requestBody;

    // Validate request with detailed logging
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      console.error('Invalid prompt:', { prompt, type: typeof prompt, length: prompt?.length });
      return new Response(
        JSON.stringify({ error: 'Prompt is missing, empty, or invalid' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!document_type || typeof document_type !== 'string' || document_type.trim().length === 0) {
      console.error('Invalid document_type:', { document_type, type: typeof document_type });
      return new Response(
        JSON.stringify({ error: 'Document type is missing or invalid' }), 
        { 
          status: 400, 
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
      console.error('Usage check error:', usageError);
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
      console.log('Usage limit reached for user:', user.id, 'Plan:', usage.plan, 'Used:', usage.ai_generations_used);
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

    // Create comprehensive prompt
    const fullPrompt = `${LEGAL_AI_INSTRUCTION}

CONTEXT:
- Document Type: ${document_type}
- Country/Jurisdiction: ${country}
- Business Type: ${business_type}

USER REQUEST:
${prompt}

Please generate a complete, professional legal document that addresses all the requirements mentioned above. Include proper legal language, structure, and all necessary clauses for this type of agreement.`;

    console.log('Full prompt being sent to Gemini 1.5 Flash:', fullPrompt);

    // Call Gemini 1.5 Flash API with proper request structure
    const geminiRequestBody = {
      contents: [
        {
          parts: [
            {
              text: fullPrompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
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
    };

    console.log('Gemini 1.5 Flash request body:', JSON.stringify(geminiRequestBody, null, 2));

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiRequestBody),
    });

    console.log('Gemini 1.5 Flash response status:', geminiResponse.status);
    console.log('Gemini 1.5 Flash response headers:', Object.fromEntries(geminiResponse.headers.entries()));

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini 1.5 Flash API error response:', errorText);
      return new Response(
        JSON.stringify({ 
          error: `Gemini API error (${geminiResponse.status}): ${errorText}` 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini 1.5 Flash response data:', JSON.stringify(geminiData, null, 2));
    
    // Extract the generated text with detailed error checking
    const candidates = geminiData.candidates;
    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      console.error('No candidates in Gemini response:', geminiData);
      return new Response(
        JSON.stringify({ error: 'Gemini returned no content candidates' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const firstCandidate = candidates[0];
    if (!firstCandidate || !firstCandidate.content) {
      console.error('First candidate has no content:', firstCandidate);
      return new Response(
        JSON.stringify({ error: 'Gemini candidate has no content' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const parts = firstCandidate.content.parts;
    if (!parts || !Array.isArray(parts) || parts.length === 0) {
      console.error('Content has no parts:', firstCandidate.content);
      return new Response(
        JSON.stringify({ error: 'Gemini content has no parts' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const generatedContent = parts[0]?.text;
    if (!generatedContent || typeof generatedContent !== 'string' || generatedContent.trim().length === 0) {
      console.error('Generated content is empty or invalid:', generatedContent);
      return new Response(
        JSON.stringify({ error: 'Gemini generated empty or invalid content' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Successfully generated content with Gemini 1.5 Flash, length:', generatedContent.length);

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
        content: generatedContent,
        document_type,
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
    console.error('Generate function error:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: `Internal server error: ${error.message}` 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});