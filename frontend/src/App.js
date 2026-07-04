import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";

// Core Components
import CitySkyline from "./components/CitySkyline";
import PropertyLayoutPage from "./pages/PropertyLayoutPage";
import PlatformLayout from "./PlatformLayout";

// Sections
import PropertyHub from "./sections/PropertyHub";
import ValuationResults from "./sections/ValuationResults";
import InvestmentIntelligence from "./sections/InvestmentIntelligence";
import ComparisonCenter from "./sections/ComparisonCenter";
import SmartCityIntelligence from "./sections/SmartCityIntelligence";
import Explorer3D from "./sections/Explorer3D";
import AiAssistantPanel from "./sections/AiAssistantPanel";

import "./App.css";

const HeroSection = () => (
  <section id="hero" className="hero-3d-container">
    <CitySkyline />
    <div className="hero-overlay" />

    <div className="app-shell" style={{ height: "100%", position: "relative", display: "flex", alignItems: "center" }}>
      <div className="hero-content">
        <motion.div
          className="hero-main-card"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="hero-tagline">
            <span>Integrated Thesis Engine</span>
          </div>
          <h1 className="hero-title">
            Immersive 3D Skyline & <span>AI Valuations</span>
          </h1>
          <p className="hero-subtitle">
            Experience real estate analysis with a procedural 3D model, instant machine learning prices, and theme design suites.
          </p>
          <div className="hero-ctas">
            <Link to="/platform/hub" className="btn-primary">
              Launch Platform
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

function App() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  useEffect(() => {
    document.body.style.overflow = isLanding ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isLanding]);

  return (
    <div className={`app-root ${isLanding ? "landing-root" : "platform-root"}`}>
      <Routes>
        <Route path="/" element={<HeroSection />} />
        <Route path="/platform" element={<PlatformLayout />}>
          <Route index element={<Navigate to="/platform/hub" replace />} />
          <Route path="hub" element={<PropertyHub />} />
          <Route path="valuation" element={<ValuationResults />} />
          <Route path="investment" element={<InvestmentIntelligence />} />
          <Route path="comparison" element={<ComparisonCenter />} />
          <Route path="city" element={<SmartCityIntelligence />} />
          <Route path="visuals" element={<Explorer3D />} />
          <Route path="assistant" element={<AiAssistantPanel />} />
          <Route path="analytics" element={<Navigate to="/platform/investment" replace />} />
          <Route path="forecast" element={<Navigate to="/platform/investment" replace />} />
          <Route path="recommendations" element={<Navigate to="/platform/investment" replace />} />
          <Route path="explorer3d" element={<Navigate to="/platform/visuals" replace />} />
          <Route path="bhk-explorer" element={<Navigate to="/platform/visuals" replace />} />
          <Route path="interior" element={<Navigate to="/platform/visuals" replace />} />
          <Route path="builder" element={<Navigate to="/platform/city" replace />} />
          <Route path="land" element={<Navigate to="/platform/city" replace />} />
          <Route path="dashboard" element={<Navigate to="/platform/investment" replace />} />
          <Route path="reports" element={<Navigate to="/platform/assistant" replace />} />
        </Route>
        <Route path="/layout" element={<PropertyLayoutPage />} />
      </Routes>
    </div>
  );
}

export default App;
