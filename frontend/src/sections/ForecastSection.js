import React, { useState } from "react";
import { GlassPanel } from "../components/ui/GlassComponents";
import { estimatePrice, formatINR, getProfile } from "../data/marketData";
import "./Section.css";

const ForecastSection = () => {
  const [city, setCity] = useState("Hyderabad");
  const [area, setArea] = useState(110);
  const profile = getProfile(city);
  const base = estimatePrice({ city, bhk: 2, area_sqm: area });
  const years = [2026, 2027, 2028, 2029, 2030];

  return (
    <div className="section-container">
      <div className="section-hero">
        <div>
          <div className="eyebrow">Forward View</div>
          <h1 className="app-heading">Price Forecast</h1>
          <p className="section-subtitle">Project property value from current dataset benchmarks and city growth assumptions.</p>
        </div>
        <div className="mini-tags">
          {Object.keys({ Hyderabad: 1, Bengaluru: 1, Mumbai: 1, Kolkata: 1, Gurgaon: 1 }).map((c) => (
            <button className={city === c ? "submit-btn" : "secondary-btn"} key={c} onClick={() => setCity(c)}>{c}</button>
          ))}
        </div>
      </div>

      <GlassPanel className="premium-panel">
        <div className="form-group">
          <label>Area: {area} sq m</label>
          <input type="range" min="60" max="180" value={area} onChange={(e) => setArea(Number(e.target.value))} />
        </div>
        <div className="premium-grid">
          {years.map((year, index) => {
            const value = base * Math.pow(1 + profile.growth / 100, index);
            return (
              <div className="market-card" key={year}>
                <h3>{year}</h3>
                <p className="metric-value">{formatINR(value)}</p>
                <div className="score-bar"><span style={{ width: `${55 + index * 9}%` }} /></div>
              </div>
            );
          })}
        </div>
      </GlassPanel>
    </div>
  );
};

export default ForecastSection;
