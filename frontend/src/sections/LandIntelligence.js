import React, { useState } from "react";
import { GlassPanel, MetricChip } from "../components/ui/GlassComponents";
import { formatINR, getProfile } from "../data/marketData";
import "./Section.css";

const LandIntelligence = () => {
  const [city, setCity] = useState("Hyderabad");
  const [sqft, setSqft] = useState(2400);
  const profile = getProfile(city);
  const landRate = { Hyderabad: 6800, Bengaluru: 9200, Mumbai: 28000, Kolkata: 5400, Gurgaon: 11800 }[city];
  const value = sqft * landRate * (0.9 + profile.infra / 1000);

  return (
    <div className="section-container">
      <div className="section-hero">
        <div>
          <div className="eyebrow">Plot Desk</div>
          <h1 className="app-heading">Land Intelligence</h1>
          <p className="section-subtitle">Estimate plot value and development readiness from city-level market assumptions.</p>
        </div>
        <select className="glass-input" style={{ maxWidth: 220 }} value={city} onChange={(e) => setCity(e.target.value)}>
          {["Hyderabad", "Bengaluru", "Mumbai", "Kolkata", "Gurgaon"].map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="metrics-grid">
        <MetricChip label="Land Value" value={formatINR(value)} />
        <MetricChip label="Rate / sq ft" value={formatINR(landRate)} />
        <MetricChip label="Development Score" value={`${profile.infra}/100`} />
      </div>
      <GlassPanel className="premium-panel">
        <div className="form-group">
          <label>Plot size: {sqft} sq ft</label>
          <input type="range" min="900" max="9000" step="100" value={sqft} onChange={(e) => setSqft(Number(e.target.value))} />
        </div>
      </GlassPanel>
    </div>
  );
};

export default LandIntelligence;
