
import { GoogleGenAI, Type } from "@google/genai";

export async function getChessHint(fen: string, history: string[]) {
  try {
    // Instantiate GoogleGenAI right before the API call for the most up-to-date config
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Current FEN: ${fen}\nMove History: ${history.join(', ')}\n\nYou are a Grandmaster chess coach. Analyze the position and suggest the best next move. Explain the strategic reasoning briefly.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedMove: { type: Type.STRING, description: "The move in SAN notation (e.g., Nf3)" },
            reasoning: { type: Type.STRING, description: "A concise explanation of why this move is good." },
            evaluation: { type: Type.STRING, description: "Rough evaluation (e.g., +0.5 white is slightly better)" }
          },
          required: ["suggestedMove", "reasoning", "evaluation"]
        }
      }
    });

    // Safely access the .text property (not a method) from the response
    const text = response.text;
    if (!text) {
      throw new Error("No content generated");
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Hint Error:", error);
    return null;
  }
}
