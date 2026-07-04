import React, { useState, useMemo } from "react";
import "./InteriorVisualizer.css";

const themes = {
  luxury: { c1: "#1a1410", c2: "#2a1f18", accent: "#E9C783", wall: "#2a1f15", floor: "#1a0f08", sofa: "#7a5f3f", tag: "Luxury Theme" },
  modern: { c1: "#1a1d24", c2: "#2a2f3a", accent: "#E9C783", wall: "#1f2229", floor: "#3a3026", sofa: "#5a5f6b", tag: "Modern Industrial" },
  minimalist: { c1: "#e8e4dd", c2: "#d4cfc4", accent: "#1a1a1a", wall: "#f0ece4", floor: "#c9c2b3", sofa: "#9a948a", tag: "Warm Minimalist" },
  smart: { c1: "#0a1018", c2: "#101822", accent: "#5DEAD0", wall: "#0d1218", floor: "#15202a", sofa: "#2a3340", tag: "Smart Cyber" },
  contemporary: { c1: "#241a1f", c2: "#2f242a", accent: "#FF8FA8", wall: "#2a1e24", floor: "#3a2a30", sofa: "#5a3f4a", tag: "Contemporary Plum" },
  traditional: { c1: "#2a1810", c2: "#3a2418", accent: "#C9A35E", wall: "#2a1810", floor: "#1a0e06", sofa: "#7a3a2a", tag: "Traditional Warmth" },
};

const InteriorVisualizer = () => {
  const [activeKey, setActiveKey] = useState("luxury");
  const t = themes[activeKey];

  // Generate background particles once to avoid visual jumpiness on selection changes
  const particles = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: 50 + Math.random() * 700,
      y: 30 + Math.random() * 320,
      opacity: 0.15 + Math.random() * 0.45,
    }));
  }, []);

  // Generate city silhouette window positions once
  const cityWindows = useMemo(() => {
    return Array.from({ length: 16 }).map((_, i) => {
      const x = 65 + i * 13 + (i % 3);
      const h = 30 + (i % 5) * 22;
      return { x, h };
    });
  }, []);

  return (
    <div className="interior-card">
      <div className="interior-header">
        <div>
          <h4 className="interior-title">Immersive Spatial Themes</h4>
          <p className="interior-sub text-muted">
            Visualize color palettes and styling presets for your future residence.
          </p>
        </div>
        <div className="interior-tag">
          <em>{t.tag}</em>
        </div>
      </div>

      <div className="interior-theme-selector">
        {Object.keys(themes).map((key) => (
          <button
            key={key}
            onClick={() => setActiveKey(key)}
            className={`theme-btn ${activeKey === key ? "active" : ""}`}
            style={{ "--theme-color": themes[key].accent }}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      <div className="interior-svg-wrapper">
        <svg
          id="interior-svg"
          viewBox="0 0 800 600"
          className="interior-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`wall-${activeKey}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={t.wall} />
              <stop offset="1" stopColor={t.c1} />
            </linearGradient>
            <linearGradient id={`floor-${activeKey}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={t.floor} />
              <stop offset="1" stopColor={t.c1} />
            </linearGradient>
            <radialGradient id={`glow-${activeKey}`} cx="50%" cy="20%" r="60%">
              <stop offset="0" stopColor={t.accent} stopOpacity=".35" />
              <stop offset="1" stopColor={t.accent} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* back wall */}
          <rect x="0" y="0" width="800" height="380" fill={`url(#wall-${activeKey})`} />

          {/* floor */}
          <polygon points="0,380 800,380 800,600 0,600" fill={`url(#floor-${activeKey})`} />

          {/* accent glow */}
          <rect x="0" y="0" width="800" height="600" fill={`url(#glow-${activeKey})`} pointerEvents="none" />

          {/* ceiling light strip */}
          <rect x="200" y="0" width="400" height="6" fill={t.accent} opacity=".75" />
          <rect x="200" y="0" width="400" height="40" fill={t.accent} opacity=".1" />

          {/* window / view */}
          <rect x="60" y="60" width="220" height="240" fill="#06070A" stroke={t.accent} strokeWidth="2" opacity=".9" />
          <line x1="170" y1="60" x2="170" y2="300" stroke={t.accent} strokeWidth="1" opacity=".4" />
          <line x1="60" y1="180" x2="280" y2="180" stroke={t.accent} strokeWidth="1" opacity=".4" />

          {/* city outside (faint) */}
          <g opacity=".7">
            {cityWindows.map((win, i) => (
              <rect
                key={i}
                x={win.x}
                y={300 - win.h}
                width="10"
                height={win.h}
                fill={t.accent}
                opacity=".25"
              />
            ))}
          </g>

          {/* artwork */}
          <rect x="360" y="80" width="200" height="120" fill={t.c2} stroke={t.accent} strokeWidth="1.5" />
          <circle cx="430" cy="130" r="22" fill={t.accent} opacity=".6" />
          <path d="M380 180 L420 140 L460 165 L500 130 L540 170 L540 200 L380 200 Z" fill={t.accent} opacity=".3" />

          {/* shelves */}
          <rect x="600" y="100" width="160" height="6" fill={t.accent} opacity=".7" />
          <rect x="600" y="160" width="160" height="6" fill={t.accent} opacity=".7" />
          <rect x="610" y="60" width="14" height="40" fill={t.sofa} />
          <rect x="635" y="55" width="14" height="45" fill={t.sofa} />
          <rect x="660" y="65" width="14" height="35" fill={t.sofa} />
          <circle cx="700" cy="80" r="14" fill={t.accent} opacity=".5" />

          {/* sofa */}
          <rect x="180" y="400" width="280" height="80" rx="14" fill={t.sofa} />
          <rect x="180" y="370" width="280" height="40" rx="14" fill={t.sofa} opacity=".85" />
          <rect x="185" y="395" width="80" height="50" rx="8" fill={t.accent} opacity=".3" />
          <rect x="275" y="395" width="80" height="50" rx="8" fill={t.accent} opacity=".2" />

          {/* coffee table */}
          <ellipse cx="320" cy="520" rx="120" ry="20" fill={t.c2} />
          <rect x="300" y="500" width="40" height="20" fill={t.accent} opacity=".5" />

          {/* floor lamp */}
          <line x1="540" y1="380" x2="540" y2="500" stroke={t.c2} strokeWidth="3" />
          <ellipse cx="540" cy="380" rx="30" ry="14" fill={t.accent} opacity=".8" />
          <ellipse cx="540" cy="380" rx="40" ry="8" fill={t.accent} opacity=".2" />

          {/* plant */}
          <rect x="630" y="440" width="40" height="50" fill={t.c2} />
          <path d="M650 440 L620 380 L640 430 L650 360 L660 430 L680 380 Z" fill={t.accent} opacity=".7" />

          {/* ambient particles */}
          {particles.map((p) => (
            <circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r="1"
              fill={t.accent}
              opacity={p.opacity}
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

export default InteriorVisualizer;
