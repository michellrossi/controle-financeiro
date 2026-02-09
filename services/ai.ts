import { GoogleGenAI, Type } from "@google/genai";
import { EXPENSE_CATEGORIES } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface AIParsedTransaction {
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
}

export const AIService = {
  parseStatement: async (text: string): Promise<AIParsedTransaction[]> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-latest',
        contents: `Analyze the following credit card statement text and extract transactions. 
        
        Rules:
        1. Extract the description, amount (positive number), and date.
        2. Categorize each transaction into one of these exact categories: ${EXPENSE_CATEGORIES.join(', ')}. If unsure, use 'Outros'.
        3. Convert dates to YYYY-MM-DD format. Assume the year is ${new Date().getFullYear()} if not specified.
        4. Ignore lines that are headers, payment confirmations, or total balances.
        
        Text to analyze:
        ${text}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                date: { type: Type.STRING },
                category: { type: Type.STRING }
              },
              required: ["description", "amount", "date", "category"]
            }
          }
        }
      });

      if (response.text) {
        return JSON.parse(response.text) as AIParsedTransaction[];
      }
      return [];
    } catch (error) {
      console.error("AI Parsing Error:", error);
      throw new Error("Falha ao processar o extrato com IA.");
    }
  }
};