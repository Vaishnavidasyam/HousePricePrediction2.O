import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const CitySkyline = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a1830, 1); // blue hour deep cobalt
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0d1f3a, 0.011); // teal-blue volumetric fog

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 22, 70);
    camera.lookAt(0, 8, 0);

    // ---------- LIGHTING ----------
    const ambient = new THREE.AmbientLight(0x2a3a55, 0.7); // cool blue ambient
    scene.add(ambient);

    // Horizon hemisphere — blue sky to amber low light
    const hemi = new THREE.HemisphereLight(0x4a6fb8, 0x1a1208, 0.4);
    scene.add(hemi);

    const moon = new THREE.DirectionalLight(0xa8c5ff, 0.55);
    moon.position.set(-40, 60, 20);
    scene.add(moon);

    const warmKey = new THREE.PointLight(0xE9C783, 1.4, 130);
    warmKey.position.set(20, 30, 30);
    scene.add(warmKey);

    const mintRim = new THREE.PointLight(0x5DEAD0, 1.0, 130);
    mintRim.position.set(-30, 20, -10);
    scene.add(mintRim);

    // Horizon glow plane (sky gradient)
    const skyGeo = new THREE.PlaneGeometry(800, 220);
    const skyCanvas = document.createElement("canvas");
    skyCanvas.width = 4;
    skyCanvas.height = 220;
    const sctx = skyCanvas.getContext("2d");
    const sg = sctx.createLinearGradient(0, 0, 0, 220);
    sg.addColorStop(0, "#06070A");
    sg.addColorStop(0.45, "#0a1830");
    sg.addColorStop(0.75, "#1c3358");
    sg.addColorStop(0.92, "#3d4d6f");
    sg.addColorStop(0.98, "#b88a4a");
    sg.addColorStop(1, "#d4a26a");
    sctx.fillStyle = sg;
    sctx.fillRect(0, 0, 4, 220);
    const skyTex = new THREE.CanvasTexture(skyCanvas);
    const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, depthWrite: false, fog: false });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    skyMesh.position.set(0, 60, -250);
    scene.add(skyMesh);

    // Distant city silhouette layer (low rooftops on horizon)
    const horizonGroup = new THREE.Group();
    const horizonGeometries = [];
    const horizonMat = new THREE.MeshBasicMaterial({ color: 0x081229, fog: false });
    for (let i = 0; i < 60; i++) {
      const w = 4 + Math.random() * 10;
      const h = 6 + Math.random() * 16;
      const geo = new THREE.BoxGeometry(w, h, 2);
      horizonGeometries.push(geo);
      const m = new THREE.Mesh(geo, horizonMat);
      m.position.set(-300 + i * 10 + Math.random() * 6, h / 2 - 2, -180);
      horizonGroup.add(m);
    }
    scene.add(horizonGroup);

    // ---------- GROUND ----------
    const groundGeo = new THREE.PlaneGeometry(400, 400);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x0a1224, roughness: 0.7, metalness: 0.35 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);

    // Grid lines on ground for that techy feel
    const grid = new THREE.GridHelper(400, 80, 0x1d2c4a, 0x0f1a30);
    grid.position.y = 0.01;
    scene.add(grid);

    // ---------- BUILDINGS ----------
    const cityGroup = new THREE.Group();
    scene.add(cityGroup);

    const createdGeometries = [];
    const createdTextures = [];
    const createdMaterials = [];

    // Window texture (procedural) — emissive grid for lit windows
    function makeWindowTexture(w = 64, h = 128, color = "#E9C783") {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#06070A";
      ctx.fillRect(0, 0, w, h);
      const cols = 6, rows = 18;
      const cw = w / cols, rh = h / rows;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (Math.random() > 0.45) {
            const v = Math.random();
            const c1 = v > 0.85 ? "#5DEAD0" : v > 0.4 ? color : "#FFE7B8";
            ctx.fillStyle = c1;
            ctx.globalAlpha = 0.5 + Math.random() * 0.5;
            ctx.fillRect(x * cw + 1, y * rh + 1, cw - 2, rh - 2);
          }
        }
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      createdTextures.push(tex);
      return tex;
    }

    function createBuilding(x, z, w, h, d, variant = 0) {
      const geo = new THREE.BoxGeometry(w, h, d);
      createdGeometries.push(geo);
      const tex = makeWindowTexture();
      tex.repeat.set(Math.max(1, w / 2.5), Math.max(2, h / 3));

      const mat = new THREE.MeshStandardMaterial({
        color: 0x0a0c14,
        roughness: 0.35,
        metalness: 0.85,
        emissiveMap: tex,
        emissive: 0xffffff,
        emissiveIntensity: 1.4,
      });
      createdMaterials.push(mat);

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, h / 2, z);
      cityGroup.add(mesh);

      // Roof crown light
      if (variant === 1) {
        const crownGeo = new THREE.BoxGeometry(w * 0.6, 0.4, d * 0.6);
        createdGeometries.push(crownGeo);
        const crownMat = new THREE.MeshBasicMaterial({ color: 0xE9C783 });
        createdMaterials.push(crownMat);
        const crown = new THREE.Mesh(crownGeo, crownMat);
        crown.position.set(x, h + 0.5, z);
        cityGroup.add(crown);

        const pl = new THREE.PointLight(0xE9C783, 0.6, 30);
        pl.position.set(x, h + 2, z);
        cityGroup.add(pl);
      } else if (variant === 2) {
        const antGeo = new THREE.CylinderGeometry(0.08, 0.08, 6, 6);
        createdGeometries.push(antGeo);
        const antMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xff5a5a, emissiveIntensity: 0.6 });
        createdMaterials.push(antMat);
        const antenna = new THREE.Mesh(antGeo, antMat);
        antenna.position.set(x, h + 3, z);
        cityGroup.add(antenna);
      }

      return mesh;
    }

    // Generate procedural city
    const cityRadius = 80;
    const placed = [];
    function overlaps(x, z, w, d) {
      for (const p of placed) {
        if (Math.abs(x - p.x) < (w + p.w) * 0.6 && Math.abs(z - p.z) < (d + p.d) * 0.6) return true;
      }
      return false;
    }

    // Central skyscrapers (taller)
    for (let i = 0; i < 80; i++) {
      let tries = 0;
      while (tries < 30) {
        const r = Math.random() * cityRadius;
        const a = Math.random() * Math.PI * 2;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r * 0.8 - 10;
        const distFromCenter = Math.sqrt(x * x + z * z);
        const heightFactor = Math.max(0.3, 1 - distFromCenter / cityRadius);
        const w = 2 + Math.random() * 5;
        const d = 2 + Math.random() * 5;
        const h = 4 + Math.random() * 38 * heightFactor;
        if (!overlaps(x, z, w, d)) {
          placed.push({ x, z, w, d });
          const variant = h > 28 ? (Math.random() > 0.5 ? 1 : 2) : 0;
          createBuilding(x, z, w, h, d, variant);
          break;
        }
        tries++;
      }
    }

    // Foreground signature towers
    createBuilding(-8, 0, 6, 48, 6, 1);
    createBuilding(8, 5, 7, 40, 7, 1);
    createBuilding(0, -12, 5, 55, 5, 2);

    // ---------- FLOATING DATA POINTS ----------
    const dataGroup = new THREE.Group();
    scene.add(dataGroup);

    const dataPoints = [];
    const dataGeos = [];
    const dataMats = [];

    for (let i = 0; i < 40; i++) {
      const geo = new THREE.SphereGeometry(0.15, 8, 8);
      dataGeos.push(geo);
      const colorChoice = Math.random();
      const color = colorChoice > 0.66 ? 0xE9C783 : colorChoice > 0.33 ? 0x5DEAD0 : 0xFFFFFF;
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
      dataMats.push(mat);
      const dot = new THREE.Mesh(geo, mat);
      dot.position.set(
        (Math.random() - 0.5) * 100,
        8 + Math.random() * 40,
        (Math.random() - 0.5) * 80 - 20
      );
      dot.userData = {
        baseY: dot.position.y,
        speed: 0.2 + Math.random() * 0.5,
        offset: Math.random() * Math.PI * 2,
        color,
      };
      dataGroup.add(dot);
      dataPoints.push(dot);

      // Light halo
      const haloGeo = new THREE.SphereGeometry(0.4, 8, 8);
      dataGeos.push(haloGeo);
      const haloMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18 });
      dataMats.push(haloMat);
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.copy(dot.position);
      dot.userData.halo = halo;
      dataGroup.add(halo);
    }

    // Connecting lines (faint network)
    const lineMat = new THREE.LineBasicMaterial({ color: 0x5DEAD0, transparent: true, opacity: 0.12 });
    dataMats.push(lineMat);
    const lineGeos = [];

    for (let i = 0; i < 25; i++) {
      const a = dataPoints[Math.floor(Math.random() * dataPoints.length)];
      const b = dataPoints[Math.floor(Math.random() * dataPoints.length)];
      if (a === b) continue;
      if (a.position.distanceTo(b.position) > 35) continue;
      const g = new THREE.BufferGeometry().setFromPoints([a.position, b.position]);
      lineGeos.push(g);
      const line = new THREE.Line(g, lineMat);
      dataGroup.add(line);
    }

    // ---------- STARS ----------
    const starGeo = new THREE.BufferGeometry();
    const starCount = 400;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 600;
      starPos[i * 3 + 1] = 60 + Math.random() * 120;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 600 - 100;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, transparent: true, opacity: 0.7 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ---------- MOUSE PARALLAX ----------
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMouseMove = (e) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    // ---------- RESIZE ----------
    function resize() {
      const w = window.innerWidth;
      const heroEl = document.querySelector(".hero-section");
      const h = heroEl ? Math.max(window.innerHeight, heroEl.offsetHeight) : window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    // ---------- ANIMATION ----------
    const clock = new THREE.Clock();
    let animFrameId;

    function animate() {
      const t = clock.getElapsedTime();
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;

      // Slow camera dolly + parallax
      const scrollY = window.scrollY;
      const scrollFactor = Math.min(scrollY / window.innerHeight, 1);
      camera.position.x = Math.sin(t * 0.08) * 8 + mouse.x * 6;
      camera.position.y = 22 + mouse.y * 4 - scrollFactor * 8;
      camera.position.z = 70 - scrollFactor * 20;
      camera.lookAt(0, 8 + Math.sin(t * 0.1) * 1.5, 0);

      // Float data points
      dataPoints.forEach((d) => {
        d.position.y = d.userData.baseY + Math.sin(t * d.userData.speed + d.userData.offset) * 1.5;
        if (d.userData.halo) {
          d.userData.halo.position.copy(d.position);
          const pulse = 0.6 + Math.sin(t * 2 + d.userData.offset) * 0.4;
          d.userData.halo.material.opacity = 0.18 * pulse;
        }
      });

      dataGroup.rotation.y = Math.sin(t * 0.05) * 0.05;

      // Slow city rotation
      cityGroup.rotation.y = Math.sin(t * 0.04) * 0.04;

      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(animate);
    }
    animate();

    // ---------- CLEANUP ON UNMOUNT ----------
    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", resize);

      // Dispose Geometries
      skyGeo.dispose();
      horizonGeometries.forEach((g) => g.dispose());
      groundGeo.dispose();
      createdGeometries.forEach((g) => g.dispose());
      dataGeos.forEach((g) => g.dispose());
      lineGeos.forEach((g) => g.dispose());
      starGeo.dispose();
      grid.dispose();

      // Dispose Materials
      skyMat.dispose();
      horizonMat.dispose();
      groundMat.dispose();
      createdMaterials.forEach((m) => m.dispose());
      dataMats.forEach((m) => m.dispose());
      starMat.dispose();

      // Dispose Textures
      skyTex.dispose();
      createdTextures.forEach((t) => t.dispose());

      // Dispose Renderer
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} id="city" className="city-canvas" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1, pointerEvents: "none", display: "block" }} />;
};

export default CitySkyline;
