// src/components/Flat2DLayoutCard.js
import React from "react";
import "./Flat2DLayoutCard.css";

const Flat2DLayoutCard = ({ bhk, areaSqM, place, city }) => {
  const bhkNum = Number(bhk);
  const hasBhk = bhkNum === 2 || bhkNum === 3;

  const floorplanSrc =
    bhkNum === 2 ? "/floorplans/2bhk-plan.png" : "/floorplans/3bhk-plan.png";

  const approxArea = areaSqM ? Math.round(areaSqM) : bhkNum === 2 ? 90 : 120;

  return (
    <div className="fl-card">
      <div className="fl-header">
        <div>
          <div className="fl-title">Interior layout</div>
          <div className="fl-sub">
            Visualize a simple 2D plan for the selected configuration.
          </div>
        </div>
        {hasBhk && (
          <div className="fl-chip">
            {bhkNum} BHK - ~{approxArea} m2
            {place ? ` - ${place}` : city ? ` - ${city}` : ""}
          </div>
        )}
      </div>

      {!hasBhk ? (
        <div className="fl-placeholder">
          Select a BHK configuration to preview the interior layout.
        </div>
      ) : (
        <>
          <div className="fl-img-wrapper">
            <img
              src={floorplanSrc}
              alt={`${bhkNum} BHK floor plan`}
              className="fl-img"
            />
          </div>
          <div className="fl-note">
            Layout is illustrative only and not from actual listings. It is meant
            to support understanding of space distribution.
          </div>
        </>
      )}
    </div>
  );
};

export default Flat2DLayoutCard;
