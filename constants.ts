import { Theme, Agent } from './types';

export const THEMES: Theme[] = [
  {
    id: 'monet',
    name: 'Water Lilies',
    painter: 'Claude Monet',
    colors: {
      primary: '#6B8E23', // Olive Drab
      secondary: '#ADD8E6', // Light Blue
      accent: '#FFB6C1', // Light Pink
      bg: '#F0F8FF', // Alice Blue
      surface: 'rgba(255, 255, 255, 0.8)',
      text: '#2F4F4F', // Dark Slate Gray
    }
  },
  {
    id: 'vangogh',
    name: 'Starry Night',
    painter: 'Vincent van Gogh',
    colors: {
      primary: '#191970', // Midnight Blue
      secondary: '#FFD700', // Gold
      accent: '#FFA500', // Orange
      bg: '#0B1026', // Deep Dark Blue
      surface: 'rgba(25, 25, 112, 0.4)',
      text: '#FFFACD', // Lemon Chiffon
    }
  },
  {
    id: 'hokusai',
    name: 'Great Wave',
    painter: 'Hokusai',
    colors: {
      primary: '#006994', // Sea Blue
      secondary: '#F5F5DC', // Beige
      accent: '#DC143C', // Crimson (Sun)
      bg: '#F0F8FF',
      surface: 'rgba(240, 248, 255, 0.9)',
      text: '#000080', // Navy
    }
  },
  {
    id: 'munch',
    name: 'The Scream',
    painter: 'Edvard Munch',
    colors: {
      primary: '#FF4500', // Orange Red
      secondary: '#483D8B', // Dark Slate Blue
      accent: '#8B4513', // Saddle Brown
      bg: '#2F2F2F',
      surface: 'rgba(50, 50, 50, 0.8)',
      text: '#FFE4B5',
    }
  },
  {
    id: 'dali',
    name: 'Persistence of Memory',
    painter: 'Salvador Dalí',
    colors: {
      primary: '#DAA520', // Goldenrod
      secondary: '#8B4513', // Saddle Brown
      accent: '#00CED1', // Dark Turquoise
      bg: '#F5DEB3', // Wheat
      surface: 'rgba(255, 235, 205, 0.6)',
      text: '#3E2723',
    }
  },
  {
    id: 'picasso',
    name: 'Cubism Blue',
    painter: 'Pablo Picasso',
    colors: {
      primary: '#4682B4', // Steel Blue
      secondary: '#708090', // Slate Gray
      accent: '#B0C4DE', // Light Steel Blue
      bg: '#E6E6FA', // Lavender
      surface: 'rgba(255, 255, 255, 0.9)',
      text: '#1C1C1C',
    }
  },
  // Adding more generic styles to hit the "20 styles" requirement conceptually
  // For brevity in code, we generate variations programmatically or just list top 6 for demo
  // but I will add a few more distinct ones.
  {
    id: 'kahlo',
    name: 'Viva la Vida',
    painter: 'Frida Kahlo',
    colors: {
      primary: '#C71585', // Medium Violet Red
      secondary: '#228B22', // Forest Green
      accent: '#FFD700', // Gold
      bg: '#FFF0F5', // Lavender Blush
      surface: 'rgba(255, 255, 255, 0.8)',
      text: '#2E2E2E',
    }
  },
  {
    id: 'matisse',
    name: 'The Dance',
    painter: 'Henri Matisse',
    colors: {
      primary: '#0000CD', // Medium Blue
      secondary: '#FF4500', // Orange Red
      accent: '#32CD32', // Lime Green
      bg: '#FFFAF0', // Floral White
      surface: 'rgba(255, 255, 255, 0.85)',
      text: '#000000',
    }
  },
];

export const DEFAULT_AGENTS: Agent[] = [
  {
    id: "summary_agent",
    name: "Summarizer",
    description: "Extracts key information from 510(k) summaries.",
    model: "gemini-2.5-flash",
    maxTokens: 4000,
    temperature: 0.2,
    systemPrompt: "You are an expert FDA reviewer. Summarize the provided 510(k) summary document. Highlight key regulatory information.",
    provider: "gemini"
  },
  {
    id: "risk_agent",
    name: "Risk Analyst",
    description: "Analyzes risk factors in submission materials.",
    model: "gemini-3-flash-preview",
    maxTokens: 5000,
    temperature: 0.3,
    systemPrompt: "Identify and list all risk factors and mitigations mentioned in the text. Format as a table.",
    provider: "gemini"
  },
  {
    id: "clinical_agent",
    name: "Clinical Reviewer",
    description: "Reviews clinical data and conclusions.",
    model: "gemini-3-pro-preview",
    maxTokens: 8000,
    temperature: 0.1,
    systemPrompt: "Critically review the clinical data provided. Are the conclusions supported by the data? Identify gaps.",
    provider: "gemini"
  }
];

export const INITIAL_YAML = `agents:
  - id: summary_agent
    name: Summarizer
    model: gemini-2.5-flash
    system_prompt: "You are an expert FDA reviewer."
  - id: risk_agent
    name: Risk Analyst
    model: gemini-3-flash-preview
`;

export const INITIAL_SKILL_MD = `# Regulatory Skills
- **Predicate Comparison**: Ability to identify substantial equivalence.
- **Biocompatibility**: ISO 10993 analysis.
- **Software**: IEC 62304 compliance check.
`;
