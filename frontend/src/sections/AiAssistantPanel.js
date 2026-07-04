import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Send, Sparkles, RefreshCw, ChevronRight,
  Target, Activity, BarChart3
} from "lucide-react";
import {
  CITIES, PROPERTY_TYPES, formatINR, getProfile,
  estimatePrice, generateForecast, topLocalities,
  areaSqmToSqft, getMarketPulse
} from "../data/marketData";
import { useMarketMetadata } from "../hooks/useMarketMetadata";
import "./AiAssistantPanel.css";

/* ── Typing indicator ─────────────────────────────────────────── */
const TypingDots = () => (
  <div className="ai-typing">
    {[0, 1, 2].map(i => (
      <span key={i} className="ai-typing-dot" style={{ animationDelay: `${i * 0.18}s` }} />
    ))}
  </div>
);

/* ── Quick stat pill ──────────────────────────────────────────── */
const StatPill = ({ label, value, color = "var(--ai-accent)" }) => (
  <div className="ai-stat-pill">
    <span className="ai-stat-label">{label}</span>
    <strong style={{ color }}>{value}</strong>
  </div>
);

/* ── Generate AI reply ────────────────────────────────────────── */
const generateReply = ({ city, locality, bhk, budget, propertyType, profile, basePrice, forecast }) => {
  const ptLabel = PROPERTY_TYPES.find(t => t.id === propertyType)?.label || "Property";
  const sqft = areaSqmToSqft(bhk * 45 + 30);
  const pricePerSqft = Math.round(basePrice / sqft);
  const forecast5y = forecast[5]?.base;
  const roi5y = Math.round(((forecast5y - basePrice) / basePrice) * 100);
  const annualRent = Math.round(basePrice * profile.yield / 100);
  const monthlyRent = Math.round(annualRent / 12);
  const verdict = profile.growth > 11 && profile.yield > 3.8 ? "STRONG BUY" : profile.growth > 9 ? "ACCUMULATE" : "HOLD";

  const withinBudget = budget >= basePrice;
  const budgetGap = Math.abs(budget - basePrice);

  return {
    summary: `Based on your inputs for a **${bhk} BHK ${ptLabel}** in **${locality}, ${city}**, here's my AI-powered investment analysis:`,
    points: [
      `📍 **Location Score:** ${city} ranks ${profile.demand > 88 ? "#1" : profile.demand > 82 ? "top 3" : "top 5"} in demand across our tracked markets with a score of **${profile.demand}/100**.`,
      `💰 **Estimated Market Value:** **${formatINR(basePrice)}** (₹${pricePerSqft.toLocaleString("en-IN")}/sq ft). Your budget is ${withinBudget ? `₹${(budgetGap / 100000).toFixed(1)}L above` : `₹${(budgetGap / 100000).toFixed(1)}L below`} this estimate.`,
      `📈 **5-Year Projection:** Value expected to reach **${formatINR(forecast5y)}** — a **+${roi5y}% return** at ${profile.growth}% annual CAGR.`,
      `🏦 **Rental Income:** Estimated **${formatINR(monthlyRent)}/month** (${profile.yield}% yield p.a.) — ${profile.yield > 4 ? "excellent" : profile.yield > 3.5 ? "strong" : "stable"} passive income potential.`,
      `🛡️ **Risk Profile:** ${profile.risk} — ${profile.risk === "Low" ? "highly stable market" : profile.risk === "Balanced" ? "good risk-reward balance" : "value play with upside"}. Infrastructure score: **${profile.infra}/100**.`,
      `✅ **Verdict: ${verdict}** — ${verdict === "STRONG BUY" ? "Exceptional fundamentals across all metrics." : verdict === "ACCUMULATE" ? "Strong growth trajectory; build position steadily." : "Hold for now; market shows stable but moderate signals."}`,
    ],
    verdict,
  };
};

