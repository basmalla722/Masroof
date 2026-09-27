const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export const TOOLS = [
  {
    functionDeclarations: [
      {
        name: "get_spending_summary",
        description:
          "Get totals for the user's expenses, including their monthly income if set. Call this before answering any question that involves how much the user has spent or earned.",
        parameters: {
          type: "object",
          properties: {
            period: {
              type: "string",
              enum: ["this_month", "last_month", "all"],
              description: "Which period to report on. Defaults to this_month.",
            },
          },
          required: [],
        },
      },
      {
        name: "list_transactions",
        description:
          "List individual stored expenses, newest first. Call this when the user asks about specific purchases, the largest expense, or what they spent on a category.",
        parameters: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description:
                "Optional category filter, e.g. Food. Omit for all categories.",
            },
            limit: {
              type: "integer",
              description: "How many transactions to return. Defaults to 20, max 50.",
            },
          },
          required: [],
        },
      },
    ],
  },
];

export const SYSTEM_INSTRUCTION = `You are the built-in spending advisor inside a personal expense tracker web app.

Rules you must follow:
1. You only discuss the user's own spending data and how this app works.
2. Never state a number, total, or category figure that you did not receive from a tool call. If you need a figure, call a tool first.
3. If a question is outside the scope of this app and the user's spending data, say so plainly in one sentence and stop.
4. Keep answers short: 2 to 5 sentences, or a few short bullet points. No preamble.
5. Give concrete, actionable advice tied to the actual numbers. Say which category to change and by roughly how much.
6. Use the currency EGP when talking about amounts.`;

export function hasApiKey() {
  return Boolean(import.meta.env.VITE_GEMINI_API_KEY);
}

export async function callGemini({ contents }) {
  const url = `${ENDPOINT}?key=${import.meta.env.VITE_GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents,
      tools: TOOLS,
      tool_config: {
        function_calling_config: { mode: "ANY" },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${detail}`);
  }

  return response.json();
}
