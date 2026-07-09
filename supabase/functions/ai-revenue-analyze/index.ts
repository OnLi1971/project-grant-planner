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

    const prompt = `${dataContext}\n\nUser question: ${question}\n\nPlease provide a concise, data-driven analysis in English. Cross-reference the revenue chartData with the planningSummary (vacation/sick/free/overtime hours, engineers on vacation, and per-engineer free/vacation hours per month) to explain dips or spikes. When the user asks about free capacity or who is available in a given month, list the engineers by name from planningSummary.free_engineers for that month (with their free hours). When asked who is on vacation, use planningSummary.vacation_engineers.\n\nWhen the user asks about planning history, recent changes, team stability, allocation trends or churn, use planningHistoryStats (last 30 days, RAIL+EL only). Explain the metrics briefly:\n- allocations = engineer-weeks moved FROM Free TO a project (new work landed).\n- deallocations = engineer-weeks moved FROM a project back TO Free (work dropped).\n- netChange = allocations - deallocations (positive = team is loading up, negative = losing work).\n- netAllocationRatio = allocations / deallocations (>1 growing, =1 stable, <1 shrinking).\n- stabilityIndex = 1 - deallocations/allocations (1 = fully stable growth, 0 = every new alloc offset by a drop, negative = more drops than adds).\n- tentativeToFinal vs finalToTentative = how many tentative reservations were confirmed vs relaxed back to tentative.\n- topEngineers = who moved the most (net alloc/dealloc).\n- recentChanges = last individual changes for concrete examples.\nMention concrete causes such as public holidays or mass vacations (e.g. Christmas in Europe causes low revenue in December) when the planning data supports it. Keep the response under 400 words.`;

    const result = await generateText({
      model,
      system: "You are a senior revenue and capacity analyst for an engineering services company. You have revenue data and engineer planning data (project allocations, vacations, sick leave, free capacity) including per-engineer free and vacation hours per month. Always correlate revenue trends with planning. When asked about free/available engineers for a specific month, list them by name with their free hours from planningSummary.free_engineers. Use bullet points where helpful. Always respond in English.",
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
