<script lang="ts">
  import { knobsStore } from '$lib/stores/knobs.svelte';
  import KnobSlider from './KnobSlider.svelte';

  interface Props {
    onGenerate: () => void;
  }

  let { onGenerate }: Props = $props();

  let livePreviewEnabled = $state(false);
  let debouncedGenerate: ReturnType<typeof setTimeout> | null = null;

  // Effect for live preview with debouncing
  $effect(() => {
    if (!livePreviewEnabled) return;

    // Track dependencies
    const params = knobsStore.parameters;
    const prompt = knobsStore.userPrompt;

    // Clear previous timeout
    if (debouncedGenerate) {
      clearTimeout(debouncedGenerate);
    }

    // Set new timeout (300ms debounce)
    if (prompt.trim()) {
      debouncedGenerate = setTimeout(() => {
        onGenerate();
      }, 300);
    }

    // Cleanup function
    return () => {
      if (debouncedGenerate) {
        clearTimeout(debouncedGenerate);
      }
    };
  });

  function handleReset() {
    knobsStore.resetKnobs();
  }
</script>

<div class="knob-panel">
  <div class="panel-header">
    <h2 class="panel-title">Cognitive Parameters</h2>
    <div class="panel-controls">
      <label class="toggle-switch">
        <input type="checkbox" bind:checked={livePreviewEnabled} />
        <span class="toggle-slider"></span>
        <span class="toggle-label">Live Preview</span>
      </label>
      <button class="reset-button" onclick={handleReset} title="Reset to defaults">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M14 8A6 6 0 1 1 8 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M8 2V5M8 2H5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Reset
      </button>
    </div>
  </div>

  <div class="knobs-grid">
    {#each knobsStore.knobs as knob (knob.id)}
      <KnobSlider {knob} />
    {/each}
  </div>

  {#if !livePreviewEnabled}
    <button
      class="generate-button"
      onclick={onGenerate}
      disabled={knobsStore.isGenerating || !knobsStore.userPrompt.trim()}
    >
      {#if knobsStore.isGenerating}
        <span class="spinner"></span>
        Processing...
      {:else}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2L10 18M10 2L6 6M10 2L14 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Generate
      {/if}
    </button>
  {/if}
</div>

<style>
  .knob-panel {
    background: var(--wood-dark);
    border: 3px solid var(--brass);
    border-radius: 12px;
    padding: var(--space-xl);
    box-shadow: var(--shadow-lg), inset 0 0 40px rgba(0, 0, 0, 0.3);
    position: relative;
  }

  .knob-panel::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg,
      transparent,
      var(--brass),
      var(--amber),
      var(--brass),
      transparent
    );
    border-radius: 12px 12px 0 0;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-xl);
    padding-bottom: var(--space-lg);
    border-bottom: 2px solid var(--copper);
  }

  .panel-title {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--amber);
    text-shadow: var(--glow-amber);
  }

  .panel-controls {
    display: flex;
    gap: var(--space-md);
    align-items: center;
  }

  /* Toggle Switch */
  .toggle-switch {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    cursor: pointer;
  }

  .toggle-switch input {
    position: absolute;
    opacity: 0;
  }

  .toggle-slider {
    position: relative;
    width: 50px;
    height: 26px;
    background: var(--steel-dark);
    border: 2px solid var(--steel);
    border-radius: 13px;
    transition: background 0.3s;
    box-shadow: var(--shadow-inset);
  }

  .toggle-slider::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    background: var(--cream);
    border-radius: 50%;
    transition: transform 0.3s;
    box-shadow: var(--shadow-sm);
  }

  .toggle-switch input:checked + .toggle-slider {
    background: var(--amber);
    box-shadow: var(--glow-amber);
  }

  .toggle-switch input:checked + .toggle-slider::before {
    transform: translateX(24px);
    background: var(--led-green);
    box-shadow: 0 0 10px var(--led-green);
  }

  .toggle-label {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--cream);
    text-transform: uppercase;
  }

  /* Reset Button */
  .reset-button {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-sm) var(--space-md);
    background: var(--steel-dark);
    border: 2px solid var(--steel);
    border-radius: 6px;
    color: var(--cream);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: var(--shadow-sm);
  }

  .reset-button:hover {
    background: var(--steel);
    border-color: var(--brass);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .reset-button:active {
    transform: translateY(0);
    box-shadow: var(--shadow-inset);
  }

  /* Knobs Grid */
  .knobs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--space-lg);
    margin-bottom: var(--space-xl);
  }

  /* Generate Button */
  .generate-button {
    width: 100%;
    padding: var(--space-lg);
    background: linear-gradient(135deg, var(--amber) 0%, var(--copper) 100%);
    border: 3px solid var(--brass);
    border-radius: 8px;
    color: var(--wood-dark);
    font-family: var(--font-display);
    font-size: 1.125rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: var(--shadow-md);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
  }

  .generate-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg), var(--glow-amber);
    filter: brightness(1.1);
  }

  .generate-button:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: var(--shadow-sm);
  }

  .generate-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 3px solid var(--wood-dark);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .panel-header {
      flex-direction: column;
      gap: var(--space-md);
      align-items: flex-start;
    }

    .knobs-grid {
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    }
  }
</style>
