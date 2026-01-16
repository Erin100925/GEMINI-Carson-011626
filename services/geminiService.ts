import { GoogleGenAI } from "@google/genai";

export const callGemini = async (
  modelName: string,
  systemPrompt: string,
  userContent: string,
  temperature: number = 0.5,
  maxTokens: number = 1000
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: userContent,
      config: {
        systemInstruction: systemPrompt,
        temperature: temperature,
        maxOutputTokens: maxTokens,
      }
    });

    return response.text || "No response generated.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to call Gemini API");
  }
};