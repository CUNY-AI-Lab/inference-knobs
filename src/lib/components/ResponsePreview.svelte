<script lang="ts">
  import { knobsStore } from '$lib/stores/knobs.svelte';
</script>

<div class="response-preview">
  <div class="preview-header">
    <h3 class="preview-title">Output Signal</h3>
    <div class="status-indicator">
      <div class="led" class:active={knobsStore.isGenerating}></div>
      <span class="status-text">
        {knobsStore.isGenerating ? 'Processing' : 'Ready'}
      </span>
    </div>
  </div>

  <div class="preview-display">
    {#if knobsStore.error}
      <div class="error-message">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p>{knobsStore.error}</p>
      </div>
    {:else if knobsStore.isGenerating}
      <div class="loading-state">
        <div class="waveform">
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
        </div>
        <p>Cognitive processing in progress...</p>
      </div>
    {:else if knobsStore.response}
      <div class="response-content">
        {knobsStore.response}
      </div>
    {:else}
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <rect x="8" y="20" width="48" height="32" rx="2" stroke="currentColor" stroke-width="2"/>
          <path d="M16 12L16 20M32 12L32 20M48 12L48 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <circle cx="20" cy="32" r="2" fill="currentColor"/>
          <circle cx="32" cy="32" r="2" fill="currentColor"/>
          <circle cx="44" cy="32" r="2" fill="currentColor"/>
        </svg>
        <p>Adjust parameters and enter a prompt to begin...</p>
      </div>
    {/if}
  </div>

  <!-- VU Meter Style Display -->
  <div class="vu-meter">
    <div class="meter-label">Signal Level</div>
    <div class="meter-bars">
      {#each Array(20) as _, i}
        <div
          class="meter-bar"
          class:low={i < 10}
          class:mid={i >= 10 && i < 16}
          class:high={i >= 16}
          class:active={knobsStore.response && (i < (knobsStore.response.length / 50))}
        ></div>
      {/each}
    </div>
  </div>
</div>

<style>
  .response-preview {
    background: var(--wood-dark);
    border: 3px solid var(--brass);
    border-radius: 12px;
    padding: var(--space-xl);
    box-shadow: var(--shadow-lg), inset 0 0 40px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    height: 100%;
  }

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: var(--space-md);
    border-bottom: 2px solid var(--copper);
  }

  .preview-title {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--amber);
    text-shadow: var(--glow-amber);
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .led {
    width: 12px;
    height: 12px;
    background: var(--led-red);
    border-radius: 50%;
    box-shadow: 0 0 4px var(--led-red), inset 0 1px 0 rgba(255, 255, 255, 0.3);
    transition: all 0.3s;
  }

  .led.active {
    background: var(--led-green);
    box-shadow: 0 0 10px var(--led-green), 0 0 20px rgba(0, 255, 136, 0.4);
    animation: pulse-glow 2s infinite;
  }

  .status-text {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--cream-dark);
    text-transform: uppercase;
  }

  .preview-display {
    flex: 1;
    background: var(--steel-dark);
    border: 2px solid var(--steel);
    border-radius: 8px;
    padding: var(--space-lg);
    box-shadow: var(--shadow-inset);
    min-height: 300px;
    overflow-y: auto;
  }

  .response-content {
    font-family: var(--font-mono);
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--cream);
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .empty-state,
  .loading-state,
  .error-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: var(--space-md);
    color: var(--cream-dark);
  }

  .empty-state svg {
    color: var(--copper);
    opacity: 0.5;
  }

  .empty-state p {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    text-align: center;
  }

  .error-message {
    color: var(--led-red);
  }

  .error-message svg {
    color: var(--led-red);
  }

  .error-message p {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    text-align: center;
  }

  /* Loading Animation */
  .waveform {
    display: flex;
    gap: 4px;
    align-items: flex-end;
    height: 60px;
  }

  .wave-bar {
    width: 6px;
    background: var(--amber);
    border-radius: 3px;
    animation: wave 1s ease-in-out infinite;
    box-shadow: 0 0 10px var(--amber-glow);
  }

  .wave-bar:nth-child(1) { animation-delay: 0s; }
  .wave-bar:nth-child(2) { animation-delay: 0.1s; }
  .wave-bar:nth-child(3) { animation-delay: 0.2s; }
  .wave-bar:nth-child(4) { animation-delay: 0.3s; }
  .wave-bar:nth-child(5) { animation-delay: 0.4s; }

  @keyframes wave {
    0%, 100% { height: 20px; }
    50% { height: 60px; }
  }

  .loading-state p {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    color: var(--amber);
    animation: flicker 2s infinite;
  }

  /* VU Meter */
  .vu-meter {
    background: var(--wood-medium);
    border: 2px solid var(--copper);
    border-radius: 6px;
    padding: var(--space-md);
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  .meter-label {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--copper);
    text-transform: uppercase;
    writing-mode: horizontal-tb;
  }

  .meter-bars {
    display: flex;
    gap: 3px;
    flex: 1;
    height: 24px;
    align-items: flex-end;
  }

  .meter-bar {
    flex: 1;
    height: 100%;
    background: var(--steel-dark);
    border-radius: 2px;
    transition: background 0.3s;
    opacity: 0.3;
  }

  .meter-bar.active {
    opacity: 1;
  }

  .meter-bar.low.active {
    background: var(--led-green);
    box-shadow: 0 0 4px var(--led-green);
  }

  .meter-bar.mid.active {
    background: var(--amber);
    box-shadow: 0 0 4px var(--amber);
  }

  .meter-bar.high.active {
    background: var(--led-red);
    box-shadow: 0 0 4px var(--led-red);
  }
</style>
