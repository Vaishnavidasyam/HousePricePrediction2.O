import React from "react";
import InteriorVisualizer from "../components/InteriorVisualizer";
import "./Section.css";

const AiInteriorDesigner = () => (
  <div className="section-container">
    <div className="section-hero">
      <div>
        <div className="eyebrow">Design Studio</div>
        <h1 className="app-heading">AI Interior Designer</h1>
        <p className="section-subtitle">Switch between premium visual palettes for customer-ready interior concepts.</p>
      </div>
    </div>
    <InteriorVisualizer />
  </div>
);

export default AiInteriorDesigner;
