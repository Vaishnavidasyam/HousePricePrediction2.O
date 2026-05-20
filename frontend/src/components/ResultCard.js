import React from "react";
import "./ResultCard.css";

const formatIndianShort = (value) => {
  if (!value) return "-";

  const n = Number(value);

  if (n >= 10000000) {
    return `₹${(n / 10000000).toFixed(2)} Cr`;
  }

  if (n >= 100000) {
    return `₹${(n / 100000).toFixed(2)} L`;
  }

  return `₹${n}`;
};

const ResultCard = ({ result }) => {
  if (!result) {
    return (
      <div className="rc-empty">
        <img src="/empty-chart.png" alt="" className="rc-empty-img" />

        <h3>No Prediction Yet</h3>

        <p>Configure apartment details and predict price.</p>
      </div>
    );
  }

  return (
    <div className="rc-wrapper">
      <div className="rc-label">Estimated Market Value</div>

      <div className="rc-value">{formatIndianShort(result.total_price)}</div>

      <div className="rc-grid">
        <div className="rc-item">
          <span>Locality</span>
          <strong>{result.place}</strong>
        </div>

        <div className="rc-item">
          <span>Configuration</span>

          <strong>{result.bhk} BHK</strong>
        </div>

        <div className="rc-item">
          <span>Area</span>

          <strong>{result.area_sqm} m²</strong>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
