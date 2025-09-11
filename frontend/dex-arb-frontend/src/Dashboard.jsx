// src/Dashboard.jsx
import React from "react";
import WalletConnect from "./WalletConnect";

export default function Dashboard({ data, onRefresh }) {
  if (!data) return <p>No data available.</p>;

  const { uniswap, sushiswap, spread, aiAdvice } = data;

  return (
    <div className="max-w-xl mx-auto p-6 bg-gray-900 text-white rounded-2xl shadow-lg">
      <h1 className="text-2xl font-bold mb-4">DEX Arbitrage Dashboard (Vite)</h1>

      <WalletConnect/>

      <button
        className="mb-6 ml-4 px-4 py-2 bg-green-600 rounded hover:bg-green-700"
        onClick={onRefresh}
      >
        Refresh Data
      </button>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Prices</h2>
        <p>Uniswap: ${uniswap.price}</p>
        <p>Sushiswap: ${sushiswap.price}</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Arbitrage</h2>
        <p>Spread: {spread}%</p>

        {parseFloat(spread) <= 0 && (
          <p className="text-red-500">
            No positive arbitrage opportunity.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">AI Advice</h2>
        {aiAdvice ? (
          <div>
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
