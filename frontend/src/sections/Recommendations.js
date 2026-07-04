import React, { useState } from "react";
import { GlassPanel } from "../components/ui/GlassComponents";
import { buildScenario, formatINR, topLocalities } from "../data/marketData";
import { useMarketMetadata } from "../hooks/useMarketMetadata";
import "./Section.css";

const Recommendations = () => {
  const { metadata } = useMarketMetadata();
  const [city, setCity] = useState("Gurgaon");
  const picks = topLocalities(metadata, city, 6).map((loc, index) => buildScenario(city, loc, index));

  return (
    <div className="section-container">
      <div className="section-hero">
        <div>
          <div className="eyebrow">Shortlist</div>
          <h1 className="app-heading">Recommendations</h1>
          <p className="section-subtitle">Curated property ideas scored by affordability, city demand and future growth.</p>
        </div>
        <select className="glass-input" style={{ maxWidth: 220 }} value={city} onChange={(e) => setCity(e.target.value)}>
          {metadata.map((item) => <option key={item.city}>{item.city}</option>)}
        </select>
      </div>
      <div className="premium-grid three">
        {picks.map((item) => (
          <GlassPanel className="premium-panel" key={item.place}>
            <span className="insight-pill">{item.score}/100 match</span>
            <h3>{item.place}</h3>
            <p className="metric-value">{formatINR(item.estimated)}</p>
            <p className="muted">{item.bhk} BHK, {Math.round(item.area_sqm)} sq m, {item.growth.toFixed(1)}% growth.</p>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
};

export default Recommendations;
