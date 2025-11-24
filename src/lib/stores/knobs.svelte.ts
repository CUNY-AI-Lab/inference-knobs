/**
 * Reactive state store using Svelte 5 runes
 */
import { browser } from '$app/environment';
import type { CognitiveKnob, LLMKnob } from '$lib/types';

// Default cognitive knobs (user-defined parameters, 0-100 scale)
const defaultCognitiveKnobs: CognitiveKnob[] = [
  {
    id: 'abstraction',
    name: 'Abstraction',
    description: 'Move from concrete examples to theoretical frameworks',
    value: 50,
    lowLabel: 'Concrete',
    highLabel: 'Abstract'
  },
  {
    id: 'ridiculousness',
    name: 'Ridiculousness',
    description: 'Adjust the level of absurdity and implausibility in the content',
    value: 50
  },
  {
    id: 'accessibility',
    name: 'Accessibility',
    description: 'Adjust language complexity for different audiences',
    value: 50,
    lowLabel: 'Expert',
    highLabel: 'General'
  }
];

// Example texts from classic and diverse sources
export const exampleTexts = [
  {
    id: 'shakespeare',
    title: 'Shakespeare - Sonnet 18',
    text: `Shall I compare thee to a summer's day? Thou art more lovely and more temperate. Rough winds do shake the darling buds of May, and summer's lease hath all too short a date. Sometime too hot the eye of heaven shines, and often is his gold complexion dimmed; and every fair from fair sometime declines, by chance or nature's changing course untrimmed. But thy eternal summer shall not fade, nor lose possession of that fair thou ow'st, nor shall death brag thou wander'st in his shade, when in eternal lines to time thou grow'st. So long as men can breathe or eyes can see, so long lives this, and this gives life to thee.`
  },
  {
    id: 'angelou',
    title: 'Maya Angelou - Still I Rise',
    text: `You may write me down in history with your bitter, twisted lies, you may tread me in the very dirt but still, like dust, I'll rise. Does my sassiness upset you? Why are you beset with gloom? 'Cause I walk like I've got oil wells pumping in my living room. Just like moons and like suns, with the certainty of tides, just like hopes springing high, still I'll rise.`
  },
  {
    id: 'plato',
    title: 'Plato - The Allegory of the Cave',
    text: `Imagine human beings living in an underground den, which has a mouth open towards the light. Here they have been from their childhood, and have their legs and necks chained so that they cannot move, and can only see before them. Above and behind them a fire is blazing at a distance, and between the fire and the prisoners there is a raised way. They see only their own shadows, or the shadows of one another, which the fire throws on the opposite wall of the cave.`
  },
  {
    id: 'woolf',
    title: 'Virginia Woolf - A Room of One\'s Own',
    text: `A woman must have money and a room of her own if she is to write fiction. All I could do was to offer you an opinion upon one minor point—a woman must have money and a room of her own if she is to write fiction; and that, as you will see, leaves the great problem of the true nature of woman and the true nature of fiction unsolved.`
  },
  {
    id: 'darwin',
    title: 'Charles Darwin - On Natural Selection',
    text: `As many more individuals of each species are born than can possibly survive; and as, consequently, there is a frequently recurring struggle for existence, it follows that any being, if it vary however slightly in any manner profitable to itself, under the complex and sometimes varying conditions of life, will have a better chance of surviving, and thus be naturally selected. From the strong principle of inheritance, any selected variety will tend to propagate its new and modified form.`
  },
  {
    id: 'curie',
    title: 'Marie Curie - On Radioactivity',
    text: `I was taught that the way of progress was neither swift nor easy. Life is not easy for any of us. But what of that? We must have perseverance and above all confidence in ourselves. We must believe that we are gifted for something and that this thing must be attained. Nothing in life is to be feared, it is only to be understood. Now is the time to understand more, so that we may fear less.`
  },
  {
    id: 'turing',
    title: 'Alan Turing - Computing Machinery',
    text: `I propose to consider the question, "Can machines think?" This should begin with definitions of the meaning of the terms "machine" and "think." The definitions might be framed so as to reflect so far as possible the normal use of the words, but this attitude is dangerous. If the meaning of the words "machine" and "think" are to be found by examining how they are commonly used it is difficult to escape the conclusion that the meaning and the answer to the question, "Can machines think?" is to be sought in a statistical survey such as a Gallup poll.`
  },
  {
    id: 'lovelace',
    title: 'Ada Lovelace - Notes on the Analytical Engine',
    text: `The Analytical Engine has no pretensions whatever to originate anything. It can do whatever we know how to order it to perform. It can follow analysis; but it has no power of anticipating any analytical relations or truths. Its province is to assist us in making available what we are already acquainted with.`
  },
  {
    id: 'carson',
    title: 'Rachel Carson - Silent Spring',
    text: `Over increasingly large areas of the United States, spring now comes unheralded by the return of the birds, and the early mornings are strangely silent where once they were filled with the beauty of bird song. This sudden silencing of the song of birds, this obliteration of the color and beauty and interest they lend to our world have come about swiftly, insidiously, and unnoticed by those whose communities are as yet unaffected.`
  },
  {
    id: 'frost',
    title: 'Robert Frost - The Road Not Taken',
    text: `Two roads diverged in a yellow wood, and sorry I could not travel both and be one traveler, long I stood and looked down one as far as I could to where it bent in the undergrowth. Then took the other, as just as fair, and having perhaps the better claim, because it was grassy and wanted wear; though as for that the passing there had worn them really about the same.`
  },
  {
    id: 'adichie',
    title: 'Chimamanda Ngozi Adichie - The Danger of a Single Story',
    text: `The single story creates stereotypes, and the problem with stereotypes is not that they are untrue, but that they are incomplete. They make one story become the only story. It is impossible to talk about the single story without talking about power. Power is the ability not just to tell the story of another person, but to make it the definitive story of that person.`
  },
  {
    id: 'gdpr',
    title: 'Modern Policy - GDPR Regulation',
    text: `After years of staring down the world's biggest tech companies and setting the bar for tough regulation worldwide, Europe has blinked. Under intense pressure from industry and the US government, Brussels is stripping protections from its flagship General Data Protection Regulation (GDPR) — including simplifying its infamous cookie permission pop-ups — and relaxing or delaying landmark AI rules in an effort to cut red tape and revive sluggish economic growth.`
  },
  {
    id: 'hooks',
    title: 'bell hooks - All About Love',
    text: `The moment we choose to love we begin to move against domination, against oppression. The moment we choose to love we begin to move towards freedom, to act in ways that liberate ourselves and others. That action is the testimony of love as the practice of freedom. To know love, we have to tell the truth to ourselves and to others.`
  },
  {
    id: 'malala',
    title: 'Malala Yousafzai - UN Speech',
    text: `We realize the importance of our voices only when we are silenced. Dear brothers and sisters, we must not forget that millions of people are suffering from poverty, injustice and ignorance. We must not forget that millions of children are out of schools. We must not forget that our sisters and brothers are waiting for a bright peaceful future. Let us pick up our books and our pens. They are our most powerful weapons. One child, one teacher, one book, one pen can change the world.`
  }
];

