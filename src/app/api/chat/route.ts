import { createClient } from "@supabase/supabase-js";
import { openai } from "@ai-sdk/openai";
import { generateText, streamText, convertToModelMessages, stepCountIs } from "ai";
import { z } from "zod";

/**
 * Edge Runtime Configuration
 * Enables sub-200ms response latency by running on edge nodes close to users
 */
export const runtime = "edge";

/**
 * Supabase Client Instance
 * Provides access to the building database (packages, bookings, conversations)
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Chat API Route - Main conversational AI endpoint
 *
 * Processes user messages with GPT-4o, maintains conversation context,
 * and enables database access through tool calling.
 *
 * @param req - Request containing messages, unitNumber, sessionId, and language
 * @returns Streamed text response from GPT-4o
 */
export async function POST(req: Request) {
  const { messages, unitNumber, sessionId, language = 'en' } = await req.json();

  // Convert UIMessages to ModelMessages
  const modelMessages = await convertToModelMessages(messages);

  // Load conversation history if sessionId provided
  let contextMessages = modelMessages;
  if (sessionId) {
    const { data: history } = await supabase
      .from("conversations")
      .select("messages")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(10); // Last 10 exchanges for context

    if (history && history.length > 0) {
      const historicalMessages = history.flatMap((h: any) => h.messages);
      const convertedHistory = await convertToModelMessages(historicalMessages);
      contextMessages = [...convertedHistory, ...modelMessages];
    }
  }

  // Bilingual system prompts
  const systemPrompts = {
    en: `You are Tides, an advanced Voice Concierge for a luxury residential building.
         ${unitNumber ? `The resident is from Unit ${unitNumber}.` : ''}

         LANGUAGE: Respond in English.

         STYLE GUIDE:
         - Speak conversationally and concisely.
         - Do not output markdown lists (bullet points sound bad in TTS).
         - Use short sentences.
         - If you take an action (like checking the DB), say "Checking that for you..." first.

         CAPABILITIES:
         - You have DIRECT access to the building's database.
         - Always check the database for ground truth.
         - You can check package deliveries and confirm pickups.`,
    es: `Eres Tides, un Conserje Virtual avanzado para un edificio residencial de lujo.
         ${unitNumber ? `El residente es de la Unidad ${unitNumber}.` : ''}

         IDIOMA: Responde en español.

         GUÍA DE ESTILO:
         - Habla de manera conversacional y concisa.
         - No uses listas con viñetas (suenan mal en texto a voz).
         - Usa oraciones cortas.
         - Si realizas una acción (como consultar la base de datos), di "Déjame verificar eso..." primero.

         CAPACIDADES:
         - Tienes acceso DIRECTO a la base de datos del edificio.
         - Siempre verifica la base de datos para obtener información precisa.
         - Puedes verificar entregas de paquetes y confirmar recolecciones.`
  };

  const result = streamText({
    model: openai("gpt-4o"),
    messages: contextMessages,
    system: systemPrompts[language as 'en' | 'es'] || systemPrompts.en,
    tools: {
      checkPackages: {
        description: "Check if a specific unit has pending packages.",
        inputSchema: z.object({
          unitNumber: z.string().describe("The resident's unit number, e.g. '101'")
        }),
        execute: async ({ unitNumber }: { unitNumber: string }) => {
          console.log(`[checkPackages] Checking for unit: ${unitNumber}`);
          try {
            const { data, error } = await supabase
              .from("packages")
              .select("*")
              .eq("unit_number", unitNumber)
              .eq("status", "pending");

            if (error) {
              console.error("[checkPackages] Database error:", error);
              return "System Error: Database unreachable.";
            }
            console.log(`[checkPackages] Found ${data?.length || 0} packages`);
            if (!data || data.length === 0) return "No pending packages found.";

            const couriers = data.map((p: any) => p.courier).join(" and ");
            return `Found ${data.length} packages from ${couriers}.`;
          } catch (err) {
            console.error("[checkPackages] Unexpected error:", err);
            return "System Error: An unexpected error occurred.";
          }
        },
      },

      logPickup: {
        description: "Mark all packages for a unit as picked up.",
        inputSchema: z.object({ unitNumber: z.string() }),
        execute: async ({ unitNumber }: { unitNumber: string }) => {
          const { error } = await supabase
            .from("packages")
            .update({ status: "picked_up" })
            .eq("unit_number", unitNumber);

          if (error) return "Failed to update.";
          return "Successfully logged pickup.";
        },
      },
    },
    stopWhen: stepCountIs(5),
    onFinish: async ({ text }) => {
      // Save this conversation exchange (async, non-blocking)
      if (sessionId) {
        try {
          await supabase.from("conversations").insert({
            session_id: sessionId,
            unit_number: unitNumber || null,
            messages: [...messages, { role: "assistant", parts: [{ type: "text", text }] }],
            created_at: new Date().toISOString()
          });
        } catch (err) {
          console.error('Failed to save conversation:', err);
        }
      }
    },
  });

  return result.toTextStreamResponse();
}
