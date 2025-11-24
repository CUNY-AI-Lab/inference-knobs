# Design Document

## Overview

This design establishes the correct integration pattern for the Cerebras API through OpenRouter, ensuring reliable ultra-fast inference for the Cognitive Knobs application. The implementation focuses on proper request construction, error handling, response parsing, and request lifecycle management to support real-time parameter manipulation with sub-second response times.

## Architecture

### System Components

```
┌─────────────────┐
│   Svelte UI     │
│  (+page.svelte) │
└────────┬────────┘
         │
         │ fetch('/api/generate')
         ▼
┌─────────────────┐
│  API Route      │
│  (+server.ts)   │
└────────┬────────┘
         │
         │ HTTPS POST
         ▼
┌─────────────────┐
│   OpenRouter    │
│   API Gateway   │
└────────┬────────┘
         │
         │ Provider Routing
         ▼
┌─────────────────┐
│  Cerebras API   │
│  (GLM 4.6)      │
└─────────────────┘
```

### Request Flow

1. User modifies cognitive knobs or source text
2. Svelte effect triggers debounced generation (200ms delay)
3. AbortController cancels any in-flight requests
4. API route validates input and constructs prompt
5. Request sent to OpenRouter with Cerebras provider specification
6. Response parsed and displayed in UI
7. Errors handled and displayed to user

## Components and Interfaces

### API Route Handler

**File:** `src/routes/api/generate/+server.ts`

**Responsibilities:**
- Validate incoming generation requests
- Construct prompts from cognitive parameters
- Make authenticated requests to OpenRouter
- Parse and validate responses
- Handle errors with appropriate status codes
- Log request/response details for debugging

**Interface:**

```typescript
// Request
POST /api/generate
Content-Type: application/json
Body: GenerationRequest

// Response (Success)
Status: 200
Content-Type: application/json
Body: OpenRouterResponse

// Response (Error)
Status: 400 | 401 | 429 | 500
Content-Type: application/json
Body: { message: string }
```

### Prompt Constructor

**Function:** `constructPrompt(sourceText, cognitiveKnobs, systemPrompt)`

**Responsibilities:**
- Format cognitive knobs into readable parameter descriptions
- Combine system prompt, source text, and parameters
- Handle edge case of zero cognitive knobs
- Ensure proper text formatting for JSON transmission

**Logic:**
```
IF cognitiveKnobs.length === 0:
  RETURN sourceText
ELSE:
  FORMAT each knob as "- {name}: {value}/100 ({description})"
  COMBINE systemPrompt + sourceText + formatted knobs
  RETURN complete prompt
```

### Request Lifecycle Manager

**Location:** `src/routes/+page.svelte`

**Responsibilities:**
- Manage AbortController for request cancellation
- Implement debouncing for rapid parameter changes
- Track generation state (isGenerating, error, response)
- Update UI based on request lifecycle events

**State Machine:**
```
IDLE → (user input) → DEBOUNCING → (timeout) → GENERATING → (response) → IDLE
                                                           → (error) → ERROR → IDLE
                                                           → (abort) → IDLE
```

## Data Models

### GenerationRequest

```typescript
interface GenerationRequest {
  sourceText: string;           // User's input text to transform
  cognitiveKnobs: CognitiveKnob[]; // User-defined parameters
  systemPrompt: string;         // AI behavior instructions
  parameters: {
    temperature: number;        // 0-2, controls randomness
    max_tokens: number;         // 50-4000, response length limit
    top_p: number;             // 0-1, nucleus sampling
    frequency_penalty: number; // 0-2, repetition penalty
    presence_penalty: number;  // 0-2, topic diversity
  };
}
```

### OpenRouter Request Payload

```typescript
interface OpenRouterRequest {
  model: string;                // e.g., "z-ai/glm-4.6:exacto"
  provider: {
    only: string[];            // ["cerebras"]
    allow_fallbacks: boolean;  // false
  };
  messages: Array<{
    role: 'user' | 'system' | 'assistant';
    content: string;
  }>;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  stream: boolean;             // false for non-streaming
}
```

### OpenRouterResponse