// Advanced LLM parameter knobs (technical settings)
const defaultLLMKnobs: LLMKnob[] = [
  {
    id: 'temp',
    name: 'Temperature',
    description: 'Controls randomness: 0 = focused & deterministic, 2 = creative & diverse',
    value: 0.7,
    min: 0,
    max: 2,
    step: 0.1,
    parameter: 'temperature'
  },
  {
    id: 'tokens',
    name: 'Max Tokens',
    description: 'Maximum response length (higher = longer responses)',
    value: 1000,
    min: 50,
    max: 4000,
    step: 50,
    parameter: 'max_tokens'
  },
  {
    id: 'topp',
    name: 'Top P',
    description: 'Nucleus sampling: lower = focused, higher = diverse token choices',
    value: 0.9,
    min: 0,
    max: 1,
    step: 0.05,
    parameter: 'top_p'
  }
];

// Load from localStorage if available
function loadCognitiveKnobs(): CognitiveKnob[] {
  if (!browser) return defaultCognitiveKnobs;

  const stored = localStorage.getItem('cognitive-knobs');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.cognitiveKnobs || defaultCognitiveKnobs;
    } catch {
      return defaultCognitiveKnobs;
    }
  }
  return defaultCognitiveKnobs;
}

function loadLLMKnobs(): LLMKnob[] {
  if (!browser) return defaultLLMKnobs;

  const stored = localStorage.getItem('cognitive-knobs');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.llmKnobs || defaultLLMKnobs;
    } catch {
      return defaultLLMKnobs;
    }
  }
  return defaultLLMKnobs;
}

