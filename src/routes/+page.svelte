<script lang="ts">
  import { knobsStore, exampleTexts } from '$lib/stores/knobs.svelte';
  import type { GenerationRequest, OpenRouterResponse, CognitiveKnob } from '$lib/types';
  import { browser } from '$app/environment';

  let abortController: AbortController | null = null;
  let showAdvanced = $state(false);
  let showAddKnob = $state(false);
  let showEditKnob = $state(false);
  let editingKnobId = $state<string | null>(null);
  let newKnobName = $state('');
  let newKnobDescription = $state('');
  let isGeneratingDescription = $state(false);
  let debouncedGenerate: ReturnType<typeof setTimeout> | null = null;
  let debouncedDescriptionGenerate: ReturnType<typeof setTimeout> | null = null;

  // Save knobs to localStorage when they change
  $effect(() => {
    const cog = knobsStore.cognitiveKnobs;
    const llm = knobsStore.llmKnobs;
    if (browser) {
      localStorage.setItem('cognitive-knobs', JSON.stringify({ cognitiveKnobs: cog, llmKnobs: llm }));
    }
  });

  // Live preview - generate whenever knobs or source text change
  $effect(() => {
    // Track dependencies
    const cogKnobs = knobsStore.cognitiveKnobs.map(k => k.value).join(',');
    const text = knobsStore.sourceText;

    // Clear previous timeout
    if (debouncedGenerate) {
      clearTimeout(debouncedGenerate);
    }

    // Only generate if we have source text
    if (text.trim()) {
      // Debounce by 200ms (fast enough with Cerebras)
      debouncedGenerate = setTimeout(() => {
        generateResponse();
      }, 200);
    }

    // Cleanup
    return () => {
      if (debouncedGenerate) {
        clearTimeout(debouncedGenerate);
      }
    };
  });

  // Auto-generate knob description when name is typed
  $effect(() => {
    const name = newKnobName;

    // Clear previous timeout
    if (debouncedDescriptionGenerate) {
      clearTimeout(debouncedDescriptionGenerate);
    }

    // Generate if name is not empty and a modal is open
    if (name.trim() && (showAddKnob || showEditKnob)) {
      debouncedDescriptionGenerate = setTimeout(() => {
        generateKnobDescription(name);
      }, 700);
    }

    // Cleanup
    return () => {
      if (debouncedDescriptionGenerate) {
        clearTimeout(debouncedDescriptionGenerate);
      }
    };
  });

  async function generateResponse() {
    if (!knobsStore.sourceText.trim()) return;

    if (abortController) abortController.abort();

    knobsStore.isGenerating = true;
    knobsStore.response = '';
    knobsStore.error = '';
    abortController = new AbortController();

    try {
      const requestBody: GenerationRequest = {
        sourceText: knobsStore.sourceText,
        cognitiveKnobs: knobsStore.cognitiveKnobs,
        systemPrompt: knobsStore.systemPrompt,
        parameters: knobsStore.parameters
      };

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: abortController.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const data: OpenRouterResponse = await response.json();
      // GLM 4.6 returns reasoning in a separate field
      const message = data.choices[0]?.message;
      const content = message?.content || message?.reasoning || 'No response generated';
      knobsStore.response = content;
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') return;
        knobsStore.error = err.message;
      } else {
        knobsStore.error = 'An unexpected error occurred';
      }
    } finally {
      knobsStore.isGenerating = false;
    }
  }

  async function generateKnobDescription(knobName: string) {
    if (!knobName.trim()) return;

    isGeneratingDescription = true;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText: `Generate a brief, concise description (10-15 words) for a cognitive transformation parameter called "${knobName}". Explain what axis or dimension of transformation it controls. Be direct and specific.`,
          cognitiveKnobs: [],
          systemPrompt: 'You provide concise, technical descriptions.',
          parameters: {
            temperature: 0.7,
            max_tokens: 100,
            top_p: 0.9,
            frequency_penalty: 0,
            presence_penalty: 0
          }
        })
      });

      if (!response.ok) return;

      const data: OpenRouterResponse = await response.json();
      const message = data.choices[0]?.message;
      const description = message?.content || message?.reasoning || '';

      // Always update with the new description
      newKnobDescription = description.trim();
    } catch (err) {
      // Silently fail - user can type manually
      console.error('Description generation failed:', err);
    } finally {
      isGeneratingDescription = false;
    }
  }

  function addKnob() {
    if (!newKnobName.trim() || !newKnobDescription.trim()) return;

    const newKnob: CognitiveKnob = {
      id: crypto.randomUUID(),
      name: newKnobName,
      description: newKnobDescription,
      value: 50
    };

    knobsStore.addCognitiveKnob(newKnob);
    newKnobName = '';
    newKnobDescription = '';
    showAddKnob = false;
  }

  function openEditModal(knob: CognitiveKnob) {
    editingKnobId = knob.id;
    newKnobName = knob.name;
    newKnobDescription = knob.description;
    showEditKnob = true;
  }

  function updateKnob() {
    if (!editingKnobId || !newKnobName.trim() || !newKnobDescription.trim()) return;

    const knob = knobsStore.cognitiveKnobs.find(k => k.id === editingKnobId);
    if (knob) {
      knob.name = newKnobName;
      knob.description = newKnobDescription;
    }

    newKnobName = '';
    newKnobDescription = '';
    editingKnobId = null;
    showEditKnob = false;
  }
