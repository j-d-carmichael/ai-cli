export const SUPPORTED_SERVICES = {
  anthropic: 'Claude (Anthropic)',
  google: 'Gemini (Google)',
  openai: 'GPT (OpenAI)',
};

// --- Model Definitions ---
export const AVAILABLE_MODELS = {
  anthropic: [
    { name: 'Claude 3.5 Sonnet (Recommended, Latest)', value: 'claude-3-5-sonnet-20240620' },
    { name: 'Claude 3 Opus (Most Powerful)', value: 'claude-3-opus-20240229' },
    { name: 'Claude 3 Haiku (Fastest)', value: 'claude-3-haiku-20240307' },
  ],
  google: [
    { name: 'Gemini 2.5 Pro Preview', value: 'gemini-2.5-pro-exp-03-25' },
    { name: 'Gemini 2.0 Flash', value: 'models/gemini-2.0-flash' },
  ],
  openai: [
    { name: 'GPT-4.1', value: 'gpt-4.1' },
    { name: 'GPT-4.1 (mini)', value: 'gpt-4.1-mini' },
    { name: 'GPT-4.1 (nano)', value: 'gpt-4.1-nano' },
    { name: 'GPT-4o', value: 'gpt-4o' },
    { name: 'GPT-4o (mini)', value: 'gpt-4o-mini' },
    { name: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
    { name: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
  ]
};
