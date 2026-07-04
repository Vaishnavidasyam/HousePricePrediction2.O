import React, { useState, useMemo, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  TrendingUp,
  Key,
  ShieldCheck,
  Bot,
  DollarSign,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  X,
  MapPin,
  Sparkles,
  BarChart2,
  Layers,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import {
  estimatePrice,
  formatINR,
  formatNumber,
  getProfile,
  generateForecast,
  getAmenities,
  areaSqmToSqft,
  PROPERTY_TYPES,
} from "../data/marketData";
import "./ValuationResults.css";

/* ─── Holographic 3D Layout ──────────────────────────────────────── */
const HolographicLayout = ({ bhk }) => {
  const bhkNum = Number(bhk) || 2;
  return (
    <group position={[0, -1, 0]}>
      <gridHelper args={[12, 12, "#14B8A6", "#1e293b"]} position={[0, 0.01, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#0c1524" transparent opacity={0.6} />
      </mesh>
      <mesh position={[-2, 0.6, 1]}>
        <boxGeometry args={[4, 1.2, 4]} />
        <meshStandardMaterial color="#14B8A6" transparent opacity={0.18} wireframe />
      </mesh>
      <mesh position={[2, 0.6, -1]}>
        <boxGeometry args={[3, 1.2, 3]} />
        <meshStandardMaterial color="#e9c783" transparent opacity={0.18} wireframe />
      </mesh>
      {bhkNum >= 3 && (
        <mesh position={[-2, 0.6, -2]}>
          <boxGeometry args={[3, 1.2, 2]} />
          <meshStandardMaterial color="#ff6f91" transparent opacity={0.18} wireframe />
        </mesh>
      )}
    </group>
  );
};

/* ─── Count-up Hook ──────────────────────────────────────────────── */
const useCountUp = (target, duration = 1400, decimals = 0, delay = 0) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let active = true;
    const startTimer = setTimeout(() => {
      const end = Number(target);
      if (isNaN(end) || end === 0) { if (active) setCount(target); return; }
      const stepTime = 16;
      const totalSteps = duration / stepTime;
      const stepValue = end / totalSteps;
      let step = 0;
      const interval = setInterval(() => {
        step++;
        if (step >= totalSteps) {
          clearInterval(interval);
          if (active) setCount(end);
        } else {
          const raw = stepValue * step;
          if (active) setCount(decimals > 0 ? parseFloat(raw.toFixed(decimals)) : Math.floor(raw));
        }
      }, stepTime);
      return () => clearInterval(interval);
    }, delay);
    return () => { active = false; clearTimeout(startTimer); };
  }, [target, duration, decimals, delay]);
  return count;
};

/* ─── Sparkline helper ───────────────────────────────────────────── */
const drawSparkline = (points, width = 60, height = 18) => {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * height;
    return `${x},${y}`;
  });
  return `M ${coords.join(" L ")}`;
};

/* ─── Animated bar on mount ─────────────────────────────────────── */
const AnimatedBar = ({ value, delay = 0 }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), delay + 300);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div className="vr-factor-progress">
      <div className="vr-factor-fill" style={{ width: `${width}%` }} />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
/* ─── Property type label helper ─────────────────────────────────── */
const getTypeLabel = (typeId) =>
  PROPERTY_TYPES.find((t) => t.id === typeId)?.label || "Residential";

