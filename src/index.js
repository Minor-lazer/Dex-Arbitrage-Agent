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

app.listen(PORT,()=>{
    console.log("Server running on PORT ",PORT);
    console.log("RPC URL", process.env.RPC_URL);
})



