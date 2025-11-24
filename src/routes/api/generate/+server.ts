/**
 * API route for OpenRouter - Cerebras GLM 4.6
 */
import { json, error } from '@sveltejs/kit';
import { OPENROUTER_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';
import type { GenerationRequest, OpenRouterResponse, CognitiveKnob } from '$lib/types';

// Cerebras GLM 4.6 model - 200K context, superior coding, advanced reasoning
const CEREBRAS_MODEL = 'z-ai/glm-4.6';

// Helper function to construct prompt from cognitive knobs
function constructPrompt(sourceText: string, cognitiveKnobs: CognitiveKnob[], systemPrompt: string): string {
  if (cognitiveKnobs.length === 0) {
    return sourceText;
  }

  const knobDescriptions = cognitiveKnobs.map(knob =>
    `- ${knob.name}: ${knob.value}/100 (${knob.description})`
  ).join('\n');

  return `${systemPrompt}

SOURCE TEXT:
${sourceText}

COGNITIVE PARAMETERS:
${knobDescriptions}

Transform the source text according to these cognitive parameters. Apply all parameters simultaneously to produce a modified version.`;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { sourceText, cognitiveKnobs, systemPrompt, parameters }: GenerationRequest = await request.json();

    // Validate inputs
    if (!sourceText || !sourceText.trim()) {
      throw error(400, 'Source text is required');
    }

    // Construct prompt from cognitive knobs
    const enhancedPrompt = constructPrompt(sourceText, cognitiveKnobs, systemPrompt);

    // Construct the request payload
    const requestPayload = {
      model: CEREBRAS_MODEL,
      // Force Cerebras provider for ultra-fast inference - fail instead of falling back
      provider: {
        only: ['cerebras'],
        allow_fallbacks: false
      },
      messages: [
        { role: 'user', content: enhancedPrompt }
      ],
      temperature: parameters.temperature,
      max_tokens: parameters.max_tokens,
      top_p: parameters.top_p,
      frequency_penalty: parameters.frequency_penalty ?? 0,
      presence_penalty: parameters.presence_penalty ?? 0,
      // Disable reasoning to get actual transformed content (GLM 4.6 doesn't support partial reasoning)
      reasoning: {
        enabled: false
      },
      stream: false
    };

    // Log what we're sending to OpenRouter (helpful for debugging)
    console.log('\n🎛️  Cognitive Knobs API Request:');
    console.log('Model:', requestPayload.model);
    console.log('Cognitive Knobs:', cognitiveKnobs.map(k => `${k.name}=${k.value}`).join(', '));
    console.log('LLM Parameters:', {
      temperature: requestPayload.temperature,
      max_tokens: requestPayload.max_tokens,
      top_p: requestPayload.top_p
    });
    console.log('\n📤 FULL PROMPT BEING SENT:');
    console.log('---START---');
    console.log(enhancedPrompt);
    console.log('---END---\n');

    // Make request to OpenRouter with Cerebras provider
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://cognitive-knobs.app',
        'X-Title': 'Cognitive Knobs'
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);

      // Handle specific error codes
      if (response.status === 429) {
        throw error(429, 'Rate limit exceeded. Please try again later.');
      } else if (response.status === 401) {
        throw error(401, 'Invalid API key');
      } else {
        throw error(response.status, `API request failed: ${errorText}`);
      }
    }

    const data: OpenRouterResponse = await response.json();

    // Log the response for debugging
    console.log('\n📥 OpenRouter Response:');
    console.log('- Model:', data.model);
    console.log('- Choices:', data.choices?.length);
    console.log('- First choice:', data.choices?.[0]);
    console.log('- Content length:', data.choices?.[0]?.message?.content?.length || 0);
    console.log('- Content preview:', data.choices?.[0]?.message?.content?.substring(0, 100));
    console.log('- Usage:', data.usage);

    // Return the response
    return json(data);

  } catch (err) {
    console.error('Generation error:', err);

    if (err instanceof Error && 'status' in err) {
      throw err; // Re-throw SvelteKit errors
    }

    throw error(500, 'Failed to generate response');
  }
};
