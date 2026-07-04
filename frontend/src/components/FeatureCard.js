import React, { useRef } from "react";
import "./FeatureCard.css";

const FeatureCard = ({ icon, title, description, badge }) => {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const r = card.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * 100;
    const my = ((e.clientY - r.top) / r.height) * 100;
    card.style.setProperty("--mx", `${mx}%`);
    card.style.setProperty("--my", `${my}%`);
  };

  return (
    <div ref={cardRef} className="feat" onMouseMove={handleMouseMove}>
      {badge && <span className="feat-badge">{badge}</span>}
      <div className="feat-icon">{icon}</div>
      <h3 className="feat-title">{title}</h3>
      <p className="feat-desc">{description}</p>
    </div>
  );
};

export default FeatureCard;
