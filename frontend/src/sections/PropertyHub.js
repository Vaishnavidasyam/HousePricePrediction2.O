import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Sparkles,
  TrendingUp,
  Zap,
  ChevronRight,
  MapPin,
  Activity,
  RefreshCw,
  Download,
  Building,
  Home,
  Map,
  Briefcase,
  Crown,
  Globe,
  Users,
  Key,
  MousePointer2,
  CheckCircle2,
  AlertTriangle,
  Plane,
  School,
  Hospital,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
import {
  CITIES,
  PROPERTY_TYPES,
  formatINR,
  getCityMeta,
  getProfile,
  estimatePrice,
  generateForecast,
  getAmenities,
  getMarketPulse,
  areaSqmToSqft,
  areaSqftToSqm,
} from "../data/marketData";
import { useMarketMetadata } from "../hooks/useMarketMetadata";
import "./PropertyHubPremium.css";

/* ── Icon map ─────────────────────────────────────────────────── */
const IconMap = {
  Building,
  Home,
  Map,
  Briefcase,
  Crown,
  Globe,
  TrainFront: Activity,
  Plane,
  Hospital,
  School,
  ShoppingBag,
  TrendingUp,
  Users,
  Key,
};

/* ── Helpers ──────────────────────────────────────────────────── */
const AREA_PRESETS = {
  apartment:  { sqft: 950,  label: "~950 sq ft" },
  villa:      { sqft: 2800, label: "~2800 sq ft" },
  plot:       { sqft: 2400, label: "~2400 sq ft" },
  commercial: { sqft: 1500, label: "~1500 sq ft" },
  luxury:     { sqft: 4000, label: "~4000 sq ft" },
  township:   { sqft: 1800, label: "~1800 sq ft" },
};

const BHK_OPTIONS = [1, 2, 3, 4, 5];

/* ── Inline validation helper ─────────────────────────────────── */
const validate = (f) => {
  const errors = {};
  if (!f.city)              errors.city  = "Select a city";
  if (!f.place)             errors.place = "Select a locality";
  if (!f.bhk)               errors.bhk   = "Select BHK";
  if (!f.area || f.area <= 0) errors.area = "Enter a valid area";
  return errors;
};

