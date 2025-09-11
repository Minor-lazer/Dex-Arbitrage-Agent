// src/App.jsx
import { useEffect, useState } from "react";
import Dashboard from "./Dashboard";

function App() {
  const [fetchedData, setFetchedData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/arbitrage");
      const json = await res.json();
      setFetchedData(json);
    } catch (err) {
      console.error("Failed to fetch arbitrage data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <p className="p-4">Loading…</p>;
  if (!fetchedData) return <p className="p-4">Error loading data.</p>;

  return <Dashboard data={fetchedData} onRefresh={fetchData} />;
}

export default App;
