import React, { useState } from "react";
import { GlassPanel } from "../components/ui/GlassComponents";
import Flat2DLayoutCard from "../components/Flat2DLayoutCard";
import { areaSqmToSqft } from "../data/marketData";
import "./Section.css";

const BhkExplorer = () => {
  const [bhk, setBhk] = useState(2);
  const [area, setArea] = useState(105);

  return (
    <div className="section-container">
      <div className="section-hero">
        <div>
          <div className="eyebrow">Layout Fit</div>
          <h1 className="app-heading">BHK Explorer</h1>
          <p className="section-subtitle">Preview layout type, room planning and area fit for 2 BHK and 3 BHK homes.</p>
        </div>
      </div>
      <div className="split-layout">
        <GlassPanel className="premium-panel">
          <div className="segmented-control">
            {[2, 3].map((item) => <button key={item} className={bhk === item ? "active" : ""} onClick={() => setBhk(item)}>{item} BHK</button>)}
          </div>
          <div className="form-group">
            <label>Area: {area} sq m / {areaSqmToSqft(area)} sq ft</label>
            <input type="range" min="70" max="180" value={area} onChange={(e) => setArea(Number(e.target.value))} />
          </div>
          <div className="premium-grid">
            <div className="market-card"><h3>Bedrooms</h3><p className="metric-value">{bhk}</p></div>
            <div className="market-card"><h3>Bathrooms</h3><p className="metric-value">{bhk === 2 ? 2 : 3}</p></div>
          </div>
        </GlassPanel>
        <Flat2DLayoutCard bhk={bhk} areaSqM={area} city="Dataset preview" />
      </div>
    </div>
  );
};

export default BhkExplorer;
