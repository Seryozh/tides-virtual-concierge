import { createClient } from "@supabase/supabase-js";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";

// 1. Edge Runtime (Crucial for <200ms latency)
export const runtime = "edge";

// 2. Connect to Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    messages,
    system: `You are Tides, an advanced Voice Concierge for a luxury building.

             STYLE GUIDE:
             - Speak conversationally and concisely.
             - Do not output markdown lists (bullet points sound bad in TTS).
             - Use short sentences.
             - If you take an action (like checking the DB), say "Checking that for you..." first.

             CAPABILITIES:
             - You have DIRECT access to the building's database.
             - Always check the database for ground truth.
             - You can check packages and book amenities.`,

    tools: {
      checkPackages: {
        description: "Check if a specific unit has pending packages.",
        inputSchema: z.object({
          unitNumber: z.string().describe("The resident's unit number, e.g. '101'")
        }),
        execute: async ({ unitNumber }: { unitNumber: string }) => {
          const { data, error } = await supabase
            .from("packages")
            .select("*")
            .eq("unit_number", unitNumber)
            .eq("status", "pending");

          if (error) return "System Error: Database unreachable.";
          if (!data || data.length === 0) return "No pending packages found.";

          const couriers = data.map((p: any) => p.courier).join(" and ");
          return `Found ${data.length} packages from ${couriers}.`;
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

      bookAmenity: {
        description: "Book an amenity (Tennis, BBQ, Spa) for a resident.",
        inputSchema: z.object({
          unitNumber: z.string(),
          amenity: z.enum(["Tennis Court", "BBQ Area", "Spa"]),
          time: z.string().describe("ISO timestamp or natural time (e.g., 'tomorrow at 2pm')")
        }),
        execute: async ({ unitNumber, amenity }: { unitNumber: string; amenity: string }) => {
          const { error } = await supabase
            .from("bookings")
            .insert({
              unit_number: unitNumber,
              amenity: amenity,
              booking_time: new Date().toISOString()
            });

          if (error) return "Booking failed.";
          return `Booked ${amenity} for unit ${unitNumber}.`;
        },
      },
    },
  });

  return result.toTextStreamResponse();
}
