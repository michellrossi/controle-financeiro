import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"; // Importação correta do SDK
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "../types";

// Acessa a chave configurada no .env.local e no Vercel 
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ""; 

const genAI = new GoogleGenerativeAI(API_KEY);

export interface AIParsedTransaction {
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  type: 'INCOME' | 'EXPENSE';
}

export const AIService = {
  parseStatement: async (text: string): Promise<AIParsedTransaction[]> => {
    if (!API_KEY) {
      throw new Error("API Key não encontrada. Verifique o seu arquivo .env.local.");
    }

    try {
      // Usando o modelo flash que é mais rápido e econômico 
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          // Define a estrutura exata que a IA deve retornar 
          responseSchema: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                description: { type: SchemaType.STRING },
                amount: { type: SchemaType.NUMBER },
                date: { type: SchemaType.STRING },
                category: { type: SchemaType.STRING },
                type: { type: SchemaType.STRING, enum: ["INCOME", "EXPENSE"] }
              },
              required: ["description", "amount", "date", "category", "type"]
            }
          }
        }
      });

      const prompt = `Você é um assistente financeiro especialista. Analise o texto do extrato bancário/fatura e extraia as transações.
        
        Categorias de Entrada (INCOME) permitidas: ${INCOME_CATEGORIES.join(", ")}.
        Categorias de Saída (EXPENSE) permitidas: ${EXPENSE_CATEGORIES.join(", ")}.
        
        Regras:
        1. Extraia a descrição, valor (sempre positivo), data e categoria.
        2. Use o campo "type" com valor "INCOME" para créditos/depósitos e "EXPENSE" para débitos/gastos.
        3. Formate a data estritamente como YYYY-MM-DD. Assuma o ano ${new Date().getFullYear()} se não estiver explícito.
        4. Ignore cabeçalhos, saldos totais ou linhas informativas que não sejam transações.
        5. Se a categoria não for óbvia, use "Outros".
        
        Texto do extrato:
        ${text}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      if (responseText) {
        return JSON.parse(responseText) as AIParsedTransaction[];
      }
      return [];
    } catch (error) {
      console.error("AI Parsing Error:", error);
      throw new Error("Falha ao processar o extrato com IA. Verifique se o texto está legível e se a chave de API está correta.");
    }
  }
};