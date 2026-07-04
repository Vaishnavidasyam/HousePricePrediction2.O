import React, { useState } from "react";
import { GlassPanel, MetricChip } from "../components/ui/GlassComponents";
import "./Section.css";

const BuilderIntelligence = () => {
  const [quality, setQuality] = useState(86);
  const [delivery, setDelivery] = useState(78);
  const [amenities, setAmenities] = useState(82);
  const score = Math.round(quality * 0.4 + delivery * 0.32 + amenities * 0.28);

  return (
    <div className="section-container">
      <div className="section-hero">
        <div>
          <div className="eyebrow">Developer Review</div>
          <h1 className="app-heading">Builder Intelligence</h1>
          <p className="section-subtitle">Score a project by construction quality, delivery discipline and amenity readiness.</p>
        </div>
      </div>
      <div className="metrics-grid">
        <MetricChip label="Builder Score" value={`${score}/100`} />
        <MetricChip label="Decision" value={score > 84 ? "Preferred" : score > 72 ? "Review" : "Caution"} />
      </div>
      <GlassPanel className="premium-panel">
        {[["Quality", quality, setQuality], ["Delivery", delivery, setDelivery], ["Amenities", amenities, setAmenities]].map(([label, value, setter]) => (
          <div className="form-group" key={label}>
            <label>{label}: {value}</label>
            <input type="range" min="40" max="100" value={value} onChange={(e) => setter(Number(e.target.value))} />
          </div>
        ))}
        <div className="score-bar"><span style={{ width: `${score}%` }} /></div>
      </GlassPanel>
    </div>
  );
};

export default BuilderIntelligence;
