import { useState } from "react";

export default function AskAI() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    setLoading(true);
    const res = await fetch("http://localhost:3000/ai/custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    setAnswer(data.response);
    setLoading(false);
  };

  return (
    <div className="ask-ai">
      <h3>Ask the AI</h3>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="e.g. Where is the best ETH/USDC opportunity in the next hour?"
      />
      <button onClick={ask} disabled={loading || !question}>Ask</button>
      {loading && <p>Thinking…</p>}
      {answer && (
        <pre>{JSON.stringify(answer, null, 2)}</pre>
      )}
    </div>
  );
}
