import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitCompare, Award, Zap
} from "lucide-react";
import {
  CITIES, PROPERTY_TYPES, formatINR, getProfile,
  estimatePrice, generateForecast, areaSqmToSqft
} from "../data/marketData";
import "./ComparisonCenter.css";

/* ── Animated bar ─────────────────────────────────────────────── */
const Bar = ({ value, color, delay = 0 }) => {
  const [w, setW] = React.useState(0);
  React.useEffect(() => {
    const t = setTimeout(() => setW(value), delay + 300);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div className="cmp-bar-track">
      <div className="cmp-bar-fill" style={{ width: `${w}%`, background: color, transition: "width 0.9s cubic-bezier(.16,1,.3,1)" }} />
    </div>
  );
};

/* ── City Panel ───────────────────────────────────────────────── */
const CityPanel = ({ city, bhk, area, propertyType, color, rank }) => {
  const profile = getProfile(city);
  const area_sqm = area;
  const price = estimatePrice({ city, bhk, area_sqm, propertyType });
  const sqft  = areaSqmToSqft(area_sqm);
  const pricePerSqft = price / sqft;
  const forecast5y   = Math.round(price * Math.pow(1 + profile.growth / 100, 5));
  const annualRent   = Math.round(price * profile.yield / 100);

  const metrics = [
    { label: "Annual Growth",     value: `${profile.growth}%`,          bar: Math.min(99, profile.growth * 6),          color: "#14B8A6" },
    { label: "Rental Yield",      value: `${profile.yield}%`,           bar: Math.min(99, profile.yield * 18),          color: "#A78BFA" },
    { label: "Demand Score",      value: `${profile.demand}/100`,       bar: profile.demand,                            color: "#22D3EE" },
    { label: "Infrastructure",    value: `${profile.infra}/100`,        bar: profile.infra,                             color: "#34D399" },
    { label: "Risk Profile",      value: profile.risk,                  bar: profile.risk === "Low" ? 85 : profile.risk === "Balanced" ? 65 : 50, color: "#F59E0B" },
  ];

  return (
    <motion.div
      className="cmp-city-panel"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ "--city-color": color }}
    >
      {/* Header */}
      <div className="cmp-panel-header" style={{ borderColor: color + "44" }}>
        <div className="cmp-panel-rank" style={{ background: color + "22", color }}>#{rank}</div>
        <div>
          <div className="cmp-panel-city">{city}</div>
          <div className="cmp-panel-sub">{bhk} BHK · {sqft.toLocaleString("en-IN")} sq ft · {PROPERTY_TYPES.find(t => t.id === propertyType)?.label}</div>
        </div>
        {rank === 1 && (
          <div className="cmp-winner-badge">
            <Award size={12} /> Best Value
          </div>
        )}
      </div>

      {/* Main price */}
      <div className="cmp-price-block">
        <div className="cmp-price-label">Market Valuation</div>
        <div className="cmp-price-main" style={{ color }}>{formatINR(price)}</div>
        <div className="cmp-price-sqft">₹{Math.round(pricePerSqft).toLocaleString("en-IN")}/sq ft</div>
      </div>

      {/* Key stats row */}
      <div className="cmp-stats-row">
        <div className="cmp-stat">
          <span className="cmp-stat-label">5Y Projection</span>
          <strong className="cmp-stat-val">{formatINR(forecast5y)}</strong>
        </div>
        <div className="cmp-stat">
          <span className="cmp-stat-label">Annual Rent</span>
          <strong className="cmp-stat-val">{formatINR(annualRent)}</strong>
        </div>
        <div className="cmp-stat">
          <span className="cmp-stat-label">AI Rating</span>
          <strong className="cmp-stat-val" style={{ color: profile.growth > 11 ? "#10B981" : profile.growth > 9 ? "#F59E0B" : "#94A3B8" }}>
            {profile.growth > 11 && profile.yield > 3.8 ? "STRONG BUY" : profile.growth > 9 ? "ACCUMULATE" : "HOLD"}
          </strong>
        </div>
      </div>

      {/* Metric bars */}
      <div className="cmp-metrics">
        {metrics.map((m, i) => (
          <div key={m.label} className="cmp-metric-row">
            <div className="cmp-metric-meta">
              <span>{m.label}</span>
              <span style={{ color: m.color, fontWeight: 900 }}>{m.value}</span>
            </div>
            <Bar value={m.bar} color={m.color} delay={i * 80} />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   COMPARISON CENTER
═══════════════════════════════════════════════════════════════════ */
const ComparisonCenter = () => {
  const [leftCity,  setLeftCity]  = useState("Bengaluru");
  const [rightCity, setRightCity] = useState("Hyderabad");
  const [bhk,       setBhk]       = useState(3);
  const [propType,  setPropType]  = useState("apartment");
  const [area,      setArea]      = useState(125);
  const [activeTab, setActiveTab] = useState("side-by-side");

  const COLORS = { left: "#14B8A6", right: "#A78BFA" };

  const leftProfile  = getProfile(leftCity);
  const rightProfile = getProfile(rightCity);
  const leftPrice    = estimatePrice({ city: leftCity,  bhk, area_sqm: area, propertyType: propType });
  const rightPrice   = estimatePrice({ city: rightCity, bhk, area_sqm: area, propertyType: propType });

  /* winner by overall score */
  const leftScore  = Math.round((leftProfile.demand + leftProfile.infra + leftProfile.growth * 3) / 5);
  const rightScore = Math.round((rightProfile.demand + rightProfile.infra + rightProfile.growth * 3) / 5);
  const leftRank   = leftScore >= rightScore ? 1 : 2;
  const rightRank  = rightScore >= leftScore ? 1 : 2;

  /* 10-year forecast for comparison chart */
  const leftForecast  = useMemo(() => generateForecast(leftPrice, 10), [leftPrice]);
  const rightForecast = useMemo(() => generateForecast(rightPrice, 10), [rightPrice]);

  /* head-to-head rows */
  const h2h = [
    { label: "Market Value",     left: formatINR(leftPrice),       right: formatINR(rightPrice),       winner: leftPrice > rightPrice ? "right" : "left", invert: true },
    { label: "Annual Growth",    left: `${leftProfile.growth}%`,   right: `${rightProfile.growth}%`,   winner: leftProfile.growth > rightProfile.growth ? "left" : "right" },
    { label: "Rental Yield",     left: `${leftProfile.yield}%`,    right: `${rightProfile.yield}%`,    winner: leftProfile.yield > rightProfile.yield ? "left" : "right" },
    { label: "Demand Score",     left: `${leftProfile.demand}`,    right: `${rightProfile.demand}`,    winner: leftProfile.demand > rightProfile.demand ? "left" : "right" },
    { label: "Infrastructure",   left: `${leftProfile.infra}`,     right: `${rightProfile.infra}`,     winner: leftProfile.infra > rightProfile.infra ? "left" : "right" },
    { label: "5Y Projection",    left: formatINR(Math.round(leftPrice * Math.pow(1 + leftProfile.growth / 100, 5))), right: formatINR(Math.round(rightPrice * Math.pow(1 + rightProfile.growth / 100, 5))), winner: leftProfile.growth > rightProfile.growth ? "left" : "right" },
  ];

  return (
    <div className="cmp-layout">

      {/* ── HEADER ───────────────────────────────────────────────── */}
      <div className="cmp-header">
        <div>
          <div className="cmp-eyebrow">Side-by-Side Analysis</div>
          <h1 className="cmp-title">Comparison Center</h1>
          <p className="cmp-subtitle">Deep-dive analysis of two cities with identical property assumptions.</p>
        </div>
      </div>

      {/* ── CONTROLS ─────────────────────────────────────────────── */}
      <div className="cmp-controls-card">
        <div className="cmp-controls-grid">
          {/* Left city */}
          <div className="cmp-ctrl-group">
            <label className="cmp-ctrl-label" style={{ color: COLORS.left }}>City A</label>
            <select className="cmp-select cmp-select--left" value={leftCity} onChange={e => setLeftCity(e.target.value)}>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="cmp-vs-badge"><GitCompare size={20} /></div>

          {/* Right city */}
          <div className="cmp-ctrl-group">
            <label className="cmp-ctrl-label" style={{ color: COLORS.right }}>City B</label>
            <select className="cmp-select cmp-select--right" value={rightCity} onChange={e => setRightCity(e.target.value)}>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Shared params */}
          <div className="cmp-ctrl-group">
            <label className="cmp-ctrl-label">Property Type</label>
            <select className="cmp-select" value={propType} onChange={e => setPropType(e.target.value)}>
              {PROPERTY_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>

          <div className="cmp-ctrl-group">
            <label className="cmp-ctrl-label">BHK</label>
            <div className="cmp-bhk-row">
              {[1, 2, 3, 4, 5].map(b => (
                <button key={b} className={`cmp-bhk-btn${bhk === b ? " active" : ""}`} onClick={() => setBhk(b)}>{b}</button>
              ))}
            </div>
          </div>

          <div className="cmp-ctrl-group">
            <label className="cmp-ctrl-label">Area (sq m): {area} m²</label>
            <input type="range" min={50} max={400} step={5} value={area}
              onChange={e => setArea(Number(e.target.value))}
              className="cmp-slider" />
          </div>
        </div>
      </div>

      {/* ── TAB BAR ──────────────────────────────────────────────── */}
      <div className="cmp-tab-bar">
        {["side-by-side", "head-to-head", "forecast"].map(tab => (
          <button key={tab} className={`cmp-tab${activeTab === tab ? " active" : ""}`} onClick={() => setActiveTab(tab)}>
            {tab === "side-by-side" ? "Side by Side" : tab === "head-to-head" ? "Head to Head" : "Forecast"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── SIDE BY SIDE ─────────────────────────────────────────── */}
        {activeTab === "side-by-side" && (
          <motion.div key="sbs" className="cmp-sbs-grid" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <CityPanel city={leftCity}  bhk={bhk} area={area} propertyType={propType} color={COLORS.left}  rank={leftRank} />
            <CityPanel city={rightCity} bhk={bhk} area={area} propertyType={propType} color={COLORS.right} rank={rightRank} />
          </motion.div>
        )}

        {/* ── HEAD TO HEAD ─────────────────────────────────────────── */}
        {activeTab === "head-to-head" && (
          <motion.div key="h2h" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="cmp-h2h-card">
              {/* Header row */}
              <div className="cmp-h2h-header">
                <div className="cmp-h2h-city" style={{ color: COLORS.left }}>{leftCity}</div>
                <div className="cmp-h2h-metric-label">Metric</div>
                <div className="cmp-h2h-city" style={{ color: COLORS.right }}>{rightCity}</div>
              </div>
              {/* Data rows */}
              {h2h.map((row, i) => {
                const leftWins  = row.winner === "left";
                const rightWins = row.winner === "right";
                return (
                  <motion.div key={row.label} className="cmp-h2h-row" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                    <div className={`cmp-h2h-val${leftWins ? " cmp-h2h-winner" : ""}`} style={leftWins ? { color: COLORS.left } : {}}>
                      {leftWins && <Zap size={12} />}{row.left}
                    </div>
                    <div className="cmp-h2h-metric">{row.label}</div>
                    <div className={`cmp-h2h-val${rightWins ? " cmp-h2h-winner" : ""}`} style={rightWins ? { color: COLORS.right } : {}}>
                      {row.right}{rightWins && <Zap size={12} />}
                    </div>
                  </motion.div>
                );
              })}
              {/* Winner banner */}
              <div className="cmp-h2h-winner-banner" style={{ borderColor: leftScore > rightScore ? COLORS.left : COLORS.right }}>
                <Award size={18} color={leftScore > rightScore ? COLORS.left : COLORS.right} />
                <span>
                  <strong style={{ color: leftScore > rightScore ? COLORS.left : COLORS.right }}>
                    {leftScore > rightScore ? leftCity : rightCity}
                  </strong> leads with a higher overall investment score ({leftScore > rightScore ? leftScore : rightScore}/100)
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── FORECAST ─────────────────────────────────────────────── */}
        {activeTab === "forecast" && (
          <motion.div key="forecast" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="cmp-forecast-card">
              <div className="cmp-fc-header">
                <div className="cmp-fc-legend">
                  <span className="cmp-fc-dot" style={{ background: COLORS.left }} /> {leftCity}
                  <span className="cmp-fc-dot" style={{ background: COLORS.right, marginLeft: 16 }} /> {rightCity}
                </div>
                <div className="cmp-fc-title">10-Year Projected Value</div>
              </div>
              <svg viewBox="0 0 680 220" className="cmp-fc-svg">
                {/* Grid lines */}
                {[44, 88, 132, 176].map(y => (
                  <line key={y} x1="60" y1={y} x2="660" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                ))}
                {(() => {
                  const allVals = [...leftForecast, ...rightForecast].flatMap(d => [d.base]);
                  const maxV = Math.max(...allVals) * 1.05;
                  const minV = Math.min(...allVals) * 0.95;
                  const diff = maxV - minV || 1;
                  const toY = v => 190 - ((v - minV) / diff) * 150;
                  const toX = i => 60 + (i / 10) * 600;

                  const lPath = leftForecast.map((d, i) => `${toX(i)},${toY(d.base)}`).join(" L ");
                  const rPath = rightForecast.map((d, i) => `${toX(i)},${toY(d.base)}`).join(" L ");

                  return (
                    <>
                      <path d={`M ${lPath}`} fill="none" stroke={COLORS.left} strokeWidth="2.5" strokeLinecap="round" />
                      <path d={`M ${rPath}`} fill="none" stroke={COLORS.right} strokeWidth="2.5" strokeLinecap="round" />
                      {leftForecast.filter((_, i) => i % 2 === 0).map((d, i) => (
                        <text key={i} x={toX(i * 2)} y="208" fill="rgba(100,116,139,0.9)" fontSize="9" fontWeight="700" textAnchor="middle">{d.year}</text>
                      ))}
                      {/* End labels */}
                      <text x={toX(10) + 6} y={toY(leftForecast[10].base)} fill={COLORS.left} fontSize="10" fontWeight="900" dominantBaseline="middle">{formatINR(leftForecast[10].base)}</text>
                      <text x={toX(10) + 6} y={toY(rightForecast[10].base) + 14} fill={COLORS.right} fontSize="10" fontWeight="900" dominantBaseline="middle">{formatINR(rightForecast[10].base)}</text>
                    </>
                  );
                })()}
              </svg>
              <div className="cmp-fc-footer">
                {[leftCity, rightCity].map((city, i) => {
                  const fc = i === 0 ? leftForecast : rightForecast;
                  const p  = getProfile(city);
                  return (
                    <div key={city} className="cmp-fc-stat-block" style={{ borderColor: i === 0 ? COLORS.left : COLORS.right }}>
                      <div className="cmp-fc-city-name" style={{ color: i === 0 ? COLORS.left : COLORS.right }}>{city}</div>
                      <div className="cmp-fc-stat"><span>10Y Base</span><strong>{formatINR(fc[10].base)}</strong></div>
                      <div className="cmp-fc-stat"><span>CAGR</span><strong>{p.growth}%</strong></div>
                      <div className="cmp-fc-stat"><span>Yield</span><strong>{p.yield}%</strong></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComparisonCenter;
