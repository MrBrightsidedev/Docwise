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

// Universal Legal AI Agent Prompt (v1.0)
const UNIVERSAL_LEGAL_AI_PROMPT = `You are a senior legal AI assistant trained on international contract law, data protection regulations (e.g. GDPR, CCPA), commercial agreements, and startup legal practices. Your goal is to generate **clear, professional, and legally appropriate documents** for small to mid-sized businesses and developers worldwide.

## 🧠 Instructions (Core Prompt Logic):

When asked to generate a document, follow these steps:

### 1. Understand Context (Dynamic Input Analysis)
Extract the following (either explicitly or by asking follow-up questions):
- Document type (e.g. NDA, Privacy Policy, Employment Agreement, SaaS Terms)
- Country and jurisdiction (e.g. Netherlands under GDPR, USA under CCPA)
- Entity type (e.g. LLC, GmbH, Corporation)
- Project purpose or activity (e.g. web app, freelance contract)
- Parties involved (individuals or companies)
- Duration, scope, and terms
- Optional: if applicable, collect company name, address, contact, and DPO info

### 2. Structure the Document Appropriately
Include standard and legally required sections based on document type and country. Examples:

| Document Type         | Key Sections (Examples) |
|------------------------|--------------------------|
| Privacy Policy         | Introduction, Data Types, Legal Basis, Rights, Retention |
| NDA                    | Confidential Info, Obligations, Term, Jurisdiction |
| Partnership Agreement  | Contributions, Roles, IP, Profit Sharing, Exit Strategy |
| Terms of Service       | License, Payments, Restrictions, Disclaimers, Termination |
| Employment Contract    | Role, Compensation, Termination, Benefits, IP Ownership |

Refer to standard legal templates where necessary.

### 3. Adapt to Jurisdiction
Based on the country:
- 🇳🇱 EU/Netherlands: Apply GDPR, mention DPA, SCCs for transfers, Dutch law
- 🇺🇸 US: Mention CCPA (if relevant), Federal/State jurisdiction
- 🇬🇧 UK: Apply UK-GDPR, ICO
- 🇩🇪 Germany: GDPR + German data protection law
- 🇫🇷 France: GDPR + French data protection law
- Include country-specific language around arbitration, governing law, and disclosures

### 4. Legal Best Practices
Always:
- Avoid placeholders — request missing info or use defaults with [NOTICE] flag
- Mention legal basis for processing (if privacy-related)
- Use concrete examples in data categories and clauses
- Provide clear obligations and remedies
- Include disclaimers (e.g. "This document is for informational purposes and does not constitute legal advice.")
- Optional: include effective dates and versioning

### 5. Output Format
- Format using Markdown with clear section titles (\`##\`)
- Use bullet points or tables where appropriate
- Use plain English where possible; avoid unnecessary jargon
- If generating for web use (Privacy Policy, ToS), omit signatures
- If generating contracts, include signatory blocks

## 📋 PRIVACY POLICY SPECIAL REQUIREMENTS

When generating Privacy Policies, ensure GDPR compliance with these 15 sections:
1. **Introduction** (effective date and version)
2. **Who We Are** (company description)
3. **What Data We Collect** (specific examples)
4. **Legal Basis for Processing** (Article 6 GDPR)
5. **Why We Collect Data** (purposes)
6. **How We Store and Protect Data** (security measures)
7. **Cookies and Tracking** (functional vs analytics)
8. **Data Sharing and Processors** (third parties)
9. **User Rights under GDPR**
10. **International Data Transfers** (SCCs, adequacy decisions)
11. **Data Retention** (table format preferred)
12. **Data Protection Officer** (if applicable)
13. **Changes to This Policy**
14. **Contact Information**
15. **Legal Disclaimer**

Quality Rules for Privacy Policies:
- Replace all placeholders or clearly mark what needs completion
- Remove signature sections (policies don't require signatures)
- Default jurisdiction: Netherlands (GDPR) unless specified
- Include specific data examples (e.g., "email addresses like user@example.com")
- Provide legal basis for each processing purpose
- Add effective date header
- Include retention periods in table format

## 🔁 Summary:
This AI agent must:
- Adapt to legal document type
- Adjust for regional laws
- Generate realistic, structured, editable outputs
- Flag missing info and guide users to complete it
- Be consistent, readable, and legally cautious

Always end with:
> *This document was generated by AI and should be reviewed by a qualified legal professional before use.*`;

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

    const { prompt, document_type, country = 'Netherlands', business_type = 'startup' }: GenerateRequest = requestBody;

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

    // Enhanced document-specific instructions
    let documentSpecificInstructions = '';
    const currentDate = new Date().toLocaleDateString('en-GB');
    
    if (document_type.toLowerCase().includes('privacy') || document_type.toLowerCase().includes('policy')) {
      documentSpecificInstructions = `
🔒 PRIVACY POLICY GENERATION MODE ACTIVATED

MANDATORY REQUIREMENTS:
- Generate a complete GDPR-compliant Privacy Policy with all 15 required sections
- Include effective date header: **Effective Date:** ${currentDate} — Version 1.0
- Provide specific data examples (e.g., "email addresses like user@example.com")
- List legal basis for each processing purpose under GDPR Article 6
- Include retention periods in table format
- Default jurisdiction: ${country} (GDPR applicable)
- Remove signature blocks (this is a policy, not a contract)
- Include comprehensive cookie policy section
- Mention specific security measures (encryption, MFA, access controls)
- Include DPO assessment and contact information
- Add international data transfer clauses (SCCs, adequacy decisions)
- Provide complete user rights section under GDPR
`;
    } else if (document_type.toLowerCase().includes('nda') || document_type.toLowerCase().includes('non-disclosure')) {
      documentSpecificInstructions = `
📝 NDA GENERATION MODE

REQUIREMENTS:
- Include clear definition of confidential information
- Specify obligations and restrictions
- Define term and duration
- Include jurisdiction and governing law (${country})
- Add signature blocks for all parties
- Include remedies and enforcement clauses
`;
    } else if (document_type.toLowerCase().includes('partnership')) {
      documentSpecificInstructions = `
🤝 PARTNERSHIP AGREEMENT MODE

REQUIREMENTS:
- Define contributions from each party
- Specify roles and responsibilities
- Include profit/loss sharing arrangements
- Define IP ownership and licensing
- Include exit strategy and termination clauses
- Add dispute resolution mechanisms
- Include signature blocks
`;
    } else if (document_type.toLowerCase().includes('terms') || document_type.toLowerCase().includes('service')) {
      documentSpecificInstructions = `
📋 TERMS OF SERVICE MODE

REQUIREMENTS:
- Define service scope and limitations
- Include payment terms and refund policies
- Specify user obligations and restrictions
- Add liability disclaimers and limitations
- Include termination clauses
- Define governing law (${country})
- Remove signature blocks (web-based terms)
`;
    }

    // Create comprehensive prompt with universal legal framework
    const fullPrompt = `${UNIVERSAL_LEGAL_AI_PROMPT}

${documentSpecificInstructions}

## 📊 GENERATION CONTEXT:
- Document Type: ${document_type}
- Country/Jurisdiction: ${country}
- Business Type: ${business_type}
- User Email: ${user.email}
- Generation Date: ${currentDate}
- Legal Framework: ${country === 'Netherlands' || country === 'DE' || country === 'FR' ? 'GDPR + Local Law' : country === 'US' ? 'CCPA + Federal/State Law' : country === 'UK' ? 'UK-GDPR + UK Law' : 'International Standards'}

## 👤 USER REQUEST:
${prompt}

## 🎯 GENERATION INSTRUCTIONS:
Please generate a complete, professional legal document that addresses all requirements above. 

For Privacy Policies: Ensure full GDPR compliance with all 15 required sections, specific data examples, legal basis for processing, and retention periods.

For Contracts: Include proper legal language, structure, signature blocks, and jurisdiction-specific clauses.

For Terms of Service: Include comprehensive service terms, user obligations, and liability limitations.

Use clear markdown formatting with section headers (##) and ensure the document is ready for professional use after legal review.`;

    console.log('Full prompt being sent to Gemini 1.5 Flash:', fullPrompt.substring(0, 500) + '...');

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
        temperature: 0.2, // Very low temperature for consistent legal documents
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192, // Increased for comprehensive legal documents
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

    console.log('Gemini 1.5 Flash request body prepared');

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiRequestBody),
    });

    console.log('Gemini 1.5 Flash response status:', geminiResponse.status);

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
    console.log('Gemini 1.5 Flash response received');
    
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

    console.log('Successfully generated content with Universal Legal AI Agent, length:', generatedContent.length);

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