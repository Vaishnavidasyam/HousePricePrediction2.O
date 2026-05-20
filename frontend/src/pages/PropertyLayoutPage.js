// src/pages/PropertyLayoutPage.js
import React, { useState } from "react";
import FlatLayoutCard2D from "../components/FlatLayoutCard2D";
import "./PropertyLayoutPage.css";

const PropertyLayoutPage = () => {
  const [bhk, setBhk] = useState(2);

  const handleBhkChange = (value) => {
    setBhk(value);
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <h1 className="page-title">Premium City Residences</h1>
          <p className="page-subtitle">
            Explore carefully planned 1, 2 and 3 BHK interior layouts before you
            decide.
          </p>
        </div>
        <div className="page-bhk-toggle">
          {[1, 2, 3].map((value) => (
            <button
              key={value}
              className={`bhk-pill ${bhk === value ? "active" : ""}`}
              onClick={() => handleBhkChange(value)}
            >
              {value} BHK
            </button>
          ))}
        </div>
      </header>

      <FlatLayoutCard2D
        bhk={bhk}
        areaSqFt={bhk === 1 ? 650 : bhk === 2 ? 980 : 1350}
        price={
          bhk === 1 ? "₹ 42,50,000" : bhk === 2 ? "₹ 68,50,000" : "₹ 96,00,000"
        }
        location="Gachibowli, Hyderabad"
        floor="9th of 20"
        facing={bhk === 3 ? "East" : "West"}
        bathrooms={bhk === 1 ? 1 : 2}
        balconies={bhk === 3 ? 3 : 2}
      />
    </div>
  );
};

export default PropertyLayoutPage;
