export interface Theme {
  id: string;
  name: string;
  painter: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    surface: string;
    text: string;
  };
}

export interface AppState {
  health: number;
  mana: number;
  xp: number;
  level: number;
  stress: number;
  themeId: string;
  language: 'en' | 'zh';
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  provider: 'gemini' | 'openai' | 'anthropic' | 'xai';
}

export interface Metrics {
  totalRuns: number;
  providerCalls: Record<string, number>;
  tokensUsed: number;
  lastRunDuration: number;
}

export const AVAILABLE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-3-flash-preview",
  "gemini-3-pro-preview",
  "gpt-4o-mini", 
  "gpt-4.1-mini",
  "claude-3-5-sonnet",
  "grok-4-fast-reasoning", 
  "grok-4-1-fast-non-reasoning"
];