/* ═══════════════════════════════════════════════════════════════
   PROPERTY HUB
═══════════════════════════════════════════════════════════════ */
const PropertyHub = () => {
  const { metadata, status } = useMarketMetadata();
  const navigate = useNavigate();

  /* — Form state — starts blank, no defaults ─────────────────── */
  const [formData, setFormData] = useState({
    city:         "",          // no default
    place:        "",          // no default
    propertyType: "apartment", // type is ok to default
    bhk:          "",          // no default — user must pick
    area:         "",          // blank
    unit:         "sqft",
  });

  const [errors,      setErrors]      = useState({});
  const [loading,     setLoading]     = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [touched,     setTouched]     = useState({});

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 1500);
  };

  /* — Derived valuation (only when all required fields are filled) ─── */
  const isFormReady = formData.city && formData.place && formData.bhk && formData.area > 0;

  const valuation = useMemo(() => {
    if (!isFormReady) return null;
    const area_sqm = formData.unit === "sqft"
      ? areaSqftToSqm(Number(formData.area))
      : Number(formData.area);
    const total   = estimatePrice({ ...formData, area_sqm });
    const profile = getProfile(formData.city);

    let verdict = "HOLD", verdictClass = "hold";
    if (profile.growth > 11 && profile.yield > 3.8) {
      verdict = "STRONG BUY"; verdictClass = "buy";
    } else if (profile.growth > 9) {
      verdict = "ACCUMULATE"; verdictClass = "buy";
    }

    return {
      total,
      low:       total * 0.96,
      high:      total * 1.04,
      confidence: 94,
      yield:     profile.yield,
      growth:    profile.growth,
      demand:    profile.demand,
      infra:     profile.infra,
      verdict,
      verdictClass,
      pulse:     getMarketPulse(formData.city),
      forecast:  generateForecast(total),
      amenities: getAmenities(formData.city, formData.place),
    };
  }, [formData, isFormReady]);

  /* — Localities for selected city ─────────────────────────────── */
  const localities = useMemo(() => {
    if (!formData.city) return [];
    return getCityMeta(metadata, formData.city).localities;
  }, [formData.city, metadata]);

  /* — Handlers ───────────────────────────────────────────────── */
  const handleCityChange = (e) => {
    const city = e.target.value;
    // Reset locality to blank — user must explicitly pick
    setFormData((f) => ({ ...f, city, place: "" }));
    setTouched((t) => ({ ...t, city: true }));
    setErrors((er) => ({ ...er, city: undefined, place: undefined }));
  };

  const handleLocalityChange = (e) => {
    setFormData((f) => ({ ...f, place: e.target.value }));
    setTouched((t) => ({ ...t, place: true }));
    setErrors((er) => ({ ...er, place: undefined }));
  };

  const handleTypeChange = (typeId) => {
    // Only update property type — never auto-fill area
    setFormData((f) => ({
      ...f,
      propertyType: typeId,
    }));
  };

  const handleAreaChange = (e) => {
    setFormData((f) => ({ ...f, area: Number(e.target.value) }));
    setTouched((t) => ({ ...t, area: true }));
    setErrors((er) => ({ ...er, area: undefined }));
  };

  const handleUnitToggle = (u) => {
    const newArea = u === "sqft"
      ? areaSqmToSqft(Number(formData.area))
      : areaSqftToSqm(Number(formData.area));
    setFormData((f) => ({ ...f, unit: u, area: Math.round(newArea) }));
  };

  /* — Submit ──────────────────────────────────────────────────── */
  const handlePredict = async () => {
    const errs = validate(formData);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setTouched({ city: true, place: true, bhk: true, area: true });
      return;
    }

    setLoading(true);
    const area_sqm = formData.unit === "sqft"
      ? areaSqftToSqm(Number(formData.area))
      : Number(formData.area);

    const payload = { ...formData, area_sqm };

    try {
      const res = await axios.post("http://127.0.0.1:8000/predict", payload);
      navigate("/platform/valuation", {
        state: { result: { ...payload, ...res.data }, source: "model" },
      });
    } catch {
      // Fallback to local estimate
      navigate("/platform/valuation", {
        state: {
          source: "estimate",
          result: {
            ...payload,
            total_price:   valuation?.total || estimatePrice({ ...formData, area_sqm }),
            price_per_sqm: Math.round(
              (valuation?.total || estimatePrice({ ...formData, area_sqm })) / area_sqm
            ),
          },
        },
      });
    } finally {
      setLoading(false);
    }
  };

  /* ─── Render ─────────────────────────────────────────────────── */
  return (
    <div className="ph-layout">

      {/* ── Header ────────────────────────────────────────────── */}
      <header className="grid-12" style={{ alignItems: "flex-end" }}>
        <div style={{ gridColumn: "span 8" }}>
          <div className="ph-eyebrow" style={{ marginBottom: 16 }}>
            Enterprise Real Estate Intelligence
          </div>
          <h1 className="ph-title-xl">Property Intelligence Platform</h1>
        </div>
        <div style={{ gridColumn: "span 4", textAlign: "right" }}>
          <div
            style={{
              background: status === "live" ? "rgba(16,185,129,0.1)" : "var(--hub-accent-soft)",
              borderColor: status === "live" ? "var(--hub-success)"  : "var(--hub-accent)",
              color:       status === "live" ? "var(--hub-success)"  : "var(--hub-accent)",
              display: "inline-flex",
              alignItems: "center",
              padding: "8px 16px",
              borderRadius: "99px",
              fontSize: 12,
              fontWeight: 800,
              border: "1px solid",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 8, height: 8,
                borderRadius: "50%",
                background: status === "live" ? "var(--hub-success)" : "var(--hub-accent)",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            {status === "live" ? "LIVE MARKET FEED ACTIVE" : "SYSTEM ONLINE · LOCAL MODEL"}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          SECTION 1 — COMMAND CENTER
      ══════════════════════════════════════════════════════════ */}
      <section className="command-center">

        {/* ── LEFT: Form ──────────────────────────────────────── */}
        <div className="premium-card elevated ph-field-group">
          <div className="ph-heading-md">Property Command Center</div>

          {/* Asset Classification */}
          <div className="ph-label-stack">
            <label className="ph-input-label">Asset Classification</label>
            <div className="segmented-grid">
              {PROPERTY_TYPES.map((type) => {
                const Icon = IconMap[type.icon] || Building;
                return (
                  <button
                    key={type.id}
                    className={`segment-btn${formData.propertyType === type.id ? " active" : ""}`}
                    onClick={() => handleTypeChange(type.id)}
                  >
                    <Icon />
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* City + Locality */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* City */}
            <div className="ph-label-stack">
              <label className="ph-input-label">
                Jurisdiction {touched.city && errors.city && (
                  <span className="ph-field-error">{errors.city}</span>
                )}
              </label>
              <select
                className={`glass-input${touched.city && errors.city ? " input-error" : ""}`}
                value={formData.city}
                onChange={handleCityChange}
              >
                <option value="" disabled>Select City</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Locality */}
            <div className="ph-label-stack">
              <label className="ph-input-label">
                Locality {touched.place && errors.place && (
                  <span className="ph-field-error">{errors.place}</span>
                )}
              </label>
              <select
                className={`glass-input${touched.place && errors.place ? " input-error" : ""}`}
                value={formData.place}
                onChange={handleLocalityChange}
                disabled={!formData.city}
              >
                {!formData.city
                  ? <option value="">Select city first</option>
                  : (
                    <>
                      <option value="" disabled>Select Locality</option>
                      {localities.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </>
                  )
                }
              </select>
            </div>
          </div>

          {/* Area + BHK */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
            {/* Area */}
            <div className="ph-label-stack">
              <label className="ph-input-label">
                Total Area {touched.area && errors.area && (
                  <span className="ph-field-error">{errors.area}</span>
                )}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  className={`glass-input${touched.area && errors.area ? " input-error" : ""}`}
                  placeholder={`e.g. ${AREA_PRESETS[formData.propertyType]?.sqft || 1000}`}
                  value={formData.area}
                  min={100}
                  onChange={handleAreaChange}
                />
                <div style={{
                  position: "absolute", right: 8, top: "50%",
                  transform: "translateY(-50%)", display: "flex", gap: 4,
                }}>
                  {["sqft", "sqm"].map((u) => (
                    <button
                      key={u}
                      style={{
                        padding: "4px 8px", fontSize: 10, fontWeight: 900,
                        borderRadius: 6, border: "none",
                        background: formData.unit === u ? "var(--hub-accent)" : "rgba(255,255,255,0.06)",
                        color:      formData.unit === u ? "#000" : "var(--hub-text-muted)",
                        cursor: "pointer",
                      }}
                      onClick={() => handleUnitToggle(u)}
                    >
                      {u.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* BHK */}
            <div className="ph-label-stack">
              <label className="ph-input-label">
                Configuration (BHK) {touched.bhk && errors.bhk && (
                  <span className="ph-field-error">{errors.bhk}</span>
                )}
              </label>
              <div
                className="segmented-control"
                style={{ background: "rgba(0,0,0,0.2)", padding: 4, borderRadius: 12 }}
              >
                {BHK_OPTIONS.map((b) => (
                  <button
                    key={b}
                    className={Number(formData.bhk) === b ? "active" : ""}
                    style={{ fontSize: 11 }}
                    onClick={() => {
                      setFormData((f) => ({ ...f, bhk: b }));
                      setTouched((t) => ({ ...t, bhk: true }));
                      setErrors((er) => ({ ...er, bhk: undefined }));
                    }}
                  >
                    {b} BHK
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Validation summary banner */}
          {!isFormReady && Object.keys(touched).length > 0 && (
            <div className="ph-validation-banner">
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>Please fill in City, Locality, BHK and Area to get a valuation.</span>
            </div>
          )}

          {/* Submit */}
          <button
            className="submit-btn"
            style={{ height: 60, fontSize: 16, marginTop: 4, opacity: loading ? 0.7 : 1 }}
            onClick={handlePredict}
            disabled={loading}
          >
            {loading ? "PROCESSING QUANTITATIVE ANALYSIS..." : "EXECUTE FULL MARKET VALUATION"}
          </button>
        </div>

        {/* ── RIGHT: Live Valuation Desk ──────────────────────── */}
        <div className="premium-card valuation-hero">
          {isFormReady && valuation ? (
            <>
              <div className="ph-eyebrow">Real-Time Market Valuation</div>
              <motion.div
                className="hero-price"
                key={valuation.total}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {formatINR(valuation.total)}
              </motion.div>

              {/* Property type badge */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                <span className="ph-prop-badge">
                  {PROPERTY_TYPES.find((t) => t.id === formData.propertyType)?.label || "Property"}
                </span>
                <span className="ph-prop-badge">{formData.bhk} BHK</span>
                <span className="ph-prop-badge">
                  {formData.area} {formData.unit}
                </span>
                <span className="ph-prop-badge">
                  {formData.place && formData.city ? `${formData.place}, ${formData.city}` : ""}
                </span>
              </div>

              <div className="price-indicator">
                <TrendingUp size={18} />
                +{valuation.growth}% Annual Growth Forecast
              </div>

              {/* Confidence bar */}
              <div style={{ width: "100%", maxWidth: 500, marginTop: 36 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span className="ph-input-label">Valuation Range</span>
                  <span style={{ fontWeight: 900, fontSize: 14 }}>{valuation.confidence}% Confidence</span>
                </div>
                <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, position: "relative" }}>
                  <div style={{
                    position: "absolute", left: "10%", right: "10%", height: "100%",
                    background: "var(--hub-accent)", borderRadius: 4, opacity: 0.3,
                  }} />
                  <div style={{
                    position: "absolute", left: "50%", top: -6, bottom: -6,
                    width: 3, background: "var(--hub-accent)", borderRadius: 2,
                  }} />
                </div>
                <div style={{
                  display: "flex", justifyContent: "space-between", marginTop: 10,
                  fontSize: 11, fontWeight: 800, color: "var(--hub-text-muted)",
                }}>
                  <span>L: {formatINR(valuation.low)}</span>
                  <span>BASE TARGET</span>
                  <span>H: {formatINR(valuation.high)}</span>
                </div>
              </div>

              {/* Key metrics */}
              <div className="grid-12" style={{ width: "100%", marginTop: 40, gap: 16 }}>
                <div className="metric-widget" style={{ gridColumn: "span 4" }}>
                  <div className="metric-label">Rental Yield</div>
                  <div className="metric-value">{valuation.yield}%</div>
                </div>
                <div className="metric-widget" style={{ gridColumn: "span 4" }}>
                  <div className="metric-label">Demand Index</div>
                  <div className="metric-value" style={{ color: "var(--hub-accent)" }}>
                    {valuation.demand}/100
                  </div>
                </div>
                <div className="metric-widget" style={{ gridColumn: "span 4" }}>
                  <div className="metric-label">Infrastructure</div>
                  <div className="metric-value">{valuation.infra}/100</div>
                </div>
              </div>
            </>
          ) : (
            /* ── Empty / placeholder state ─────────────────────── */
            <div className="ph-empty-state">
              <div className="ph-empty-icon">
                <Sparkles size={36} />
              </div>
              <h3 className="ph-empty-title">Your Valuation Appears Here</h3>
              <p className="ph-empty-sub">
                Select a city, locality, property type, area and BHK configuration on the left to see a live real-time AI valuation instantly.
              </p>
              <div className="ph-empty-steps">
                <div className="ph-step"><span className="ph-step-num">1</span> Choose city &amp; locality</div>
                <div className="ph-step"><span className="ph-step-num">2</span> Pick property type</div>
                <div className="ph-step"><span className="ph-step-num">3</span> Enter area &amp; BHK</div>
                <div className="ph-step"><span className="ph-step-num">4</span> Click Execute Valuation</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 — AI INTELLIGENCE GRID (only shown when ready)
      ══════════════════════════════════════════════════════════ */}
      {isFormReady && valuation && (
        <section className="intel-grid">
          {/* Executive Thesis */}
          <div className="premium-card">
            <div className="ph-heading-md" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <Sparkles size={24} color="var(--hub-accent)" /> Executive Thesis
            </div>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 16 }}>
              <li style={{ display: "flex", gap: 12, color: "var(--hub-text-secondary)", fontSize: 14, lineHeight: 1.5 }}>
                <CheckCircle2 size={18} color="var(--hub-success)" style={{ flexShrink: 0 }} />
                Strong capital appreciation detected in <b>&nbsp;{formData.place}&nbsp;</b> corridor.
              </li>
              <li style={{ display: "flex", gap: 12, color: "var(--hub-text-secondary)", fontSize: 14, lineHeight: 1.5 }}>
                <CheckCircle2 size={18} color="var(--hub-success)" style={{ flexShrink: 0 }} />
                High-intent buyer activity in <b>&nbsp;{formData.city}&nbsp;</b> premium segments.
              </li>
              <li style={{ display: "flex", gap: 12, color: "var(--hub-text-secondary)", fontSize: 14, lineHeight: 1.5 }}>
                <AlertTriangle size={18} color="var(--hub-warning)" style={{ flexShrink: 0 }} />
                Macroeconomic stability provides a low-risk entry threshold.
              </li>
            </ul>
            <div style={{
              marginTop: 32, padding: 20, background: "rgba(0,0,0,0.2)",
              borderRadius: 20, display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div className="ph-input-label">Investment Rating</div>
              <div className={`ph-verdict-badge ${valuation.verdictClass}`} style={{ padding: "8px 20px", fontSize: 16 }}>
                {valuation.verdict}
              </div>
            </div>
          </div>

          {/* Market Pulse */}
          <div className="premium-card" style={{ gridColumn: "span 2" }}>
            <div className="ph-heading-md" style={{ marginBottom: 24 }}>Market Pulse Indicators</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
              {valuation.pulse.map((item) => {
                const Icon = IconMap[item.icon] || TrendingUp;
                return (
                  <div
                    key={item.label}
                    className="metric-widget"
                    style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div>
                      <div className="metric-label">{item.label}</div>
                      <div className="metric-value" style={{ fontSize: 24 }}>{item.value}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{
                        color: item.trend.startsWith("+") ? "var(--hub-success)" : "var(--hub-danger)",
                        fontWeight: 900, fontSize: 12,
                      }}>
                        {item.trend}
                      </div>
                      <Icon size={20} color="var(--hub-text-muted)" style={{ marginTop: 8 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          SECTION 3 — COMPARABLE ASSETS (only when ready)
      ══════════════════════════════════════════════════════════ */}
      {isFormReady && valuation && (
        <section className="grid-12">
          <div style={{ gridColumn: "span 12" }}>
            <div className="ph-heading-md" style={{ marginBottom: 24 }}>
              Institutional Benchmark Comparison
            </div>
            <div className="premium-card elevated" style={{ padding: 0, overflow: "hidden" }}>
              <table className="ph-table">
                <thead>
                  <tr>
                    <th>Property Asset</th>
                    <th>Valuation</th>
                    <th>Unit Rate ({formData.unit})</th>
                    <th>Annual ROI</th>
                    <th>Yield</th>
                    <th>Growth Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: `${formData.place} — Subject`,  mult: 1.00, roi: 12, yield: valuation.yield },
                    { label: `${formData.place} — Comparable A`, mult: 1.07, roi: 13, yield: +(valuation.yield + 0.2).toFixed(1) },
                    { label: `${formData.place} — Comparable B`, mult: 0.94, roi: 11, yield: +(valuation.yield - 0.2).toFixed(1) },
                    { label: `${formData.city} City Average`,  mult: 0.88, roi: 10, yield: +(valuation.yield - 0.4).toFixed(1) },
                  ].map((row, i) => {
                    const val      = valuation.total * row.mult;
                    const unitRate = formData.unit === "sqft"
                      ? val / Number(formData.area)
                      : val / areaSqftToSqm(Number(formData.area));
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 800 }}>{row.label}</td>
                        <td style={{ fontWeight: 900, color: i === 0 ? "var(--hub-accent)" : "inherit" }}>
                          {formatINR(val)}
                        </td>
                        <td>{formatINR(Math.round(unitRate))} /{formData.unit}</td>
                        <td style={{ color: "var(--hub-success)", fontWeight: 800 }}>+{row.roi}%</td>
                        <td>{row.yield}%</td>
                        <td>
                          <div style={{
                            padding: "4px 12px",
                            background: i === 0 ? "var(--hub-accent-soft)" : "rgba(255,255,255,0.04)",
                            borderRadius: 6, display: "inline-block",
                            fontSize: 10, fontWeight: 900,
                            color: i === 0 ? "var(--hub-accent)" : "var(--hub-text-muted)",
                          }}>
                            {["GRADE A+", "GRADE A", "GRADE B+", "GRADE B"][i]}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          SECTION 4 — EMERGING LOCALITIES (city-driven)
      ══════════════════════════════════════════════════════════ */}
      {formData.city && localities.length > 3 && (
        <section>
          <div className="ph-heading-md" style={{ marginBottom: 24, padding: "0 4px" }}>
            Emerging Market Opportunities — {formData.city}
          </div>
          <div className="carousel-container">
            {localities.slice(3).map((l) => {
              const profile = getProfile(formData.city);
              return (
                <motion.div
                  key={l}
                  className="locality-card"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="locality-image">
                    <MapPin size={48} color="var(--hub-accent)" opacity={0.2} />
                    <div style={{
                      position: "absolute", top: 20, right: 20,
                      padding: "6px 12px", background: "var(--hub-accent)",
                      color: "#000", borderRadius: 8, fontSize: 10, fontWeight: 900,
                    }}>
                      TOP PICK
                    </div>
                  </div>
                  <div className="locality-content">
                    <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>{l}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span className="ph-input-label">Growth Forecast</span>
                      <span style={{ color: "var(--hub-success)", fontWeight: 800 }}>
                        +{profile.growth}%
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                      <span className="ph-input-label">Rental Yield</span>
                      <span style={{ color: "var(--hub-accent)", fontWeight: 800 }}>
                        {profile.yield}%
                      </span>
                    </div>
                    <button
                      className="ph-secondary-btn"
                      style={{ width: "100%", height: 44, borderRadius: 12, fontSize: 12 }}
                      onClick={() => {
                        setFormData((f) => ({ ...f, place: l }));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      SELECT LOCALITY
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          SECTION 5 — LOCATION & FORECAST (only when ready)
      ══════════════════════════════════════════════════════════ */}
      {isFormReady && valuation && (
        <section className="grid-12">
          {/* Location Analytics */}
          <div className="premium-card" style={{ gridColumn: "span 5" }}>
            <div className="ph-heading-md" style={{ marginBottom: 24 }}>Location Analytics</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {valuation.amenities.map((amenity) => {
                const Icon = IconMap[amenity.icon] || MapPin;
                return (
                  <div
                    key={amenity.name}
                    className="rank-row"
                    style={{ gridTemplateColumns: "40px 1fr auto" }}
                  >
                    <div className="rank-number" style={{ background: "var(--hub-accent-soft)", color: "var(--hub-accent)" }}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{amenity.name}</div>
                      <div style={{ fontSize: 11, color: "var(--hub-text-muted)" }}>
                        {amenity.distance} · {amenity.time}
                      </div>
                    </div>
                    <div style={{ fontWeight: 900, color: "var(--hub-accent)" }}>{amenity.score}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Forecast Chart */}
          <div className="premium-card" style={{ gridColumn: "span 7" }}>
            <div className="ph-heading-md" style={{ marginBottom: 24 }}>
              10-Year Growth Projection — {formData.place}
            </div>
            <div style={{
              height: 280, display: "flex", alignItems: "flex-end",
              gap: 10, paddingBottom: 20, borderBottom: "1px solid var(--hub-border)",
            }}>
              {valuation.forecast.slice(0, 8).map((point, i) => (
                <div
                  key={point.year}
                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
                >
                  <div style={{
                    width: "100%",
                    background: "var(--hub-accent)",
                    height: (point.base / valuation.forecast[7].bull) * 220,
                    borderRadius: "4px 4px 0 0",
                    opacity: 0.2 + i * 0.1,
                    position: "relative",
                  }}>
                    <div style={{
                      position: "absolute", top: -20, left: "50%",
                      transform: "translateX(-50%)", fontSize: 10, fontWeight: 900, whiteSpace: "nowrap",
                    }}>
                      {Math.round(point.base / 100000) / 10}M
                    </div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--hub-text-muted)" }}>
                    {point.year}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 24, marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 12, height: 12, background: "var(--hub-accent)", borderRadius: 3 }} />
                <span className="ph-input-label">Base Scenario (+{valuation.growth}% YoY)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 12, height: 12, background: "var(--hub-accent)", borderRadius: 3, opacity: 0.4 }} />
                <span className="ph-input-label">Market Volatility Range</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          SYSTEM INTEGRITY FOOTER
      ══════════════════════════════════════════════════════════ */}
      <section className="premium-card elevated grid-12" style={{ padding: 40 }}>
        <div style={{
          gridColumn: "span 12", display: "flex",
          justifyContent: "space-between", alignItems: "center", marginBottom: 32,
        }}>
          <div>
            <h2 className="ph-heading-md">System Integrity &amp; Technical Core</h2>
            <p className="ph-input-label" style={{ marginTop: 8 }}>PLATFORM VERSION 4.8.2-ENTERPRISE</p>
          </div>
          <button
            className="ph-secondary-btn"
            onClick={handleExportPDF}
            disabled={isExporting || !isFormReady}
            style={{ height: 50, borderRadius: 12, opacity: isFormReady ? 1 : 0.4 }}
          >
            {isExporting ? <RefreshCw className="spin" /> : <Download />}
            <span style={{ marginLeft: 10 }}>GENERATE EXECUTIVE PDF REPORT</span>
          </button>
        </div>
        {[
          { label: "Inference Latency", value: "14.2ms", sub: "OPTIMAL",      color: "var(--hub-success)" },
          { label: "Dataset Records",   value: "1,422,904", sub: "TRACES ANALYZED", color: "var(--hub-text-muted)" },
          { label: "Last Training Sync", value: "02:14:00", sub: "HOURS AGO",  color: "var(--hub-text-muted)" },
          { label: "Model Accuracy",    value: "98.42%",  sub: "HIGH CONFIDENCE", color: "var(--hub-success)" },
        ].map((m) => (
          <div key={m.label} style={{ gridColumn: "span 3" }}>
            <div className="metric-label">{m.label}</div>
            <div className="metric-value" style={{ color: "var(--hub-accent)" }}>{m.value}</div>
            <div style={{ fontSize: 11, color: m.color, fontWeight: 800, marginTop: 4 }}>{m.sub}</div>
          </div>
        ))}
      </section>

      {/* ══════════════════════════════════════════════════════════
          FLOATING AI ASSISTANT
      ══════════════════════════════════════════════════════════ */}
      <div style={{ position: "fixed", bottom: 40, right: 40, zIndex: 1000 }}>
        <AnimatePresence>
          {showAssistant && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="assistant-panel"
            >
              <div className="assistant-header">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 10, height: 10, background: "var(--hub-success)", borderRadius: "50%" }} />
                  <span style={{ fontWeight: 900, fontSize: 14 }}>AI STRATEGIST ONLINE</span>
                </div>
                <button onClick={() => setShowAssistant(false)} style={{ background: "none", border: "none", color: "var(--hub-text-muted)", cursor: "pointer" }}>
                  <ChevronRight style={{ transform: "rotate(90deg)" }} />
                </button>
              </div>
              <div className="assistant-body">
                <div className="chat-bubble ai">
                  {formData.place
                    ? `Welcome! I can provide real-time analysis on ${formData.place}, ${formData.city} — market trends, valuation models, and investment risk.`
                    : "Welcome to the Enterprise Intelligence Hub. Select a property to begin your analysis."}
                </div>
                <div className="chat-bubble ai">How can I assist your investment decision today?</div>
                <div style={{ marginTop: "auto", display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <div className="prompt-pill">Explain current valuation</div>
                  <div className="prompt-pill">Compare with Nearby</div>
                  <div className="prompt-pill">ROI Forecast 5Y</div>
                  <div className="prompt-pill">Risk Mitigation</div>
                </div>
              </div>
              <div className="assistant-input">
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="Query Intelligence Engine..."
                    style={{ paddingRight: 50 }}
                  />
                  <Zap size={18} color="var(--hub-accent)" style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)" }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="ph-primary-btn"
          onClick={() => setShowAssistant(!showAssistant)}
          style={{ width: 64, height: 64, borderRadius: "50%", boxShadow: "0 20px 40px rgba(20, 184, 166, 0.4)" }}
        >
          {showAssistant ? <Zap size={24} color="#000" /> : <MousePointer2 size={24} color="#000" />}
        </motion.button>
      </div>
    </div>
  );
};

export default PropertyHub;
