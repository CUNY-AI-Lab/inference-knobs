<script lang="ts">
  import { knobsStore } from '$lib/stores/knobs.svelte';
  import { saveConfiguration, loadAllConfigurations, deleteConfiguration, loadConfiguration } from '$lib/utils/localStorage';
  import type { KnobConfiguration, StoredConfiguration } from '$lib/types';

  let savedConfigs = $state<StoredConfiguration[]>(loadAllConfigurations());
  let configName = $state('');
  let showManager = $state(false);

  function handleSave() {
    if (!configName.trim()) return;

    const config: KnobConfiguration = {
      id: crypto.randomUUID(),
      name: configName,
      knobs: structuredClone(knobsStore.knobs),
      systemPrompt: knobsStore.systemPrompt,
      createdAt: new Date()
    };

    saveConfiguration(config);
    savedConfigs = loadAllConfigurations();
    configName = '';
  }

  function handleLoad(id: string) {
    const config = loadConfiguration(id);
    if (config) {
      knobsStore.loadKnobs(config.knobs);
      knobsStore.systemPrompt = config.systemPrompt;
    }
  }

  function handleDelete(id: string) {
    deleteConfiguration(id);
    savedConfigs = loadAllConfigurations();
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
</script>

<div class="config-manager">
  <button class="toggle-button" onclick={() => showManager = !showManager}>
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="3" width="16" height="3" rx="1" fill="currentColor"/>
      <rect x="2" y="8" width="16" height="3" rx="1" fill="currentColor"/>
      <rect x="2" y="13" width="16" height="3" rx="1" fill="currentColor"/>
    </svg>
    Presets
    <svg class="chevron" class:open={showManager} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>

  {#if showManager}
    <div class="manager-panel">
      <div class="save-section">
        <h4>Save Current Settings</h4>
        <div class="save-form">
          <input
            type="text"
            bind:value={configName}
            placeholder="Preset name..."
            class="name-input"
          />
          <button
            class="save-button"
            onclick={handleSave}
            disabled={!configName.trim()}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 2H3C2.4 2 2 2.4 2 3V13C2 13.6 2.4 14 3 14H13C13.6 14 14 13.6 14 13V4L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M11 14V9H5V14M5 2V5H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Save
          </button>
        </div>
      </div>

      <div class="presets-section">
        <h4>Saved Presets ({savedConfigs.length})</h4>
        {#if savedConfigs.length === 0}
          <p class="empty-message">No saved presets yet.</p>
        {:else}
          <div class="presets-list">
            {#each savedConfigs as config (config.id)}
              <div class="preset-item">
                <div class="preset-info">
                  <span class="preset-name">{config.name}</span>
                  <span class="preset-date">{formatDate(config.createdAt)}</span>
                </div>
                <div class="preset-actions">
                  <button
                    class="action-button load"
                    onclick={() => handleLoad(config.id)}
                    title="Load preset"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1V7M7 7L10 4M7 7L4 4M1 13H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Load
                  </button>
                  <button
                    class="action-button delete"
                    onclick={() => handleDelete(config.id)}
                    title="Delete preset"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 3.5H13M5.5 6.5V10.5M8.5 6.5V10.5M2 3.5L3 12C3 12.5 3.4 13 4 13H10C10.6 13 11 12.5 11 12L12 3.5M5 3.5V1.5C5 1.2 5.2 1 5.5 1H8.5C8.8 1 9 1.2 9 1.5V3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .config-manager {
    background: var(--wood-medium);
    border: 2px solid var(--copper);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: var(--shadow-md);
  }

  .toggle-button {
    width: 100%;
    padding: var(--space-md) var(--space-lg);
    background: linear-gradient(135deg, var(--wood-medium) 0%, var(--wood-dark) 100%);
    border: none;
    color: var(--brass);
    font-family: var(--font-display);
    font-size: 0.875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    transition: all 0.2s;
  }

  .toggle-button:hover {
    background: var(--wood-light);
  }

  .chevron {
    margin-left: auto;
    transition: transform 0.3s;
  }

  .chevron.open {
    transform: rotate(180deg);
  }

  .manager-panel {
    padding: var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
    animation: slide-up 0.3s ease-out;
  }

  .save-section h4,
  .presets-section h4 {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--copper);
    text-transform: uppercase;
    margin-bottom: var(--space-md);
    letter-spacing: 0.05em;
  }

  .save-form {
    display: flex;
    gap: var(--space-sm);
  }

  .name-input {
    flex: 1;
    padding: var(--space-sm) var(--space-md);
    background: var(--steel-dark);
    border: 2px solid var(--steel);
    border-radius: 4px;
    color: var(--cream);
    font-family: var(--font-mono);
    font-size: 0.875rem;
    box-shadow: var(--shadow-inset);
  }

  .name-input::placeholder {
    color: var(--cream-dark);
    opacity: 0.5;
  }

  .name-input:focus {
    outline: none;
    border-color: var(--brass);
    box-shadow: var(--shadow-inset), 0 0 0 2px rgba(212, 175, 55, 0.2);
  }

  .save-button {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-sm) var(--space-md);
    background: var(--brass);
    border: none;
    border-radius: 4px;
    color: var(--wood-dark);
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: var(--shadow-sm);
  }

  .save-button:hover:not(:disabled) {
    background: var(--amber);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .save-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .empty-message {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--cream-dark);
    text-align: center;
    padding: var(--space-lg);
    opacity: 0.7;
  }

  .presets-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .preset-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-md);
    background: var(--wood-dark);
    border: 1px solid var(--steel);
    border-radius: 6px;
    transition: all 0.2s;
  }

  .preset-item:hover {
    border-color: var(--brass);
    background: var(--wood-light);
  }

  .preset-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .preset-name {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    color: var(--cream);
    font-weight: 700;
  }

  .preset-date {
    font-family: var(--font-mono);
    font-size: 0.625rem;
    color: var(--copper);
  }

  .preset-actions {
    display: flex;
    gap: var(--space-xs);
  }

  .action-button {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    border: 1px solid;
    border-radius: 4px;
    font-family: var(--font-mono);
    font-size: 0.625rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-button.load {
    background: var(--steel-dark);
    border-color: var(--steel);
    color: var(--led-green);
  }

  .action-button.load:hover {
    background: var(--led-green);
    color: var(--wood-dark);
    border-color: var(--led-green);
  }

  .action-button.delete {
    background: transparent;
    border-color: var(--led-red);
    color: var(--led-red);
  }

  .action-button.delete:hover {
    background: var(--led-red);
    color: var(--wood-dark);
  }
</style>