// Create reactive state using Svelte 5 runes
let cognitiveKnobs = $state<CognitiveKnob[]>(loadCognitiveKnobs());
let llmKnobs = $state<LLMKnob[]>(loadLLMKnobs());
let systemPrompt = $state<string>('You are a helpful assistant that transforms text according to specified cognitive parameters.');
let sourceText = $state<string>('');
let response = $state<string>('');
let isGenerating = $state<boolean>(false);
let error = $state<string>('');

// Helper function to save knobs to localStorage
function saveKnobs() {
  if (browser) {
    localStorage.setItem('cognitive-knobs', JSON.stringify({
      cognitiveKnobs,
      llmKnobs
    }));
  }
}

// Derived state: convert LLM knobs to API parameters
const parameters = $derived({
  temperature: llmKnobs.find(k => k.parameter === 'temperature')?.value ?? 0.7,
  max_tokens: llmKnobs.find(k => k.parameter === 'max_tokens')?.value ?? 1000,
  top_p: llmKnobs.find(k => k.parameter === 'top_p')?.value ?? 0.9,
  frequency_penalty: llmKnobs.find(k => k.parameter === 'frequency_penalty')?.value ?? 0,
  presence_penalty: llmKnobs.find(k => k.parameter === 'presence_penalty')?.value ?? 0
});

// Export reactive state and methods
export const knobsStore = {
  get cognitiveKnobs() { return cognitiveKnobs; },
  get llmKnobs() { return llmKnobs; },
  get systemPrompt() { return systemPrompt; },
  set systemPrompt(value: string) { systemPrompt = value; },
  get sourceText() { return sourceText; },
  set sourceText(value: string) { sourceText = value; },
  get response() { return response; },
  set response(value: string) { response = value; },
  get isGenerating() { return isGenerating; },
  set isGenerating(value: boolean) { isGenerating = value; },
  get error() { return error; },
  set error(value: string) { error = value; },
  get parameters() { return parameters; },

  addCognitiveKnob(knob: CognitiveKnob) {
    cognitiveKnobs.push(knob);
    saveKnobs();
  },

  removeCognitiveKnob(id: string) {
    cognitiveKnobs = cognitiveKnobs.filter(k => k.id !== id);
    saveKnobs();
  },

  updateCognitiveKnob(id: string, value: number) {
    const knob = cognitiveKnobs.find(k => k.id === id);
    if (knob) {
      knob.value = value;
      saveKnobs();
    }
  },

  updateLLMKnob(id: string, value: number) {
    const knob = llmKnobs.find(k => k.id === id);
    if (knob) {
      knob.value = value;
      saveKnobs();
    }
  },

  resetCognitiveKnobs() {
    cognitiveKnobs = structuredClone(defaultCognitiveKnobs);
    saveKnobs();
  },

  resetLLMKnobs() {
    llmKnobs = structuredClone(defaultLLMKnobs);
    saveKnobs();
  },

  // Legacy compatibility
  get knobs() { return cognitiveKnobs; },
  get userPrompt() { return sourceText; },
  set userPrompt(value: string) { sourceText = value; }
};
