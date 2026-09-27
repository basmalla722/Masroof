import { useState } from "react";
import { callGemini, hasApiKey } from "../services/gemini";
import { runTool } from "../services/tools";

const MAX_TURNS = 6;

export default function AdvisorChat({ state }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const configured = hasApiKey();

  async function send(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;

    setDraft("");
    setError(null);
    setBusy(true);

    const nextContents = [
      ...messages.map((message) => ({
        role: message.role === "user" ? "user" : "model",
        parts: [{ text: message.text }],
      })),
      { role: "user", parts: [{ text }] },
    ];

    setMessages((current) => [...current, { role: "user", text }]);

    const working = [...nextContents];
    let reply = "";
    const toolTrace = [];

    try {
      for (let turn = 0; turn < MAX_TURNS; turn += 1) {
        const data = await callGemini({ contents: working });
        const candidate = data.candidates?.[0];
        const parts = candidate?.content?.parts ?? [];

        const calls = parts
          .filter((part) => part.functionCall)
          .map((part) => part.functionCall);

        const textParts = parts
          .filter((part) => part.text)
          .map((part) => part.text)
          .join("");

        if (calls.length === 0) {
          reply = textParts;
          break;
        }

        working.push({ role: "model", parts: calls.map((c) => ({ functionCall: c })) });

        const responses = calls.map((call) => ({
          functionResponse: {
            name: call.name,
            response: { result: runTool(call.name, call.args, state) },
          },
        }));

        working.push({ role: "user", parts: responses });
        toolTrace.push(
          ...calls.map((call) => `${call.name}(${JSON.stringify(call.args ?? {})})`)
        );
      }
    } catch (err) {
      setError(err.message);
      setBusy(false);
      return;
    }

    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        text: reply || "I could not produce an answer.",
        tools: toolTrace,
      },
    ]);
    setBusy(false);
  }

  if (!configured) {
    return (
      <div className="card chat">
        <h2>Ask the advisor</h2>
        <div className="warning">
          <strong>The AI advisor needs an API key.</strong>
          <br />
          1. Get a free key at <code>aistudio.google.com</code> → Get API key
          <br />
          2. Create a file named <code>.env.local</code> in the project folder
          containing:{" "}
          <code>VITE_GEMINI_API_KEY=your_key_here</code>
          <br />
          3. Restart the dev server.
        </div>
      </div>
    );
  }

  return (
    <div className="card chat">
      <h2>Ask the advisor</h2>
      <p className="empty" style={{ padding: "0 0 12px", textAlign: "left" }}>
        Try: “Where am I over budget?” · “What is my biggest expense?” · “How can
        I save 200 EGP this month?”
      </p>

      <div className="chat-log">
        {messages.length === 0 && (
          <p className="empty">Ask a question about your spending.</p>
        )}
        {messages.map((message, index) => (
          <div key={index} className={`bubble ${message.role}`}>
            {message.text}
            {message.tools?.length > 0 && (
              <span className="trace">tools: {message.tools.join(" → ")}</span>
            )}
          </div>
        ))}
        {busy && <div className="bubble assistant">Thinking…</div>}
        {error && <div className="bubble error">{error}</div>}
      </div>

      <form className="chat-input" onSubmit={send}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about your spending…"
          aria-label="Ask the advisor"
        />
        <button className="primary" type="submit" disabled={busy || !draft.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
