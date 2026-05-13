import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { SKILL_CATEGORIES, type SkillTier } from "./data";

interface ScratchCell {
  id: string;
  name: string;
  tier: SkillTier;
  categoryId: string;
  col: number;
  row: number;
}

const REVEAL_THRESHOLD = 0.35;
const BRUSH_RADIUS = 24;

function seededShuffle<T>(arr: T[], seed: number): T[] {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

interface RawSkill {
  id: string;
  name: string;
  tier: SkillTier;
  categoryId: string;
}

function flattenSkills(): RawSkill[] {
  const all: RawSkill[] = [];
  SKILL_CATEGORIES.forEach((cat) => {
    cat.skills.forEach((skill, idx) => {
      all.push({
        id: `${cat.id}-${idx}`,
        name: skill.name,
        tier: skill.tier,
        categoryId: cat.id,
      });
    });
  });
  return all;
}

function buildCells(cols: number, allSkills: RawSkill[]): ScratchCell[] {
  const shuffled = seededShuffle(allSkills, 7);
  return shuffled.map((s, i) => ({
    ...s,
    col: i % cols,
    row: Math.floor(i / cols),
  }));
}

export default function SkillsScratch() {
  const [isMobile, setIsMobile] = useState(false);
  const [foundIds, setFoundIds] = useState<Set<string>>(new Set());

  const allSkills = useMemo(() => flattenSkills(), []);
  const cols = isMobile ? 4 : 8;
  const cells = useMemo(() => buildCells(cols, allSkills), [cols, allSkills]);
  const rows = Math.ceil(cells.length / cols);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const foundIdsRef = useRef(foundIds);

  const mainRef = useRef<HTMLDivElement>(null);
  const [matchedHeight, setMatchedHeight] = useState<number | null>(null);
  const [isStacked, setIsStacked] = useState(false);

  useEffect(() => {
    foundIdsRef.current = foundIds;
  }, [foundIds]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const mqStacked = window.matchMedia("(max-width: 900px)");
    const update = () => setIsStacked(mqStacked.matches);
    update();
    mqStacked.addEventListener("change", update);
    return () => mqStacked.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!mainRef.current || isStacked) {
      setMatchedHeight(null);
      return;
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setMatchedHeight(entry.contentRect.height);
      }
    });
    observer.observe(mainRef.current);
    return () => observer.disconnect();
  }, [isStacked]);

  const drawSurface = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, w, h);

      // Base magenta gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#ff3d9a");
      grad.addColorStop(0.5, "#e8348a");
      grad.addColorStop(1, "#c0277a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Grain
      for (let i = 0; i < 1800; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const a = Math.random() * 0.18;
        ctx.fillStyle = `rgba(0, 0, 0, ${a})`;
        ctx.fillRect(x, y, Math.random() * 1.5, Math.random() * 1.5);
      }

      // Sparkle highlights
      for (let i = 0; i < 70; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.25 + Math.random() * 0.4})`;
        ctx.fillRect(x, y, 1.5, 1.5);
      }

      // Hint text
      const bigFont = w > 600 ? 28 : 20;
      ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
      ctx.font = `bold ${bigFont}px ui-monospace, "Geist Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SCRATCH TO REVEAL", w / 2, h / 2 - 14);

      const smallFont = w > 600 ? 13 : 11;
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.font = `${smallFont}px ui-monospace, "Geist Mono", monospace`;
      ctx.fillText("Drag to discover skills underneath", w / 2, h / 2 + 16);
    },
    [],
  );

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawSurface(ctx, rect.width, rect.height);
    canvas.style.opacity = "1";
  }, [cols, rows, drawSurface]);

  const checkCells = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvasW: number,
      canvasH: number,
      minX: number,
      minY: number,
      maxX: number,
      maxY: number,
    ) => {
      const cellW = canvasW / cols;
      const cellH = canvasH / rows;
      const newlyFound: string[] = [];
      const currentFound = foundIdsRef.current;

      cells.forEach((cell) => {
        if (currentFound.has(cell.id)) return;

        const cellX = cell.col * cellW;
        const cellY = cell.row * cellH;

        if (cellX + cellW < minX || cellX > maxX) return;
        if (cellY + cellH < minY || cellY > maxY) return;

        const inset = 4;
        const sampleW = Math.max(1, Math.floor(cellW - inset * 2));
        const sampleH = Math.max(1, Math.floor(cellH - inset * 2));

        let imageData: ImageData;
        try {
          imageData = ctx.getImageData(
            Math.floor(cellX + inset),
            Math.floor(cellY + inset),
            sampleW,
            sampleH,
          );
        } catch {
          return;
        }

        const data = imageData.data;
        const stride = 4 * 6;
        let transparent = 0;
        let total = 0;
        for (let i = 3; i < data.length; i += stride) {
          if (data[i] < 80) transparent++;
          total++;
        }

        if (total > 0 && transparent / total > REVEAL_THRESHOLD) {
          newlyFound.push(cell.id);
        }
      });

      if (newlyFound.length > 0) {
        setFoundIds((prev) => {
          const next = new Set(prev);
          newlyFound.forEach((id) => next.add(id));
          return next;
        });
      }
    },
    [cells, cols, rows],
  );

  const scratchPath = useCallback(
    (fromX: number, fromY: number, toX: number, toY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.lineWidth = BRUSH_RADIUS * 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";

      const minX = Math.min(fromX, toX) - BRUSH_RADIUS;
      const maxX = Math.max(fromX, toX) + BRUSH_RADIUS;
      const minY = Math.min(fromY, toY) - BRUSH_RADIUS;
      const maxY = Math.max(fromY, toY) + BRUSH_RADIUS;

      checkCells(ctx, canvas.width, canvas.height, minX, minY, maxX, maxY);
    },
    [checkCells],
  );

  const getEventPos = (
    e: MouseEvent | TouchEvent,
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    let clientY: number;

    if ("touches" in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("clientX" in e) {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    } else {
      return null;
    }

    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    const pos = getEventPos(e.nativeEvent);
    if (pos) {
      lastPoint.current = pos;
      scratchPath(pos.x, pos.y, pos.x + 0.01, pos.y);
    }
    if ("touches" in e.nativeEvent) e.preventDefault();
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const pos = getEventPos(e.nativeEvent);
    if (pos && lastPoint.current) {
      scratchPath(lastPoint.current.x, lastPoint.current.y, pos.x, pos.y);
      lastPoint.current = pos;
    }
    if ("touches" in e.nativeEvent) e.preventDefault();
  };

  const handleEnd = () => {
    isDrawing.current = false;
    lastPoint.current = null;
  };

  const handleRevealAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.style.transition = "opacity 0.6s ease";
    canvas.style.opacity = "0";

    setTimeout(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setFoundIds(new Set(cells.map((c) => c.id)));
    }, 80);
  };

  const handleReset = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.style.transition = "opacity 0.3s ease";
    canvas.style.opacity = "1";

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    drawSurface(ctx, rect.width, rect.height);
    setFoundIds(new Set());
  };

  const foundByCategory = useMemo(() => {
    return SKILL_CATEGORIES.map((cat) => ({
      ...cat,
      foundSkills: cat.skills
        .map((skill, idx) => ({ ...skill, id: `${cat.id}-${idx}` }))
        .filter((s) => foundIds.has(s.id)),
    }));
  }, [foundIds]);

  const totalCount = cells.length;
  const allFound = foundIds.size === totalCount;

  return (
    <div className="skills-scratch">
      <div className="skills-scratch__layout">
        <div className="skills-scratch__main" ref={mainRef}>
          <div
            className="skills-scratch__container"
            ref={containerRef}
            style={{ aspectRatio: isMobile ? "2 / 5" : "5 / 4" }}
          >
            <div
              className="skills-scratch__grid"
              style={{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
              }}
            >
              {cells.map((cell) => (
                <div
                  key={cell.id}
                  className={`skills-scratch__cell skills-scratch__cell--${cell.tier}${
                    foundIds.has(cell.id) ? " is-found" : ""
                  }`}
                >
                  <span>{cell.name}</span>
                </div>
              ))}
            </div>
            <canvas
              ref={canvasRef}
              className="skills-scratch__canvas"
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
              onTouchCancel={handleEnd}
            />
          </div>

          <div className="skills-scratch__controls">
            <div className="skills-scratch__progress">
              Found <strong>{foundIds.size}</strong> / {totalCount}
            </div>
            <div className="skills-scratch__buttons">
              {allFound ? (
                <button
                  type="button"
                  className="skills-scratch__reset"
                  onClick={handleReset}
                >
                  Reset
                </button>
              ) : (
                <button
                  type="button"
                  className="skills-scratch__reveal-all"
                  onClick={handleRevealAll}
                >
                  Reveal all
                </button>
              )}
            </div>
          </div>
        </div>

        <aside
          className="skills-scratch__found"
          style={{
            height:
              !isStacked && matchedHeight ? `${matchedHeight}px` : undefined,
          }}
        >
          <h3 className="skills-scratch__found-title">Discovered</h3>
          {foundIds.size === 0 ? (
            <p className="skills-scratch__found-empty">
              Skills you uncover will appear here.
            </p>
          ) : (
            <div className="skills-scratch__found-categories">
              {foundByCategory.map((cat) =>
                cat.foundSkills.length > 0 ? (
                  <div key={cat.id} className="skills-scratch__found-category">
                    <div className="skills-scratch__found-category-header">
                      <span>{cat.name}</span>
                      <span className="skills-scratch__found-category-count">
                        {cat.foundSkills.length} / {cat.skills.length}
                      </span>
                    </div>
                    <ul className="skills-scratch__found-list">
                      {cat.foundSkills.map((skill) => (
                        <li
                          key={skill.id}
                          className={`skills-scratch__found-chip skills-scratch__found-chip--${skill.tier}`}
                        >
                          {skill.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null,
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
