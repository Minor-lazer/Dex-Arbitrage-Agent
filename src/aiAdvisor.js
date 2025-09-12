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
You are an expert DeFi trader. You must respond with ONLY valid JSON. No explanations, no comments, no markdown formatting.

Data:
Uniswap price: ${data.uniswap.price}
Sushiswap price: ${data.sushiswap.price}
Spread: ${data.spread}%
Buy on: ${buyOn || "N/A"}
Sell on: ${sellOn || "N/A"}
Question: ${data.customQuestion || "Provide arbitrage advice."}

CRITICAL: Return ONLY valid JSON with this EXACT structure. No comments or explanations inside JSON values:

{
  "decision": "string describing the trading decision",
  "reason": "string explaining why this decision was made",
  "recommendation": "string with specific trading recommendations", 
  "riskAnalysis": "string describing risks, fees, slippage, and gas costs"
}

Rules:
- Use only string values in JSON
- No parenthetical comments in JSON values
- No additional fields beyond the 4 required
- If spread is 0, indicate no opportunity
- Include risk analysis considering 0.3% fees and 0.5% slippage
- Maximum response length: 500 characters per field
`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3, // Lower temperature for more consistent JSON output
      max_tokens: 800, // Limit response length
    });

    console.log("Raw AI Response:", response.choices[0].message.content);
    
    let responseText = response.choices[0].message.content.trim();
    
    // Clean the response more aggressively
    responseText = cleanJsonResponse(responseText);
    
    console.log("Cleaned Response:", responseText);
    
    const parsedResponse = JSON.parse(responseText);
    
    // Validate the response structure
    const requiredFields = ['decision', 'reason', 'recommendation', 'riskAnalysis'];
    for (const field of requiredFields) {
      if (!parsedResponse.hasOwnProperty(field)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    return parsedResponse;
    
  } catch (e) {
    console.error("Failed to parse AI response:", e.message);
    console.error("Full error:", e);
    
    // Return a structured fallback response
    return generateFallbackResponse(data, buyOn, sellOn);
  }
}

function cleanJsonResponse(text) {
  // Remove markdown code blocks
  text = text.replace(/```json\s*/, '').replace(/```\s*$/, '');
  text = text.replace(/```\s*/, '').replace(/```\s*$/, '');
  
  // Find the first complete JSON object
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('No valid JSON object found');
  }
  
  text = text.substring(jsonStart, jsonEnd + 1);
  
  // Remove duplicate content (common AI issue)
  const lines = text.split('\n');
  const uniqueLines = [];
  const seenLines = new Set();
  
  for (const line of lines) {
    const cleanLine = line.trim();
    if (cleanLine && !seenLines.has(cleanLine)) {
      uniqueLines.push(line);
      seenLines.add(cleanLine);
    } else if (!cleanLine) {
      uniqueLines.push(line); // Keep empty lines for structure
    }
  }
  
  text = uniqueLines.join('\n');
  
  // Fix common JSON syntax issues
  text = text
    // Remove comments in parentheses from JSON values
    .replace(/"([^"]*)\([^)]*\)([^"]*)"/g, '"$1$2"')
    // Fix missing commas before closing braces
    .replace(/"\s*\n\s*}/g, '"\n}')
    // Fix duplicate closing braces
    .replace(/}\s*}/g, '}')
    // Remove trailing commas
    .replace(/,(\s*[}\]])/g, '$1');
  
  return text.trim();
}

function generateFallbackResponse(data, buyOn, sellOn) {
  const spread = parseFloat(data.spread) || 0;
  const hasOpportunity = Math.abs(spread) > 0.5; // Consider opportunities > 0.5%
  
  if (!hasOpportunity) {
    return {
      decision: "No Trade",
      reason: `Spread of ${spread}% is too small to be profitable after fees and gas costs`,
      recommendation: "Wait for better arbitrage opportunities with higher spreads",
      riskAnalysis: "No risk as no trade is recommended"
    };
  }
  
  return {
    decision: hasOpportunity ? `Buy on ${buyOn}, Sell on ${sellOn}` : "No Trade",
    reason: `Price difference of ${spread}% detected between exchanges`,
    recommendation: hasOpportunity 
      ? `Execute arbitrage: buy on ${buyOn} and sell on ${sellOn}. Consider 0.3% fees and 0.5% slippage`
      : "Spread too small for profitable arbitrage",
    riskAnalysis: hasOpportunity
      ? "Moderate risk due to gas costs, slippage, and potential price movements during execution"
      : "No risk as no trade is recommended"
  };
}