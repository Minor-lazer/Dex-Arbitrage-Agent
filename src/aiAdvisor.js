import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function analyzeArbitrage(data) {
  // Determine trade direction if not already provided
  let buyOn = data.buyOn;
  let sellOn = data.sellOn;

  if (!buyOn || !sellOn) {
    if (parseFloat(data.spread) > 0) {
      buyOn = "Sushiswap";
      sellOn = "Uniswap";
    } else if (parseFloat(data.spread) < 0) {
      buyOn = "Uniswap";
      sellOn = "Sushiswap";
    } else {
      buyOn = sellOn = null;
    }
  }

  const prompt = `
You are an expert DeFi trader.

Uniswap price: ${data.uniswap.price}
Sushiswap price: ${data.sushiswap.price}
Spread: ${data.spread}%

Buy on: ${buyOn || "N/A"}
Sell on: ${sellOn || "N/A"}

Question: ${data.customQuestion || "Provide arbitrage advice."}

Rules:
- If spread is 0, indicate no opportunity.
- Include risk analysis (consider fees, slippage, and gas).
- Simulate a single ETH trade including 0.3% fees and 0.5% slippage if applicable.
- Output strictly in JSON with keys: decision, reason, recommendation, riskAnalysis.
`;



  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
  });

  try {
    console.log("helooooooooooooooooooooooo",response);
    return JSON.parse(response.choices[0].message.content);
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return {
      decision: "Unknown",
      reason: "AI response parsing error",
      recommendation: "Check manually",
      riskAnalysis: null,
    };
  }
}
