import "./GlassComponents.css";

export const GlassPanel = ({ children, className = "", style }) => (
  <div className={`glass-panel ${className}`} style={style}>{children}</div>
);

export const MetricChip = ({ label, value, trend }) => (
  <div className="metric-chip">
    <span className="metric-label">{label}</span>
    <span className="metric-value">{value}</span>
    {trend && <span className={`metric-trend ${trend > 0 ? 'up' : 'down'}`}>{trend}%</span>}
  </div>
);
