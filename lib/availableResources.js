export const SUPPORTED_SERVICES = {
  anthropic: 'Anthropic (Claude)',
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
    { name: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro-exp-03-25' },
    { name: 'Gemini 2.0 Flash', value: 'models/gemini-2.0-flash' },
  ],
  openai: [
    { name: 'GPT-4o Mini (Recommended, Cost-Effective)', value: 'gpt-4o-mini' },
    { name: 'GPT-4o (Latest, Advanced)', value: 'gpt-4o' },
    { name: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
    { name: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
  ]
};
