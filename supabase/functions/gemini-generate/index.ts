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

// Gemini API configuration
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

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

    const { prompt, document_type, country = 'US', business_type = 'startup' }: GenerateRequest = await req.json();

    // Validate request
    if (!prompt || !document_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: prompt and document_type' }), 
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

    // Create comprehensive prompt
    const fullPrompt = `${LEGAL_AI_INSTRUCTION}

CONTEXT:
- Document Type: ${document_type}
- Country/Jurisdiction: ${country}
- Business Type: ${business_type}

USER REQUEST:
${prompt}

Please generate a complete, professional legal document that addresses all the requirements mentioned above. Include proper legal language, structure, and all necessary clauses for this type of agreement.`;

    // Call Gemini API
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
      }),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error('Gemini API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to generate document. Please try again.' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const geminiData = await geminiResponse.json();
    
    // Extract the generated text
    const generatedContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate document';

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
    console.error('Generate error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});