</script>

<svelte:head>
  <title>Inference Knobs</title>
</svelte:head>

<div class="container">
  <!-- Compact Header -->
  <header>
    <h1>🎛️ Inference Knobs</h1>
    <p>Real-time AI parameter control surface</p>
  </header>

  <!-- Input -->
  <section class="input-section">
    <div class="input-header">
      <label for="source">Source Text</label>
      <select
        class="example-select"
        onchange={(e) => {
          const selected = (e.target as HTMLSelectElement).value;
          if (selected) {
            const example = exampleTexts.find(ex => ex.id === selected);
            if (example) {
              knobsStore.sourceText = example.text;
            }
          }
          (e.target as HTMLSelectElement).value = '';
        }}
      >
        <option value="">Load Example...</option>
        {#each exampleTexts as example}
          <option value={example.id}>{example.title}</option>
        {/each}
      </select>
    </div>
    <textarea
      id="source"
      bind:value={knobsStore.sourceText}
      placeholder="Enter text to transform..."
      rows="4"
    ></textarea>
  </section>

  <!-- Cognitive Knobs -->
  <section class="knobs-section">
    <div class="section-header">
      <h2>Cognitive Parameters</h2>
      <button class="add-btn" onclick={() => showAddKnob = !showAddKnob}>
        + Add Knob
      </button>
    </div>


    <div class="knobs-grid">
      {#each knobsStore.cognitiveKnobs as knob (knob.id)}
        <div class="knob">
          <div class="knob-header">
            <span class="knob-name">{knob.name}</span>
            <div class="knob-actions">
              <button class="edit-btn" onclick={() => openEditModal(knob)}>✎</button>
              <button class="remove-btn" onclick={() => knobsStore.removeCognitiveKnob(knob.id)}>×</button>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            bind:value={knob.value}
            class="slider"
          />
          <div class="knob-footer">
            <span class="value">{knob.value}</span>
            <span class="desc">{knob.description}</span>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Live Status -->
  <div class="live-status">
    {#if knobsStore.isGenerating}
      <span class="spinner"></span>
      <span>Generating...</span>
    {:else if knobsStore.sourceText.trim()}
      <span class="indicator active"></span>
      <span>Live</span>
    {:else}
      <span class="indicator"></span>
      <span>Enter text to begin</span>
    {/if}
  </div>

  <!-- Output -->
  <section class="output-section">
    <h2>Output</h2>
    {#if knobsStore.error}
      <div class="error">{knobsStore.error}</div>
    {:else if knobsStore.response}
      <div class="response">{knobsStore.response}</div>
    {:else}
      <div class="empty">Adjust parameters and generate to see output...</div>
    {/if}
  </section>

  <!-- Advanced Settings -->
  <details class="advanced" bind:open={showAdvanced}>
    <summary>Advanced Settings</summary>

    <div class="advanced-content">
      <!-- System Prompt -->
      <div class="field">
        <label>System Prompt</label>
        <textarea bind:value={knobsStore.systemPrompt} rows="2"></textarea>
      </div>

      <!-- LLM Parameters -->
      <div class="llm-knobs">
        {#each knobsStore.llmKnobs as llmKnob (llmKnob.id)}
          <div class="llm-knob">
            <label>
              {llmKnob.name}
              <span class="llm-value">{llmKnob.value}</span>
            </label>
            <input
              type="range"
              min={llmKnob.min}
              max={llmKnob.max}
              step={llmKnob.step}
              bind:value={llmKnob.value}
            />
            <p class="hint">{llmKnob.description}</p>
          </div>
        {/each}
      </div>
    </div>
  </details>
</div>

<!-- Add Knob Modal -->
{#if showAddKnob}
  <div
    class="modal-backdrop"
    onclick={(e) => {
      if (e.target === e.currentTarget) {
        showAddKnob = false;
        newKnobName = '';
        newKnobDescription = '';
      }
    }}
    onkeydown={(e) => {
      if (e.key === 'Escape') {
        showAddKnob = false;
        newKnobName = '';
        newKnobDescription = '';
      }
    }}
    role="dialog"
    aria-modal="true"
  >
    <div class="modal-dialog">
      <div class="modal-header">
        <h3>Add New Inference Knob</h3>
        <button
          class="modal-close"
          onclick={() => {
            showAddKnob = false;
            newKnobName = '';
            newKnobDescription = '';
          }}
        >×</button>
      </div>

      <div class="modal-body">
        <div class="modal-field">
          <label for="knob-name">Knob Name</label>
          <input
            id="knob-name"
            type="text"
            bind:value={newKnobName}
            placeholder="e.g., Formality, Emotion, Technicality"
            autofocus
          />
        </div>

        <div class="modal-field">
          <label for="knob-description">
            Description
            {#if isGeneratingDescription}
              <span class="generating-label">Generating...</span>
            {/if}
          </label>
          <textarea
            id="knob-description"
            bind:value={newKnobDescription}
            placeholder={isGeneratingDescription ? "AI is generating description..." : "Describe what transformation this knob controls (auto-generated)"}
            disabled={isGeneratingDescription}
            rows="4"
          ></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" onclick={() => {
          showAddKnob = false;
          newKnobName = '';
          newKnobDescription = '';
        }}>Cancel</button>
        <button class="btn-primary" onclick={addKnob}>Add Knob</button>
      </div>
    </div>
  </div>
{/if}

<!-- Edit Knob Modal -->
{#if showEditKnob}
  <div
    class="modal-backdrop"
    onclick={(e) => {
      if (e.target === e.currentTarget) {
        showEditKnob = false;
        newKnobName = '';
        newKnobDescription = '';
        editingKnobId = null;
      }
    }}
    onkeydown={(e) => {
      if (e.key === 'Escape') {
        showEditKnob = false;
        newKnobName = '';
        newKnobDescription = '';
        editingKnobId = null;
      }
    }}
    role="dialog"
    aria-modal="true"
  >
    <div class="modal-dialog">
      <div class="modal-header">
        <h3>Edit Inference Knob</h3>
        <button
          class="modal-close"
          onclick={() => {
            showEditKnob = false;
            newKnobName = '';
            newKnobDescription = '';
            editingKnobId = null;
          }}
        >×</button>
      </div>

      <div class="modal-body">
        <div class="modal-field">
          <label for="edit-knob-name">Knob Name</label>
          <input
            id="edit-knob-name"
            type="text"
            bind:value={newKnobName}
            placeholder="e.g., Formality, Emotion, Technicality"
            autofocus
          />
        </div>

        <div class="modal-field">
          <label for="edit-knob-description">
            Description
            {#if isGeneratingDescription}
              <span class="generating-label">Generating...</span>
            {/if}
          </label>
          <textarea
            id="edit-knob-description"
            bind:value={newKnobDescription}
            placeholder={isGeneratingDescription ? "AI is generating description..." : "Describe what transformation this knob controls"}
            disabled={isGeneratingDescription}
            rows="4"
          ></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" onclick={() => {
          showEditKnob = false;
          newKnobName = '';
          newKnobDescription = '';
          editingKnobId = null;
        }}>Cancel</button>
        <button class="btn-primary" onclick={updateKnob}>Save Changes</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  /* Header */
  header {
    text-align: center;
    margin-bottom: 2rem;
  }

  header h1 {
    font-family: var(--font-title);
    font-size: 2rem;
    color: var(--amber);
    margin: 0;
  }

  header p {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    color: var(--copper);
    margin: 0.5rem 0 0;
  }

  /* Sections */
  section {
    margin-bottom: 2rem;
  }

  section h2 {
    font-family: var(--font-display);
    font-size: 1rem;
    color: var(--brass);
    text-transform: uppercase;
    margin: 0 0 1rem;
  }

  /* Input */
  .input-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .input-section label {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--copper);
    margin: 0;
  }

  .example-select {
    padding: 0.4rem 0.6rem;
    background: var(--steel-dark);
    border: 1px solid var(--steel);
    border-radius: 4px;
    color: var(--brass);
    font-family: var(--font-mono);
    font-size: 0.7rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .example-select:hover {
    border-color: var(--brass);
    background: var(--steel);
    color: var(--wood-dark);
  }

  .example-select:focus {
    outline: none;
    border-color: var(--copper);
  }

  textarea,
  input[type="text"] {
    width: 100%;
    padding: 0.75rem;
    background: var(--steel-dark);
    border: 2px solid var(--steel);
    border-radius: 6px;
    color: var(--cream);
    font-family: var(--font-mono);
    font-size: 0.875rem;
    resize: vertical;
  }

  textarea:focus,
  input:focus {
    outline: none;
    border-color: var(--brass);
  }

  /* Knobs Section */
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .add-btn {
    padding: 0.5rem 1rem;
    background: var(--brass);
    border: none;
    border-radius: 4px;
    color: var(--wood-dark);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    cursor: pointer;
    font-weight: 700;
  }

  .add-btn:hover {
    background: var(--amber);
  }

  /* Modal */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(42, 24, 16, 0.85);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .modal-dialog {
    background: var(--wood-medium);
    border: 3px solid var(--brass);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 40px var(--amber-glow);
    max-width: 500px;
    width: 100%;
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 2px solid var(--wood-light);
  }

  .modal-header h3 {
    font-family: var(--font-display);
    font-size: 1.125rem;
    color: var(--brass);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .modal-close {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--copper);
    font-size: 1.5rem;
    cursor: pointer;
    line-height: 1;
    transition: color 0.2s;
  }

  .modal-close:hover {
    color: var(--amber);
  }

  .modal-body {
    padding: 1.5rem;
  }

  .modal-field {
    margin-bottom: 1.25rem;
  }

  .modal-field:last-child {
    margin-bottom: 0;
  }

  .modal-field label {
    display: block;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--copper);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .generating-label {
    color: var(--brass);
    font-style: italic;
    margin-left: 0.5rem;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }

  .modal-field input,
  .modal-field textarea {
    width: 100%;
    padding: 0.875rem;
    background: var(--steel-dark);
    border: 2px solid var(--steel);
    border-radius: 6px;
    color: var(--cream);
    font-family: var(--font-mono);
    font-size: 0.9rem;
    transition: border-color 0.2s;
  }

  .modal-field input:focus,
  .modal-field textarea:focus {
    outline: none;
    border-color: var(--brass);
  }

  .modal-field textarea {
    resize: vertical;
    min-height: 100px;
  }

  .modal-field textarea:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.5rem;
    border-top: 2px solid var(--wood-light);
  }

  .btn-primary,
  .btn-secondary {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: var(--brass);
    color: var(--wood-dark);
  }

  .btn-primary:hover {
    background: var(--amber);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
  }

  .btn-secondary {
    background: var(--steel);
    color: var(--cream);
  }

  .btn-secondary:hover {
    background: var(--steel-dark);
  }

  /* Knobs Grid */
  .knobs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
  }

  .knob {
    background: var(--wood-medium);
    border: 2px solid var(--copper);
    border-radius: 6px;
    padding: 1rem;
  }

  .knob-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .knob-name {
    font-family: var(--font-display);
    font-size: 0.875rem;
    color: var(--brass);
    font-weight: 700;
  }

  .knob-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .edit-btn {
    width: 24px;
    height: 24px;
    background: transparent;
    border: 1px solid var(--brass);
    border-radius: 50%;
    color: var(--brass);
    font-size: 0.875rem;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .edit-btn:hover {
    background: var(--brass);
    color: var(--wood-dark);
  }

  .remove-btn {
    width: 24px;
    height: 24px;
    background: transparent;
    border: 1px solid var(--led-red);
    border-radius: 50%;
    color: var(--led-red);
    font-size: 1.25rem;
    line-height: 1;
    cursor: pointer;
    padding: 0;
  }

  .remove-btn:hover {
    background: var(--led-red);
    color: var(--wood-dark);
  }

  /* Slider */
  .slider {
    width: 100%;
    margin: 0.5rem 0;
  }

  .knob-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .value {
    font-family: var(--font-mono);
    font-size: 1.25rem;
    color: var(--amber);
    font-weight: 700;
    min-width: 3ch;
  }

  .desc {
    font-size: 0.7rem;
    color: var(--cream-dark);
    line-height: 1.3;
  }

  /* Live Status */
  .live-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--wood-medium);
    border: 2px solid var(--steel);
    border-radius: 6px;
    margin-bottom: 1.5rem;
    font-family: var(--font-mono);
    font-size: 0.875rem;
    color: var(--cream);
  }

  .indicator {
    width: 12px;
    height: 12px;
    background: var(--led-red);
    border-radius: 50%;
    box-shadow: 0 0 4px var(--led-red);
  }

  .indicator.active {
    background: var(--led-green);
    box-shadow: 0 0 10px var(--led-green);
    animation: pulse-glow 2s infinite;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--wood-dark);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Output */
  .output-section {
    background: var(--wood-medium);
    border: 2px solid var(--copper);
    border-radius: 6px;
    padding: 1rem;
    min-height: 150px;
  }

  .response,
  .error,
  .empty {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    line-height: 1.6;
    white-space: pre-wrap;
  }

  .response {
    color: var(--cream);
  }

  .error {
    color: var(--led-red);
  }

  .empty {
    color: var(--cream-dark);
    opacity: 0.6;
    font-style: italic;
  }

  /* Advanced Settings */
  .advanced {
    background: var(--wood-dark);
    border: 2px solid var(--steel);
    border-radius: 6px;
    padding: 0;
  }

  .advanced summary {
    padding: 1rem;
    font-family: var(--font-mono);
    font-size: 0.875rem;
    color: var(--copper);
    cursor: pointer;
    list-style: none;
    user-select: none;
  }

  .advanced summary::-webkit-details-marker {
    display: none;
  }

  .advanced summary::before {
    content: '▸ ';
    display: inline-block;
    transition: transform 0.2s;
  }

  .advanced[open] summary::before {
    transform: rotate(90deg);
  }

  .advanced-content {
    padding: 0 1rem 1rem;
  }

  .field {
    margin-bottom: 1rem;
  }

  .field label {
    display: block;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--copper);
    margin-bottom: 0.5rem;
  }

  .llm-knobs {
    display: grid;
    gap: 1rem;
  }

  .llm-knob label {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--brass);
    margin-bottom: 0.25rem;
  }

  .llm-value {
    color: var(--amber);
    font-weight: 700;
  }

  .llm-knob input[type="range"] {
    width: 100%;
  }

  .hint {
    font-size: 0.7rem;
    color: var(--cream-dark);
    margin: 0.25rem 0 0;
  }
</style>
