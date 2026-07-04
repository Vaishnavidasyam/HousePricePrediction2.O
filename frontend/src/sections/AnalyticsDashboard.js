import React from "react";
import { GlassPanel, MetricChip } from "../components/ui/GlassComponents";
import { CITY_PROFILES, estimatePrice, formatINR } from "../data/marketData";
import "./Section.css";

const AnalyticsDashboard = () => {
  const rows = Object.keys(CITY_PROFILES).map((city) => ({
    city,
    profile: CITY_PROFILES[city],
    price: estimatePrice({ city, bhk: 2, area_sqm: 100 }),
  }));

  return (
    <div className="section-container">
      <div className="section-hero">
        <div>
          <div className="eyebrow">Portfolio View</div>
          <h1 className="app-heading">Analytics Dashboard</h1>
          <p className="section-subtitle">A single board for city pricing, growth, demand and infrastructure signals.</p>
        </div>
      </div>
      <div className="metrics-grid">
        <MetricChip label="Cities" value={rows.length} />
        <MetricChip label="Best Growth" value="Hyderabad" />
        <MetricChip label="Highest Demand" value="Mumbai" />
        <MetricChip label="Value Market" value="Kolkata" />
      </div>
      <GlassPanel className="rank-list">
        {rows.map((row) => (
          <div className="rank-row" key={row.city}>
            <span className="rank-number">{row.profile.demand}</span>
            <div>
              <strong>{row.city}</strong>
              <p className="muted">{row.profile.growth}% growth, {row.profile.yield}% yield, {row.profile.infra}/100 infra</p>
              <div className="score-bar"><span style={{ width: `${row.profile.demand}%` }} /></div>
            </div>
            <strong>{formatINR(row.price)}</strong>
          </div>
        ))}
      </GlassPanel>
    </div>
  );
};

export default AnalyticsDashboard;
