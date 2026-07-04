import React, { useMemo } from "react";
import "./Heatmap.css";

const Heatmap = () => {
  const totalCells = 184;
  const commercialCount = 24;

  const cells = useMemo(() => {
    return Array.from({ length: totalCells }).map((_, i) => {
      const r = Math.random();
      let status = "vacant";

      if (i >= totalCells - commercialCount) {
        // Commercial zone
        if (r > 0.12) status = "commercial-occupied";
      } else {
        // Residential zone
        if (r > 0.15) status = "residential-occupied";
      }

      return {
        id: i,
        status,
      };
    });
  }, []);

  return (
    <div className="occ-card">
      <div className="occ-header">
        <div>
          <h4 className="occ-title">Real-Time Occupancy Analytics</h4>
          <p className="occ-sub text-muted">
            Live distribution of residential & commercial block occupancy.
          </p>
        </div>
        <div className="occ-legend">
          <div className="legend-item">
            <span className="dot res-occupied"></span>
            <span>Res Occupied</span>
          </div>
          <div className="legend-item">
            <span className="dot com-occupied"></span>
            <span>Com Occupied</span>
          </div>
          <div className="legend-item">
            <span className="dot vacant"></span>
            <span>Vacant</span>
          </div>
        </div>
      </div>

      <div className="occ-grid-wrapper">
        <div id="occ-grid" className="occ-grid">
          {cells.map((cell) => (
            <i
              key={cell.id}
              className={`grid-cell ${cell.status}`}
              title={`Unit ${cell.id + 101} - ${cell.status.replace("-", " ")}`}
            />
          ))}
        </div>
      </div>

      <div className="occ-footer">
        <div className="occ-kpi">
          <span>Res Occupancy Rate</span>
          <strong>85.6%</strong>
        </div>
        <div className="occ-kpi">
          <span>Com Absorption</span>
          <strong>88.0%</strong>
        </div>
        <div className="occ-kpi">
          <span>Total Units Checked</span>
          <strong>184</strong>
        </div>
      </div>
    </div>
  );
};

export default Heatmap;
