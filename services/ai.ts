import { GoogleGenAI, Type } from "@google/genai";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "../types";

export interface AIParsedTransaction {
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  type: 'INCOME' | 'EXPENSE';
}

export const AIService = {
  // Used for both Bank Statements and Credit Card Statements
  parseStatement: async (text: string): Promise<AIParsedTransaction[]> => {
    // Initialize client ONLY when function is called to prevent startup crashes
    // if process.env isn't immediately ready
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      console.error("API Key missing");
      throw new Error("Chave de API (API_KEY) não encontrada no ambiente.");
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Você é um assistente financeiro especialista. Analise o texto do extrato bancário/fatura e extraia as transações.
        
        Categorias de Entrada (INCOME) permitidas: ${INCOME_CATEGORIES.join(", ")}.
        Categorias de Saída (EXPENSE) permitidas: ${EXPENSE_CATEGORIES.join(", ")}.
        
        Regras:
        1. Extraia a descrição, valor (sempre positivo), data e categoria.
        2. Use o campo "type" com valor "INCOME" para créditos/depósitos e "EXPENSE" para débitos/gastos.
        3. Formate a data estritamente como YYYY-MM-DD. Assuma o ano ${new Date().getFullYear()} se não estiver explícito.
        4. Ignore cabeçalhos, saldos totais ou linhas informativas que não sejam transações.
        5. Se a categoria não for óbvia, use "Outros".
        
        Texto do extrato:
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
                category: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["INCOME", "EXPENSE"] }
              },
              required: ["description", "amount", "date", "category", "type"]
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
      throw new Error("Falha ao processar o extrato com IA. Verifique se o texto está legível.");
    }
  }
};