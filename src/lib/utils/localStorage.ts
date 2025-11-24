/**
 * localStorage utilities for configuration persistence
 */
import { browser } from '$app/environment';
import type { KnobConfiguration, StoredConfiguration } from '$lib/types';

const STORAGE_KEY = 'cognitive-knobs-configs';

export function saveConfiguration(config: KnobConfiguration): void {
  if (!browser) return;

  const configs = loadAllConfigurations();

  // Convert to storable format
  const storedConfig: StoredConfiguration = {
    ...config,
    createdAt: config.createdAt.toISOString()
  };

  configs.push(storedConfig);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  } catch (error) {
    console.error('Failed to save configuration:', error);
  }
}

export function loadAllConfigurations(): StoredConfiguration[] {
  if (!browser) return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load configurations:', error);
    return [];
  }
}

export function deleteConfiguration(id: string): void {
  if (!browser) return;

  const configs = loadAllConfigurations().filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

export function loadConfiguration(id: string): KnobConfiguration | null {
  const configs = loadAllConfigurations();
  const stored = configs.find(c => c.id === id);

  if (!stored) return null;

  // Convert back to KnobConfiguration with Date object
  return {
    ...stored,
    createdAt: new Date(stored.createdAt)
  };
}
