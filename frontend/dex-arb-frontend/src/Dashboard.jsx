import React from "react";
import WalletConnect from "./WalletConnect";

export default function Dashboard({ data, onRefresh }) {
  if (!data) return <p>No data available.</p>;

  const { uniswap, sushiswap, spread, aiAdvice } = data;

  return (
    <div className="w-full p-6 text-red bg-linear-65 from-purple-500 to-pink-500">
      <h1 className="text-4xl font-serif font-bold mb-4 text-amber-50">DEX Arbitrage Dashboards</h1>
    <div className="flex">
      <WalletConnect/>
      <button
        className="bg-red mb-6 ml-4 px-4 py-2 bg-green-600 rounded hover:bg-green-700"
        onClick={onRefresh}
      >
        Check opportunity
      </button>
      </div>

      <section className="mb-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Prices</h2>
        <p>Ethereum price on Uniswap: ${uniswap.price}</p>
        <p>Ethereum price on Sushiswap: ${sushiswap.price}</p>
      </section>

      <section className="mb-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Arbitrage</h2>
        <p>Spread: {spread}%</p>

        {parseFloat(spread) <= 0 && (
      
          <p className="text-white ">
            No positive arbitrage opportunity.
          </p>
    
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-2 text-white">AI Advice</h2>
        {aiAdvice ? (
          <div className="text-white">
            <p><strong>Decision:</strong> {aiAdvice.decision}</p>
            <p><strong>Reason:</strong> {aiAdvice.reason}</p>
            <p><strong>Recommendation:</strong> {aiAdvice.recommendation}</p>
            {aiAdvice.riskAnalysis && (
              <p><strong>Risk:</strong> {aiAdvice.riskAnalysis}</p>
            )}
          </div>
        ) : (
          <p>No AI advice available.</p>
        )}
      </section>
    </div>
  );
}