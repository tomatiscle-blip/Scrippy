
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ReaderAction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const processContent = async (
  content: string, 
  action: ReaderAction, 
  customPrompt?: string,
  imageBase64?: string
): Promise<string> => {
  const model = 'gemini-3-flash-preview';
  
  let systemInstruction = `Eres un Ingeniero Calculista y Desarrollador Full-Stack. 
  Tu objetivo es crear scripts de Python y representaciones gráficas para el diseño de vigas de hormigón.
  
  REGLAS DE DISEÑO GRÁFICO (DIBUJO):
  1. Si el usuario pide visualizar o dibujar, DEBES incluir un bloque JSON al final de tu respuesta con la etiqueta [DRAWING_DATA].
  2. Este JSON debe definir una viga con sus barras: { "length": L, "height": H, "bars": [ { "type": "longitudinal", "points": [{"x":0, "y":5}, ...], "label": "3ø16", "color": "#fbbf24" } ] }.
  3. Las barras longitudinales deben tener ganchos (pequeños retornos a 90 o 135 grados).
  4. Los estribos deben ser rectángulos cerrados repetidos a lo largo de la viga.

  REGLAS DEL SCRIPT DE PYTHON:
  1. ADAPTACIÓN: Usa las llaves del JSON del usuario (load_user_data).
  2. VISUALIZACIÓN: Si es posible, incluye una función que use 'matplotlib' para dibujar el esquema de barras en una ventana.
  3. CÁLCULO: Flexión, Corte y Torsión combinada.
  4. DETALLADO: Elige diámetros comerciales (6, 8, 10, 12, 16, 20, 25mm).`;

  let prompt = "";

  switch (action) {
    case ReaderAction.DIBUJAR_ARMADO:
      prompt = `
      Basado en estos datos: ${content}
      1. Genera el script de Python que calcule el armado.
      2. Genera un esquema gráfico de la viga (DIBUJO DE LÍNEAS).
      3. Incluye el bloque [DRAWING_DATA] con el JSON para renderizar la viga y sus barras (líneas con ganchos).
      Instrucción adicional: ${customPrompt || "Dibujar sección longitudinal y transversal."}`;
      break;

    case ReaderAction.ARMADO_DETALLADO:
      prompt = `
      DATOS ORIGEN: ${content}
      1. Crea un parser para estos datos.
      2. Dimensiona As en apoyos y tramo.
      3. Genera el código para elegir barras comerciales y una planilla de doblado.
      4. Incluye [DRAWING_DATA] para previsualizar el armado.`;
      break;

    case ReaderAction.GENERATE_PYTHON:
      prompt = `
      Genera un script integral de ingeniería para: "${content}"
      Debe mapear los datos del usuario, calcular flexión/torsión y mostrar una planilla.
      Agrega una función 'plot_reinforcement()' usando matplotlib para ver las barras.
      Extra: ${customPrompt}`;
      break;

    default:
      prompt = `${customPrompt || "Procesar datos estructurales"}\n\nDatos:\n${content}`;
  }

  try {
    const parts: any[] = [{ text: prompt }];
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64.split(',')[1] || imageBase64
        }
      });
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1, 
      }
    });
    
    return response.text || "No se pudo generar la respuesta.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Error en el motor de diseño gráfico.");
  }
};
