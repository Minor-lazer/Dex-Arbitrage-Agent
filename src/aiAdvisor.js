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

  // Try multiple attempts with progressively simpler prompts
  const attempts = [
    createSimplePrompt(data, buyOn, sellOn),
    createUltraSimplePrompt(data, buyOn, sellOn),
    createMinimalPrompt(data, buyOn, sellOn)
  ];

  for (let i = 0; i < attempts.length; i++) {
    try {
      console.log(`Attempt ${i + 1}:`, attempts[i].substring(0, 200) + "...");
      
      const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: attempts[i] }],
        temperature: 0.1, // Very low temperature for consistency
        max_tokens: 400, // Strict limit
      });

      const rawResponse = response.choices[0].message.content;
      console.log(`Raw AI Response (Attempt ${i + 1}):`, rawResponse);
      
      const cleanedResponse = aggressiveJsonClean(rawResponse);
      console.log(`Cleaned Response (Attempt ${i + 1}):`, cleanedResponse);
      
      const parsedResponse = JSON.parse(cleanedResponse);
      
      // Validate structure
      if (validateResponse(parsedResponse)) {
        console.log("✅ Successfully parsed AI response");
        return parsedResponse;
      } else {
        throw new Error("Invalid response structure");
      }
      
    } catch (error) {
      console.error(`❌ Attempt ${i + 1} failed:`, error.message);
      if (i === attempts.length - 1) {
        console.log("🔄 All attempts failed, using fallback");
        return generateFallbackResponse(data, buyOn, sellOn);
      }
    }
  }
}

function createSimplePrompt(data, buyOn, sellOn) {
  return `Return ONLY this JSON format with NO comments, NO nested objects, ONLY strings:

{"decision": "your decision here", "reason": "your reason here", "recommendation": "your recommendation here", "riskAnalysis": "your risk analysis here"}

Data: Uniswap=${data.uniswap.price}, Sushiswap=${data.sushiswap.price}, Spread=${data.spread}%, Buy=${buyOn}, Sell=${sellOn}

Return ONLY the JSON object above with your analysis as string values. NO other text.`;
}

function createUltraSimplePrompt(data, buyOn, sellOn) {
  return `JSON only. No comments. No explanations. Fill this template:

{"decision": "trade decision", "reason": "why", "recommendation": "what to do", "riskAnalysis": "risks"}

Spread: ${data.spread}%`;
}

function createMinimalPrompt(data, buyOn, sellOn) {
  const spread = parseFloat(data.spread) || 0;
  const hasOpportunity = Math.abs(spread) > 0.5;
  
  return `{"decision": "${hasOpportunity ? `Buy ${buyOn} Sell ${sellOn}` : 'No Trade'}", "reason": "Spread ${spread}%", "recommendation": "${hasOpportunity ? 'Execute arbitrage' : 'Wait'}", "riskAnalysis": "Consider fees and gas"}`;
}

function aggressiveJsonClean(text) {
  try {
    // Remove all whitespace and newlines first to see the structure
    let cleaned = text.trim();
    
    // Remove any text before the first {
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace > 0) {
      cleaned = cleaned.substring(firstBrace);
    }
    
    // Remove any text after the last }
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1) {
      cleaned = cleaned.substring(0, lastBrace + 1);
    }
    
    // Remove all comments (// style and /* style)
    cleaned = cleaned.replace(/\/\/.*$/gm, '');
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove comments in parentheses within string values
    cleaned = cleaned.replace(/"([^"]*)\([^)]*\)([^"]*)"/g, '"$1 $2"');
    
    // Split into lines and rebuild, removing duplicates
    const lines = cleaned.split('\n');
    const uniqueLines = [];
    const seenContent = new Set();
    
    let braceCount = 0;
    let inString = false;
    let skipDuplicates = false;
    
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      
      // Track braces to detect structure issues
      for (let char of line) {
        if (char === '"' && !line.includes('\\"')) {
          inString = !inString;
        }
        if (!inString) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
        }
      }
      
      // Skip duplicate content
      const contentKey = line.replace(/[{},\s]/g, '');
      if (seenContent.has(contentKey) && contentKey !== '') {
        continue;
      }
      seenContent.add(contentKey);
      
      uniqueLines.push(line);
      
      // Stop if we have a complete object
      if (braceCount === 0 && line.includes('}') && uniqueLines.length > 2) {
        break;
      }
    }
    
    let result = uniqueLines.join('\n');
    
    // Fix common JSON syntax errors
    result = result
      .replace(/,(\s*})/g, '$1') // Remove trailing commas
      .replace(/}(\s*{)/g, '},\n$1') // Add comma between objects
      .replace(/"\s*\n\s*"/g, '", "') // Fix broken string continuation
      .replace(/(\w+):/g, '"$1":') // Quote unquoted keys
      .replace(/:\s*(\w+)(?=\s*[,}])/g, ': "$1"'); // Quote unquoted values
    
    // Ensure we have exactly one complete JSON object
    const openBraces = (result.match(/{/g) || []).length;
    const closeBraces = (result.match(/}/g) || []).length;
    
    if (openBraces > closeBraces) {
      result += '}';
    } else if (closeBraces > openBraces) {
      result = result.replace(/}$/, '');
    }
    
    return result;
    
  } catch (error) {
    console.error("JSON cleaning failed:", error);
    throw error;
  }
}

function validateResponse(response) {
  const requiredFields = ['decision', 'reason', 'recommendation', 'riskAnalysis'];
  
  if (typeof response !== 'object' || response === null) {
    return false;
  }
  
  for (const field of requiredFields) {
    if (!response.hasOwnProperty(field) || typeof response[field] !== 'string') {
      console.log(`❌ Missing or invalid field: ${field}`);
      return false;
    }
  }
  
  return true;
}

function generateFallbackResponse(data, buyOn, sellOn) {
  const spread = parseFloat(data.spread) || 0;
  const hasOpportunity = Math.abs(spread) > 0.8; // Higher threshold for fallback
  
  console.log("🔧 Generating fallback response");
  
  if (!hasOpportunity) {
    return {
      decision: "No Trade Recommended",
      reason: `Spread of ${spread}% is insufficient for profitable arbitrage after fees`,
      recommendation: "Monitor for higher spreads above 1% before considering trades",
      riskAnalysis: "No trading risk as position not recommended. Continue monitoring."
    };
  }
  
  return {
    decision: `Execute Arbitrage: Buy on ${buyOn}, Sell on ${sellOn}`,
    reason: `Profitable spread of ${spread}% detected between exchanges`,
    recommendation: `Buy ETH on ${buyOn} at lower price, immediately sell on ${sellOn}. Account for 0.6% total fees and gas costs.`,
    riskAnalysis: `Medium risk due to price volatility, network congestion, and slippage. Potential profit reduced by fees and gas costs.`
  };
}