const ValuationResults = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const result    = location.state?.result;

  /* ─── Safe derived values (work even when result is null) ──────── */
  const safeCity        = result?.city || "";
  const safePlace       = result?.place || "";
  const safeBhk         = result?.bhk || 2;
  const safePropertyType = result?.propertyType || "apartment";
  const area_sqm        = Number(result?.area_sqm || 1);
  const totalPrice      = Number(
    result?.total_price || (result ? estimatePrice({ ...result, area_sqm }) : 0)
  );
  const pricePerSqm     = Number(result?.price_per_sqm || totalPrice / area_sqm);
  const pricePerSqft    = pricePerSqm / 10.7639;
  const confidence      = 94;
  const sqftArea        = areaSqmToSqft(area_sqm);
  const typeLabel       = getTypeLabel(safePropertyType);
  const profile         = getProfile(safeCity);

  /* ─── All hooks BEFORE any early return ─────────────────────────── */
  /* — Count-ups ———————————————————————————————————— */
  const countPrice  = useCountUp(totalPrice, 1400, 0);
  const countYield  = useCountUp(profile.yield, 1200, 1, 200);
  const countGrowth = useCountUp(profile.growth, 1200, 1, 400);
  const countScore  = useCountUp(84, 1200, 0, 600);

  /* — UI State ———————————————————————————————————— */
  const [vizTab,       setVizTab]       = useState("overview");
  const [analysisTab,  setAnalysisTab]  = useState("forecast");
  const [zoomLevel,    setZoomLevel]    = useState(1);
  const [forecastRange, setForecastRange] = useState(5);
  const [hoveredForecastIndex, setHoveredForecastIndex] = useState(null);
  const [activePOIIndex, setActivePOIIndex] = useState(null);

  /* — Copilot ————————————————————————————————————— */
  const [copilotOpen, setCopilotOpen] = useState(false);
  const chatBodyRef = useRef(null);
  const [copilotMessages, setCopilotMessages] = useState([
    {
      sender: "ai",
      text: safePlace
        ? `Hello! I'm your AI investment companion. I've analysed this property in ${safePlace}, ${safeCity}. Ask me anything.`
        : "Hello! I'm your AI investment companion. Please go back to the Hub to select a property.",
    },
  ]);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [copilotMessages]);

  /* — Data helpers ———————————————————————————————— */
  const amenitiesList = useMemo(() => getAmenities(safeCity, safePlace), [safeCity, safePlace]);
  const forecastData  = useMemo(() => generateForecast(totalPrice, 10), [totalPrice]);

  /* — Guard: no data → redirect to hub (AFTER all hooks) ────────── */
  if (!result) {
    return (
      <div className="vr-workspace" style={{ alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div style={{ fontSize: 48, opacity: 0.15 }}>🏠</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--vr-text)", margin: 0 }}>No Property Selected</h2>
          <p style={{ color: "var(--vr-text-sec)", fontSize: 14, maxWidth: 340, lineHeight: 1.6, margin: 0 }}>
            Please go to the Hub, fill in city, locality, BHK and area, then click Execute Valuation to see your report.
          </p>
          <button
            onClick={() => navigate("/platform/hub")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 24px", borderRadius: 99,
              background: "var(--vr-accent)", color: "#fff",
              border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}
          >
            <ArrowLeft size={15} /> Back to Hub
          </button>
        </div>
      </div>
    );
  }

  /* — Comparison rows (uses city-specific data) ——————————————— */
  const comparisons = [
    { name: "Prestige Shantiniketan", price: totalPrice * 1.08, priceSqft: pricePerSqft * 1.05, yield: +(profile.yield + 0.1).toFixed(1) },
    { name: "Sobha Rose Residences",  price: totalPrice * 0.94, priceSqft: pricePerSqft * 0.92, yield: +(profile.yield - 0.2).toFixed(1) },
    { name: "Brigade Cosmopolis",     price: totalPrice * 1.02, priceSqft: pricePerSqft * 1.01, yield: +(profile.yield + 0.0).toFixed(1) },
  ];

  const analysisBars = [
    { label: "Demand",      val: profile.demand },
    { label: "Growth",      val: Math.min(99, Math.round(profile.growth * 7)) },
    { label: "Rental",      val: Math.min(99, Math.round(profile.yield * 20)) },
    { label: "Liquidity",   val: 88 },
    { label: "Risk Buffer", val: 82 },
  ];

  /* — Copilot handler ————————————————————————————— */
  const handleSendCopilot = (promptText) => {
    setCopilotMessages((prev) => [...prev, { sender: "user", text: promptText }]);
    setTimeout(() => {
      const lower = promptText.toLowerCase();
      let reply = "";
      if (lower.includes("expensive") || lower.includes("price"))
        reply = `The valuation of ${formatINR(totalPrice)} is driven by its position in a primary growth corridor — high demand, tight supply, and top-tier infrastructure access.`;
      else if (lower.includes("invest"))
        reply = `This property ranks in the top 12% for appreciation in ${safeCity}. Growth corridor dynamics (+${profile.growth}% annually) and an investment score of 84/100 indicate a strong risk-adjusted entry.`;
      else if (lower.includes("hsr"))
        reply = `HSR Layout offers slightly higher rental yields, but ${safePlace} provides superior capital appreciation pathways fuelled by infrastructure and cluster growth.`;
      else if (lower.includes("forecast") || lower.includes("appreciation"))
        reply = `Base-case models project this asset at ${formatINR(Math.round(totalPrice * 1.4))} in 5 years. Bull-case: ${formatINR(Math.round(totalPrice * 1.58))}.`;
      else if (lower.includes("rental"))
        reply = `Estimated rental yield is ${profile.yield}% p.a., underpinned by long-term workforce tenants — stable and growing.`;
      else
        reply = `I've noted your query. In short — ${safePlace} remains a high-conviction asset in the ${safeCity} residential market.`;
      setCopilotMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    }, 700);
  };

  /* ─── RENDER ─────────────────────────────────────────────────── */
  return (
    <div className="vr-workspace">

      {/* ══════════════════════════════════════════════════════════
          SECTION 1 — PROPERTY HERO
      ══════════════════════════════════════════════════════════ */}
      <section className="vr-hero" aria-label="Property Hero">
        {/* Left */}
        <div className="vr-hero-left">
          <span className="vr-eyebrow">Property Intel Desk</span>
          <h1 className="vr-hero-title">
            {safePlace},<br /><span className="vr-hero-city">{safeCity}</span>
          </h1>
          <p className="vr-hero-meta">
            {typeLabel} &nbsp;·&nbsp; {safeBhk} BHK &nbsp;·&nbsp;
            {formatNumber(sqftArea)} sq ft &nbsp;·&nbsp; {formatNumber(area_sqm)} sq m
          </p>
          <div className="vr-badge-row">
            <span className="vr-badge vr-badge--teal">High Demand Zone</span>
            <span className="vr-badge vr-badge--teal">Growth Corridor</span>
            <span className="vr-badge vr-badge--teal">{safeCity}</span>
          </div>
        </div>

        {/* Center */}
        <div className="vr-hero-center">
          <div className="vr-hero-price">{formatINR(countPrice)}</div>
          <span className="vr-confidence-tag">
            <Sparkles size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />
            {confidence}% AI Confidence
          </span>
        </div>

        {/* Right */}
        <div className="vr-hero-right">
          <div className="vr-rec-pill">
            <span className="vr-rec-dot" />
            {profile.growth > 11 && profile.yield > 3.8
              ? "STRONG BUY"
              : profile.growth > 9
              ? "ACCUMULATE"
              : "HOLD"}
          </div>
          <p className="vr-rec-sub">AI Recommendation</p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 — VALUATION SNAPSHOT  (exactly 4 cards)
      ══════════════════════════════════════════════════════════ */}
      <section className="vr-snapshot" aria-label="Valuation Snapshot">
        {/* Card 1 */}
        <div className="vr-snap-card">
          <div className="vr-snap-header">
            <span className="vr-snap-label">Market Value</span>
            <DollarSign size={13} className="vr-snap-icon" />
          </div>
          <div className="vr-snap-body">
            <span className="vr-snap-val">{formatINR(countPrice)}</span>
            <svg viewBox="0 0 60 18" className="vr-sparkline" aria-hidden="true">
              <path d={drawSparkline([50,52,54,53,58,60,64])} fill="none" stroke="var(--vr-accent)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="vr-snap-trend vr-snap-trend--up">▲ 4.2% MoM</span>
        </div>

        {/* Card 2 */}
        <div className="vr-snap-card">
          <div className="vr-snap-header">
            <span className="vr-snap-label">Rental Yield</span>
            <Key size={13} className="vr-snap-icon" />
          </div>
          <div className="vr-snap-body">
            <span className="vr-snap-val">{countYield}%</span>
            <svg viewBox="0 0 60 18" className="vr-sparkline" aria-hidden="true">
              <path d={drawSparkline([30,31,33,32,34,36,38])} fill="none" stroke="var(--vr-accent)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="vr-snap-trend vr-snap-trend--up">▲ Stable</span>
        </div>

        {/* Card 3 */}
        <div className="vr-snap-card">
          <div className="vr-snap-header">
            <span className="vr-snap-label">Growth Forecast</span>
            <TrendingUp size={13} className="vr-snap-icon" />
          </div>
          <div className="vr-snap-body">
            <span className="vr-snap-val">+{countGrowth}%</span>
            <svg viewBox="0 0 60 18" className="vr-sparkline" aria-hidden="true">
              <path d={drawSparkline([40,42,45,48,52,55,58])} fill="none" stroke="var(--vr-accent)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="vr-snap-trend vr-snap-trend--up">▲ YoY Annualised</span>
        </div>

        {/* Card 4 */}
        <div className="vr-snap-card">
          <div className="vr-snap-header">
            <span className="vr-snap-label">Investment Score</span>
            <ShieldCheck size={13} className="vr-snap-icon" />
          </div>
          <div className="vr-snap-body">
            <span className="vr-snap-val">{countScore} <small>/100</small></span>
            <svg viewBox="0 0 60 18" className="vr-sparkline" aria-hidden="true">
              <path d={drawSparkline([70,72,75,78,80,82,84])} fill="none" stroke="var(--vr-accent)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="vr-snap-trend vr-snap-trend--up">▲ Top 12% City</span>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 3 — PROPERTY VISUALIZATION
      ══════════════════════════════════════════════════════════ */}
      <section className="vr-viz-card" aria-label="Property Visualization">
        {/* Tab bar */}
        <div className="vr-tab-bar">
          {[
            { id: "overview",  label: "Overview" },
            { id: "2d",        label: "2D Layout" },
            { id: "3d",        label: "3D Model" },
            { id: "interior",  label: "Interior" },
            { id: "location",  label: "Location" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`vr-tab-btn${vizTab === tab.id ? " active" : ""}`}
              onClick={() => setVizTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="vr-viz-body">

          {/* — Overview ——————————————————————————— */}
          {vizTab === "overview" && (
            <div className="vr-overview">
              <img
                src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80"
                alt="Property exterior"
                className="vr-overview-img"
              />
              <div className="vr-overview-info">
                <span className="vr-eyebrow">Institutional Brief</span>
                <p className="vr-overview-para">
                  This {safeBhk} BHK {typeLabel.toLowerCase()} spans {formatNumber(sqftArea)} sq ft of premium carpet area in {safePlace}, {safeCity}. Positioned in a high-demand growth corridor with superior infrastructure connectivity and low regional supply pipeline.
                </p>
                <div className="vr-overview-stats">
                  <div className="vr-overview-stat">
                    <span className="vr-stat-label">Appreciation Rank</span>
                    <strong className="vr-stat-val">Top 12%</strong>
                  </div>
                  <div className="vr-overview-stat">
                    <span className="vr-stat-label">Rental Grade</span>
                    <strong className="vr-stat-val">AAA</strong>
                  </div>
                  <div className="vr-overview-stat">
                    <span className="vr-stat-label">Price / sq ft</span>
                    <strong className="vr-stat-val">₹{Math.round(pricePerSqft).toLocaleString("en-IN")}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* — 2D Layout ——————————————————————————— */}
          {vizTab === "2d" && (
            <div className="vr-2d-viewport">
              <svg
                viewBox="0 0 500 340"
                style={{ width: "100%", height: "100%", transform: `scale(${zoomLevel})`, transformOrigin: "center" }}
                aria-label="2D floor plan"
              >
                <defs>
                  <pattern id="vr-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#vr-grid)" />
                <rect x="20" y="20" width="460" height="300" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" rx="2" />
                {/* Rooms */}
                <rect x="30" y="30" width="200" height="145" fill="rgba(20,184,166,0.04)" stroke="rgba(20,184,166,0.35)" strokeWidth="1" rx="2" />
                <text x="130" y="108" fill="var(--vr-text-sec)" fontSize="11" fontWeight="700" textAnchor="middle">Living Lounge</text>
                <rect x="248" y="30" width="222" height="145" fill="rgba(233,199,131,0.04)" stroke="rgba(233,199,131,0.35)" strokeWidth="1" rx="2" />
                <text x="359" y="108" fill="var(--vr-text-sec)" fontSize="11" fontWeight="700" textAnchor="middle">Master Suite</text>
                <rect x="30" y="193" width="135" height="117" fill="rgba(148,163,184,0.04)" stroke="rgba(148,163,184,0.25)" strokeWidth="1" rx="2" />
                <text x="97" y="255" fill="var(--vr-text-sec)" fontSize="11" fontWeight="700" textAnchor="middle">Kitchen</text>
                <rect x="183" y="193" width="145" height="117" fill="rgba(148,163,184,0.04)" stroke="rgba(148,163,184,0.25)" strokeWidth="1" rx="2" />
                <text x="255" y="255" fill="var(--vr-text-sec)" fontSize="11" fontWeight="700" textAnchor="middle">Study Room</text>
                <rect x="346" y="193" width="124" height="117" fill="rgba(20,184,166,0.04)" stroke="rgba(20,184,166,0.2)" strokeWidth="1" rx="2" />
                <text x="408" y="255" fill="var(--vr-text-sec)" fontSize="11" fontWeight="700" textAnchor="middle">Balcony</text>
                {/* Compass */}
                <text x="468" y="42" fill="var(--vr-accent)" fontSize="10" fontWeight="800">N</text>
                <line x1="471" y1="44" x2="471" y2="58" stroke="var(--vr-accent)" strokeWidth="1.5" />
              </svg>
              <div className="vr-2d-controls">
                <button className="vr-icon-btn" onClick={() => setZoomLevel((z) => Math.min(2, z + 0.15))} aria-label="Zoom in"><ZoomIn size={13} /></button>
                <button className="vr-icon-btn" onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))} aria-label="Zoom out"><ZoomOut size={13} /></button>
                <button className="vr-icon-btn" onClick={() => setZoomLevel(1)} aria-label="Reset zoom"><RefreshCw size={13} /></button>
              </div>
            </div>
          )}

          {/* — 3D Model ——————————————————————————— */}
          {vizTab === "3d" && (
            <div className="vr-canvas-3d">
              <Canvas camera={{ position: [5, 6, 8], fov: 35 }}>
                <color attach="background" args={["#030712"]} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} />
                <HolographicLayout bhk={result.bhk} />
                <OrbitControls enablePan enableRotate enableZoom />
              </Canvas>
              <div className="vr-3d-hint">Drag to rotate &nbsp;·&nbsp; Scroll to zoom</div>
            </div>
          )}

          {/* — Interior Gallery ———————————————————— */}
          {vizTab === "interior" && (
            <div className="vr-gallery">
              {[
                { name: "Living Room",    url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=500&q=80" },
                { name: "Kitchen",        url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=500&q=80" },
                { name: "Master Bedroom", url: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=500&q=80" },
              ].map((img, i) => (
                <div className="vr-gallery-item" key={i}>
                  <img src={img.url} alt={img.name} />
                  <div className="vr-gallery-label">{img.name}</div>
                </div>
              ))}
            </div>
          )}

          {/* — Location Map ———————————————————————— */}
          {vizTab === "location" && (
            <div className="vr-location">
              {/* Decorative map surface */}
              <div className="vr-map-render">
                <svg viewBox="0 0 500 320" width="100%" height="100%" fill="none" aria-hidden="true">
                  {/* Road lines */}
                  <path d="M 0 160 Q 150 100 300 160 T 500 150" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                  <path d="M 0 220 Q 200 200 500 230"            stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
                  <path d="M 150 0 L 200 320"                    stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                  <path d="M 340 0 L 360 320"                    stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
                  {/* Green zones */}
                  <ellipse cx="80"  cy="80"  rx="40" ry="30" fill="rgba(20,184,166,0.05)" />
                  <ellipse cx="420" cy="260" rx="50" ry="30" fill="rgba(20,184,166,0.05)" />
                  {/* Property pin */}
                  <circle cx="258" cy="155" r="14" fill="rgba(20,184,166,0.15)" stroke="var(--vr-accent)" strokeWidth="1.5" />
                  <circle cx="258" cy="155" r="5"  fill="var(--vr-accent)" />
                  <circle cx="258" cy="155" r="20" fill="none" stroke="var(--vr-accent)" strokeWidth="0.5" opacity="0.4">
                    <animate attributeName="r" values="14;28;14" dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" />
                  </circle>
                  {/* POI dots */}
                  <circle cx="130" cy="120" r="4" fill="rgba(233,199,131,0.7)" />
                  <circle cx="380" cy="100" r="4" fill="rgba(148,163,184,0.6)" />
                  <circle cx="310" cy="240" r="4" fill="rgba(148,163,184,0.6)" />
                </svg>
              </div>

              {/* POI list */}
              <div className="vr-poi-list">
                <span className="vr-eyebrow" style={{ marginBottom: 10 }}>Nearby Infrastructure</span>
                {amenitiesList.slice(0, 5).map((poi, idx) => (
                  <div
                    key={idx}
                    className={`vr-poi-item${activePOIIndex === idx ? " active" : ""}`}
                    onMouseEnter={() => setActivePOIIndex(idx)}
                    onMouseLeave={() => setActivePOIIndex(null)}
                  >
                    <div className="vr-poi-left">
                      <MapPin size={11} className="vr-poi-icon" />
                      <div>
                        <div className="vr-poi-name">{poi.name}</div>
                        <div className="vr-poi-dist">{poi.distance}</div>
                      </div>
                    </div>
                    <span className="vr-poi-time">{poi.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 4 — AI INVESTMENT ANALYSIS
      ══════════════════════════════════════════════════════════ */}
      <section className="vr-analysis" aria-label="AI Investment Analysis">
        {/* Left — AI summary */}
        <div className="vr-analysis-left">
          <span className="vr-eyebrow">
            <Sparkles size={11} style={{ marginRight: 5, verticalAlign: "middle" }} />
            AI Executive Thesis
          </span>
          <p className="vr-analysis-para">
            This {typeLabel.toLowerCase()} is located in one of {safeCity}'s strongest growth corridors.
            Demand remains high, rental absorption is stable, and future appreciation
            is expected to outperform the city average by +{Math.max(1, (profile.growth - 7).toFixed(1))}%.
          </p>
          <div className="vr-analysis-meta">
            <div>
              <span className="vr-stat-label">City Profile</span>
              <strong className="vr-stat-val">{safeCity}</strong>
            </div>
            <div>
              <span className="vr-stat-label">Risk Rating</span>
              <strong className="vr-stat-val">{profile.risk}</strong>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="vr-analysis-divider" />

        {/* Right — factor bars */}
        <div className="vr-analysis-right">
          <span className="vr-eyebrow">
            <BarChart2 size={11} style={{ marginRight: 5, verticalAlign: "middle" }} />
            Factor Analysis
          </span>
          <div className="vr-bars">
            {analysisBars.map((item, i) => (
              <div className="vr-factor-row" key={item.label}>
                <div className="vr-factor-meta">
                  <span>{item.label}</span>
                  <span className="vr-factor-val">{item.val}%</span>
                </div>
                <AnimatedBar value={item.val} delay={i * 80} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 5 — FORECAST & COMPARISON
      ══════════════════════════════════════════════════════════ */}
      <section className="vr-forecast-card" aria-label="Forecast and Comparison">
        {/* Tab bar */}
        <div className="vr-tab-bar">
          {[
            { id: "forecast",   label: "Forecast" },
            { id: "comparison", label: "Comparison" },
            { id: "location",   label: "Location Intel" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`vr-tab-btn${analysisTab === tab.id ? " active" : ""}`}
              onClick={() => setAnalysisTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* — Forecast ——————————————————————————————— */}
        {analysisTab === "forecast" && (
          <div className="vr-forecast-content">
            <div className="vr-forecast-header">
              <span className="vr-eyebrow">Valuation Projection</span>
              <div className="vr-horizon-btns">
                {[{ label: "1 Yr", val: 1 }, { label: "3 Yr", val: 3 }, { label: "5 Yr", val: 5 }, { label: "10 Yr", val: 10 }].map((h) => (
                  <button
                    key={h.val}
                    className={`vr-horizon-btn${forecastRange === h.val ? " active" : ""}`}
                    onClick={() => setForecastRange(h.val)}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            <svg
              viewBox="0 0 600 200"
              className="vr-forecast-svg"
              onMouseLeave={() => setHoveredForecastIndex(null)}
              aria-label="Forecast chart"
            >
              {/* Grid lines */}
              {[40, 80, 120, 160].map((y) => (
                <line key={y} x1="50" y1={y} x2="570" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              ))}

              {(() => {
                const subData = forecastData.slice(0, forecastRange + 1);
                const count   = subData.length;
                const maxVal  = Math.max(...subData.map((d) => d.bull)) * 1.05;
                const minVal  = Math.min(...subData.map((d) => d.bear)) * 0.95;
                const diff    = maxVal - minVal || 1;

                const coords = (key) =>
                  subData.map((d, i) => ({
                    x: 50 + (i / Math.max(count - 1, 1)) * 520,
                    y: 165 - ((d[key] - minVal) / diff) * 130,
                    d,
                    index: i,
                  }));

                const bullC = coords("bull");
                const baseC = coords("base");
                const bearC = coords("bear");
                const bullPath = `M ${bullC.map((c) => `${c.x},${c.y}`).join(" L ")}`;
                const basePath = `M ${baseC.map((c) => `${c.x},${c.y}`).join(" L ")}`;
                const bearPath = `M ${bearC.map((c) => `${c.x},${c.y}`).join(" L ")}`;

                return (
                  <>
                    {/* Area fill under base line */}
                    <path
                      d={`${basePath} L ${baseC[baseC.length - 1].x},175 L ${baseC[0].x},175 Z`}
                      fill="url(#vr-base-gradient)"
                      opacity="0.18"
                    />
                    <defs>
                      <linearGradient id="vr-base-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--vr-accent)" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="var(--vr-accent)" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    <path d={bullPath} fill="none" stroke="rgba(148,163,184,0.4)" strokeWidth="1.5" strokeDasharray="4,3" />
                    <path d={basePath} fill="none" stroke="var(--vr-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={bearPath} fill="none" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="5,3" opacity="0.6" />

                    {/* Hover hit areas */}
                    {baseC.map((c, idx) => (
                      <rect
                        key={idx}
                        x={c.x - 18}
                        y="10"
                        width="36"
                        height="180"
                        fill="transparent"
                        style={{ cursor: "crosshair" }}
                        onMouseEnter={() => setHoveredForecastIndex(idx)}
                      />
                    ))}

                    {/* Hover crosshair */}
                    {hoveredForecastIndex !== null && (
                      <>
                        <line
                          x1={baseC[hoveredForecastIndex].x}
                          y1="15"
                          x2={baseC[hoveredForecastIndex].x}
                          y2="168"
                          stroke="rgba(20,184,166,0.3)"
                          strokeDasharray="3,3"
                          strokeWidth="1"
                        />
                        <circle cx={baseC[hoveredForecastIndex].x} cy={baseC[hoveredForecastIndex].y} r="4" fill="var(--vr-accent)" />
                      </>
                    )}

                    {/* Year labels */}
                    {subData.map((d, idx) => {
                      const showLabel = forecastRange <= 5 || idx % 2 === 0 || idx === forecastRange;
                      if (!showLabel) return null;
                      return (
                        <text key={idx} x={50 + (idx / Math.max(count - 1, 1)) * 520} y="190" fill="var(--vr-text-sec)" fontSize="9" fontWeight="700" textAnchor="middle">
                          {d.year}
                        </text>
                      );
                    })}

                    {/* Tooltip */}
                    {hoveredForecastIndex !== null && (() => {
                      const fx = baseC[hoveredForecastIndex].x;
                      const tooltipX = fx > 390 ? fx - 175 : fx + 14;
                      const sd = subData[hoveredForecastIndex];
                      return (
                        <foreignObject x={tooltipX} y="18" width="165" height="115">
                          <div className="vr-forecast-tooltip">
                            <span className="vr-tooltip-year">{sd.year}</span>
                            <div className="vr-tooltip-row"><span style={{ color: "var(--vr-text-sec)" }}>Bull</span><strong>{formatINR(sd.bull)}</strong></div>
                            <div className="vr-tooltip-row"><span style={{ color: "var(--vr-accent)" }}>Base</span><strong>{formatINR(sd.base)}</strong></div>
                            <div className="vr-tooltip-row"><span style={{ color: "#EF4444" }}>Bear</span><strong>{formatINR(sd.bear)}</strong></div>
                          </div>
                        </foreignObject>
                      );
                    })()}
                  </>
                );
              })()}
            </svg>

            {/* Legend */}
            <div className="vr-forecast-legend">
              <span className="vr-legend-item"><span className="vr-legend-line vr-legend-line--base" />Base Case</span>
              <span className="vr-legend-item"><span className="vr-legend-line vr-legend-line--bull" />Bull Case</span>
              <span className="vr-legend-item"><span className="vr-legend-line vr-legend-line--bear" />Bear Case</span>
            </div>
          </div>
        )}

        {/* — Comparison ————————————————————————————— */}
        {analysisTab === "comparison" && (
          <div className="vr-comparison">
            {/* Subject property header */}
            <div className="vr-cmp-subject">
              <span className="vr-eyebrow">Subject Property</span>
              <div className="vr-cmp-subject-row">
                <span className="vr-cmp-prop-name">{safePlace}</span>
                <span className="vr-cmp-highlight">{formatINR(totalPrice)}</span>
              </div>
            </div>

            <div className="vr-cmp-table">
              {/* Header */}
              <div className="vr-cmp-thead">
                <span>Property</span>
                <span>Valuation</span>
                <span>Price / sq ft</span>
                <span>Yield</span>
                <span>vs Subject</span>
              </div>
              {/* Rows */}
              {comparisons.map((item, idx) => {
                const diff = ((item.price - totalPrice) / totalPrice) * 100;
                return (
                  <div className="vr-cmp-row" key={idx}>
                    <span className="vr-cmp-name">{item.name}</span>
                    <span>{formatINR(item.price)}</span>
                    <span>₹{Math.round(item.priceSqft).toLocaleString("en-IN")}</span>
                    <span>{item.yield}%</span>
                    <span className={diff > 0 ? "vr-cmp-higher" : "vr-cmp-lower"}>
                      {diff > 0 ? "+" : ""}{diff.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* — Location Intel ————————————————————————— */}
        {analysisTab === "location" && (
          <div className="vr-loc-intel">
            <span className="vr-eyebrow">Location Intelligence</span>
            <div className="vr-loc-table">
              {[
                { label: "Metro Station",    value: "0.8 km",  time: "10 mins", impact: "+12% Valuation" },
                { label: "Int'l Airport",    value: "32 km",   time: "55 mins", impact: "+2% Valuation" },
                { label: "IT Hub / Park",    value: "3.5 km",  time: "15 mins", impact: "+15% Valuation" },
                { label: "Premium School",   value: "1.2 km",  time: "5 mins",  impact: "+4% Valuation" },
                { label: "Super-specialty Hospital", value: "2.4 km", time: "12 mins", impact: "+6% Valuation" },
              ].map((poi, idx) => (
                <div className="vr-loc-row" key={idx}>
                  <div className="vr-loc-icon-wrap">
                    <Layers size={12} className="vr-loc-icon" />
                  </div>
                  <span className="vr-loc-label">{poi.label}</span>
                  <span className="vr-loc-dist">{poi.value}</span>
                  <span className="vr-loc-time">{poi.time}</span>
                  <span className="vr-loc-impact">{poi.impact}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════
          FLOATING AI COPILOT
      ══════════════════════════════════════════════════════════ */}
      <button
        className={`vr-copilot-fab${copilotOpen ? " vr-copilot-fab--open" : ""}`}
        onClick={() => setCopilotOpen(!copilotOpen)}
        aria-label="Toggle AI Copilot"
      >
        {copilotOpen ? <X size={20} /> : <Bot size={20} />}
      </button>

      {copilotOpen && (
        <div className="vr-copilot-panel">
          <div className="vr-copilot-header">
            <div className="vr-copilot-title">
              <span className="vr-copilot-dot" />
              <span>Portfolio Co-advisor</span>
            </div>
            <button className="vr-copilot-close-btn" onClick={() => setCopilotOpen(false)}>
              <X size={14} />
            </button>
          </div>

          <div className="vr-copilot-body" ref={chatBodyRef}>
            {copilotMessages.map((msg, i) => (
              <div className={`vr-bubble vr-bubble--${msg.sender}`} key={i}>
                {msg.text}
              </div>
            ))}
          </div>

          <div className="vr-copilot-prompts">
            {[
              "Why is this property expensive?",
              "Should I invest here?",
              "Compare with HSR Layout",
              "Future appreciation forecast",
              "Rental potential",
            ].map((p, idx) => (
              <button
                key={idx}
                className="vr-prompt-btn"
                onClick={() => handleSendCopilot(p)}
              >
                <ChevronRight size={10} style={{ flexShrink: 0 }} />
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default ValuationResults;
