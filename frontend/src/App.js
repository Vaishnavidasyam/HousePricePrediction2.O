import React, { useState } from "react";

import { Building2, BrainCircuit, LayoutGrid } from "lucide-react";

import HomeForm from "./components/HomeForm";
import ResultCard from "./components/ResultCard";
import Flat2DLayoutCard from "./components/Flat2DLayoutCard";

import { motion } from "framer-motion";

import "./App.css";

function App() {
  const [predictionResult, setPredictionResult] = useState(null);

  const [formState, setFormState] = useState({
    city: "",
    place: "",
    bhk: null,
    areaSqM: "",
  });

  const handleFormChange = (values) => {
    setFormState((prev) => ({
      ...prev,
      ...values,
    }));
  };

  return (
    <div className="app-root">
      <div className="bg-circle bg-circle-1"></div>
      <div className="bg-circle bg-circle-2"></div>

      <div className="app-shell">
        {/* HEADER */}

        <motion.header
          className="app-header"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="app-logo">
            <div className="app-logo-img-wrapper">
              <img src="/home.png" alt="logo" className="app-logo-img" />
            </div>

            <div className="app-logo-text">
              <span className="app-logo-title">HouseWorth AI</span>

              <span className="app-logo-sub">
                Multi-City Apartment Price Estimator
              </span>
            </div>
          </div>
        </motion.header>

        {/* HERO */}

        <motion.section
          className="hero-stats"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
        >
          <div className="hero-card">
            <div className="hero-icon">
              <Building2 size={26} />
            </div>

            <h3>5+</h3>

            <p>Indian Cities</p>
          </div>

          <div className="hero-card">
            <div className="hero-icon">
              <BrainCircuit size={26} />
            </div>

            <h3>Machine Learning</h3>

            <p>Regression Prediction</p>
          </div>

          <div className="hero-card">
            <div className="hero-icon">
              <LayoutGrid size={26} />
            </div>

            <h3>2D Layout</h3>

            <p>Interior Visualization</p>
          </div>
        </motion.section>

        {/* PANEL */}

        <motion.main
          className="app-panel"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <section className="app-panel-header">
            <h1 className="app-heading">Apartment Value Prediction</h1>

            <p className="app-subheading">
              Estimate 2BHK and 3BHK apartment prices across major Indian cities
              with AI-powered analytics and interior layout previews.
            </p>
          </section>

          <section className="app-grid">
            {/* LEFT */}

            <div className="app-column">
              <div className="app-card">
                <div className="app-card-header">
                  <div>
                    <h2>Property Configuration</h2>

                    <p>Configure apartment details for prediction.</p>
                  </div>

                  <span className="app-chip">Step 1</span>
                </div>

                <HomeForm
                  onResult={setPredictionResult}
                  onFormChange={handleFormChange}
                  initialValues={{
                    city: formState.city,
                    place: formState.place,
                    bhk: formState.bhk,
                    areaSqM: formState.areaSqM,
                  }}
                />
              </div>
            </div>

            {/* RIGHT */}

            <div className="app-column">
              <div className="app-card">
                <div className="app-card-header">
                  <div>
                    <h2>Predicted Market Price</h2>

                    <p>AI-generated apartment valuation.</p>
                  </div>

                  <span className="app-chip app-chip-green">Step 2</span>
                </div>

                <ResultCard result={predictionResult} />
              </div>

              <div className="app-card">
                <div className="app-card-header">
                  <div>
                    <h2>2D Interior Layout</h2>

                    <p>Smart visualization based on BHK.</p>
                  </div>

                  <span className="app-chip app-chip-blue">Step 3</span>
                </div>

                <Flat2DLayoutCard
                  bhk={formState.bhk}
                  areaSqM={formState.areaSqM}
                  place={formState.place}
                  city={formState.city}
                />
              </div>
            </div>
          </section>
        </motion.main>
      </div>
    </div>
  );
}

export default App;
