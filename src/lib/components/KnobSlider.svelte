<script lang="ts">
  import type { Knob } from '$lib/types';

  interface Props {
    knob: Knob;
  }

  let { knob }: Props = $props();

  // Calculate percentage for visual fill
  const percentage = $derived(
    ((knob.value - knob.min) / (knob.max - knob.min)) * 100
  );

  // Format value display based on parameter type
  const displayValue = $derived(() => {
    if (knob.parameter === 'max_tokens') {
      return knob.value.toFixed(0);
    }
    return knob.value.toFixed(2);
  });
</script>

<div class="knob-slider">
  <div class="knob-header">
    <label for={knob.id} class="knob-name">{knob.name}</label>
    <div class="led-display">
      <span class="led-value">{displayValue()}</span>
    </div>
  </div>

  <div class="fader-container">
    <div class="fader-track"></div>
    <div class="fader-fill" style="height: {percentage}%"></div>
    <input
      id={knob.id}
      type="range"
      min={knob.min}
      max={knob.max}
      step={knob.step}
      bind:value={knob.value}
      orient="vertical"
      aria-label={knob.name}
    />
    <div class="fader-thumb" style="bottom: {percentage}%"></div>
  </div>

  <p class="knob-description">{knob.description}</p>

  <!-- Scale markers -->
  <div class="scale-markers">
    <span class="marker">MIN</span>
    <span class="marker">MAX</span>
  </div>
</div>

<style>
  .knob-slider {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-lg);
    background: linear-gradient(135deg, var(--wood-medium) 0%, var(--wood-dark) 100%);
    border: 2px solid var(--copper);
    border-radius: 8px;
    box-shadow: var(--shadow-md);
    position: relative;
  }

  .knob-slider::before {
    content: '';
    position: absolute;
    top: 4px;
    left: 4px;
    right: 4px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  }

  .knob-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-sm);
  }

  .knob-name {
    font-family: var(--font-display);
    font-size: 0.875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--brass);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .led-display {
    background: var(--steel-dark);
    border: 2px solid var(--steel);
    border-radius: 4px;
    padding: 4px 12px;
    box-shadow: var(--shadow-inset);
    position: relative;
  }

  .led-value {
    font-family: var(--font-mono);
    font-size: 1rem;
    font-weight: 700;
    color: var(--amber);
    text-shadow: var(--glow-amber);
    animation: flicker 3s infinite;
  }

  .fader-container {
    position: relative;
    height: 200px;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .fader-track {
    position: absolute;
    width: 8px;
    height: 100%;
    background: linear-gradient(180deg, var(--steel-dark) 0%, var(--wood-dark) 100%);
    border: 1px solid var(--steel);
    border-radius: 4px;
    box-shadow: var(--shadow-inset);
  }

  .fader-fill {
    position: absolute;
    bottom: 0;
    width: 8px;
    background: linear-gradient(180deg, var(--brass) 0%, var(--amber) 100%);
    border-radius: 4px;
    box-shadow: 0 0 10px var(--amber-glow);
    transition: height 0.1s ease-out;
    pointer-events: none;
  }

  .fader-thumb {
    position: absolute;
    width: 40px;
    height: 30px;
    background: linear-gradient(135deg, var(--steel) 0%, var(--steel-dark) 100%);
    border: 2px solid var(--brass);
    border-radius: 4px;
    box-shadow: var(--shadow-md), inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transform: translateY(50%);
    transition: bottom 0.1s ease-out;
    pointer-events: none;
  }

  .fader-thumb::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 3px;
    height: 12px;
    background: var(--amber);
    border-radius: 2px;
    box-shadow: 0 0 4px var(--amber-glow);
  }

  input[type="range"] {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    z-index: 10;
  }

  input[type="range"]:hover + .fader-thumb {
    filter: brightness(1.2);
  }

  input[type="range"]:active + .fader-thumb {
    filter: brightness(1.4);
    box-shadow: var(--shadow-lg), inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  .knob-description {
    font-size: 0.75rem;
    line-height: 1.4;
    color: var(--cream-dark);
    text-align: center;
    margin-top: var(--space-sm);
    padding-top: var(--space-sm);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .scale-markers {
    display: flex;
    justify-content: space-between;
    padding: 0 var(--space-sm);
  }

  .marker {
    font-family: var(--font-mono);
    font-size: 0.625rem;
    color: var(--copper);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .fader-container {
      height: 150px;
    }
  }
</style>