/* ══════════════════════════════════════════════════════════════════
   AI ASSISTANT PANEL
══════════════════════════════════════════════════════════════════ */
const AiAssistantPanel = () => {
  const { metadata } = useMarketMetadata();

  /* — Form state ──────────────────────────────────────────────── */
  const [city,         setCity]         = useState("Hyderabad");
  const [locality,     setLocality]     = useState("");
  const [bhk,          setBhk]          = useState(2);
  const [budget,       setBudget]       = useState(12000000);
  const [propertyType, setPropertyType] = useState("apartment");

  const localities = useMemo(() => topLocalities(metadata, city, 10), [metadata, city]);

  useEffect(() => {
    setLocality(localities[0] || "");
  }, [city, localities]);

  /* — Derived data ─────────────────────────────────────────────── */
  const profile   = getProfile(city);
  const area_sqm  = bhk * 45 + 30;
  const basePrice = useMemo(() => estimatePrice({ city, bhk, area_sqm, propertyType }), [city, bhk, area_sqm, propertyType]);
  const forecast  = useMemo(() => generateForecast(basePrice, 10), [basePrice]);
  const pulse     = useMemo(() => getMarketPulse(city), [city]);
  const ptLabel   = PROPERTY_TYPES.find(t => t.id === propertyType)?.label || "Property";

  /* — Chat state ───────────────────────────────────────────────── */
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [isTyping,  setIsTyping]  = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, isTyping]);

  /* — Generate full report ─────────────────────────────────────── */
  const handleAnalyze = () => {
    setIsTyping(true);
    setMessages([]);

    setTimeout(() => {
      const reply = generateReply({ city, locality, bhk, budget, propertyType, profile, basePrice, forecast });
      setMessages([{ type: "ai-report", ...reply }]);
      setIsTyping(false);
    }, 1400);
  };

  /* — Handle free-form chat ────────────────────────────────────── */
  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { type: "user", text: userMsg }]);
    setIsTyping(true);

    setTimeout(() => {
      const lower = userMsg.toLowerCase();
      let reply = "";
      const forecast5y = forecast[5]?.base;
      const roi5y = Math.round(((forecast5y - basePrice) / basePrice) * 100);
      const monthlyRent = Math.round(basePrice * profile.yield / 100 / 12);

      if (lower.includes("price") || lower.includes("value") || lower.includes("worth"))
        reply = `The estimated market value for a ${bhk} BHK ${ptLabel} in ${locality || city} is **${formatINR(basePrice)}** — based on ${city}'s base rate of ₹${Math.round(basePrice / areaSqmToSqft(area_sqm)).toLocaleString("en-IN")}/sq ft and current demand index of ${profile.demand}/100.`;
      else if (lower.includes("rent") || lower.includes("yield"))
        reply = `Expected monthly rental for this property: **${formatINR(monthlyRent)}/month** (annual yield: **${profile.yield}%**). ${profile.yield > 4 ? "This is an excellent yield — top 20% in India." : "Solid yield for long-term passive income."}`;
      else if (lower.includes("forecast") || lower.includes("5 year") || lower.includes("grow"))
        reply = `5-year base-case projection: **${formatINR(forecast5y)}** (+${roi5y}% return). At ${profile.growth}% annual CAGR, ${city} is one of India's ${profile.growth > 11 ? "fastest-growing" : profile.growth > 9 ? "top-performing" : "steadily-growing"} real estate markets.`;
      else if (lower.includes("invest") || lower.includes("buy") || lower.includes("should"))
        reply = `AI Verdict: **${profile.growth > 11 && profile.yield > 3.8 ? "STRONG BUY ✅" : profile.growth > 9 ? "ACCUMULATE 📈" : "HOLD ⏳"}**. ${city} scores ${profile.demand}/100 on demand and ${profile.infra}/100 on infrastructure. Risk profile: **${profile.risk}**.`;
      else if (lower.includes("risk"))
        reply = `${city}'s risk profile is **${profile.risk}**. Infrastructure score: **${profile.infra}/100**, demand: **${profile.demand}/100**. ${profile.risk === "Low" ? "Very stable — ideal for conservative investors." : profile.risk === "Balanced" ? "Good risk-reward balance for most investor profiles." : "Value play — higher upside with moderate risk."}`;
      else if (lower.includes("compare") || lower.includes("vs") || lower.includes("better"))
        reply = `Compared to the 5-city average, ${city} ${profile.growth > 10 ? "outperforms" : "tracks"} on growth (${profile.growth}% vs ~10.1% avg). Use the **Compare** tab in the sidebar for a detailed side-by-side analysis.`;
      else if (lower.includes("locality") || lower.includes("area") || lower.includes("location"))
        reply = `Top localities in ${city}: ${localities.slice(0, 4).join(", ")}. Each offers strong connectivity. ${locality ? `You've selected **${locality}** — an excellent choice within ${city}'s premium micro-markets.` : "Select a locality above for personalised insights."}`;
      else if (lower.includes("budget") || lower.includes("afford"))
        reply = `Your budget is ${formatINR(budget)}. The estimated price for a ${bhk} BHK ${ptLabel} here is **${formatINR(basePrice)}**. You are **${budget >= basePrice ? `₹${((budget - basePrice) / 100000).toFixed(1)}L above` : `₹${((basePrice - budget) / 100000).toFixed(1)}L below`}** the estimate — ${budget >= basePrice ? "you're well-positioned to negotiate!" : "consider a smaller BHK or an emerging locality."}`;
      else
        reply = `Great question! For ${city} real estate — growth is at **${profile.growth}%** YoY, demand score **${profile.demand}/100**, and infrastructure at **${profile.infra}/100**. I recommend generating a full report above for a comprehensive analysis of your specific inputs.`;

      setMessages(prev => [...prev, { type: "ai", text: reply }]);
      setIsTyping(false);
    }, 900);
  };

  /* — Quick prompts ────────────────────────────────────────────── */
  const quickPrompts = [
    "What is the market value?",
    "What is the rental yield?",
    "Should I invest here?",
    "5-year growth forecast",
    "What is the risk profile?",
    "Compare with other cities",
  ];

  return (
    <div className="ai-layout">

      {/* ── LEFT PANEL — Config + Stats ────────────────────────── */}
      <div className="ai-left">

        {/* Header */}
        <div className="ai-left-header">
          <div className="ai-eyebrow">AI Investment Advisor</div>
          <h1 className="ai-title">Smart Assistant</h1>
          <p className="ai-subtitle">Configure your property inputs and let the AI generate a full investment report.</p>
        </div>

        {/* Config form */}
        <div className="ai-config-card">
          <div className="ai-config-title">
            <Target size={16} color="var(--ai-accent)" /> Property Configuration
          </div>

          <div className="ai-form-group">
            <label className="ai-label">City</label>
            <select className="ai-select" value={city} onChange={e => setCity(e.target.value)}>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="ai-form-group">
            <label className="ai-label">Locality</label>
            <select className="ai-select" value={locality} onChange={e => setLocality(e.target.value)} disabled={!localities.length}>
              {localities.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="ai-form-group">
            <label className="ai-label">Property Type</label>
            <select className="ai-select" value={propertyType} onChange={e => setPropertyType(e.target.value)}>
              {PROPERTY_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>

          <div className="ai-form-group">
            <label className="ai-label">BHK Configuration</label>
            <div className="ai-bhk-row">
              {[1, 2, 3, 4, 5].map(b => (
                <button key={b} className={`ai-bhk-btn${bhk === b ? " active" : ""}`} onClick={() => setBhk(b)}>{b} BHK</button>
              ))}
            </div>
          </div>

          <div className="ai-form-group">
            <label className="ai-label">Budget: <strong style={{ color: "var(--ai-accent)" }}>{formatINR(budget)}</strong></label>
            <input
              type="range" min={3000000} max={80000000} step={500000}
              value={budget} onChange={e => setBudget(Number(e.target.value))}
              className="ai-slider"
            />
            <div className="ai-slider-labels"><span>₹30L</span><span>₹8Cr</span></div>
          </div>

          <button className="ai-analyze-btn" onClick={handleAnalyze}>
            <Sparkles size={18} />
            Generate AI Report
          </button>
        </div>

        {/* Live Market Pulse */}
        <div className="ai-pulse-card">
          <div className="ai-config-title"><Activity size={16} color="var(--ai-accent)" /> Market Pulse — {city}</div>
          {pulse.map((item, i) => (
            <div key={item.label} className="ai-pulse-row">
              <span className="ai-pulse-label">{item.label}</span>
              <span className="ai-pulse-val">{item.value}</span>
              <span className={`ai-pulse-trend ${item.trend.startsWith("+") ? "up" : "down"}`}>{item.trend}</span>
            </div>
          ))}
        </div>

        {/* Quick stats */}
        <div className="ai-stats-grid">
          <StatPill label="Est. Value"    value={formatINR(basePrice)}          color="var(--ai-accent)" />
          <StatPill label="Annual Growth" value={`${profile.growth}%`}          color="#22D3EE" />
          <StatPill label="Rental Yield"  value={`${profile.yield}%`}           color="#A78BFA" />
          <StatPill label="Risk Profile"  value={profile.risk}                  color="#F59E0B" />
          <StatPill label="Demand Score"  value={`${profile.demand}/100`}       color="#34D399" />
          <StatPill label="Infrastructure" value={`${profile.infra}/100`}       color="#F87171" />
        </div>
      </div>

      {/* ── RIGHT PANEL — Chat ─────────────────────────────────── */}
      <div className="ai-right">
        <div className="ai-chat-header">
          <div className="ai-chat-avatar">
            <Bot size={22} />
          </div>
          <div>
            <div className="ai-chat-name">EstateVerse AI Advisor</div>
            <div className="ai-chat-status"><span className="ai-status-dot" /> Online · Powered by market intelligence</div>
          </div>
          <button className="ai-refresh-btn" onClick={() => { setMessages([]); }} title="Clear chat">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="ai-chat-body" ref={chatRef}>
          {messages.length === 0 && !isTyping && (
            <div className="ai-welcome">
              <div className="ai-welcome-icon"><Sparkles size={32} /></div>
              <h3 className="ai-welcome-title">Hello! I'm your AI Property Advisor.</h3>
              <p className="ai-welcome-sub">Configure your property details on the left and click <strong>Generate AI Report</strong> for a full investment analysis — or ask me anything below.</p>
              <div className="ai-welcome-chips">
                {["What's the market value?", "Best localities in Hyderabad?", "Is now a good time to buy?"].map(q => (
                  <button key={q} className="ai-welcome-chip" onClick={() => { setInput(q); }}>
                    <ChevronRight size={12} />{q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                {msg.type === "user" ? (
                  <div className="ai-bubble ai-bubble--user">{msg.text}</div>
                ) : msg.type === "ai-report" ? (
                  <div className="ai-report-card">
                    <div className="ai-report-header">
                      <Sparkles size={16} color="var(--ai-accent)" />
                      <span>AI Investment Report</span>
                      <span className={`ai-verdict-chip ${msg.verdict === "STRONG BUY" ? "buy" : msg.verdict === "ACCUMULATE" ? "acc" : "hold"}`}>
                        {msg.verdict}
                      </span>
                    </div>
                    <p className="ai-report-summary">
                      {msg.summary.replace(/\*\*/g, "")}
                    </p>
                    <div className="ai-report-points">
                      {msg.points.map((pt, j) => (
                        <div key={j} className="ai-report-point">
                          <span>{pt.replace(/\*\*/g, "")}</span>
                        </div>
                      ))}
                    </div>
                    <div className="ai-report-footer">
                      <BarChart3 size={12} /> Analysis based on {city} market data · {ptLabel} · {bhk} BHK
                    </div>
                  </div>
                ) : (
                  <div className="ai-bubble ai-bubble--ai">
                    <Bot size={14} className="ai-bubble-icon" />
                    <span>{msg.text.replace(/\*\*/g, "")}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ai-bubble ai-bubble--ai">
              <Bot size={14} className="ai-bubble-icon" />
              <TypingDots />
            </motion.div>
          )}
        </div>

        {/* Quick prompts */}
        <div className="ai-prompts">
          {quickPrompts.map(p => (
            <button key={p} className="ai-prompt-btn" onClick={() => { setInput(p); }}>
              <ChevronRight size={10} />{p}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div className="ai-input-bar">
          <input
            className="ai-input"
            type="text"
            placeholder="Ask about price, yield, growth, risk, comparisons..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
          />
          <button className="ai-send-btn" onClick={handleSend} disabled={!input.trim()}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantPanel;
