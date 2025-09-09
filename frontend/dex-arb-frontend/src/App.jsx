import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [prices, setPrices] = useState(null);
  const [arbitrage, setArbitrage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const priceRes = await axios.get("http://localhost:3000/prices");
        const arbRes = await axios.get("http://localhost:3000/arbitrage");

        setPrices(priceRes.data);
        setArbitrage(arbRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>DEX Arbitrage Dashboard (Vite)</h1>

      {prices && (
        <div>
          <h2>Prices</h2>
          <p>Uniswap: ${prices.uniswap.price}</p>
          <p>Sushiswap: ${prices.sushiswap.price}</p>
        </div>
      )}

      {arbitrage && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: arbitrage.opportunity ? "#d4edda" : "#f8d7da",
          }}
        >
          <h2>Arbitrage</h2>
          <p>Spread: {arbitrage.spread}</p>
          <p>Opportunity: {arbitrage.opportunity ? "✅ Yes" : "❌ No"}</p>
          <p>Buy From: {arbitrage.buyFrom}</p>
          <p>Sell To: {arbitrage.sellTo}</p>
        </div>
      )}
    </div>
  );
}

export default App;
