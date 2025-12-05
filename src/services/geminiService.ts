
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

export const analyzeBusinessDay = async (transactions: Transaction[]): Promise<string> => {
  if (!process.env.API_KEY) return "Clave de API no configurada. Configure el entorno para usar IA.";

  // Filter for today's transactions only
  const today = new Date().setHours(0,0,0,0);
  const todaysTxs = transactions.filter(t => t.timestamp >= today);

  if (todaysTxs.length === 0) return "No hay transacciones hoy para analizar.";

  const summary = todaysTxs.map(t => {
    // Handle old data or new data safely
    const pair = t.pair || 'USD_DOP';
    const amount = t.amount || (t as any).amountUSD;
    return `- ${t.type} (${pair}): ${amount} a tasa ${t.rate} (Total: ${t.total})`;
  }).join('\n');

  const prompt = `
    Actúa como un experto consultor financiero para una casa de cambio en República Dominicana.
    Analiza las siguientes transacciones del día de hoy:
    
    ${summary}
    
    Dame un resumen muy breve (máximo 3 oraciones) sobre el volumen de negocio y una recomendación estratégica (ej: si vendimos mucho USD, subir el precio de venta? Movimiento inusual en Euros?).
    El tono debe ser profesional y directo.
  `;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error conectando con el servicio de IA.";
  }
};
