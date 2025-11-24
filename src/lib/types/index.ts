/**
 * Core type definitions for Cognitive Knobs
 */

// Freeform user-defined cognitive dimension (0-100 scale)
export interface CognitiveKnob {
  id: string;
  name: string;                    // e.g., "Abstraction", "Evidence Demand"
  description: string;              // What this parameter does
  value: number;                    // 0-100
  lowLabel?: string;                // Optional: label for 0 (e.g., "Concrete")
  highLabel?: string;               // Optional: label for 100 (e.g., "Abstract")
}

// Advanced LLM parameter knobs
export interface LLMKnob {
  id: string;
  name: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  parameter: 'temperature' | 'max_tokens' | 'top_p' | 'frequency_penalty' | 'presence_penalty';
}

// Legacy alias for compatibility
export type Knob = CognitiveKnob;

export interface KnobConfiguration {
  id: string;
  name: string;
  cognitiveKnobs: CognitiveKnob[];
  llmKnobs: LLMKnob[];
  systemPrompt: string;
  createdAt: Date;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerationRequest {
  sourceText: string;
  cognitiveKnobs: CognitiveKnob[];
  systemPrompt: string;
  parameters: {
    temperature: number;
    max_tokens: number;
    top_p: number;
    frequency_penalty: number;
    presence_penalty: number;
  };
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
      reasoning?: string;  // GLM 4.6 reasoning models use this field
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StoredConfiguration {
  id: string;
  name: string;
  cognitiveKnobs: CognitiveKnob[];
  llmKnobs: LLMKnob[];
  systemPrompt: string;
  createdAt: string; // ISO date string for JSON serialization
}
