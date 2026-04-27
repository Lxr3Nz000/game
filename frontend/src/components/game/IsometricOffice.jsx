import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PROJECT_TEMPLATES } from "../../game/constants";

// Isometric stage + tap-to-code overlay. Click anywhere on the stage to contribute a work point.
export default function IsometricOffice({ state, derived, lang, onTap, tutorialStep }) {
  const { desks, staff, officeTier, activeProject } = state;

  const capacity = Math.min(25, derived.office.capacity);
  const cols = Math.ceil(Math.sqrt(capacity));
  const rows = Math.ceil(capacity / cols);

  const tiles = useMemo(() => {
    const arr = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        arr.push({ r, c, idx: r * cols + c });
      }
    }
    return arr;
  }, [rows, cols]);

  const stageRef = useRef(null);
  const [tileSize, setTileSize] = useState(72);
  useEffect(() => {
    function recompute() {
      if (!stageRef.current) return;
      const w = stageRef.current.clientWidth;
      const base = w < 480 ? 44 : w < 768 ? 56 : 72;
      setTileSize(base);
    }
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, []);

  const gridW = cols * tileSize;
  const gridH = rows * tileSize;
  const deskW = Math.round(tileSize * 0.83);
  const deskH = Math.round(tileSize * 0.53);
  const devW = Math.max(14, Math.round(tileSize * 0.3));
  const devH = Math.max(18, Math.round(tileSize * 0.39));

  const activeTpl =
    activeProject && PROJECT_TEMPLATES.find((t) => t.id === activeProject.templateId);

  // Floating +1 animations
  const [floats, setFloats] = useState([]);
  const nextId = useRef(0);
  const handleStageClick = useCallback(
    (e) => {
      if (!stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      const x = (e.clientX || (e.touches && e.touches[0]?.clientX) || rect.left + rect.width / 2) - rect.left;
      const y = (e.clientY || (e.touches && e.touches[0]?.clientY) || rect.top + rect.height / 2) - rect.top;
      const id = ++nextId.current;
      const isCoding = !!activeProject;
      setFloats((prev) => [...prev.slice(-6), { id, x, y, coding: isCoding }]);
      setTimeout(() => {
        setFloats((prev) => prev.filter((f) => f.id !== id));
      }, 800);
      onTap && onTap();
    },
    [onTap, activeProject]
  );

  const tapHighlight = tutorialStep === 0 || tutorialStep === 4;

  return (
    <div className="sm-panel p-2 md:p-3" data-testid="iso-office">
      <div className="flex items-center justify-between mb-2 px-1 gap-2">
        <div className="sm-heading text-xs md:text-sm uppercase tracking-widest text-[color:var(--sm-text-dim)] truncate">
          // {derived.office.name[lang]} <span className="neon-cyan">TIER {officeTier}</span>
        </div>
        <div className="text-[10px] md:text-xs text-[color:var(--sm-text-dim)] truncate hidden sm:block">
          {derived.office.tagline[lang]}
        </div>
      </div>

      <div
        ref={stageRef}
        className={`iso-stage ${tapHighlight ? "tap-highlight" : ""}`}
        onClick={handleStageClick}
        onTouchStart={(e) => { e.preventDefault(); handleStageClick(e); }}
        role="button"
        aria-label="Tap to code"
        data-testid="iso-tap-zone"
        style={{ aspectRatio: "16/10", minHeight: 200, cursor: "pointer", userSelect: "none" }}
      >
        <div
          style={{
            position: "absolute",
            top: "15%",
            left: 0,
            right: 0,
            height: 2,
            background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.5), transparent)",
            filter: "blur(1px)",
            pointerEvents: "none",
          }}
        />

        <div className="iso-grid" style={{ width: gridW, height: gridH, pointerEvents: "none" }}>
          {tiles.map((tile) => {
            const hasDesk = tile.idx < desks;
            const dev = hasDesk ? staff[tile.idx] : null;
            const devColor = dev
              ? dev.roleId === "junior"
                ? "junior"
                : dev.roleId === "senior"
                ? "senior"
                : "lead"
              : "";
            return (
              <div
                key={tile.idx}
                className="iso-tile"
                style={{
                  left: tile.c * tileSize,
                  top: tile.r * tileSize,
                  width: tileSize,
                  height: tileSize,
                }}
              >
                {hasDesk && (
                  <div
                    className="iso-desk"
                    style={{
                      left: Math.round(tileSize * 0.08),
                      top: Math.round(tileSize * 0.25),
                      width: deskW,
                      height: deskH,
                    }}
                    data-testid={`iso-desk-${tile.idx}`}
                  >
                    {dev && (
                      <div
                        className={`iso-dev ${devColor}`}
                        style={{
                          width: devW,
                          height: devH,
                          left: Math.round(deskW * 0.3),
                          top: -Math.round(devH * 0.55),
                        }}
                        data-testid={`iso-dev-${tile.idx}`}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Floating +work indicators */}
        {floats.map((f) => (
          <span
            key={f.id}
            className={`sm-float ${f.coding ? "neon-green" : "neon-amber"}`}
            style={{ left: f.x, top: f.y }}
          >
            {f.coding ? "+1 wp" : "+€1"}
          </span>
        ))}

        {desks === 0 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--sm-text-dim)",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 13,
              pointerEvents: "none",
              textAlign: "center",
              padding: 20,
            }}
          >
            <span className="blink">&gt; tap to code_</span>
          </div>
        )}

        {activeProject && activeTpl && (
          <div
            style={{
              position: "absolute",
              left: 8,
              bottom: 8,
              right: 8,
              background: "rgba(4, 8, 14, 0.85)",
              border: "1px solid var(--sm-border-strong)",
              borderLeft: "3px solid var(--sm-neon-green)",
              borderRadius: 6,
              padding: "8px 10px",
              pointerEvents: "none",
            }}
            data-testid="iso-active-project"
          >
            <div className="flex items-center justify-between mb-1 gap-2">
              <div className="sm-heading text-xs md:text-sm truncate">
                <span className="neon-green">&gt;</span> {activeTpl.name[lang]}
              </div>
              <div className="text-[10px] md:text-xs text-[color:var(--sm-text-dim)] shrink-0">
                {Math.round(activeProject.workDone)}/{activeProject.workTarget} wp
              </div>
            </div>
            <div className="sm-bar">
              <div
                className="sm-bar-fill"
                style={{
                  width: `${Math.min(100, (activeProject.workDone / activeProject.workTarget) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
