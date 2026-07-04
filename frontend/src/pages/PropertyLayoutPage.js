import React, { useState } from "react";
import Flat2DLayoutCard from "../components/Flat2DLayoutCard";
import "./PropertyLayoutPage.css";

const PropertyLayoutPage = () => {
  const [bhk, setBhk] = useState(2);
  const [areaSqM, setAreaSqM] = useState(105);

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <h1 className="page-title">Premium City Residences</h1>
          <p className="page-subtitle">
            Explore model-supported 2 and 3 BHK layouts before you decide.
          </p>
        </div>
        <div className="page-bhk-toggle">
          {[2, 3].map((value) => (
            <button
              key={value}
              className={`bhk-pill ${bhk === value ? "active" : ""}`}
              onClick={() => setBhk(value)}
            >
              {value} BHK
            </button>
          ))}
        </div>
      </header>

      <div className="layout-control">
        <label>Area: {areaSqM} sq m</label>
        <input type="range" min="70" max="180" value={areaSqM} onChange={(e) => setAreaSqM(Number(e.target.value))} />
      </div>

      <Flat2DLayoutCard
        bhk={bhk}
        areaSqM={areaSqM}
        place="Gachibowli"
        city="Hyderabad"
      />
    </div>
  );
};

export default PropertyLayoutPage;
