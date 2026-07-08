import { generateText } from "npm:ai@latest";
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { data, question } = body;

    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "Missing question" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gateway = createLovableAiGatewayProvider(lovableApiKey);
    const model = gateway("google/gemini-3-flash-preview");

    const dataContext = data
      ? `Here is the revenue data context (JSON): ${JSON.stringify(data)}`
      : "No specific data context provided.";

    const prompt = `${dataContext}\n\nUser question: ${question}\n\nPlease provide a concise, data-driven analysis in English. Focus on actionable insights and key differences. Keep the response under 400 words.`;

    const result = await generateText({
      model,
      system: "You are a senior revenue analyst. Analyze the provided data and answer the user's question with clear, concise insights. Use bullet points where helpful. Always respond in English.",
      prompt,
    });

    return new Response(
      JSON.stringify({ analysis: result.text }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("AI analysis error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
