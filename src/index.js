import express from "express";
import dotenv from "dotenv";
import {getPrices} from "./prices.js";
dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;


app.get("/",(req,res)=>{
    res.send("Hello from Dex Arbitrage Agent Backend");
});

app.get("/prices", async(req , res)=>{

    try {
       const prices = await getPrices();
       res.json(prices);
    }catch(error) {
       console.error("Error fetching prices :",error);
       res.status(500).json({error: "Error fetching prices"});
    }
} );


app.get("/arbitrage", async (req, res) => {
  try {
    const { uniswap, sushiswap } = await getPrices();

    // Compute margin difference correctly
    const cheaper = Math.min(uniswap.price, sushiswap.price);
    const expensive = Math.max(uniswap.price, sushiswap.price);
    const marginDifference = ((expensive - cheaper) / cheaper) * 100;

    // Figure out direction of trade
    const buyFrom = uniswap.price < sushiswap.price ? "uniswap" : "sushiswap";
    const sellTo = uniswap.price > sushiswap.price ? "uniswap" : "sushiswap";

    res.json({
      uniswap: uniswap.price,
      sushiswap: sushiswap.price,
      spread: marginDifference.toFixed(2) + "%",
      opportunity: `${marginDifference > 0.5 ? "Voila Opportunity Found!":"Ah No high margin opportunity"}`, // >0.5% difference = arbitrage
      buyFrom,
      sellTo
    });

  } catch (error) {
    console.error("Error checking arbitrage:", error);
    res.status(500).json({ error: "Failed to check arbitrage" });
  }
});



app.listen(PORT,()=>{
    console.log("Server running on PORT ",PORT);
    console.log("RPC URL", process.env.RPC_URL);
})




