import React, { useState } from "react";
import { GlassPanel } from "../components/ui/GlassComponents";
import { estimatePrice, formatINR, getProfile } from "../data/marketData";
import "./Section.css";

const ReportCenter = () => {
  const [city, setCity] = useState("Mumbai");
  const profile = getProfile(city);
  const price = estimatePrice({ city, bhk: 3, area_sqm: 130 });

  return (
    <div className="section-container">
      <div className="section-hero">
        <div>
          <div className="eyebrow">Executive Pack</div>
          <h1 className="app-heading">Report Center</h1>
          <p className="section-subtitle">Create a board-ready snapshot from valuation, risk and city intelligence modules.</p>
        </div>
        <select className="glass-input" style={{ maxWidth: 220 }} value={city} onChange={(e) => setCity(e.target.value)}>
          {["Hyderabad", "Bengaluru", "Mumbai", "Kolkata", "Gurgaon"].map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <GlassPanel className="premium-panel">
        <h3>{city} Acquisition Report</h3>
        <div className="premium-grid three">
          <div className="market-card"><h3>Benchmark Asset</h3><p>3 BHK, 130 sq m</p></div>
          <div className="market-card"><h3>Indicative Value</h3><p className="metric-value">{formatINR(price)}</p></div>
          <div className="market-card"><h3>Risk</h3><p>{profile.risk}</p></div>
        </div>
        <p className="muted">
          Recommendation: prioritize localities with strong model coverage, verify final locality spelling against the dataset metadata, and use the ML valuation before final negotiation.
        </p>
      </GlassPanel>
    </div>
  );
};

export default ReportCenter;
