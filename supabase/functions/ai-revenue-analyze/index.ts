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

    const prompt = `${dataContext}\n\nUser question: ${question}\n\nPlease provide a concise, data-driven analysis in English. Cross-reference the revenue chartData with the planningSummary (vacation/sick/free/overtime hours, engineers on vacation, and per-engineer free/vacation hours per month) to explain dips or spikes. When the user asks about free capacity or who is available in a given month, list the engineers by name from planningSummary.free_engineers for that month (with their free hours). When asked who is on vacation, use planningSummary.vacation_engineers.\n\nWhen the user asks who is PARTIALLY utilized / partially free / not fully loaded / has partial capacity, use planningSummary.overall_partial_engineers for general questions and planningSummary.months[].partial_engineers or planningSummary.partial_engineers for month-specific questions. Partially utilized = engineer has project work but <=35Mh/week on the project in at least one week. This explicitly includes 20Mh/week and 25Mh/week allocations. List them by name with avg_project_hours_per_week, weeks_partial, max_free_capacity_hours_per_week and example weeks/projects if present. If partial engineers exist, list those FIRST. Mention fully free engineers only as an additional separate note. Do NOT answer only with FREE engineers when asked about partial utilization.\n\nWhen the user asks about planning history, recent changes, team stability, allocation trends or churn, use planningHistoryStats (last 30 days, RAIL+EL only). Explain the metrics briefly:\n- allocations = engineer-weeks moved FROM Free TO a project (new work landed).\n- deallocations = engineer-weeks moved FROM a project back TO Free (work dropped).\n- netChange = allocations - deallocations (positive = team is loading up, negative = losing work).\n- netAllocationRatio = allocations / deallocations (>1 growing, =1 stable, <1 shrinking).\n- stabilityIndex = 1 - deallocations/allocations (1 = fully stable growth, 0 = every new alloc offset by a drop, negative = more drops than adds).\n- tentativeToFinal vs finalToTentative = how many tentative reservations were confirmed vs relaxed back to tentative.\n- topEngineers = who moved the most (net alloc/dealloc).\n- recentChanges = last individual changes for concrete examples.\nMention concrete causes such as public holidays or mass vacations (e.g. Christmas in Europe causes low revenue in December) when the planning data supports it. Keep the response under 400 words.`;

    const result = await generateText({
      model,
      system: "You are a senior revenue and capacity analyst for an engineering services company. You have revenue data and engineer planning data (project allocations, vacations, sick leave, free capacity, partial utilization) including per-engineer free/vacation hours and partial engineers. Always correlate revenue trends with planning. When asked about free/available engineers list them from planningSummary.free_engineers. When asked about partially utilized engineers, use planningSummary.overall_partial_engineers for general questions, and planningSummary.months[].partial_engineers or planningSummary.partial_engineers for month-specific questions. Partial utilization means project work >0 and <=35Mh/week; 20Mh/week is partial capacity. List partial engineers FIRST with name + avg_project_hours_per_week + weeks_partial + examples if available; mention fully free engineers only separately. Do not answer partial-capacity questions with only FREE engineers. Use bullet points where helpful. Always respond in English.\n\nCRITICAL ANTI-HALLUCINATION RULE: You MUST ONLY use engineer names that appear VERBATIM in the provided JSON data (planningSummary.overall_partial_engineers, planningSummary.months[].partial_engineers, planningSummary.free_engineers, vacation_engineers, partial_engineers, or planningHistoryStats.topEngineers/recentChanges). NEVER invent, guess, translate, or add names that are not literally present in the JSON. If no engineers match the query for that month, say 'No engineers found in the data for this criterion.' Do not fabricate names like 'Pavlík', 'Konečný', 'Kandera', 'Fuksa', or any name not present in the JSON payload. Copy names character-for-character from the data.",

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
