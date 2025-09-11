import express from "express";
import dotenv from "dotenv";
import { getPrices } from "./prices.js";
import cors from "cors";
import { analyzeArbitrage } from "./aiAdvisor.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello from Dex Arbitrage Agent Backend 🚀");
});

app.get("/prices", async (req, res) => {
  try {
    const prices = await getPrices();
    res.json(prices);
  } catch (error) {
    console.error("Error fetching prices:", error);
    res.status(500).json({ error: "Error fetching prices" });
  }
});

app.get("/arbitrage", async (req, res) => {
  try {
    const prices = await getPrices();

    // Spread calculation
    const spread =
      ((prices.uniswap.price - prices.sushiswap.price) / prices.sushiswap.price) *
      100;

    // Determine buy/sell direction
    let buyOn, sellOn;
    if (spread > 0) {
      buyOn = "Sushiswap";
      sellOn = "Uniswap";
    } else if (spread < 0) {
      buyOn = "Uniswap";
      sellOn = "Sushiswap";
    } else {
      buyOn = sellOn = null;
    }

    // AI analysis
    const aiAdvice = await analyzeArbitrage({
      ...prices,
      spread: spread.toFixed(2),
      buyOn,
      sellOn,
    });

    res.json({
      ...prices,
      spread: spread.toFixed(2) + "%",
      buyOn,
      sellOn,
      aiAdvice,
    });
  } catch (error) {
    console.error("Error in arbitrage route:", error);
    res.status(500).json({ error: "Failed to analyze arbitrage" });
  }
});

app.post("/ai", async (req, res) => {
  try {
    const { question, context } = req.body;
    if (!question) return res.status(400).json({ error: "Missing 'question' field" });

    const aiResponse = await analyzeArbitrage({
      ...context,
      customQuestion: question,
    });

    res.json({ response: aiResponse });
  } catch (error) {
    console.error("Error in /ai route:", error);
    res.status(500).json({ error: "AI analysis failed" });
  }
});

app.listen(PORT, () => {
  console.log("✅ Server running on PORT", PORT);
  console.log("🌐 RPC URL", process.env.RPC_URL);
});
