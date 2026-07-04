import React, { useState } from "react";
import "./FloorPlanVisualizer.css";

const FloorPlanVisualizer = () => {
  const [bhk, setBhk] = useState("2bhk");
  const [mode, setMode] = useState("night");
  const [activeRoom, setActiveRoom] = useState("living");

  const roomsList = [
    { id: "living", name: "Living Room", desc: "Spacious central area" },
    { id: "master", name: "Master Suite", desc: "Attached bath & balcony" },
    { id: "kitchen", name: "Gourmet Kitchen", desc: "Modern modular setup" },
    { id: "guest", name: "Guest Bedroom", desc: "Cozy ventilation layout" },
    { id: "balcony", name: "Sunset Deck", desc: "Scenic glass railing" },
  ];

  // Colors based on Day/Night modes
  const bgStyle =
    mode === "day"
      ? {
          background:
            "radial-gradient(circle at 50% 50%, rgba(255, 225, 170, 0.18), transparent 60%), linear-gradient(180deg, #1a1814, #0d0c08)",
          borderColor: "rgba(233, 199, 131, 0.25)",
        }
      : {
          background:
            "radial-gradient(circle at 50% 50%, rgba(233, 199, 131, 0.08), transparent 60%), linear-gradient(180deg, #0d1018, #06070A)",
          borderColor: "rgba(255, 255, 255, 0.05)",
        };

  return (
    <div className="fp-card">
      <div className="fp-header">
        <div>
          <h4 className="fp-title">Interactive Architectural Layout</h4>
          <p className="fp-sub text-muted">
            Toggle configurations and inspect individual zones.
          </p>
        </div>
        <div className="fp-controls">
          <div className="fp-toggle-group">
            <button
              onClick={() => setBhk("2bhk")}
              className={`fp-btn ${bhk === "2bhk" ? "active" : ""}`}
            >
              2 BHK Plan
            </button>
            <button
              onClick={() => setBhk("3bhk")}
              className={`fp-btn ${bhk === "3bhk" ? "active" : ""}`}
            >
              3 BHK Plan
            </button>
          </div>
          <div className="fp-toggle-group">
            <button
              onClick={() => setMode("day")}
              className={`fp-btn ${mode === "day" ? "active" : ""}`}
            >
              Day
            </button>
            <button
              onClick={() => setMode("night")}
              className={`fp-btn ${mode === "night" ? "active" : ""}`}
            >
              Night
            </button>
          </div>
        </div>
      </div>

      <div className="fp-workspace" style={bgStyle}>
        <div className="fp-svg-container">
          <svg viewBox="0 0 400 300" className="fp-svg">
            {/* Outline Grid/Guide */}
            <defs>
              <pattern id="fp-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="400" height="300" fill="url(#fp-grid)" />

            {/* Core Outer Boundary */}
            <rect
              x="20"
              y="20"
              width="360"
              height="260"
              fill="none"
              stroke={mode === "day" ? "rgba(233,199,131,0.2)" : "rgba(255,255,255,0.1)"}
              strokeWidth="2"
              strokeDasharray="4,4"
            />

            {/* Room 1: Living Room */}
            <g onClick={() => setActiveRoom("living")} style={{ cursor: "pointer" }}>
              <rect
                x="30"
                y="30"
                width="160"
                height="130"
                className={`fp-room-rect ${activeRoom === "living" ? "active" : ""}`}
              />
              <text x="110" y="100" className="fp-room-label">
                Living Area
              </text>
            </g>

            {/* Room 2: Master Bedroom */}
            <g onClick={() => setActiveRoom("master")} style={{ cursor: "pointer" }}>
              <rect
                x="200"
                y="30"
                width="170"
                height="110"
                className={`fp-room-rect ${activeRoom === "master" ? "active" : ""}`}
              />
              <text x="285" y="90" className="fp-room-label">
                Master Bed
              </text>
            </g>

            {/* Room 3: Kitchen */}
            <g onClick={() => setActiveRoom("kitchen")} style={{ cursor: "pointer" }}>
              <rect
                x="30"
                y="170"
                width="100"
                height="100"
                className={`fp-room-rect ${activeRoom === "kitchen" ? "active" : ""}`}
              />
              <text x="80" y="225" className="fp-room-label">
                Kitchen
              </text>
            </g>

            {/* Room 4: Guest Bedroom (Only shown or larger in 3 BHK) */}
            <g onClick={() => setActiveRoom("guest")} style={{ cursor: "pointer" }}>
              <rect
                x="140"
                y="170"
                width="120"
                height="100"
                className={`fp-room-rect ${activeRoom === "guest" ? "active" : ""} ${
                  bhk === "2bhk" ? "dimmed" : ""
                }`}
              />
              <text x="200" y="225" className="fp-room-label">
                {bhk === "3bhk" ? "Guest Bed" : "Study/Kids"}
              </text>
            </g>

            {/* Room 5: Balcony */}
            <g onClick={() => setActiveRoom("balcony")} style={{ cursor: "pointer" }}>
              <rect
                x="270"
                y="150"
                width="100"
                height="120"
                className={`fp-room-rect ${activeRoom === "balcony" ? "active" : ""}`}
              />
              <text x="320" y="215" className="fp-room-label">
                Balcony
              </text>
            </g>

            {/* Room Highlights (Neons) */}
            <circle cx="110" cy="50" r="3" fill="#5DEAD0" opacity="0.6" className="pulse-light" />
            <circle cx="285" cy="50" r="3" fill="#E9C783" opacity="0.6" className="pulse-light" />
          </svg>
        </div>

        <div className="fp-room-details">
          <h5>Configure Layout Zones</h5>
          <div className="fp-rooms-list">
            {roomsList.map((room) => (
              <div
                key={room.id}
                onClick={() => setActiveRoom(room.id)}
                className={`fp-room-item ${activeRoom === room.id ? "active" : ""}`}
              >
                <div className="room-meta">
                  <span className="room-name">{room.name}</span>
                  <span className="room-desc">{room.desc}</span>
                </div>
                {activeRoom === room.id && <span className="room-dot"></span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorPlanVisualizer;