```typescript
interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
      reasoning?: string;      // GLM 4.6 specific field
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

## Correctnes
s Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


Property 1: Request payload completeness
*For any* valid source text and cognitive parameters, the constructed request payload should contain all required fields: model identifier, provider configuration with Cerebras specified and fallbacks disabled, messages array, and all LLM parameters (temperature, max_tokens, top_p, frequency_penalty, presence_penalty)
**Validates: Requirements 1.1, 1.3, 4.1**

Property 2: Authentication header presence
*For any* API request, the request headers should include an Authorization header with Bearer token format
**Validates: Requirements 1.2**

Property 3: Content extraction from responses
*For any* valid OpenRouter response, the content extraction function should return the content from either the message.content field or the message.reasoning field (for GLM models), preferring content over reasoning
**Validates: Requirements 1.5, 6.2**

Property 4: Request abortion on new generation
*For any* sequence of generation requests, when a new request is initiated, the previous AbortController should have its abort() method called before the new request begins
**Validates: Requirements 3.1**

Property 5: Aborted requests don't update state
*For any* aborted request, the response state should remain unchanged from its value before the request was initiated
**Validates: Requirements 3.2**

Property 6: Debouncing prevents request flooding
*For any* sequence of rapid parameter changes within the debounce window (200ms), only one API request should be initiated after the final change
**Validates: Requirements 3.3, 3.4**

Property 7: Response structure validation
*For any* response object, the validation function should verify the presence of a choices array with at least one element containing a message object
**Validates: Requirements 6.1**

Property 8: Prompt formatting with cognitive knobs
*For any* non-empty array of cognitive knobs, the formatted prompt should contain each knob's name, value, and description in the output string
**Validates: Requirements 5.1, 5.2**

Property 9: JSON serialization safety
*For any* source text containing special characters (quotes, newlines, backslashes), the constructed prompt should be safely serializable to JSON without throwing errors
**Validates: Requirements 5.4**

Property 10: Input validation for empty text
*For any* string containing only whitespace characters, the validation function should reject the input and prevent API request initiation
**Validates: Requirements 7.1**

Property 11: Parameter range validation
*For any* LLM parameter value outside its valid range (temperature: 0-2, max_tokens: 50-4000, top_p: 0-1), the system should either clamp the value to the valid range or reject the request
**Validates: Requirements 7.3**

Property 12: Request logging completeness
*For any* API request, the console logs should contain the model identifier, all cognitive knob values, and all LLM parameter values
**Validates: Requirements 8.1**

Property 13: Response logging completeness
*For any* successful API response, the console logs should contain the model used, content length, and token usage statistics
**Validates: Requirements 8.3**

Property 14: Error logging completeness
*For any* error during API interaction, the console logs should contain the error type and error message
**Validates: Requirements 2.6, 8.4**

## Error Handling

### Error Categories

1. **Validation Errors (400)**
   - Empty or whitespace-only source text
   - Missing required parameters
   - Invalid parameter ranges
   - Malformed request structure

2. **Authentication Errors (401)**
   - Missing API key
   - Invalid API key format
   - Expired API key

3. **Rate Limiting Errors (429)**
   - Too many requests in time window
   - Provider-specific rate limits exceeded

4. **Server Errors (500)**
   - OpenRouter internal errors
   - Cerebras provider unavailability
   - Timeout errors

5. **Network Errors**
   - Connection failures
   - DNS resolution failures
   - Request abortion

### Error Handling Strategy

```typescript
try {
  // Validate input
  if (!sourceText.trim()) {
    throw error(400, 'Source text is required');
  }
  
  // Make API request
  const response = await fetch(OPENROUTER_URL, config);
  
  // Handle HTTP errors
  if (!response.ok) {
    const errorText = await response.text();
    
    switch (response.status) {
      case 401:
        throw error(401, 'Invalid API key');
      case 429:
        throw error(429, 'Rate limit exceeded. Please try again later.');
      case 400:
        throw error(400, `Invalid request: ${errorText}`);
      default:
        throw error(response.status, `API request failed: ${errorText}`);
    }
  }
  
  // Parse and validate response
  const data = await response.json();
  if (!data.choices || data.choices.length === 0) {
    throw error(500, 'Malformed response: missing choices');
  }
  
  return data;
  
} catch (err) {
  // Log error details
  console.error('Generation error:', err);
  
  // Re-throw SvelteKit errors
  if (err instanceof Error && 'status' in err) {
    throw err;
  }
  
  // Wrap unknown errors
  throw error(500, 'Failed to generate response');
}
```

### User-Facing Error Messages

- **401**: "Invalid API key. Please check your OpenRouter API key configuration."
- **429**: "Rate limit exceeded. Please wait a moment and try again."
- **400**: "Invalid request parameters. Please check your input."
- **500**: "Server error. Please try again later."
- **Network**: "Connection failed. Please check your internet connection."
- **Abort**: (Silent - no error message shown)

## Testing Strategy

### Unit Testing

Unit tests will cover:

1. **Prompt Construction**
   - Test with various cognitive knob configurations
   - Test with empty knobs array
   - Test with special characters in text
   - Test with very long source text

2. **Request Payload Building**
   - Verify all required fields are present
   - Verify provider configuration is correct
   - Verify parameter values are included

3. **Response Parsing**
   - Test with standard content field
   - Test with reasoning field (GLM models)
   - Test with missing fields
   - Test with malformed responses

4. **Error Handling**
   - Test each HTTP status code mapping
   - Test network error handling
   - Test validation error handling

5. **Input Validation**
   - Test empty string rejection
   - Test whitespace-only string rejection
   - Test parameter range validation

### Property-Based Testing

Property-based tests will use **fast-check** (JavaScript/TypeScript PBT library) with a minimum of 100 iterations per property.

Each property-based test will:
- Generate random valid inputs within the domain
- Execute the function under test
- Verify the property holds for all generated inputs
- Be tagged with the format: `**Feature: cerebras-endpoint-integration, Property {number}: {property_text}**`

Test generators will:
- Generate random strings with various lengths and character sets
- Generate random cognitive knob arrays with 0-10 knobs
- Generate random parameter values within and outside valid ranges
- Generate random response objects with various structures
- Generate random error scenarios

### Integration Testing

Integration tests will verify:
- End-to-end request flow with mocked OpenRouter API
- Debouncing behavior with simulated rapid changes
- Request abortion with concurrent requests
- Error propagation from API to UI

### Manual Testing Checklist

- [ ] Verify correct model identifier is used in requests
- [ ] Test with actual OpenRouter API key
- [ ] Verify Cerebras provider is being used (check response model field)
- [ ] Test rate limiting behavior
- [ ] Verify debouncing with rapid parameter changes
- [ ] Test request cancellation with rapid text changes
- [ ] Verify error messages are user-friendly
- [ ] Check console logs for debugging information
- [ ] Test with various cognitive knob configurations
- [ ] Verify response times are sub-second with Cerebras

## Implementation Notes

### Model Identifier

The current implementation uses `'z-ai/glm-4.6:exacto'` as the model identifier. This should be verified against OpenRouter's current model list to ensure:
- The model identifier is correct and active
- The model supports the Cerebras provider
- The `:exacto` variant is the correct choice for eliminating reasoning traces

### Provider Configuration

The provider configuration must specify:
```typescript
provider: {
  only: ['cerebras'],
  allow_fallbacks: false
}
```

This ensures:
- Requests are routed exclusively to Cerebras
- No fallback to slower providers occurs
- Failures are explicit rather than silent degradation

### Debounce Timing

The current 200ms debounce delay is optimized for Cerebras's ultra-fast inference (<100ms). This provides:
- Responsive feel for users
- Sufficient delay to prevent API flooding
- Balance between real-time feedback and API efficiency

### Request Cancellation

The AbortController pattern ensures:
- Only the most recent request updates the UI
- No race conditions from out-of-order responses
- Efficient use of API quota
- Clean request lifecycle management

### Logging Strategy

Console logging is comprehensive for debugging but should:
- Include timestamps for performance analysis
- Use consistent formatting for parseability
- Include request IDs for correlation
- Be removable or configurable for production

## Security Considerations

1. **API Key Protection**
   - API key stored in environment variables
   - Never exposed to client-side code
   - Transmitted only in server-side requests

2. **Input Sanitization**
   - All user input validated before API transmission
   - Special characters properly escaped in JSON
   - No code injection vulnerabilities

3. **Rate Limiting**
   - Client-side debouncing reduces request volume
   - Server-side rate limit errors handled gracefully
   - No retry storms on rate limit errors

4. **Error Information Disclosure**
   - Detailed errors logged server-side only
   - User-facing errors are generic and safe
   - No sensitive information in error messages

## Performance Considerations

1. **Response Time**
   - Target: <100ms for Cerebras inference
   - Debounce: 200ms to balance responsiveness and efficiency
   - Network overhead: ~20-50ms typical

2. **Request Size**
   - Prompt size varies with cognitive knobs (typically <2KB)
   - Response size varies with max_tokens setting
   - JSON overhead minimal

3. **Memory Usage**
   - Single in-flight request at a time
   - Responses stored in reactive state
   - No response caching (real-time generation)

4. **API Quota**
   - Debouncing reduces unnecessary requests
   - Request cancellation prevents wasted quota
   - Validation prevents invalid requests
