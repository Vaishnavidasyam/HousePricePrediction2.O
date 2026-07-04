import React, { useState, useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
import {
  Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, Camera, Share2,
  Sun, Moon, Navigation, Eye, Bot, Mic, Send,
  Activity
} from "lucide-react";
import {
  CITIES, formatINR, getAdjustedProfile,
  estimatePrice, generateForecast, topLocalities, areaSqmToSqft
} from "../data/marketData";
import { useMarketMetadata } from "../hooks/useMarketMetadata";
import "./Explorer3D.css";

/* ══════════════════════════════════════════════════════════════════
   CAMERA CONTROLLER (Lerps position & target for smooth transitions)
   ══════════════════════════════════════════════════════════════════ */
const CameraController = ({ targetPos, targetLookAt, resetCounter }) => {
  const { camera } = useThree();
  const currentLookAt = useRef(new Vector3(0, 0, 0));

  // Initialize camera position on first render
  useEffect(() => {
    camera.position.set(13, 14, 16);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Handle reset camera view trigger
  useEffect(() => {
    if (resetCounter > 0) {
      targetPos.set(13, 14, 16);
      targetLookAt.set(0, 0, 0);
    }
  }, [resetCounter, targetPos, targetLookAt]);

  useFrame((state, delta) => {
    const speed = 4.5 * delta;
    camera.position.lerp(targetPos, speed);
    currentLookAt.current.lerp(targetLookAt, speed);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};

/* ══════════════════════════════════════════════════════════════════
   SHARED HELPER COMPONENTS
   ══════════════════════════════════════════════════════════════════ */
const WindowPane = ({ x, y, z, w = 0.9, h = 0.55, dir = 'z' }) => (
  <mesh position={[x, y, z]}>
    <boxGeometry args={dir === 'z' ? [w, h, 0.05] : [0.05, h, w]} />
    <meshPhysicalMaterial color="#7dd3fc" roughness={0.04} metalness={0.15} transparent opacity={0.65} transmission={0.5} />
  </mesh>
);

const DoorFrame = ({ x, y, z }) => (
  <mesh position={[x, y, z]}>
    <boxGeometry args={[0.6, 1.0, 0.06]} />
    <meshStandardMaterial color="#92400e" roughness={0.35} />
  </mesh>
);

const TreeObj = ({ x, z, s = 1 }) => (
  <group position={[x, 0, z]} scale={s}>
    <mesh castShadow position={[0, 0.22, 0]}><cylinderGeometry args={[0.09, 0.12, 0.44, 8]} /><meshStandardMaterial color="#78350f" roughness={0.9} /></mesh>
    <mesh castShadow position={[0, 0.74, 0]}><sphereGeometry args={[0.40, 10, 10]} /><meshStandardMaterial color="#16a34a" roughness={0.8} /></mesh>
    <mesh castShadow position={[0, 1.06, 0]}><sphereGeometry args={[0.26, 10, 10]} /><meshStandardMaterial color="#15803d" roughness={0.8} /></mesh>
  </group>
);

const BedObj = ({ x, y, z, color = '#1d4ed8' }) => (
  <group position={[x, y, z]}>
    <mesh castShadow><boxGeometry args={[1.65, 0.18, 2.05]} /><meshStandardMaterial color="#92400e" roughness={0.4} /></mesh>
    <mesh castShadow position={[0, 0.18, 0]}><boxGeometry args={[1.55, 0.22, 1.9]} /><meshStandardMaterial color={color} roughness={0.5} /></mesh>
    <mesh castShadow position={[0, 0.28, -0.92]}><boxGeometry args={[1.55, 0.40, 0.13]} /><meshStandardMaterial color="#f8fafc" roughness={0.4} /></mesh>
    <mesh castShadow position={[0.6, 0.38, -0.92]}><boxGeometry args={[0.36, 0.33, 0.11]} /><meshStandardMaterial color="#f8fafc" roughness={0.4} /></mesh>
    <mesh castShadow position={[-0.6, 0.38, -0.92]}><boxGeometry args={[0.36, 0.33, 0.11]} /><meshStandardMaterial color="#f8fafc" roughness={0.4} /></mesh>
  </group>
);

const SofaObj = ({ x, y, z, rot = 0, color = '#1d4ed8', w = 2.0 }) => (
  <group position={[x, y, z]} rotation={[0, rot, 0]}>
    <mesh castShadow><boxGeometry args={[w, 0.44, 0.88]} /><meshStandardMaterial color={color} roughness={0.5} /></mesh>
    <mesh castShadow position={[0, 0.38, -0.38]}><boxGeometry args={[w, 0.62, 0.16]} /><meshStandardMaterial color={color} roughness={0.5} /></mesh>
    <mesh castShadow position={[w / 2 - 0.09, 0.26, 0]}><boxGeometry args={[0.16, 0.52, 0.88]} /><meshStandardMaterial color={color} roughness={0.5} /></mesh>
    <mesh castShadow position={[-(w / 2 - 0.09), 0.26, 0]}><boxGeometry args={[0.16, 0.52, 0.88]} /><meshStandardMaterial color={color} roughness={0.5} /></mesh>
  </group>
);

const TableObj = ({ x, y, z, w = 1.2, d = 0.7 }) => (
  <group position={[x, y, z]}>
    <mesh castShadow><boxGeometry args={[w, 0.07, d]} /><meshStandardMaterial color="#b45309" roughness={0.3} metalness={0.1} /></mesh>
    {[[-w / 2 + 0.07, -0.32, -d / 2 + 0.07], [w / 2 - 0.07, -0.32, -d / 2 + 0.07],
      [-w / 2 + 0.07, -0.32, d / 2 - 0.07], [w / 2 - 0.07, -0.32, d / 2 - 0.07]].map(([px, py, pz], i) => (
      <mesh key={i} castShadow position={[px, py, pz]}><cylinderGeometry args={[0.04, 0.04, 0.64, 8]} /><meshStandardMaterial color="#92400e" roughness={0.4} /></mesh>
    ))}
  </group>
);

const KitchenObj = ({ x, y, z, w = 2.4, d = 0.62, color = '#0f172a' }) => (
  <group position={[x, y, z]}>
    <mesh castShadow><boxGeometry args={[w, 0.88, d]} /><meshStandardMaterial color={color} roughness={0.22} /></mesh>
    <mesh castShadow position={[0, 0.46, 0]}><boxGeometry args={[w, 0.05, d]} /><meshStandardMaterial color="#e2e8f0" roughness={0.05} metalness={0.3} /></mesh>
    <mesh castShadow position={[0, 0.72, -d / 2 + 0.06]}><boxGeometry args={[w, 0.58, 0.33]} /><meshStandardMaterial color={color} roughness={0.3} /></mesh>
    <mesh position={[0.4, 0.49, -d / 2 + 0.07]} castShadow><boxGeometry args={[0.42, 0.05, 0.3]} /><meshStandardMaterial color="#64748b" roughness={0.12} metalness={0.8} /></mesh>
  </group>
);

const GlassRail = ({ x, y, z, w, dir = 'x' }) => (
  <mesh position={[x, y, z]}>
    <boxGeometry args={dir === 'x' ? [w, 0.92, 0.05] : [0.05, 0.92, w]} />
    <meshPhysicalMaterial color="#cbd5e1" transparent opacity={0.22} transmission={0.92} roughness={0.04} />
  </mesh>
);

/* ══════════════════════════════════════════════════════════════════
   1. APARTMENT — BHK-AWARE FLOOR PLAN (1–5 BHK)
   ══════════════════════════════════════════════════════════════════ */
const Apartment3D = ({ config, theme, isNight, onSelectRoom }) => {
  const bhk = Math.max(1, Math.min(5, Number(config) || 2));
  const totalW = 7 + bhk * 1.6;
  const totalD = 9;
  const bedrooms = Array.from({ length: bhk }, (_, i) => ({
    id: `bed${i}`, x: -totalW / 2 + 1.6 + i * (totalW - 2) / bhk, z: -2.8
  }));

  return (
    <group>
      {/* Floor */}
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[totalW, 0.1, totalD]} />
        <meshStandardMaterial color={theme.floorColor} roughness={0.28} metalness={0.1} />
      </mesh>
      {/* Perimeter walls */}
      <mesh castShadow receiveShadow position={[0, 1.45, -totalD / 2]}>
        <boxGeometry args={[totalW, 2.9, 0.13]} />
        <meshStandardMaterial color={theme.wallColor} roughness={0.5} />
      </mesh>
      <mesh castShadow receiveShadow position={[-totalW / 2, 1.45, 0]}>
        <boxGeometry args={[0.13, 2.9, totalD]} />
        <meshStandardMaterial color={theme.wallColor} roughness={0.5} />
      </mesh>
      <mesh castShadow receiveShadow position={[totalW / 2, 1.45, 0]}>
        <boxGeometry args={[0.13, 2.9, totalD]} />
        <meshStandardMaterial color={theme.wallColor} roughness={0.5} />
      </mesh>
      {/* Front partial walls with door gap */}
      <mesh castShadow receiveShadow position={[-totalW / 3.5, 1.45, totalD / 2]}>
        <boxGeometry args={[totalW / 2.5, 2.9, 0.13]} />
        <meshStandardMaterial color={theme.wallColor} roughness={0.5} />
      </mesh>
      <mesh castShadow receiveShadow position={[totalW / 3, 1.45, totalD / 2]}>
        <boxGeometry args={[totalW / 2.5, 2.9, 0.13]} />
        <meshStandardMaterial color={theme.wallColor} roughness={0.5} />
      </mesh>
      {/* Bedroom zone divider */}
      <mesh castShadow position={[0, 1.45, -0.6]}>
        <boxGeometry args={[totalW, 2.9, 0.1]} />
        <meshStandardMaterial color={theme.wallColor} roughness={0.5} />
      </mesh>
      {/* Bedroom partition walls */}
      {bedrooms.slice(0, -1).map((bd, i) => (
        <mesh key={i} castShadow position={[bd.x + (totalW - 2) / bhk / 2, 1.45, -2.8]}>
          <boxGeometry args={[0.1, 2.9, 4.5]} />
          <meshStandardMaterial color={theme.wallColor} roughness={0.5} />
        </mesh>
      ))}
      {/* Bedrooms with furniture */}
      {bedrooms.map((bd, i) => (
        <group key={bd.id} onClick={(e) => { e.stopPropagation(); onSelectRoom(i === 0 ? 'master' : 'guest'); }}>
          <BedObj x={bd.x} y={0.18} z={bd.z} color={i === 0 ? theme.fabricColor : '#334155'} />
          <TableObj x={bd.x + 0.95} y={0.32} z={bd.z + 0.7} w={0.5} d={0.4} />
          <WindowPane x={bd.x} y={1.4} z={-totalD / 2 + 0.08} />
        </group>
      ))}
      {/* Living room */}
      <group onClick={(e) => { e.stopPropagation(); onSelectRoom('living'); }}>
        <SofaObj x={0} y={0.44} z={2.6} color={theme.fabricColor} w={2.4} />
        <TableObj x={0} y={0.32} z={1.5} w={1.1} d={0.65} />
        {/* TV unit */}
        <mesh castShadow position={[0, 0.52, 4.0]}><boxGeometry args={[1.9, 0.82, 0.32]} /><meshStandardMaterial color={theme.woodColor} roughness={0.3} /></mesh>
        <mesh position={[0, 0.9, 4.04]}><boxGeometry args={[1.5, 0.88, 0.05]} /><meshStandardMaterial color="#020617" roughness={0.05} metalness={0.5} /></mesh>
      </group>
      {/* Kitchen */}
      <group onClick={(e) => { e.stopPropagation(); onSelectRoom('kitchen'); }}>
        <KitchenObj x={totalW / 2 - 1.5} y={0} z={1.6} w={2.2} color={theme.accentColor} />
        <KitchenObj x={totalW / 2 - 0.44} y={0} z={-0.2} w={0.9} d={0.55} color={theme.accentColor} />
      </group>
      {/* Dining */}
      <TableObj x={totalW / 2 - 2.2} y={0.32} z={-0.3} w={1.3} d={0.85} />
      {/* Bathroom tile indication */}
      <mesh receiveShadow position={[-totalW / 2 + 0.85, -0.04, 2.6]}>
        <boxGeometry args={[1.5, 0.02, 2.1]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.1} />
      </mesh>
      {/* Balcony */}
      <group onClick={(e) => { e.stopPropagation(); onSelectRoom('balcony'); }}>
        <mesh receiveShadow position={[0, -0.04, totalD / 2 + 1.1]}>
          <boxGeometry args={[totalW * 0.5, 0.07, 2.0]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.6} />
        </mesh>
        <GlassRail x={0} y={0.52} z={totalD / 2 + 2.08} w={totalW * 0.5} dir="x" />
      </group>
      {/* Door */}
      <DoorFrame x={0} y={0.48} z={totalD / 2 + 0.08} />
      {/* Windows on back */}
      <WindowPane x={totalW * 0.15} y={1.4} z={-totalD / 2 + 0.08} w={1.0} />
      {/* Night lights */}
      {isNight && <pointLight position={[0, 2.3, 1.5]} intensity={1.3} distance={11} color="#fbbf24" />}
      {isNight && <pointLight position={[0, 2.3, -2.0]} intensity={0.7} distance={7} color="#a5f3fc" />}
    </group>
  );
};

/* ══════════════════════════════════════════════════════════════════
   2. VILLA — GF + FF + Pool + Garden + Garage + Porch
   ══════════════════════════════════════════════════════════════════ */
const Villa3D = ({ theme, isNight }) => (
  <group>
    {/* Site land */}
    <mesh receiveShadow position={[0, -0.12, 0]}>
      <boxGeometry args={[17, 0.24, 14]} />
      <meshStandardMaterial color="#15803d" roughness={0.95} />
    </mesh>
    {/* Driveway */}
    <mesh receiveShadow position={[0, -0.08, 6.8]}>
      <boxGeometry args={[3.6, 0.05, 2.5]} />
      <meshStandardMaterial color="#334155" roughness={0.72} />
    </mesh>
    {/* Boundary walls */}
    <mesh castShadow position={[0, 0.26, -7]}><boxGeometry args={[17, 0.52, 0.3]} /><meshStandardMaterial color="#cbd5e1" roughness={0.6} /></mesh>
    <mesh castShadow position={[-8.5, 0.26, 0]}><boxGeometry args={[0.3, 0.52, 14]} /><meshStandardMaterial color="#cbd5e1" roughness={0.6} /></mesh>
    <mesh castShadow position={[8.5, 0.26, 0]}><boxGeometry args={[0.3, 0.52, 14]} /><meshStandardMaterial color="#cbd5e1" roughness={0.6} /></mesh>
    {/* Ground floor */}
    <mesh castShadow receiveShadow position={[0, 0.72, 0.5]}>
      <boxGeometry args={[10.5, 1.44, 9.2]} />
      <meshStandardMaterial color={theme.wallColor} roughness={0.42} />
    </mesh>
    {/* GF Windows */}
    <WindowPane x={-3.2} y={0.92} z={5.12} w={1.3} h={0.72} />
    <WindowPane x={3.2} y={0.92} z={5.12} w={1.3} h={0.72} />
    <WindowPane x={-5.27} y={0.92} z={1} dir="z" w={1.1} h={0.72} />
    <WindowPane x={5.27} y={0.92} z={1} dir="z" w={1.1} h={0.72} />
    {/* GF Door */}
    <DoorFrame x={0} y={0.56} z={5.12} />
    {/* Entrance porch slab */}
    <mesh castShadow receiveShadow position={[0, 1.46, 5.95]}>
      <boxGeometry args={[4.2, 0.13, 1.6]} />
      <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
    </mesh>
    {[-1.6, 1.6].map(x => (
      <mesh key={x} castShadow position={[x, 0.78, 6.0]}>
        <cylinderGeometry args={[0.13, 0.13, 1.56, 14]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} />
      </mesh>
    ))}
    {/* GF Interior furniture */}
    <SofaObj x={0} y={0.44} z={1.0} color={theme.fabricColor} w={2.4} />
    <KitchenObj x={3.8} y={0} z={-1.5} w={2.6} color={theme.accentColor} />
    {/* First floor */}
    <mesh castShadow receiveShadow position={[0, 2.16, 0]}>
      <boxGeometry args={[9.2, 1.44, 7.8]} />
      <meshStandardMaterial color="#f8fafc" roughness={0.3} />
    </mesh>
    <WindowPane x={-3} y={2.36} z={3.92} w={1.1} h={0.64} />
    <WindowPane x={3} y={2.36} z={3.92} w={1.1} h={0.64} />
    <WindowPane x={0} y={2.36} z={-3.92} w={1.5} h={0.64} />
    <BedObj x={-2.5} y={2.62} z={-1.2} color={theme.fabricColor} />
    <BedObj x={2.5} y={2.62} z={-1.2} color="#334155" />
    {/* Flat roof + glass railings */}
    <mesh castShadow receiveShadow position={[0, 2.92, 0.2]}>
      <boxGeometry args={[9.6, 0.18, 8.2]} />
      <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
    </mesh>
    <GlassRail x={0} y={3.22} z={4.18} w={9.6} dir="x" />
    <GlassRail x={0} y={3.22} z={-3.98} w={9.6} dir="x" />
    <GlassRail x={-4.88} y={3.22} z={0.2} w={8.2} dir="z" />
    <GlassRail x={4.88} y={3.22} z={0.2} w={8.2} dir="z" />
    {/* Swimming pool */}
    <group position={[-5.5, 0, 1.5]}>
      <mesh receiveShadow position={[0, -0.03, 0]}><boxGeometry args={[4.8, 0.09, 3.2]} /><meshStandardMaterial color="#075985" roughness={0.05} /></mesh>
      <mesh receiveShadow position={[0, 0.02, 0]}><boxGeometry args={[4.6, 0.05, 3.0]} /><meshStandardMaterial color="#0ea5e9" roughness={0.02} metalness={0.1} transparent opacity={0.88} /></mesh>
      {isNight && <pointLight position={[0, 0.5, 0]} color="#22d3ee" intensity={3.5} distance={5.5} />}
    </group>
    {/* Garden trees */}
    <TreeObj x={5.8} z={-4.5} s={1.1} />
    <TreeObj x={6.8} z={-1.5} s={0.88} />
    <TreeObj x={-6.8} z={-4.5} s={1.05} />
    <TreeObj x={-5.2} z={-5.5} s={0.92} />
    <TreeObj x={6.0} z={4.0} s={0.82} />
    {/* Garage */}
    <mesh castShadow receiveShadow position={[5.0, 0.58, 4.8]}>
      <boxGeometry args={[3.8, 1.16, 3.2]} />
      <meshStandardMaterial color="#334155" roughness={0.52} />
    </mesh>
    <mesh position={[5.0, 0.58, 6.42]}>
      <boxGeometry args={[3.2, 1.16, 0.07]} />
      <meshStandardMaterial color="#64748b" roughness={0.2} metalness={0.45} />
    </mesh>
    {/* Patio sofa */}
    <SofaObj x={-5.0} y={0.0} z={-3.6} rot={0.55} color="#475569" w={1.7} />
    {/* Night lights */}
    {isNight && <pointLight position={[0, 1.6, 6.2]} color="#fef08a" intensity={1.6} distance={6.5} />}
    {isNight && <pointLight position={[-5.5, 0.6, 1.5]} color="#22d3ee" intensity={2.2} distance={4.5} />}
  </group>
);

/* ══════════════════════════════════════════════════════════════════
   3. PLOT — Surveyed land parcel with boundary, compass, roads
   ══════════════════════════════════════════════════════════════════ */
const Plot3D = ({ activeLayer, isNight }) => (
  <group>
    {/* Terrain */}
    <mesh receiveShadow position={[0, -0.13, 0]}>
      <boxGeometry args={[13, 0.26, 10]} />
      <meshStandardMaterial color="#4d7c0f" roughness={0.96} />
    </mesh>
    {/* Inner soil plot */}
    <mesh receiveShadow position={[0, -0.01, 0]}>
      <boxGeometry args={[11, 0.05, 8]} />
      <meshStandardMaterial color="#92400e" roughness={0.98} />
    </mesh>
    {/* Golden boundary lines */}
    <mesh position={[0, 0.05, -4]}><boxGeometry args={[11, 0.07, 0.09]} /><meshStandardMaterial color="#eab308" roughness={0.2} emissive="#eab308" emissiveIntensity={0.35} /></mesh>
    <mesh position={[0, 0.05, 4]}><boxGeometry args={[11, 0.07, 0.09]} /><meshStandardMaterial color="#eab308" roughness={0.2} emissive="#eab308" emissiveIntensity={0.35} /></mesh>
    <mesh position={[-5.5, 0.05, 0]}><boxGeometry args={[0.09, 0.07, 8]} /><meshStandardMaterial color="#eab308" roughness={0.2} emissive="#eab308" emissiveIntensity={0.35} /></mesh>
    <mesh position={[5.5, 0.05, 0]}><boxGeometry args={[0.09, 0.07, 8]} /><meshStandardMaterial color="#eab308" roughness={0.2} emissive="#eab308" emissiveIntensity={0.35} /></mesh>
    {/* Corner survey stakes */}
    {[[-5.5, -4], [5.5, -4], [-5.5, 4], [5.5, 4]].map(([x, z], i) => (
      <mesh key={i} castShadow position={[x, 0.32, z]}>
        <cylinderGeometry args={[0.07, 0.07, 0.64, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.45} />
      </mesh>
    ))}
    {/* Road */}
    <mesh receiveShadow position={[0, -0.09, 5.5]}>
      <boxGeometry args={[15, 0.05, 1.3]} />
      <meshStandardMaterial color="#1e293b" roughness={0.8} />
    </mesh>
    <mesh position={[0, -0.04, 5.5]}><boxGeometry args={[15, 0.02, 0.12]} /><meshStandardMaterial color="#fbbf24" /></mesh>
    {/* Compass rose */}
    <group position={[4.2, 0.07, -3.2]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh><cylinderGeometry args={[0.65, 0.65, 0.02, 32]} /><meshStandardMaterial color="#0f172a" roughness={0.4} /></mesh>
      <mesh position={[0, 0.01, -0.48]}><boxGeometry args={[0.09, 0.02, 0.52]} /><meshStandardMaterial color="#ef4444" /></mesh>
      <mesh position={[0, 0.01, 0.48]}><boxGeometry args={[0.09, 0.02, 0.52]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      <mesh position={[-0.48, 0.01, 0]}><boxGeometry args={[0.52, 0.02, 0.09]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      <mesh position={[0.48, 0.01, 0]}><boxGeometry args={[0.52, 0.02, 0.09]} /><meshStandardMaterial color="#f8fafc" /></mesh>
    </group>

    <TreeObj x={6.2} z={-5.2} s={1.2} />
    <TreeObj x={-6.2} z={-5.2} s={1.05} />
    <TreeObj x={6.2} z={3.2} s={0.92} />
  </group>
);

/* ══════════════════════════════════════════════════════════════════
   4. COMMERCIAL — Multi-storey Glass Office Tower
   ══════════════════════════════════════════════════════════════════ */
const Commercial3D = ({ theme, isNight }) => (
  <group>
    {/* Plaza base */}
    <mesh receiveShadow position={[0, -0.05, 0]}>
      <boxGeometry args={[13, 0.1, 11]} />
      <meshStandardMaterial color="#1e293b" roughness={0.42} />
    </mesh>
    {/* Lobby podium */}
    <mesh castShadow receiveShadow position={[0, 0.82, 1.2]}>
      <boxGeometry args={[10.5, 1.64, 7.2]} />
      <meshStandardMaterial color={theme.wallColor} roughness={0.32} />
    </mesh>
    <WindowPane x={-3.2} y={0.88} z={4.62} w={1.5} h={0.95} />
    <WindowPane x={0} y={0.88} z={4.62} w={1.5} h={0.95} />
    <WindowPane x={3.2} y={0.88} z={4.62} w={1.5} h={0.95} />
    {/* Lobby glass entry */}
    <mesh position={[0, 0.88, 4.64]}>
      <boxGeometry args={[2.6, 1.58, 0.07]} />
      <meshPhysicalMaterial color="#7dd3fc" transparent opacity={0.52} transmission={0.82} roughness={0.04} />
    </mesh>
    {/* Main glass tower */}
    <mesh castShadow position={[0, 4.4, -0.5]}>
      <boxGeometry args={[5.2, 6.4, 5.2]} />
      <meshPhysicalMaterial color="#38bdf8" roughness={0.04} metalness={0.82} transparent opacity={0.32} transmission={0.88} />
    </mesh>
    {/* Floor plates */}
    {[1.7, 2.55, 3.4, 4.25, 5.1, 5.95, 6.8].map((y, i) => (
      <mesh key={i} castShadow receiveShadow position={[0, y, -0.5]}>
        <boxGeometry args={[5.1, 0.09, 5.1]} />
        <meshStandardMaterial color={i % 2 === 0 ? "#e2e8f0" : "#cbd5e1"} roughness={0.6} />
      </mesh>
    ))}
    {/* Structural core */}
    <mesh castShadow position={[0, 4.4, -0.5]}>
      <boxGeometry args={[1.6, 6.4, 1.6]} />
      <meshStandardMaterial color="#94a3b8" roughness={0.5} />
    </mesh>
    {/* Secondary tower */}
    <mesh castShadow position={[4.2, 2.9, -0.5]}>
      <boxGeometry args={[3.4, 4.2, 3.4]} />
      <meshPhysicalMaterial color="#0284c7" roughness={0.06} metalness={0.72} transparent opacity={0.38} transmission={0.82} />
    </mesh>
    {[1.2, 2.1, 3.0, 3.9].map((y, i) => (
      <mesh key={i} position={[4.2, y, -0.5]}><boxGeometry args={[3.3, 0.08, 3.3]} /><meshStandardMaterial color="#e2e8f0" roughness={0.6} /></mesh>
    ))}
    {/* Helipad */}
    <mesh position={[0, 7.72, -0.5]}>
      <cylinderGeometry args={[1.25, 1.25, 0.07, 32]} />
      <meshStandardMaterial color="#fbbf24" roughness={0.22} />
    </mesh>
    {/* Outdoor plaza landscaping */}
    <TreeObj x={-5.5} z={4.5} s={1.1} />
    <TreeObj x={5.5} z={4.5} s={1.1} />
    {/* Night tower lights */}
    {isNight && [[0, 2.5, -0.5], [0, 3.5, -0.5], [0, 4.5, -0.5], [0, 5.5, -0.5],
      [4.2, 2.0, -0.5], [4.2, 3.0, -0.5]].map(([x, y, z], i) => (
      <pointLight key={i} position={[x, y, z]} intensity={0.65} distance={3.2} color="#fef08a" />
    ))}
  </group>
);

/* ══════════════════════════════════════════════════════════════════
   5. LUXURY RESIDENCE — Ultra-premium open plan, infinity pool
   ══════════════════════════════════════════════════════════════════ */
const Luxury3D = ({ theme, isNight }) => (
  <group>
    {/* Marble floor */}
    <mesh receiveShadow position={[0, -0.05, 0]}>
      <boxGeometry args={[15, 0.1, 10.5]} />
      <meshStandardMaterial color={theme.floorColor} roughness={0.03} metalness={0.26} />
    </mesh>
    {/* Full-height glass walls */}
    <GlassRail x={0} y={1.1} z={-5.25} w={15} dir="x" />
    <GlassRail x={0} y={1.1} z={5.25} w={15} dir="x" />
    <GlassRail x={-7.45} y={1.1} z={0} w={10.5} dir="z" />
    {/* Gold columns */}
    {[-7.0, -3.5, 3.5, 7.0].map(x =>
      [-4.8, 4.8].map(z => (
        <mesh key={`${x}-${z}`} castShadow position={[x, 1.25, z]}>
          <cylinderGeometry args={[0.1, 0.1, 2.5, 18]} />
          <meshStandardMaterial color="#eab308" metalness={0.96} roughness={0.08} />
        </mesh>
      ))
    )}
    {/* Grand living */}
    <SofaObj x={0} y={0.44} z={1.6} color={theme.fabricColor} w={3.8} />
    <SofaObj x={2.7} y={0.44} z={-0.4} rot={Math.PI / 2} color={theme.fabricColor} w={2.2} />
    <TableObj x={0} y={0.32} z={0.4} w={1.7} d={1.0} />
    {/* Marble fireplace */}
    <mesh castShadow position={[-7.3, 0.65, 0]}><boxGeometry args={[0.32, 1.3, 2.6]} /><meshStandardMaterial color="#f8fafc" roughness={0.1} /></mesh>
    {isNight && <pointLight position={[-6.8, 0.45, 0]} color="#f97316" intensity={3.5} distance={6.5} />}
    {/* Open kitchen island */}
    <KitchenObj x={5.0} y={0} z={-2.8} w={4.0} d={1.3} color={theme.accentColor} />
    <KitchenObj x={5.0} y={0} z={2.8} w={4.0} d={1.3} color={theme.accentColor} />
    {/* Dining */}
    <TableObj x={-2.2} y={0.32} z={-2.8} w={2.2} d={1.1} />
    {[-0.8, 0.1, 1.0].map(x => (
      <mesh key={x} castShadow position={[x - 2.2, 0.55, -2.8]}>
        <cylinderGeometry args={[0.19, 0.19, 0.05, 14]} />
        <meshStandardMaterial color="#b45309" roughness={0.3} />
      </mesh>
    ))}
    {/* Infinity pool */}
    <group position={[-1.8, -0.03, -7.0]}>
      <mesh receiveShadow><boxGeometry args={[6.5, 0.11, 2.7]} /><meshStandardMaterial color="#075985" roughness={0.04} /></mesh>
      <mesh position={[0, 0.07, 0]}><boxGeometry args={[6.2, 0.06, 2.45]} /><meshStandardMaterial color="#0ea5e9" roughness={0.02} transparent opacity={0.92} metalness={0.1} /></mesh>
      {isNight && <pointLight position={[0, 0.22, 0]} color="#22d3ee" intensity={4.5} distance={7} />}
    </group>
    {/* Sky deck */}
    <mesh castShadow receiveShadow position={[7.0, 0.05, -2.8]}>
      <boxGeometry args={[1.6, 0.09, 5.5]} />
      <meshStandardMaterial color="#475569" roughness={0.52} />
    </mesh>
    <GlassRail x={7.0} y={0.55} z={-2.8} w={5.5} dir="z" />
    {/* Art wall */}
    <mesh castShadow position={[0, 1.3, -5.2]}>
      <boxGeometry args={[4.5, 2.1, 0.09]} />
      <meshStandardMaterial color="#1d4ed8" roughness={0.22} metalness={0.3} />
    </mesh>
    {isNight && <pointLight position={[0, 2.4, 1.8]} color="#fef08a" intensity={1.6} distance={11} />}
    {isNight && <pointLight position={[-3.2, 2.4, -2.2]} color="#a78bfa" intensity={1.1} distance={9} />}
  </group>
);

/* ══════════════════════════════════════════════════════════════════
   6. TOWNSHIP — Full master plan: roads, blocks, parks, amenity hub
   ══════════════════════════════════════════════════════════════════ */
const Township3D = ({ theme, isNight }) => (
  <group scale={0.65}>
    {/* Master land */}
    <mesh receiveShadow position={[0, -0.13, 0]}>
      <boxGeometry args={[23, 0.26, 19]} />
      <meshStandardMaterial color="#166534" roughness={0.93} />
    </mesh>
    {/* Main arterial roads */}
    <mesh receiveShadow position={[0, 0.01, 0]}><boxGeometry args={[23, 0.03, 1.5]} /><meshStandardMaterial color="#1e293b" roughness={0.8} /></mesh>
    <mesh receiveShadow position={[0, 0.01, 0]}><boxGeometry args={[1.5, 0.03, 19]} /><meshStandardMaterial color="#1e293b" roughness={0.8} /></mesh>
    {/* Cross roads */}
    {[-7.5, 7.5].map(x => (
      <mesh key={x} position={[x, 0.01, 0]}><boxGeometry args={[0.8, 0.03, 19]} /><meshStandardMaterial color="#334155" /></mesh>
    ))}
    {[-7.5, 7.5].map(z => (
      <mesh key={z} position={[0, 0.01, z]}><boxGeometry args={[23, 0.03, 0.8]} /><meshStandardMaterial color="#334155" /></mesh>
    ))}
    {/* Residential blocks */}
    {[[-5.5, 3.8], [-5.5, -3.8], [5.5, 3.8], [5.5, -3.8]].map(([x, z], i) => (
      <group key={i} position={[x, 0, z]}>
        <mesh receiveShadow position={[0, -0.02, 0]}><boxGeometry args={[5.0, 0.04, 4.8]} /><meshStandardMaterial color="#4ade80" roughness={0.82} /></mesh>
        {[-1.4, 0, 1.4].map((bx, bi) => (
          <mesh key={bi} castShadow position={[bx, 1.3 + i * 0.25, 0]}>
            <boxGeometry args={[1.0, 2.6 + i * 0.5, 1.0]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#cbd5e1' : '#f8fafc'} roughness={0.42} />
          </mesh>
        ))}
      </group>
    ))}
    {/* Central clubhouse */}
    <group position={[0, 0, 0]}>
      <mesh castShadow position={[0, 0.52, 0]}><cylinderGeometry args={[1.3, 1.3, 1.04, 18]} /><meshStandardMaterial color="#fbbf24" metalness={0.32} roughness={0.22} /></mesh>
      <mesh castShadow position={[0, 1.14, 0]}><coneGeometry args={[1.42, 0.65, 18]} /><meshStandardMaterial color="#b45309" roughness={0.42} /></mesh>
      {isNight && <pointLight position={[0, 1.1, 0]} color="#fbbf24" intensity={3.5} distance={9} />}
    </group>
    {/* Amenity parks */}
    {[[-3.8, 3.8], [-3.8, -3.8], [3.8, 3.8], [3.8, -3.8]].map(([x, z], i) => (
      <group key={i} position={[x, 0, z]}>
        <mesh receiveShadow><boxGeometry args={[1.7, 0.04, 1.7]} /><meshStandardMaterial color="#4ade80" roughness={0.9} /></mesh>
        <TreeObj x={0} z={0} s={0.65} />
      </group>
    ))}
    {/* Water body */}
    <group position={[9.0, 0, 6.5]}>
      <mesh receiveShadow position={[0, -0.02, 0]}>
        <boxGeometry args={[3.8, 0.07, 3.2]} />
        <meshStandardMaterial color="#0ea5e9" roughness={0.03} transparent opacity={0.82} />
      </mesh>
      {isNight && <pointLight position={[0, 0.22, 0]} color="#22d3ee" intensity={2.2} distance={4.5} />}
    </group>
    {/* Outer trees */}
    {[-9, -6, 6, 9].map(x => (<TreeObj key={x} x={x} z={-9.5} s={1.1} />))}
    {[-9, -6, 6, 9].map(x => (<TreeObj key={x + 'b'} x={x} z={9.5} s={1.02} />))}
    {/* Phase markers */}
    {[-9.8, 0, 9.8].map((x, i) => (
      <mesh key={i} castShadow position={[x, 0.42, 9.8]}>
        <boxGeometry args={[0.16, 0.84, 0.16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.35} />
      </mesh>
    ))}
  </group>
);

/* ══════════════════════════════════════════════════════════════════
   7–12. REMAINING ASSET TYPES
   ══════════════════════════════════════════════════════════════════ */
const Retail3D = ({ theme, activeLayer, isNight }) => (
  <group>
    <mesh receiveShadow position={[0, -0.05, 0]}><boxGeometry args={[13, 0.1, 9.5]} /><meshStandardMaterial color={theme.floorColor} roughness={0.25} /></mesh>
    <mesh castShadow receiveShadow position={[0, 1.05, -2.2]}><boxGeometry args={[13, 2.1, 5.2]} /><meshStandardMaterial color={theme.wallColor} roughness={0.42} /></mesh>
    <mesh position={[0, 1.05, 2.7]}><boxGeometry args={[13, 2.1, 0.07]} /><meshPhysicalMaterial color="#7dd3fc" transparent opacity={0.42} transmission={0.88} roughness={0.04} /></mesh>
    {[-4.2, 0, 4.2].map(x => (<mesh key={x} castShadow position={[x, 1.05, 0]}><boxGeometry args={[0.09, 2.1, 5.2]} /><meshStandardMaterial color={theme.wallColor} roughness={0.5} /></mesh>))}
    {[-5.8, -1.9, 1.9, 5.8].map((x, i) => (
      <mesh key={i} castShadow position={[x, 2.0, 2.78]}>
        <boxGeometry args={[3.0, 0.52, 0.07]} />
        <meshStandardMaterial color={["#ef4444", "#3b82f6", "#eab308", "#10b981"][i]} roughness={0.3} emissive={["#ef4444", "#3b82f6", "#eab308", "#10b981"][i]} emissiveIntensity={isNight ? 0.65 : 0.12} />
      </mesh>
    ))}

    )}
    {isNight && [-4.2, 0, 4.2].map(x => (<pointLight key={x} position={[x, 2.1, 3.2]} intensity={1.3} distance={5.5} color="#fef08a" />))}
  </group>
);

const Duplex3D = ({ theme, isNight }) => (
  <group>
    <mesh receiveShadow position={[0, -0.05, 0]}><boxGeometry args={[10.5, 0.1, 7.2]} /><meshStandardMaterial color={theme.floorColor} roughness={0.3} /></mesh>
    <mesh castShadow receiveShadow position={[0, 0.72, 0]}><boxGeometry args={[9.5, 1.44, 6.8]} /><meshStandardMaterial color={theme.wallColor} roughness={0.42} /></mesh>
    <WindowPane x={-2.6} y={0.84} z={3.45} w={1.2} h={0.64} />
    <WindowPane x={2.6} y={0.84} z={3.45} w={1.2} h={0.64} />
    <DoorFrame x={0} y={0.57} z={3.46} />
    <SofaObj x={-1.6} y={0.44} z={0.5} color={theme.fabricColor} w={1.9} />
    <KitchenObj x={2.8} y={0} z={-0.6} w={2.2} color={theme.accentColor} />
    {[0, 1, 2, 3].map(i => (<mesh key={i} castShadow position={[3.7, 0.09 * i, 2.4 - i * 0.42]}><boxGeometry args={[1.3, 0.09, 0.42]} /><meshStandardMaterial color={theme.woodColor} roughness={0.3} /></mesh>))}
    <mesh castShadow receiveShadow position={[0, 2.18, 0]}><boxGeometry args={[9.5, 1.44, 6.8]} /><meshStandardMaterial color="#f8fafc" roughness={0.3} /></mesh>
    <WindowPane x={-2.6} y={2.3} z={3.45} w={1.2} h={0.64} />
    <WindowPane x={2.6} y={2.3} z={3.45} w={1.2} h={0.64} />
    <BedObj x={-2.2} y={2.64} z={-1.4} color={theme.fabricColor} />
    <BedObj x={2.2} y={2.64} z={-1.4} color="#334155" />
    <mesh castShadow receiveShadow position={[0, 2.94, 0]}><boxGeometry args={[9.8, 0.19, 7.2]} /><meshStandardMaterial color="#cbd5e1" roughness={0.5} /></mesh>
    <GlassRail x={0} y={3.24} z={3.7} w={9.8} dir="x" />
    {isNight && <pointLight position={[0, 1.45, 1.2]} intensity={1.3} distance={8.5} color="#fbbf24" />}
    {isNight && <pointLight position={[0, 2.85, 1.2]} intensity={0.85} distance={6.5} color="#fbbf24" />}
  </group>
);

const Penthouse3D = ({ theme, isNight }) => (
  <group>
    <mesh receiveShadow position={[0, -0.05, 0]}><boxGeometry args={[15, 0.1, 9.5]} /><meshStandardMaterial color={theme.floorColor} roughness={0.04} /></mesh>
    <GlassRail x={0} y={1.05} z={4.75} w={15} dir="x" />
    <GlassRail x={0} y={1.05} z={-4.75} w={15} dir="x" />
    <GlassRail x={7.5} y={1.05} z={0} w={9.5} dir="z" />
    <GlassRail x={-7.5} y={1.05} z={0} w={9.5} dir="z" />
    <mesh receiveShadow position={[-5.2, 0.03, 2.8]}><boxGeometry args={[4.2, 0.07, 4.2]} /><meshStandardMaterial color="#475569" roughness={0.52} /></mesh>
    <GlassRail x={-5.2} y={0.52} z={4.88} w={4.2} dir="x" />
    <group position={[4.8, -0.01, -0.6]}>
      <mesh receiveShadow><boxGeometry args={[3.8, 0.08, 2.8]} /><meshStandardMaterial color="#075985" /></mesh>
      <mesh position={[0, 0.06, 0]}><boxGeometry args={[3.6, 0.05, 2.6]} /><meshStandardMaterial color="#0ea5e9" roughness={0.02} transparent opacity={0.92} /></mesh>
      {isNight && <pointLight position={[0, 0.32, 0]} color="#22d3ee" intensity={3.5} distance={5.5} />}
    </group>
    <SofaObj x={0} y={0.44} z={1.8} color={theme.fabricColor} w={3.2} />
    <TableObj x={0} y={0.32} z={0.6} w={1.7} d={1.0} />
    <KitchenObj x={-5.2} y={0} z={-2.8} w={3.8} color={theme.accentColor} />
    {[-6.5, 6.5].map(x => [-4.2, 4.2].map(z => (<mesh key={`${x}${z}`} castShadow position={[x, 1.28, z]}><cylinderGeometry args={[0.1, 0.1, 2.56, 18]} /><meshStandardMaterial color="#eab308" metalness={0.96} roughness={0.08} /></mesh>)))}
    {isNight && <pointLight position={[0, 2.6, 0.5]} color="#fbbf24" intensity={1.6} distance={16} />}
  </group>
);

const Warehouse3D = ({ theme }) => (
  <group>
    <mesh receiveShadow position={[0, -0.05, 0]}><boxGeometry args={[14, 0.1, 10]} /><meshStandardMaterial color="#64748b" roughness={0.72} /></mesh>
    <mesh castShadow receiveShadow position={[0, 1.85, 0]}><boxGeometry args={[14, 3.7, 10]} /><meshStandardMaterial color="#334155" roughness={0.62} /></mesh>
    {[-4.5, 0, 4.5].map(x => (<mesh key={x} castShadow position={[x, 3.78, 0]} rotation={[0, 0, 0]}><boxGeometry args={[0.22, 0.22, 10]} /><meshStandardMaterial color="#1e293b" metalness={0.72} roughness={0.22} /></mesh>))}
    {[-4.8, 4.8].map(x => (<mesh key={x} castShadow position={[x, 1.45, 5.05]}><boxGeometry args={[3.2, 2.9, 0.07]} /><meshStandardMaterial color="#475569" metalness={0.52} roughness={0.32} /></mesh>))}
    {[-2.2, 2.2].map(x => (<mesh key={x} position={[x, 3.62, 0]}><boxGeometry args={[2.2, 0.07, 7.5]} /><meshPhysicalMaterial color="#7dd3fc" transparent opacity={0.36} transmission={0.82} roughness={0.04} /></mesh>))}
    <mesh castShadow position={[0, 0.65, 0]}><boxGeometry args={[1.6, 1.3, 2.2]} /><meshStandardMaterial color="#eab308" roughness={0.42} /></mesh>
    <pointLight position={[0, 3.2, 0]} intensity={2.2} distance={20} color="#e0f2fe" />
  </group>
);

const Industrial3D = () => (
  <group>
    <mesh receiveShadow position={[0, -0.05, 0]}><boxGeometry args={[12.5, 0.1, 9.5]} /><meshStandardMaterial color="#475569" metalness={0.42} roughness={0.92} /></mesh>
    <mesh castShadow receiveShadow position={[-1, 1.55, 0]}><boxGeometry args={[8.5, 3.1, 7.2]} /><meshStandardMaterial color="#334155" roughness={0.62} /></mesh>
    {[-2.6, 0, 2.6].map((x, i) => (<mesh key={i} castShadow position={[x, 2.3, -1.1]}><cylinderGeometry args={[0.92, 0.92, 4.6, 18]} /><meshStandardMaterial color="#cbd5e1" metalness={0.82} roughness={0.26} /></mesh>))}
    {[-2.6, 0, 2.6].map((x, i) => (<mesh key={i} castShadow position={[x, 4.72, -1.1]}><coneGeometry args={[0.95, 0.65, 18]} /><meshStandardMaterial color="#94a3b8" metalness={0.72} roughness={0.32} /></mesh>))}
    <mesh position={[0, 2.6, 1.7]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.08, 0.08, 9.5]} /><meshStandardMaterial color="#ef4444" metalness={0.92} roughness={0.22} /></mesh>
    <mesh position={[0, 1.6, 1.7]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.06, 0.06, 9.5]} /><meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.22} /></mesh>
    <mesh castShadow position={[4.8, 2.6, 0]}><cylinderGeometry args={[0.32, 0.38, 5.2, 14]} /><meshStandardMaterial color="#292524" roughness={0.72} /></mesh>
    <pointLight position={[0, 3.8, 0]} intensity={1.65} distance={16} color="#fef08a" />
  </group>
);

const MixedUse3D = ({ theme }) => (
  <group scale={0.75}>
    <mesh receiveShadow position={[0, -0.05, 0]}><boxGeometry args={[17, 0.1, 11.5]} /><meshStandardMaterial color="#334155" roughness={0.52} /></mesh>
    <mesh castShadow receiveShadow position={[0, 0.72, 2.2]}><boxGeometry args={[12.5, 1.44, 4.2]} /><meshStandardMaterial color="#cbd5e1" roughness={0.52} /></mesh>
    <mesh castShadow position={[-4.2, 3.6, -2.2]}>
      <boxGeometry args={[3.8, 7.2, 3.8]} />
      <meshPhysicalMaterial color="#38bdf8" roughness={0.08} metalness={0.72} transparent opacity={0.42} transmission={0.82} />
    </mesh>
    {[1, 2, 3, 4, 5, 6].map(y => (<mesh key={y} position={[-4.2, y, -2.2]}><boxGeometry args={[3.7, 0.08, 3.7]} /><meshStandardMaterial color="#e2e8f0" roughness={0.62} /></mesh>))}
    <mesh castShadow position={[4.2, 2.3, -2.2]}>
      <boxGeometry args={[3.8, 4.6, 3.8]} />
      <meshPhysicalMaterial color="#0284c7" roughness={0.08} metalness={0.62} transparent opacity={0.38} transmission={0.82} />
    </mesh>
    {[1, 2, 3, 4].map(y => (<mesh key={y} position={[4.2, y, -2.2]}><boxGeometry args={[3.7, 0.08, 3.7]} /><meshStandardMaterial color="#cbd5e1" roughness={0.62} /></mesh>))}
    <TreeObj x={-7} z={4.5} s={0.95} />
    <TreeObj x={7} z={4.5} s={0.95} />
    <TreeObj x={0} z={-4.5} s={1.05} />
  </group>
);


/* ══════════════════════════════════════════════════════════════════
   RADAR SCOREBOARD CHART COMPONENT
   ══════════════════════════════════════════════════════════════════ */
const RadarChart = ({ score, metrics }) => {
  const c = 75, r = 45;
  const points = useMemo(() => {
    return metrics.map((m, i) => {
      const angle = (i * 2 * Math.PI) / metrics.length - Math.PI / 2;
      const factor = m.val / 100;
      const x = c + r * factor * Math.cos(angle);
      const y = c + r * factor * Math.sin(angle);
      return { x, y, label: m.label };
    });
  }, [metrics]);

  const polyPoints = points.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
      <svg width="150" height="150" style={{ overflow: "visible" }}>
        {/* Background spokes/rings */}
        {[0.3, 0.6, 1.0].map((f, idx) => (
          <circle key={idx} cx={c} cy={c} r={r * f} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        ))}
        {points.map((p, i) => {
          const angle = (i * 2 * Math.PI) / metrics.length - Math.PI / 2;
          return (
            <line key={i} x1={c} y1={c} x2={c + r * Math.cos(angle)} y2={c + r * Math.sin(angle)} stroke="rgba(255,255,255,0.05)" />
          );
        })}
        {/* Polygon */}
        <polygon points={polyPoints} fill="rgba(20, 184, 166, 0.15)" stroke="var(--ev-accent)" strokeWidth="1.5" />
        {/* Score text */}
        <text x={c} y={c + 5} textAnchor="middle" fill="#fff" fontSize="16" fontWeight="950">{score}</text>
      </svg>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   10-YEAR FORECAST CHART (Interactive SVG)
   ══════════════════════════════════════════════════════════════════ */
const ForecastChart = ({ data }) => {
  const w = 310, h = 100;
  const points = useMemo(() => {
    if (!data.length) return [];
    const allVals = data.flatMap(d => [d.base, d.bull, d.bear]);
    const maxV = Math.max(...allVals), minV = Math.min(...allVals);
    const range = maxV - minV || 1;

    return data.map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      return {
        x,
        baseY: h - ((d.base - minV) / range) * h,
        bullY: h - ((d.bull - minV) / range) * h,
        bearY: h - ((d.bear - minV) / range) * h,
        year: d.year,
        baseVal: d.base,
      };
    });
  }, [data]);

  const baseLine = points.map(p => `${p.x},${p.baseY}`).join(" L ");
  const bullLine = points.map(p => `${p.x},${p.bullY}`).join(" L ");
  const bearLine = points.map(p => `${p.x},${p.bearY}`).join(" L ");

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ overflow: "visible" }}>
        {/* Projections lines */}
        <path d={`M ${bullLine}`} fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
        <path d={`M ${bearLine}`} fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
        <path d={`M ${baseLine}`} fill="none" stroke="var(--ev-accent)" strokeWidth="2.5" />
        {/* End markers */}
        {points.length > 0 && (
          <circle cx={points[points.length-1].x} cy={points[points.length-1].baseY} r="3.5" fill="var(--ev-accent)" />
        )}
      </svg>
      {/* Year labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 8, color: "var(--ev-text-sec)", fontWeight: 700 }}>
        <span>{data[0]?.year}</span>
        <span>{data[Math.floor(data.length/2)]?.year}</span>
        <span>{data[data.length-1]?.year}</span>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   GLOBAL OVERLAYS (Metro & Growth Maps)
   ══════════════════════════════════════════════════════════════════ */
const GlobalOverlays = ({ activeLayer }) => (
  <group>
    {activeLayer === "growth" && (
      <group position={[0, 0.04, 0]}>
        {[-4.2, -2.1, 0, 2.1, 4.2].map(x =>
          [-2.1, 0, 2.1].map(z => {
            const v = Math.sin(x) * Math.cos(z);
            return (
              <mesh key={`${x}-${z}`} position={[x, 0.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[2.0, 2.0]} />
                <meshBasicMaterial color={v > 0.3 ? "#ef4444" : v > -0.2 ? "#f59e0b" : "#10b981"} transparent opacity={0.35} />
              </mesh>
            );
          })
        )}
        <mesh position={[0, 1.6, 0]} rotation={[0.32, 0, 0.12]}>
          <torusGeometry args={[7.8, 0.045, 8, 64]} />
          <meshBasicMaterial color="#eab308" transparent opacity={0.52} />
        </mesh>
      </group>
    )}
    {activeLayer === "metro" && (
      <group>
        <mesh position={[0, 1.6, -5.0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.055, 0.055, 20]} />
          <meshBasicMaterial color="#06b6d4" />
        </mesh>
        <mesh position={[0, 1.6, -5.0]}><sphereGeometry args={[0.22, 12, 12]} /><meshBasicMaterial color="#22d3ee" /></mesh>
        <mesh position={[-6.0, 1.6, -5.0]}><sphereGeometry args={[0.18, 12, 12]} /><meshBasicMaterial color="#22d3ee" /></mesh>
        <mesh position={[6.0, 1.6, -5.0]}><sphereGeometry args={[0.18, 12, 12]} /><meshBasicMaterial color="#22d3ee" /></mesh>
      </group>
    )}
  </group>
);

/* ══════════════════════════════════════════════════════════════════
   MAIN CONTAINER CODE
   ══════════════════════════════════════════════════════════════════ */
const Explorer3D = () => {
  const { metadata } = useMarketMetadata();

  /* — Basic Controls — */
  const [city, setCity] = useState("Hyderabad");
  const [locality, setLocality] = useState("");
  const [assetType, setAssetType] = useState("apartment");
  const [configVal, setConfigVal] = useState(3); // BHK or Floors
  const [area, setArea] = useState(140); // sqm
  const [budget, setBudget] = useState(14000000); // budget slider
  const [interiorTheme, setInteriorTheme] = useState("luxury");
  const [isNight, setIsNight] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeLayer, setActiveLayer] = useState("none"); // sun path, metro networks, etc.
  const [selectedRoom, setSelectedRoom] = useState("living");

  // Camera glide settings
  const targetPos = useMemo(() => new Vector3(13, 14, 16), []);
  const targetLookAt = useMemo(() => new Vector3(0, 0, 0), []);
  const [resetCounter, setResetCounter] = useState(0);

  // Dynamic lists
  const localities = useMemo(() => topLocalities(metadata, city, 10), [metadata, city]);

  useEffect(() => {
    setLocality(localities[0] || "");
  }, [city, localities]);

  // Pricing & Metrics
  const profile = useMemo(() => getAdjustedProfile(city, assetType, configVal), [city, assetType, configVal]);
  const totalValuation = useMemo(() => {
    return estimatePrice({ city, bhk: configVal, area_sqm: area, propertyType: assetType });
  }, [city, configVal, area, assetType]);

  const forecast = useMemo(() => generateForecast(totalValuation, 10), [totalValuation]);

  // Scores
  const demandIndex = profile.demand;
  const growthRate = profile.growth;
  const yieldRate = profile.yield;
  const infrastructure = profile.infra;
  const healthScore = Math.round((demandIndex + infrastructure + growthRate * 6) / 8);

  const recommendation = useMemo(() => {
    if (growthRate > 11 && yieldRate > 3.8) return "STRONG BUY";
    if (growthRate > 9) return "BUY";
    if (growthRate > 7.5) return "HOLD";
    return "WATCH";
  }, [growthRate, yieldRate]);

  // Radar metrics data
  const radarMetrics = [
    { label: "Demand", val: demandIndex },
    { label: "Growth", val: Math.round(growthRate * 6) },
    { label: "Rental", val: Math.round(yieldRate * 20) },
    { label: "Liquidity", val: 84 },
    { label: "Risk", val: profile.risk === "Low" ? 88 : 65 },
  ];

  // UI States
  const [flash, setFlash] = useState(false);

  /* — AI Copilot Console — */
  const [messages, setMessages] = useState([
    { type: "ai", text: "Welcome to EstateVerse Explorer. I've prepared structural layout configurations for this asset. Ask me any investment-related query." }
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const handleSendCopilot = (text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { type: "user", text }]);
    setInputMsg("");

    setTimeout(() => {
      const lower = text.toLowerCase();
      let reply = "";
      if (lower.includes("expensive") || lower.includes("price") || lower.includes("valuation")) {
        reply = `The valuation of ${formatINR(totalValuation)} is supported by the ${city} growth trajectory of +${growthRate}% CAGR and a high localized Infrastructure rating of ${infrastructure}/100.`;
      } else if (lower.includes("rent") || lower.includes("yield")) {
        reply = `Expected rental yield for this layout is ${yieldRate}% annually, translating to approximately ${formatINR(totalValuation * yieldRate / 100 / 12)} per month in current market conditions.`;
      } else if (lower.includes("invest") || lower.includes("buy")) {
        reply = `Our algorithms issue a **${recommendation}** rating. With a health index of ${healthScore}/100 and risk profile rated as **${profile.risk}**, capital appreciation potential remains top-tier.`;
      } else if (lower.includes("forecast") || lower.includes("future")) {
        reply = `Based on our 10-year model, this property is projected to appreciate from ${formatINR(totalValuation)} to **${formatINR(forecast[10].base)}** by year 2036.`;
      } else if (lower.includes("risk")) {
        reply = `Key risks: localized supply pressure in ${locality || "this micro-market"}. However, risk buffer remains stable due to the ${profile.risk} risk profile.`;
      } else {
        reply = `I have logged your request. For this specific configuration of ${area} m² in ${locality}, ${city}, we project appreciation of ${growthRate}% YoY and liquidity rating of 84/100.`;
      }
      setMessages(prev => [...prev, { type: "ai", text: reply }]);
    }, 700);
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      setIsRecording(false);
      handleSendCopilot("Should I invest here?");
    } else {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        handleSendCopilot("What is the rental potential?");
      }, 2500);
    }
  };

  // Theme Config styles
  const THEME_STYLES = {
    luxury: { id: "luxury", name: "Luxury Palace", desc: "White marble & gold accents", floorColor: "#f8fafc", wallColor: "#0f172a", woodColor: "#b45309", fabricColor: "#1d4ed8", accentColor: "#fbbf24" },
    modern: { id: "modern", name: "Urban Modern", desc: "Charcoal gray & steel", floorColor: "#d97706", wallColor: "#334155", woodColor: "#78350f", fabricColor: "#475569", accentColor: "#0f172a" },
    minimal: { id: "minimal", name: "Nordic Minimal", desc: "Ash wood & light concrete", floorColor: "#a1a1aa", wallColor: "#f1f5f9", woodColor: "#d97706", fabricColor: "#e4e4e7", accentColor: "#52525b" },
    scandinavian: { id: "scandinavian", name: "Scandinavian", desc: "Natural woods & light hues", floorColor: "#e2e8f0", wallColor: "#f8fafc", woodColor: "#a16207", fabricColor: "#cbd5e1", accentColor: "#475569" },
    contemporary: { id: "contemporary", name: "Contemporary", desc: "Bold patterns & glass", floorColor: "#f1f5f9", wallColor: "#020617", woodColor: "#b45309", fabricColor: "#3b82f6", accentColor: "#ef4444" },
    industrial: { id: "industrial", name: "Industrial", desc: "Raw metals & brick walls", floorColor: "#64748b", wallColor: "#451a03", woodColor: "#451a03", fabricColor: "#334155", accentColor: "#f97316" }
  };

  const activeThemeConfig = THEME_STYLES[interiorTheme] || THEME_STYLES.luxury;

  // Zoom to Room coordinates
  const ROOM_COORDS = {
    living:  { look: [0, 0, 0], pos: [6, 8, 9] },
    kitchen: { look: [2.5, 0, -2.5], pos: [6, 7, 3] },
    master:  { look: [-2.5, 0, -2], pos: [-2, 7, 5] },
    balcony: { look: [-3.5, 0, 3.5], pos: [-4, 6, 8] }
  };

  const handleRoomFocus = (rId) => {
    setSelectedRoom(rId);
    if (ROOM_COORDS[rId]) {
      targetLookAt.set(...ROOM_COORDS[rId].look);
      targetPos.set(...ROOM_COORDS[rId].pos);
    }
  };

  const handleResetCamera = () => {
    setSelectedRoom("");
    setResetCounter(prev => prev + 1);
  };

  // Capture Screenshot mechanics
  const handleScreenshot = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
    alert("Camera viewport captured and exported to workspace reports!");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Workspace URL link copied to clipboard!");
  };

  const toggleFullscreen = () => setIsFullscreen(prev => !prev);

  return (
    <div className="ev-explorer-page">
      {/* Visual flash capture effect */}
      {flash && <div className="ev-flash-overlay" />}

      <div className="ev-main-layout">
        {/* ── LEFT PANEL: CONFIGURATION & CONFIGURATOR ───────────────── */}
        <div className="ev-side-panel">
          <div className="ev-header-block">
            <span className="ev-eyebrow">Visual Studio</span>
            <h2 className="ev-title">Spatial Studio</h2>
            <p className="ev-sub">Matterport & Tesla-class property configuration studio.</p>
          </div>

          {/* Config Filters */}
          <div className="ev-form-group">
            <label className="ev-label">Asset Type</label>
            <select className="ev-select" value={assetType} onChange={e => setAssetType(e.target.value)}>
              <option value="apartment">Apartment Suite</option>
              <option value="villa">Luxury Villa</option>
              <option value="plot">Plot / Land parcel</option>
              <option value="commercial">Commercial Office</option>
              <option value="retail">Retail Space</option>
              <option value="luxury">Luxury Residence</option>
              <option value="township">Township Masterplan</option>
              <option value="duplex">Duplex Apartment</option>
              <option value="penthouse">Penthouse Skydeck</option>
              <option value="warehouse">Industrial Warehouse</option>
              <option value="industrial">Industrial Pipeline</option>
              <option value="mixed_use">Mixed Use Towers</option>
            </select>
          </div>

          <div className="ev-form-group">
            <label className="ev-label">City</label>
            <select className="ev-select" value={city} onChange={e => setCity(e.target.value)}>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="ev-form-group">
            <label className="ev-label">Locality</label>
            <select className="ev-select" value={locality} onChange={e => setLocality(e.target.value)} disabled={!localities.length}>
              {localities.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="ev-form-group">
            <label className="ev-label">Configuration</label>
            <div className="ev-swatch-grid">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  className={`ev-swatch-btn${configVal === n ? " active" : ""}`}
                  onClick={() => { setConfigVal(n); handleResetCamera(); }}
                >
                  {n} BHK
                </button>
              ))}
            </div>
          </div>

          <div className="ev-slider-container">
            <div className="ev-slider-meta">
              <span className="ev-label">Built Up Area</span>
              <span className="ev-slider-val">{areaSqmToSqft(area).toLocaleString("en-IN")} sq ft</span>
            </div>
            <input
              type="range" min={50} max={450} step={10} value={area}
              onChange={e => setArea(Number(e.target.value))}
              className="ev-slider"
            />
          </div>

          <div className="ev-slider-container">
            <div className="ev-slider-meta">
              <span className="ev-label">Budget ceiling</span>
              <span className="ev-slider-val">{formatINR(budget)}</span>
            </div>
            <input
              type="range" min={3000000} max={80000000} step={1000000} value={budget}
              onChange={e => setBudget(Number(e.target.value))}
              className="ev-slider"
            />
          </div>

          {/* Theme customizer */}
          <div className="ev-form-group">
            <label className="ev-label">Interior Finishes</label>
            <div className="ev-theme-list">
              {Object.values(THEME_STYLES).slice(0, 3).map(t => (
                <div
                  key={t.id}
                  className={`ev-theme-card${interiorTheme === t.id ? " active" : ""}`}
                  onClick={() => setInteriorTheme(t.id)}
                >
                  <div className="ev-theme-info">
                    <span className="ev-theme-title">{t.name}</span>
                    <span className="ev-theme-sub">{t.desc}</span>
                  </div>
                  <div className="ev-theme-indicator" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CENTER PANEL: 3D VIEWPORT CANVAS ───────────────────────── */}
        <div className={`ev-viewport-panel${isFullscreen ? " fullscreen" : ""}`}>
          {/* Overlay Headings HUD */}
          <div className="ev-hud-legend">
            <div className="ev-hud-title">
              {locality || "Micro Market"}, {city}
            </div>
            <div className="ev-hud-sub">
              {configVal} BHK {assetType.toUpperCase()} · {activeThemeConfig.name}
            </div>
          </div>

          {/* Control overlay guide */}
          <div className="ev-hud-hint">
            <Navigation size={10} />
            DRAG ROTATE · SCROLL ZOOM
          </div>

          {/* Render Layers Control bar for Plots/Towers */}
          <div className="ev-layer-controls">
            <button className={`ev-layer-btn${activeLayer === "none" ? " active" : ""}`} onClick={() => setActiveLayer("none")}>Standard</button>
            <button className={`ev-layer-btn${activeLayer === "metro" ? " active" : ""}`} onClick={() => setActiveLayer("metro")}>Metro Network</button>
            <button className={`ev-layer-btn${activeLayer === "growth" ? " active" : ""}`} onClick={() => setActiveLayer("growth")}>Growth Overlays</button>
          </div>

          {/* 3D Canvas Context */}
          <Canvas shadows camera={{ fov: 40, position: [13, 14, 16] }}>
            <color attach="background" args={[isNight ? "#020617" : "#0f172a"]} />
            <fog attach="fog" args={[isNight ? "#020617" : "#0f172a", 15, 28]} />

            {/* LIGHTS ENVIRONMENT */}
            <ambientLight intensity={isNight ? 0.15 : 0.7} color={isNight ? "#1e1b4b" : "#f1f5f9"} />
            <directionalLight
              castShadow
              position={isNight ? [-8, 8, -6] : [6, 12, 8]}
              intensity={isNight ? 0.3 : 1.5}
              color={isNight ? "#818cf8" : "#fef08a"}
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
              shadow-bias={-0.0005}
            />
            <hemisphereLight args={[isNight ? "#312e81" : "#bae6fd", "#020617", isNight ? 0.1 : 0.35]} />

            {/* Silos / towers based on selected Asset Type */}
            {assetType === "apartment" && (
              <Apartment3D config={configVal} theme={activeThemeConfig} isNight={isNight} onSelectRoom={handleRoomFocus} />
            )}
            {assetType === "villa" && <Villa3D theme={activeThemeConfig} isNight={isNight} />}
            {assetType === "plot" && <Plot3D isNight={isNight} />}
            {assetType === "commercial" && <Commercial3D theme={activeThemeConfig} isNight={isNight} />}
            {assetType === "retail" && <Retail3D theme={activeThemeConfig} isNight={isNight} />}
            {assetType === "luxury" && <Luxury3D theme={activeThemeConfig} isNight={isNight} />}
            {assetType === "township" && <Township3D theme={activeThemeConfig} isNight={isNight} />}
            {assetType === "duplex" && <Duplex3D theme={activeThemeConfig} isNight={isNight} />}
            {assetType === "penthouse" && <Penthouse3D theme={activeThemeConfig} isNight={isNight} />}
            {assetType === "warehouse" && <Warehouse3D theme={activeThemeConfig} />}
            {assetType === "industrial" && <Industrial3D />}
            {assetType === "mixed_use" && <MixedUse3D theme={activeThemeConfig} />}

            {/* Shadow receiver floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
              <planeGeometry args={[50, 50]} />
              <shadowMaterial opacity={isNight ? 0.6 : 0.3} />
            </mesh>

            {/* Global Overlays */}
            <GlobalOverlays activeLayer={activeLayer} />

            {/* Controls camera glide */}
            <CameraController targetPos={targetPos} targetLookAt={targetLookAt} resetCounter={resetCounter} />

            <OrbitControls
              enablePan
              enableRotate
              enableZoom
              maxPolarAngle={Math.PI / 2.05}
              minDistance={5}
              maxDistance={25}
            />
          </Canvas>

          {/* HUD Floating Actions controls */}
          <div className="ev-floating-toolbar">
            <button className="ev-hud-btn" onClick={() => targetPos.multiplyScalar(0.9)} title="Zoom In"><ZoomIn size={16} /></button>
            <button className="ev-hud-btn" onClick={() => targetPos.multiplyScalar(1.1)} title="Zoom Out"><ZoomOut size={16} /></button>
            <div className="ev-hud-divider" />
            <button className="ev-hud-btn" onClick={() => setIsNight(!isNight)} title={isNight ? "Switch to Day" : "Switch to Night"}>
              {isNight ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="ev-hud-divider" />
            <button className="ev-hud-btn" onClick={handleResetCamera} title="Reset camera angle"><RotateCcw size={16} /></button>
            <button className="ev-hud-btn" onClick={handleScreenshot} title="Capture Snapshot"><Camera size={16} /></button>
            <button className="ev-hud-btn" onClick={handleShare} title="Share Scene Link"><Share2 size={16} /></button>
            <div className="ev-hud-divider" />
            <button className="ev-hud-btn" onClick={toggleFullscreen} title="Toggle Fullscreen">
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>

        {/* ── RIGHT PANEL: AI INSIGHTS & COPILOT CHAT ────────────────── */}
        <div className="ev-side-panel">
          <div className="ev-header-block">
            <span className="ev-eyebrow">Real-Time Forecast</span>
            <h2 className="ev-title">AI Valuations</h2>
            <p className="ev-sub">BlackRock-grade real estate analytics engine.</p>
          </div>

          {/* Dynamic recommendation badge */}
          <div className="ev-badge-container">
            <span className="ev-badge-heading">AI Rating Verdict</span>
            <span className={`ev-recommendation-badge ${
              recommendation === "STRONG BUY" || recommendation === "BUY" ? "buy" : recommendation === "HOLD" ? "hold" : "avoid"
            }`}>
              {recommendation}
            </span>
          </div>

          {/* Property Health radar scoreboard */}
          <div className="ev-form-group">
            <div className="ev-section-title"><Activity size={12} /> Asset Health Index</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignItems: "center" }}>
              <RadarChart score={healthScore} metrics={radarMetrics} />
              <div className="ev-health-breakdown">
                {radarMetrics.slice(0, 3).map(m => (
                  <div key={m.label} className="ev-health-row">
                    <div className="ev-health-meta">
                      <span>{m.label}</span>
                      <span>{m.val}%</span>
                    </div>
                    <div className="ev-bar-track">
                      <div className="ev-bar-fill" style={{ width: `${m.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive price forecast center */}
          <div className="ev-chart-container">
            <div className="ev-chart-header">
              <span className="ev-label">10Y Appreciation Forecast</span>
              <div className="ev-chart-legend">
                <span><span className="ev-legend-dot" style={{ background: "#10b981" }} />Bull</span>
                <span><span className="ev-legend-dot" style={{ background: "var(--ev-accent)" }} />Base</span>
              </div>
            </div>
            <ForecastChart data={forecast} />
          </div>

          {/* Focus room buttons (Specific for Apartments layout) */}
          {assetType === "apartment" && (
            <div className="ev-form-group">
              <span className="ev-label">Focused Spaces</span>
              <div className="ev-room-row">
                <button className={`ev-room-pill${selectedRoom === "living" ? " active" : ""}`} onClick={() => handleRoomFocus("living")}><Eye size={10} />Living</button>
                <button className={`ev-room-pill${selectedRoom === "kitchen" ? " active" : ""}`} onClick={() => handleRoomFocus("kitchen")}><Eye size={10} />Kitchen</button>
                <button className={`ev-room-pill${selectedRoom === "master" ? " active" : ""}`} onClick={() => handleRoomFocus("master")}><Eye size={10} />Master Bed</button>
                <button className={`ev-room-pill${selectedRoom === "balcony" ? " active" : ""}`} onClick={() => handleRoomFocus("balcony")}><Eye size={10} />Balcony</button>
              </div>
            </div>
          )}

          {/* AI Property Copilot Console */}
          <div className="ev-form-group">
            <div className="ev-section-title"><Bot size={12} /> AI Property Copilot</div>
            <div className="ev-copilot-container">
              <div className="ev-chat-window">
                {messages.map((m, idx) => (
                  <div key={idx} className={`ev-msg ${m.type}`}>
                    {m.text}
                  </div>
                ))}
              </div>

              {/* Preselected templates queries */}
              <div className="ev-copilot-prompts">
                <button className="ev-prompt-chip" onClick={() => handleSendCopilot("Should I invest here?")}>Should I invest here?</button>
                <button className="ev-prompt-chip" onClick={() => handleSendCopilot("What is the rental potential?")}>Rental Yield?</button>
                <button className="ev-prompt-chip" onClick={() => handleSendCopilot("Explain risk factors.")}>Risk factors?</button>
              </div>

              {/* Input bar controls */}
              <div className="ev-copilot-input-row">
                <input
                  type="text"
                  className="ev-copilot-input"
                  placeholder="Ask copilot..."
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendCopilot(inputMsg)}
                />
                <button className={`ev-copilot-btn${isRecording ? " recording" : ""}`} onClick={handleVoiceInput} title="Record voice query">
                  <Mic size={14} />
                </button>
                <button className="ev-copilot-btn" onClick={() => handleSendCopilot(inputMsg)}>
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explorer3D;
