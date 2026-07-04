import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map, Activity, Building, Globe,
  MapPin, Train, Plane, School, Hospital, ShoppingBag,
  Briefcase, BarChart3, Award
} from "lucide-react";
import {
  CITIES, PROPERTY_TYPES, formatINR, getProfile,
  estimatePrice, getAmenities, topLocalities, areaSqmToSqft
} from "../data/marketData";
import { useMarketMetadata } from "../hooks/useMarketMetadata";
import "./SmartCityIntelligence.css";

/* ── Animated Bar ────────────────────────────────────────────────── */
const Bar = ({ value, color = "#14B8A6", delay = 0 }) => {
  const [w, setW] = React.useState(0);
  React.useEffect(() => {
    const t = setTimeout(() => setW(value), delay + 300);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div className="sci-bar-track">
      <div className="sci-bar-fill" style={{ width: `${w}%`, background: color, transition: "width 0.9s cubic-bezier(.16,1,.3,1)" }} />
    </div>
  );
};

/* ── Icon map ────────────────────────────────────────────────────── */
const IconMap = { TrainFront: Train, Plane, School, Hospital, ShoppingBag, Briefcase, MapPin };

/* ── City score ring ─────────────────────────────────────────────── */
const ScoreRing = ({ value, color, label }) => {
  const r = 44, circ = 2 * Math.PI * r;
  const [dash, setDash] = React.useState(circ);
  React.useEffect(() => {
    const t = setTimeout(() => setDash(circ - (value / 100) * circ), 500);
    return () => clearTimeout(t);
  }, [value, circ]);
  return (
    <div className="sci-ring-wrap">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={dash}
          strokeLinecap="round" transform="rotate(-90 55 55)"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1)" }} />
        <text x="55" y="52" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="900">{value}</text>
        <text x="55" y="68" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9" fontWeight="700">/100</text>
      </svg>
      <div className="sci-ring-label">{label}</div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SMART CITY & LAND INTELLIGENCE
═══════════════════════════════════════════════════════════════════ */
const SmartCityIntelligence = () => {
  const { metadata, status } = useMarketMetadata();
  const [activeCity, setActiveCity]     = useState("Hyderabad");
  const [activeLocality, setActiveLocality] = useState("");
  const [activeTab, setActiveTab]       = useState("overview");

  const profile    = getProfile(activeCity);
  const localities = useMemo(() => topLocalities(metadata, activeCity, 10), [metadata, activeCity]);
  const amenities  = useMemo(() => getAmenities(activeCity, activeLocality || localities[0] || ""), [activeCity, activeLocality, localities]);

  /* set first locality when city changes */
  React.useEffect(() => {
    setActiveLocality(localities[0] || "");
  }, [activeCity, localities]);

  /* price estimates per property type for the selected city */
  const priceMatrix = useMemo(() =>
    PROPERTY_TYPES.map(pt => ({
      ...pt,
      prices: [1, 2, 3, 4].map(bhk => ({
        bhk,
        price: estimatePrice({ city: activeCity, bhk, area_sqm: bhk * 45 + 30, propertyType: pt.id }),
        sqft:  areaSqmToSqft(bhk * 45 + 30),
      }))
    })),
    [activeCity]
  );

  /* Land/plot price per sq ft by city (derived from plot type) */
  const landPrice = useMemo(() => {
    const sqm = 200; // 200 sq m = ~2153 sq ft benchmark
    const p = estimatePrice({ city: activeCity, bhk: 1, area_sqm: sqm, propertyType: "plot" });
    return { total: p, perSqft: Math.round(p / areaSqmToSqft(sqm)) };
  }, [activeCity]);

  /* city-wide scorecard */
  const scorecard = [
    { label: "Demand Index",   val: profile.demand, color: "#14B8A6" },
    { label: "Infrastructure", val: profile.infra,  color: "#22D3EE" },
    { label: "Growth Rate",    val: Math.min(99, Math.round(profile.growth * 6)), color: "#A78BFA" },
    { label: "Connectivity",   val: Math.min(99, Math.round((profile.infra + profile.demand) / 2.1)), color: "#34D399" },
    { label: "Livability",     val: Math.min(99, Math.round(profile.infra * 1.05)), color: "#F59E0B" },
    { label: "Investment Grade", val: Math.min(99, Math.round((profile.growth * 4 + profile.yield * 8) / 2)), color: "#F87171" },
  ];

  return (
    <div className="sci-layout">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="sci-header">
        <div>
          <div className="sci-eyebrow">Urban Intelligence Dashboard</div>
          <h1 className="sci-title">City &amp; Land Intelligence</h1>
          <p className="sci-subtitle">
            Explore city-level demand signals, land valuation, infrastructure scores and locality coverage across all major markets.
          </p>
        </div>
        <div className="sci-header-controls">
          <select className="sci-select" value={activeCity} onChange={e => setActiveCity(e.target.value)}>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className={`sci-live-badge ${status === "live" ? "live" : ""}`}>
            <span className="sci-live-dot" />
            {status === "live" ? "Live Feed" : "Local Model"}
          </div>
        </div>
      </div>

      {/* ── CITY KPI RINGS ─────────────────────────────────────────── */}
      <div className="sci-rings-card">
        <div className="sci-rings-label">
          <Map size={18} color="var(--sci-accent)" />
          <span>{activeCity} — City Scorecard</span>
        </div>
        <div className="sci-rings-row">
          <ScoreRing value={profile.demand} color="#14B8A6" label="Demand" />
          <ScoreRing value={profile.infra}  color="#22D3EE" label="Infrastructure" />
          <ScoreRing value={Math.min(99, Math.round(profile.growth * 6))} color="#A78BFA" label="Growth" />
          <ScoreRing value={Math.min(99, Math.round((profile.infra + profile.demand) / 2.1))} color="#34D399" label="Connectivity" />
          <ScoreRing value={Math.min(99, Math.round(profile.infra * 1.05))} color="#F59E0B" label="Livability" />
          <ScoreRing value={Math.min(99, Math.round((profile.growth * 4 + profile.yield * 8) / 2))} color="#F87171" label="Inv. Grade" />
        </div>
      </div>

      {/* ── TAB BAR ────────────────────────────────────────────────── */}
      <div className="sci-tab-bar">
        {["overview", "localities", "property-matrix", "land"].map(tab => (
          <button key={tab} className={`sci-tab${activeTab === tab ? " active" : ""}`} onClick={() => setActiveTab(tab)}>
            {tab === "property-matrix" ? "Property Matrix" : tab === "land" ? "Land & Plot" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <motion.div key="ov" className="sci-content" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

            {/* Profile bars */}
            <div className="sci-card sci-card--wide">
              <div className="sci-card-header"><Activity size={18} color="var(--sci-accent)" /><span>Market Profile Breakdown</span></div>
              <div className="sci-bar-grid">
                {scorecard.map((s, i) => (
                  <div key={s.label} className="sci-bar-item">
                    <div className="sci-bar-meta"><span>{s.label}</span><span style={{ color: s.color, fontWeight: 900 }}>{s.val}</span></div>
                    <Bar value={s.val} color={s.color} delay={i * 100} />
                  </div>
                ))}
              </div>
            </div>

            {/* Investment verdicts */}
            <div className="sci-card">
              <div className="sci-card-header"><Award size={18} color="#F59E0B" /><span>Investment Verdict</span></div>
              <div className="sci-verdict-block">
                <div className={`sci-verdict ${profile.growth > 11 ? "buy" : profile.growth > 9 ? "acc" : "hold"}`}>
                  {profile.growth > 11 && profile.yield > 3.8 ? "STRONG BUY" : profile.growth > 9 ? "ACCUMULATE" : "HOLD"}
                </div>
                <div className="sci-verdict-stats">
                  {[
                    { label: "Yield p.a.",   val: `${profile.yield}%`,   color: "#A78BFA" },
                    { label: "Growth YoY",   val: `${profile.growth}%`,  color: "#14B8A6" },
                    { label: "Risk",         val: profile.risk,           color: "#F59E0B" },
                  ].map(item => (
                    <div key={item.label} className="sci-verdict-stat">
                      <span className="sci-vs-label">{item.label}</span>
                      <strong style={{ color: item.color }}>{item.val}</strong>
                    </div>
                  ))}
                </div>
                <p className="sci-verdict-text">
                  {activeCity} demonstrates {profile.growth > 11 ? "outstanding" : profile.growth > 9 ? "above-average" : "stable"} real estate fundamentals.
                  With a demand index of {profile.demand}/100 and infrastructure score {profile.infra}/100, the city offers
                  {profile.infra > 85 ? " premium connectivity and amenities." : " solid urban infrastructure."}
                </p>
              </div>
            </div>

            {/* Amenities for first locality */}
            <div className="sci-card sci-card--full">
              <div className="sci-card-header">
                <MapPin size={18} color="var(--sci-accent)" />
                <span>Proximity Intelligence — {activeLocality || localities[0]}</span>
                <select className="sci-select-sm" value={activeLocality} onChange={e => setActiveLocality(e.target.value)}>
                  {localities.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="sci-amenities-grid">
                {amenities.map((a, i) => {
                  const Icon = IconMap[a.icon] || MapPin;
                  return (
                    <motion.div key={a.name} className="sci-amenity-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                      <div className="sci-amenity-icon"><Icon size={18} /></div>
                      <div className="sci-amenity-info">
                        <div className="sci-amenity-name">{a.name}</div>
                        <div className="sci-amenity-dist">{a.distance} · {a.time}</div>
                      </div>
                      <div className="sci-amenity-score">{a.score}<span>/100</span></div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── LOCALITIES TAB ───────────────────────────────────────── */}
        {activeTab === "localities" && (
          <motion.div key="loc" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="sci-card sci-card--full">
              <div className="sci-card-header"><MapPin size={18} color="var(--sci-accent)" /><span>Dataset Locality Coverage — {activeCity}</span><span className="sci-badge">{localities.length} areas</span></div>
              <div className="sci-locality-grid">
                {localities.map((loc, i) => {
                  const benchPrice = estimatePrice({ city: activeCity, bhk: 2, area_sqm: 100, propertyType: "apartment" });
                  const locVariation = 0.92 + (i % 5) * 0.04;
                  return (
                    <motion.div key={loc} className={`sci-locality-tile${activeLocality === loc ? " active" : ""}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setActiveLocality(loc)}
                    >
                      <div className="sci-lt-rank">{i + 1}</div>
                      <div className="sci-lt-name">{loc}</div>
                      <div className="sci-lt-price">{formatINR(Math.round(benchPrice * locVariation))}</div>
                      <div className="sci-lt-meta">2 BHK · 100 sq m</div>
                      <div className="sci-lt-growth">+{(profile.growth + (i % 3 - 1) * 0.5).toFixed(1)}%</div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── PROPERTY MATRIX TAB ──────────────────────────────────── */}
        {activeTab === "property-matrix" && (
          <motion.div key="pm" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="sci-card sci-card--full">
              <div className="sci-card-header"><Building size={18} color="var(--sci-accent)" /><span>Price Matrix — {activeCity} (All Types × BHK)</span></div>
              <div className="sci-matrix-table">
                <div className="sci-mt-header">
                  <span>Property Type</span>
                  <span>1 BHK</span><span>2 BHK</span><span>3 BHK</span><span>4 BHK</span>
                  <span>Type Premium</span>
                </div>
                {priceMatrix.map((pt, i) => {
                  const baseApartment = priceMatrix[0].prices[1].price;
                  const premium = Math.round(((pt.prices[1].price - baseApartment) / baseApartment) * 100);
                  return (
                    <motion.div key={pt.id} className="sci-mt-row" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                      <div className="sci-mt-type">
                        <span className="sci-mt-dot" style={{ background: ["#14B8A6","#A78BFA","#F59E0B","#F87171","#34D399","#22D3EE"][i] }} />
                        {pt.label}
                      </div>
                      {pt.prices.map(row => (
                        <div key={row.bhk} className="sci-mt-cell">
                          <div className="sci-mt-price">{formatINR(row.price)}</div>
                          <div className="sci-mt-sqft">₹{Math.round(row.price / row.sqft).toLocaleString("en-IN")}/sqft</div>
                        </div>
                      ))}
                      <div className={`sci-mt-premium ${premium >= 0 ? "pos" : "neg"}`}>{premium >= 0 ? "+" : ""}{premium}%</div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── LAND TAB ─────────────────────────────────────────────── */}
        {activeTab === "land" && (
          <motion.div key="land" className="sci-content" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Land price card */}
            <div className="sci-card sci-card--wide">
              <div className="sci-card-header"><Map size={18} color="var(--sci-accent)" /><span>Land &amp; Plot Valuations — {activeCity}</span></div>
              <div className="sci-land-hero">
                <div>
                  <div className="sci-land-label">200 sq m Benchmark Plot</div>
                  <div className="sci-land-price">{formatINR(landPrice.total)}</div>
                  <div className="sci-land-rate">₹{landPrice.perSqft.toLocaleString("en-IN")} / sq ft</div>
                </div>
                <div className="sci-land-tiers">
                  {[
                    { size: "100 sq m", label: "Residential Plot" },
                    { size: "200 sq m", label: "Villa Plot" },
                    { size: "500 sq m", label: "Commercial Site" },
                    { size: "1000 sq m", label: "Development Land" },
                  ].map(tier => {
                    const sqm = parseInt(tier.size);
                    const p = estimatePrice({ city: activeCity, bhk: 1, area_sqm: sqm, propertyType: "plot" });
                    return (
                      <div key={tier.label} className="sci-land-tier">
                        <span className="sci-lt-l">{tier.label}</span>
                        <span className="sci-lt-s">{tier.size}</span>
                        <strong className="sci-lt-p">{formatINR(p)}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* City land comparison */}
            <div className="sci-card">
              <div className="sci-card-header"><BarChart3 size={18} color="var(--sci-accent)" /><span>Land Rate by City</span></div>
              <div className="sci-land-compare">
                {CITIES.map((city, i) => {
                  const p = estimatePrice({ city, bhk: 1, area_sqm: 200, propertyType: "plot" });
                  const perSqft = Math.round(p / areaSqmToSqft(200));
                  const maxRate = 50000;
                  return (
                    <div key={city} className="sci-lc-row">
                      <span className="sci-lc-city">{city}</span>
                      <div className="sci-lc-bar-wrap">
                        <Bar value={Math.min(99, Math.round((perSqft / maxRate) * 100))} color={["#14B8A6","#A78BFA","#F59E0B","#34D399","#F87171"][i]} delay={i * 80} />
                      </div>
                      <span className="sci-lc-rate">₹{perSqft.toLocaleString("en-IN")}/sqft</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Township insight */}
            <div className="sci-card">
              <div className="sci-card-header"><Globe size={18} color="#A78BFA" /><span>Township &amp; Large Format</span></div>
              <div className="sci-township">
                {[
                  { label: "Township (integrated)", sqm: 500, note: "Gated community + amenities" },
                  { label: "Commercial Land",       sqm: 300, note: "Office/retail development" },
                  { label: "Luxury Estate",         sqm: 800, note: "Premium villa land" },
                ].map(item => {
                  const p = estimatePrice({ city: activeCity, bhk: 2, area_sqm: item.sqm, propertyType: "township" });
                  return (
                    <div key={item.label} className="sci-ts-row">
                      <div>
                        <div className="sci-ts-name">{item.label}</div>
                        <div className="sci-ts-note">{item.note} · {item.sqm} sq m</div>
                      </div>
                      <strong className="sci-ts-price">{formatINR(p)}</strong>
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

export default SmartCityIntelligence;
