// src/components/House3DViewer.js
import React, { Suspense, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import "./House3DViewer.css";

function HouseModel({ url, areaSqM, onError }) {
  const { scene } = useGLTF(url, true, undefined, (error) => {
    console.error("GLB load error:", error);
    if (onError) onError(error);
  });

  const scale = useMemo(() => {
    const base = 80;
    const ratio = Math.max(0.6, Math.min(1.6, (areaSqM || 80) / base));
    return [ratio, ratio, ratio];
  }, [areaSqM]);

  return <primitive object={scene} scale={scale} />;
}

const House3DViewer = ({ bhk, areaSqM }) => {
  const bhkNum = Number(bhk) || 2;

  // Use your file for 2BHK, and keep a placeholder for 3BHK for now
  const modelUrl =
    bhkNum === 2 ? "/models/appartement_2bhk.glb" : "/models/Duck.glb"; // later you can swap this when you have a 3BHK GLB

  const [loadError, setLoadError] = useState(false);

  return (
    <div className="house3d-card mb-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h6 className="mb-0">3D Layout</h6>
          <small className="text-muted">
            {bhkNum} BHK · ~{Math.round(areaSqM || 0)} m²
          </small>
        </div>
        <span className="badge rounded-pill bg-light text-dark">
          Drag to rotate · Scroll to zoom
        </span>
      </div>

      <div className="house3d-canvas-wrapper">
        {loadError ? (
          <div className="h-100 d-flex flex-column justify-content-center align-items-center text-muted small text-center p-3">
            <div className="mb-1">3D model could not be loaded.</div>
            <div>
              Check <code>{modelUrl}</code> is a valid GLB model.
            </div>
          </div>
        ) : (
          <Canvas camera={{ position: [0, 6, 10], fov: 40 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={0.8} />
            <Suspense fallback={null}>
              <HouseModel
                url={modelUrl}
                areaSqM={areaSqM}
                onError={() => setLoadError(true)}
              />
              <Environment preset="city" />
            </Suspense>
            <OrbitControls enablePan enableRotate enableZoom />
          </Canvas>
        )}
      </div>
    </div>
  );
};

export default House3DViewer;
