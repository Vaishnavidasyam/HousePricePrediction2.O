import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, DollarSign, ShieldCheck,
  ArrowUpRight, ArrowDownRight, Star, MapPin,
  Activity, Target, Award, Layers
} from "lucide-react";
import {
  CITIES, PROPERTY_TYPES, formatINR, getAdjustedProfile,
  estimatePrice, generateForecast, buildScenario, topLocalities, areaSqmToSqft
} from "../data/marketData";
import { useMarketMetadata } from "../hooks/useMarketMetadata";
import "./InvestmentIntelligence.css";

/* ── count-up hook ──────────────────────────────────────────────── */
const useCountUp = (target, duration = 1000) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let frame = 0;
    const steps = duration / 16;
    const inc = target / steps;
    const id = setInterval(() => {
      frame++;
      if (frame >= steps) { setVal(target); clearInterval(id); }
      else setVal(Math.floor(inc * frame));
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  return val;
};

/* ── animated progress bar ─────────────────────────────────────── */
const Bar = ({ value, color = "var(--inv-accent)", delay = 0 }) => {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(value), delay + 400);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${w}%`, background: color, borderRadius: 99, transition: "width 1s cubic-bezier(.16,1,.3,1)" }} />
    </div>
  );
};

/* ── sparkline ──────────────────────────────────────────────────── */
const Spark = ({ points, color = "#14B8A6" }) => {
  const max = Math.max(...points), min = Math.min(...points), range = max - min || 1;
  const w = 80, h = 28;
  const coords = points.map((p, i) => `${(i / (points.length - 1)) * w},${h - ((p - min) / range) * h}`);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: w, height: h, overflow: "visible" }}>
      <path d={`M ${coords.join(" L ")}`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx={coords[coords.length - 1].split(",")[0]} cy={coords[coords.length - 1].split(",")[1]} r="3" fill={color} />
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   INVESTMENT INTELLIGENCE PAGE
═══════════════════════════════════════════════════════════════════ */
const InvestmentIntelligence = () => {
  const { metadata } = useMarketMetadata();
  const [activeCity, setActiveCity] = useState("Hyderabad");
  const [activePType, setActivePType] = useState("apartment");
  const [activeBhk, setActiveBhk] = useState(2);
  const [activeTab, setActiveTab] = useState("overview");

  const profile = useMemo(() => getAdjustedProfile(activeCity, activePType, activeBhk), [activeCity, activePType, activeBhk]);
  const localities = useMemo(() => topLocalities(metadata, activeCity, 8), [metadata, activeCity]);

  const scenarios = useMemo(
    () => localities.map((loc, i) => buildScenario(activeCity, loc, i, {
      bhk: activeBhk,
      area_sqm: activeBhk * 45 + 30,
      propertyType: activePType
    })),
    [activeCity, localities, activeBhk, activePType]
  );

  const basePrice = useMemo(() => {
    const area_sqm = activeBhk * 45 + 30;
    return estimatePrice({ city: activeCity, bhk: activeBhk, area_sqm, propertyType: activePType });
  }, [activeCity, activeBhk, activePType]);

  const forecast = useMemo(() => generateForecast(basePrice, 5), [basePrice]);

  const cYield  = useCountUp(Math.round(profile.yield * 10), 1200);
  const cGrowth = useCountUp(Math.round(profile.growth * 10), 1200);
  const cDemand = useCountUp(profile.demand, 1000);
  const cInfra  = useCountUp(profile.infra, 1000);

  const cityComparison = useMemo(() =>
    CITIES.map(city => {
      const p = getAdjustedProfile(city, activePType, activeBhk);
      const price = estimatePrice({ city, bhk: activeBhk, area_sqm: activeBhk * 45 + 30, propertyType: activePType });
      return { city, ...p, price, score: Math.round((p.demand + p.infra) / 2) };
    }).sort((a, b) => b.growth - a.growth),
    [activeBhk, activePType]
  );

  return (
    <div className="inv-layout">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="inv-header">
        <div className="inv-header-text">
          <div className="inv-eyebrow">Capital Allocation Engine</div>
          <h1 className="inv-title">Investment Intelligence</h1>
          <p className="inv-subtitle">
            Rank localities, compare cities and forecast ROI across all property types.
          </p>
        </div>
        <div className="inv-controls">
          <select className="inv-select" value={activeCity} onChange={e => setActiveCity(e.target.value)}>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="inv-select" value={activePType} onChange={e => setActivePType(e.target.value)}>
            {PROPERTY_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <div className="inv-bhk-row">
            {[1, 2, 3, 4, 5].map(b => (
              <button key={b} className={`inv-bhk-btn${activeBhk === b ? " active" : ""}`} onClick={() => setActiveBhk(b)}>
                {b} BHK
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI STRIP ──────────────────────────────────────────────── */}
      <div className="inv-kpi-grid">
        {[
          { label: "Rental Yield", value: `${(cYield / 10).toFixed(1)}%`, icon: DollarSign, trend: "+0.4%", up: true, spark: [3.2,3.4,3.5,3.7,3.8,3.9,4.1] },
          { label: "Annual Growth", value: `${(cGrowth / 10).toFixed(1)}%`, icon: TrendingUp, trend: "+1.2%", up: true, spark: [8,9,10,11,12,12.5,13] },
          { label: "Demand Score", value: `${cDemand}/100`, icon: Target, trend: "+4", up: true, spark: [78,82,85,87,88,90,91] },
          { label: "Infrastructure", value: `${cInfra}/100`, icon: ShieldCheck, trend: "+2", up: true, spark: [80,82,83,84,85,86,88] },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} className="inv-kpi-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <div className="inv-kpi-top">
              <div className="inv-kpi-icon"><kpi.icon size={18} /></div>
              <span className={`inv-kpi-trend ${kpi.up ? "up" : "down"}`}>
                {kpi.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {kpi.trend}
              </span>
            </div>
            <div className="inv-kpi-value">{kpi.value}</div>
            <div className="inv-kpi-label">{kpi.label}</div>
            <div style={{ marginTop: 8 }}><Spark points={kpi.spark} /></div>
          </motion.div>
        ))}
      </div>

      {/* ── TAB BAR ────────────────────────────────────────────────── */}
      <div className="inv-tab-bar">
        {["overview", "localities", "forecast", "comparison"].map(tab => (
          <button key={tab} className={`inv-tab${activeTab === tab ? " active" : ""}`} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div key="overview" className="inv-content" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="inv-card inv-card--wide">
              <div className="inv-card-header"><Activity size={20} color="var(--inv-accent)" /><span>Market Profile — {activeCity}</span></div>
              <div className="inv-profile-grid">
                {[
                  { label: "Demand", val: profile.demand, color: "#14B8A6" },
                  { label: "Growth", val: Math.min(99, Math.round(profile.growth * 6)), color: "#22D3EE" },
                  { label: "Rental Yield", val: Math.min(99, Math.round(profile.yield * 18)), color: "#A78BFA" },
                  { label: "Infrastructure", val: profile.infra, color: "#34D399" },
                  { label: "Liquidity", val: 86, color: "#F59E0B" },
                  { label: "Risk Buffer", val: 80, color: "#F87171" },
                ].map((item, i) => (
                  <div key={item.label} className="inv-bar-row">
                    <div className="inv-bar-meta"><span>{item.label}</span><span style={{ color: item.color, fontWeight: 900 }}>{item.val}%</span></div>
                    <Bar value={item.val} color={item.color} delay={i * 100} />
                  </div>
                ))}
              </div>
            </div>
            <div className="inv-card">
              <div className="inv-card-header"><DollarSign size={20} color="var(--inv-accent)" /><span>Benchmark Price</span></div>
              <div className="inv-benchmark">
                <div className="inv-price-main">{formatINR(basePrice)}</div>
                <div className="inv-price-meta">{activeBhk} BHK · {PROPERTY_TYPES.find(t => t.id === activePType)?.label}</div>
                <div className="inv-price-meta">₹{Math.round(basePrice / areaSqmToSqft(activeBhk * 45 + 30)).toLocaleString("en-IN")}/sq ft</div>
                {[
                  { label: "1-Year Target", val: Math.round(basePrice * (1 + profile.growth / 100)) },
                  { label: "3-Year Target", val: Math.round(basePrice * Math.pow(1 + profile.growth / 100, 3)) },
                  { label: "5-Year Target", val: Math.round(basePrice * Math.pow(1 + profile.growth / 100, 5)) },
                ].map(row => (
                  <div key={row.label} className="inv-target-row"><span>{row.label}</span><strong style={{ color: "var(--inv-accent)" }}>{formatINR(row.val)}</strong></div>
                ))}
              </div>
            </div>
            <div className="inv-card">
              <div className="inv-card-header"><Star size={20} color="#F59E0B" /><span>AI Investment Thesis</span></div>
              <div className="inv-thesis">
                <div className={`inv-verdict ${profile.growth > 11 ? "buy" : profile.growth > 9 ? "accumulate" : "hold"}`}>
                  {profile.growth > 11 && profile.yield > 3.8 ? "STRONG BUY" : profile.growth > 9 ? "ACCUMULATE" : "HOLD"}
                </div>
                <p className="inv-thesis-text">
                  {activeCity} shows {profile.growth > 11 ? "exceptional" : profile.growth > 9 ? "strong" : "moderate"} capital appreciation at {profile.growth}% YoY.
                  Rental yield of {profile.yield}% underpins stable income. Demand score {profile.demand}/100 reflects
                  {profile.demand > 88 ? " very high buyer intent" : profile.demand > 80 ? " healthy buyer activity" : " moderate market activity"}.
                </p>
                <div className="inv-risk-badge">Risk Profile: <strong>{profile.risk}</strong></div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "localities" && (
          <motion.div key="localities" className="inv-content" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="inv-card inv-card--full">
              <div className="inv-card-header"><MapPin size={20} color="var(--inv-accent)" /><span>Locality Ranking — {activeCity}</span><span className="inv-badge">{scenarios.length} localities</span></div>
              <div className="inv-rank-table">
                <div className="inv-rank-thead"><span>#</span><span>Locality</span><span>Est. Price</span><span>Growth</span><span>Yield</span><span>Score</span><span>Grade</span></div>
                {scenarios.map((s, i) => (
                  <motion.div key={s.place} className="inv-rank-row" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                    <span className="inv-rank-num">{i + 1}</span>
                    <div><strong>{s.place}</strong><div style={{ fontSize: 11, color: "var(--inv-muted)", marginTop: 2 }}>{s.bhk} BHK · {Math.round(areaSqmToSqft(s.area_sqm))} sq ft</div></div>
                    <span className="inv-price-cell">{formatINR(s.estimated)}</span>
                    <span className="inv-green">+{s.growth.toFixed(1)}%</span>
                    <span style={{ color: "#A78BFA", fontWeight: 700 }}>{s.yield.toFixed(1)}%</span>
                    <div style={{ width: 60 }}><Bar value={s.score} color="var(--inv-accent)" delay={i * 60} /><div style={{ fontSize: 10, color: "var(--inv-muted)", marginTop: 4 }}>{s.score}/100</div></div>
                    <span className={`inv-grade`}>{["A+","A","A","B+","B+","B","B","B+"][i] || "B"}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "forecast" && (
          <motion.div key="forecast" className="inv-content" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="inv-card inv-card--full">
              <div className="inv-card-header"><TrendingUp size={20} color="var(--inv-accent)" /><span>5-Year Value Projection — {activeCity}</span></div>
              <div className="inv-forecast-chart">
                {forecast.map((pt, i) => {
                  const maxVal = forecast[forecast.length - 1].bull;
                  const barH = Math.round((pt.base / maxVal) * 220);
                  return (
                    <div key={pt.year} className="inv-bar-col">
                      <div className="inv-bar-label-top">{formatINR(pt.base).replace("₹","")}</div>
                      <div className="inv-bar-visual">
                        <motion.div className="inv-bar-fill" initial={{ height: 0 }} animate={{ height: barH }} transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }} style={{ opacity: 0.4 + i * 0.12 }} />
                      </div>
                      <div className="inv-bar-year">{pt.year}</div>
                    </div>
                  );
                })}
              </div>
              <div className="inv-forecast-footer">
                {[
                  { label: "Base (5Y)", val: formatINR(forecast[5]?.base), color: "var(--inv-accent)" },
                  { label: "Bull (5Y)", val: formatINR(forecast[5]?.bull), color: "#34D399" },
                  { label: "Bear (5Y)", val: formatINR(forecast[5]?.bear), color: "#F87171" },
                  { label: "CAGR (Base)", val: `${profile.growth}%`, color: "#A78BFA" },
                ].map(s => (
                  <div key={s.label} className="inv-forecast-stat"><span>{s.label}</span><strong style={{ color: s.color }}>{s.val}</strong></div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "comparison" && (
          <motion.div key="comparison" className="inv-content" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="inv-card inv-card--full">
              <div className="inv-card-header"><Layers size={20} color="var(--inv-accent)" /><span>City ROI Comparison — {PROPERTY_TYPES.find(t => t.id === activePType)?.label} · {activeBhk} BHK</span></div>
              <div className="inv-cmp-table">
                <div className="inv-cmp-thead"><span>City</span><span>Benchmark Price</span><span>Growth</span><span>Yield</span><span>Demand</span><span>Infra</span><span>Score</span></div>
                {cityComparison.map((row, i) => (
                  <motion.div key={row.city} className={`inv-cmp-row${row.city === activeCity ? " inv-cmp-row--active" : ""}`} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                    <span style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>{i === 0 && <Award size={14} color="#F59E0B" />}{row.city}</span>
                    <span className="inv-price-cell">{formatINR(row.price)}</span>
                    <span className="inv-green">+{row.growth}%</span>
                    <span style={{ color: "#A78BFA", fontWeight: 700 }}>{row.yield}%</span>
                    <div className="inv-mini-bar"><Bar value={row.demand} color="var(--inv-accent)" delay={i * 80} /><span>{row.demand}</span></div>
                    <div className="inv-mini-bar"><Bar value={row.infra} color="#34D399" delay={i * 80 + 40} /><span>{row.infra}</span></div>
                    <div className="inv-score-badge">{row.score}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvestmentIntelligence;
