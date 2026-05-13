import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import { Vector3 } from "three";
import type { Group, Mesh } from "three";
import {
  RUNGS,
  TOP_Y,
  BOTTOM_Y,
  RAIL_X,
  ACCENT,
  rungY,
  type Rung,
} from "./data";

const COLORS = {
  skin: "#d4b896",
  shirt: "#ededee",
  pants: "#2a2a30",
  shoe: "#16161a",
  hair: "#2a1f18",
} as const;

const FLOOR_FOOT_Y = BOTTOM_Y - 0.5;

function positionLimb(mesh: Mesh | null, from: Vector3, to: Vector3) {
  if (!mesh) return;
  const dir = new Vector3().subVectors(to, from);
  const length = dir.length();
  const midpoint = new Vector3().addVectors(from, to).multiplyScalar(0.5);
  mesh.position.copy(midpoint);
  if (length > 0.0001) {
    const axis = new Vector3(0, 1, 0);
    mesh.quaternion.setFromUnitVectors(axis, dir.clone().normalize());
  }
  mesh.scale.y = length;
}

function computeKnee(
  hip: Vector3,
  foot: Vector3,
  thighLen: number,
  shinLen: number,
): Vector3 {
  const dist = hip.distanceTo(foot);
  const totalLen = thighLen + shinLen;
  const midpoint = new Vector3().addVectors(hip, foot).multiplyScalar(0.5);
  if (dist >= totalLen) return midpoint;
  const halfDist = dist / 2;
  const perpDist = Math.sqrt(
    Math.max(0, thighLen * thighLen - halfDist * halfDist),
  );
  midpoint.z += perpDist;
  return midpoint;
}

function getActiveRungId(progress: number, totalRungs: number): number {
  const cycles = totalRungs;
  const cyclePos = progress * cycles;
  const cycleIndex = Math.max(0, Math.min(cycles - 1, Math.floor(cyclePos)));
  const cyclePhase = Math.max(0, Math.min(1, cyclePos - cycleIndex));

  if (cycleIndex < totalRungs - 1) {
    const fromRungId = totalRungs - cycleIndex;
    const toRungId = fromRungId - 1;
    return cyclePhase < 0.5 ? fromRungId : toRungId;
  }
  return 1;
}

function Ladder() {
  const railLength = TOP_Y - BOTTOM_Y + 0.6;
  const railCenterY = (TOP_Y + BOTTOM_Y) / 2;
  return (
    <group>
      {[-RAIL_X, RAIL_X].map((x) => (
        <mesh key={x} position={[x, railCenterY, 0]}>
          <cylinderGeometry args={[0.025, 0.025, railLength, 12]} />
          <meshStandardMaterial
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={2.2}
            toneMapped={false}
          />
        </mesh>
      ))}
      {RUNGS.map((rung) => {
        const y = rungY(rung.id);
        const radius = rung.isTransition ? 0.034 : 0.022;
        const intensity = rung.isTransition ? 2.6 : 1.4;
        return (
          <mesh
            key={rung.id}
            position={[0, y, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[radius, radius, RAIL_X * 2, 12]} />
            <meshStandardMaterial
              color={ACCENT}
              emissive={ACCENT}
              emissiveIntensity={intensity}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Floor() {
  return (
    <group position={[0, BOTTOM_Y - 0.55, 0]}>
      <mesh>
        <boxGeometry args={[6, 0.05, 0.06]} />
        <meshStandardMaterial
          color={ACCENT}
          emissive={ACCENT}
          emissiveIntensity={3.2}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, -0.4, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial
          color="#0c0c0e"
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>
    </group>
  );
}

function Clouds() {
  return (
    <group position={[0, TOP_Y + 0.5, 0]}>
      <mesh position={[-1.8, 0.9, -0.6]} scale={[1.5, 0.55, 1]}>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshStandardMaterial
          color="#e8e8ee"
          roughness={1}
          opacity={0.55}
          transparent
        />
      </mesh>
      <mesh position={[0.4, 1.1, -0.4]} scale={[1.7, 0.6, 1]}>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshStandardMaterial
          color="#e8e8ee"
          roughness={1}
          opacity={0.55}
          transparent
        />
      </mesh>
      <mesh position={[1.9, 1.0, -0.5]} scale={[1.3, 0.5, 1]}>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshStandardMaterial
          color="#e8e8ee"
          roughness={1}
          opacity={0.55}
          transparent
        />
      </mesh>
      <mesh position={[-2.1, 1.3, -0.3]} scale={[1.0, 0.45, 1]}>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshStandardMaterial
          color="#e8e8ee"
          roughness={1}
          opacity={0.55}
          transparent
        />
      </mesh>
      <mesh position={[-0.5, 0.3, 0.7]} scale={[1.7, 1.27, 1]}>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={1}
          opacity={0.92}
          transparent
        />
      </mesh>
      <mesh position={[0.6, 0.4, 0.8]} scale={[1.5, 1.2, 1]}>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={1}
          opacity={0.9}
          transparent
        />
      </mesh>
      <mesh position={[-1.4, 0.4, 0.65]} scale={[1.1, 1.0, 1]}>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshStandardMaterial
          color="#f8f8fc"
          roughness={1}
          opacity={0.88}
          transparent
        />
      </mesh>
      <mesh position={[1.6, 0.35, 0.6]} scale={[1.0, 0.95, 1]}>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshStandardMaterial
          color="#f8f8fc"
          roughness={1}
          opacity={0.88}
          transparent
        />
      </mesh>
    </group>
  );
}

function RungLabel({ rung }: { rung: Rung }) {
  const y = rungY(rung.id);
  return (
    <Html
      position={[-RAIL_X - 0.9, y, 0]}
      center={false}
      style={{ pointerEvents: "none" }}
      transform={false}
      occlude={false}
    >
      <div className="rung-label rung-label--left">
        <div className="rung-label__date">{rung.monthYear}</div>
        {rung.transitionLabel && (
          <div className="rung-label__transition">{rung.transitionLabel}</div>
        )}
      </div>
    </Html>
  );
}

function Climber({
  progress,
  totalRungs,
}: {
  progress: number;
  totalRungs: number;
}) {
  const figureRef = useRef<Group>(null);
  const leftThighRef = useRef<Mesh>(null);
  const leftShinRef = useRef<Mesh>(null);
  const rightThighRef = useRef<Mesh>(null);
  const rightShinRef = useRef<Mesh>(null);
  const leftFootRef = useRef<Mesh>(null);
  const rightFootRef = useRef<Mesh>(null);

  const tempVecs = useMemo(
    () => ({
      leftHip: new Vector3(),
      leftFoot: new Vector3(),
      rightHip: new Vector3(),
      rightFoot: new Vector3(),
    }),
    [],
  );

  const HIP_X = 0.07;
  const THIGH_LEN = 0.32;
  const SHIN_LEN = 0.32;
  const TOTAL_LEG = THIGH_LEN + SHIN_LEN;

  useFrame(() => {
    if (!figureRef.current) return;

    const cycles = totalRungs;
    const cyclePos = progress * cycles;
    const cycleIndex = Math.max(0, Math.min(cycles - 1, Math.floor(cyclePos)));
    const cyclePhase = Math.max(0, Math.min(1, cyclePos - cycleIndex));

    let fromRungY: number;
    let toRungY: number;
    if (cycleIndex < totalRungs - 1) {
      const fromRungId = totalRungs - cycleIndex;
      const toRungId = fromRungId - 1;
      fromRungY = rungY(fromRungId);
      toRungY = rungY(toRungId);
    } else {
      fromRungY = rungY(1);
      toRungY = FLOOR_FOOT_Y;
    }

    const hipY = fromRungY + TOTAL_LEG - cyclePhase * (fromRungY - toRungY);
    const rightLegLeads = cycleIndex % 2 === 0;

    let leftFootY: number;
    let rightFootY: number;
    if (cyclePhase < 0.5) {
      const t = cyclePhase * 2;
      const movingFootY = fromRungY - t * (fromRungY - toRungY);
      if (rightLegLeads) {
        rightFootY = movingFootY;
        leftFootY = fromRungY;
      } else {
        leftFootY = movingFootY;
        rightFootY = fromRungY;
      }
    } else {
      const t = (cyclePhase - 0.5) * 2;
      const movingFootY = fromRungY - t * (fromRungY - toRungY);
      if (rightLegLeads) {
        leftFootY = movingFootY;
        rightFootY = toRungY;
      } else {
        rightFootY = movingFootY;
        leftFootY = toRungY;
      }
    }

    figureRef.current.position.set(0, hipY, 0.22);

    const leftFootLocalY = leftFootY - hipY;
    const rightFootLocalY = rightFootY - hipY;

    tempVecs.leftHip.set(-HIP_X, 0, 0);
    tempVecs.leftFoot.set(-HIP_X, leftFootLocalY, 0);
    tempVecs.rightHip.set(HIP_X, 0, 0);
    tempVecs.rightFoot.set(HIP_X, rightFootLocalY, 0);

    const leftKnee = computeKnee(
      tempVecs.leftHip,
      tempVecs.leftFoot,
      THIGH_LEN,
      SHIN_LEN,
    );
    const rightKnee = computeKnee(
      tempVecs.rightHip,
      tempVecs.rightFoot,
      THIGH_LEN,
      SHIN_LEN,
    );

    positionLimb(leftThighRef.current, tempVecs.leftHip, leftKnee);
    positionLimb(leftShinRef.current, leftKnee, tempVecs.leftFoot);
    positionLimb(rightThighRef.current, tempVecs.rightHip, rightKnee);
    positionLimb(rightShinRef.current, rightKnee, tempVecs.rightFoot);

    if (leftFootRef.current) {
      leftFootRef.current.position.set(-HIP_X, leftFootLocalY, 0.05);
    }
    if (rightFootRef.current) {
      rightFootRef.current.position.set(HIP_X, rightFootLocalY, 0.05);
    }
  });

  return (
    <group ref={figureRef}>
      <group>
        <mesh position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.13, 20, 20]} />
          <meshStandardMaterial
            color={COLORS.skin}
            roughness={0.55}
            metalness={0.05}
          />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <sphereGeometry
            args={[0.138, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]}
          />
          <meshStandardMaterial
            color={COLORS.hair}
            roughness={0.7}
            metalness={0.05}
          />
        </mesh>
        <mesh position={[0, 0.46, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 0.06, 10]} />
          <meshStandardMaterial
            color={COLORS.skin}
            roughness={0.55}
            metalness={0.05}
          />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.115, 0.09, 0.45, 14]} />
          <meshStandardMaterial
            color={COLORS.shirt}
            roughness={0.65}
            metalness={0.05}
          />
        </mesh>
        <mesh position={[0.2, 0.34, 0]} rotation={[0, 0, 0.65]}>
          <cylinderGeometry args={[0.034, 0.03, 0.27, 10]} />
          <meshStandardMaterial
            color={COLORS.shirt}
            roughness={0.65}
            metalness={0.05}
          />
        </mesh>
        <mesh position={[-0.2, 0.34, 0]} rotation={[0, 0, -0.65]}>
          <cylinderGeometry args={[0.034, 0.03, 0.27, 10]} />
          <meshStandardMaterial
            color={COLORS.shirt}
            roughness={0.65}
            metalness={0.05}
          />
        </mesh>
        <mesh position={[0.34, 0.18, 0.04]} rotation={[0.2, 0, 0.4]}>
          <cylinderGeometry args={[0.03, 0.028, 0.27, 10]} />
          <meshStandardMaterial
            color={COLORS.shirt}
            roughness={0.65}
            metalness={0.05}
          />
        </mesh>
        <mesh position={[-0.34, 0.18, 0.04]} rotation={[0.2, 0, -0.4]}>
          <cylinderGeometry args={[0.03, 0.028, 0.27, 10]} />
          <meshStandardMaterial
            color={COLORS.shirt}
            roughness={0.65}
            metalness={0.05}
          />
        </mesh>
        <mesh position={[0.4, 0.06, 0.08]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial
            color={COLORS.skin}
            roughness={0.55}
            metalness={0.05}
          />
        </mesh>
        <mesh position={[-0.4, 0.06, 0.08]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial
            color={COLORS.skin}
            roughness={0.55}
            metalness={0.05}
          />
        </mesh>
      </group>

      <mesh ref={leftThighRef}>
        <cylinderGeometry args={[0.045, 0.042, 1, 12]} />
        <meshStandardMaterial
          color={COLORS.pants}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>
      <mesh ref={leftShinRef}>
        <cylinderGeometry args={[0.042, 0.038, 1, 12]} />
        <meshStandardMaterial
          color={COLORS.pants}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>
      <mesh ref={rightThighRef}>
        <cylinderGeometry args={[0.045, 0.042, 1, 12]} />
        <meshStandardMaterial
          color={COLORS.pants}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>
      <mesh ref={rightShinRef}>
        <cylinderGeometry args={[0.042, 0.038, 1, 12]} />
        <meshStandardMaterial
          color={COLORS.pants}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      <mesh ref={leftFootRef}>
        <boxGeometry args={[0.085, 0.04, 0.14]} />
        <meshStandardMaterial
          color={COLORS.shoe}
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>
      <mesh ref={rightFootRef}>
        <boxGeometry args={[0.085, 0.04, 0.14]} />
        <meshStandardMaterial
          color={COLORS.shoe}
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

function AnimatedScene({
  progress,
  hideLabels,
  reduceBloom,
}: {
  progress: number;
  hideLabels: boolean;
  reduceBloom: boolean;
}) {
  const ladderGroupRef = useRef<Group>(null);

  useFrame(() => {
    if (ladderGroupRef.current) {
      const targetOffset = -4.6 + 8.2 * progress;
      const current = ladderGroupRef.current.position.y;
      ladderGroupRef.current.position.y =
        current + (targetOffset - current) * 0.12;
    }
  });

  return (
    <>
      <ambientLight intensity={0.18} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} color="#fff5e8" />
      <directionalLight position={[-3, 2, 4]} intensity={0.4} color="#c4d8ff" />
      <pointLight
        position={[0, 5, 3]}
        intensity={6}
        color={ACCENT}
        distance={20}
      />
      <pointLight
        position={[0, 0, -3]}
        intensity={3}
        color={ACCENT}
        distance={14}
      />
      <pointLight
        position={[0, -3, 4]}
        intensity={2.2}
        color="#ffffff"
        distance={12}
      />

      <group ref={ladderGroupRef} position={[0, -4.6, 0]}>
        <Ladder />
        <Floor />
        {!hideLabels &&
          RUNGS.map((rung) => <RungLabel key={rung.id} rung={rung} />)}
        <Climber progress={progress} totalRungs={RUNGS.length} />
        <Clouds />
      </group>

      <EffectComposer>
        <Bloom
          intensity={reduceBloom ? 0.25 : 0.5}
          luminanceThreshold={reduceBloom ? 0.85 : 0.7}
          luminanceSmoothing={0.4}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

function CurrentRungOverlay({ progress }: { progress: number }) {
  const activeRungId = getActiveRungId(progress, RUNGS.length);
  const activeRung = RUNGS.find((r) => r.id === activeRungId);
  if (!activeRung) return null;

  return (
    <div className="experience-rung-overlay" key={activeRung.id}>
      <div className="experience-rung-overlay__date">
        {activeRung.monthYear}
      </div>
      {activeRung.transitionLabel && (
        <div className="experience-rung-overlay__transition">
          {activeRung.transitionLabel}
        </div>
      )}
      {activeRung.role && activeRung.company && (
        <div className="experience-rung-overlay__role">
          {activeRung.role} <span aria-hidden="true">·</span>{" "}
          {activeRung.company}
        </div>
      )}
    </div>
  );
}

function RungDetailCard({ progress }: { progress: number }) {
  const activeRungId = getActiveRungId(progress, RUNGS.length);
  const activeRung = RUNGS.find((r) => r.id === activeRungId);
  if (!activeRung) return null;

  return (
    <div className="experience-detail-card" key={activeRung.id}>
      <div className="experience-detail-card__date">{activeRung.monthYear}</div>
      {activeRung.transitionLabel && (
        <div className="experience-detail-card__transition">
          {activeRung.transitionLabel}
        </div>
      )}
      <div className="experience-detail-card__role">
        {activeRung.role} <span aria-hidden="true">·</span> {activeRung.company}
      </div>

      {activeRung.projects && activeRung.projects.length > 0 && (
        <>
          <div className="experience-detail-card__section-header">
            Working on
          </div>
          <ul className="experience-detail-card__projects">
            {activeRung.projects.map((project, idx) => (
              <li key={idx} className="experience-detail-card__project">
                <div className="experience-detail-card__project-name">
                  {project.name}
                </div>
                <div className="experience-detail-card__project-description">
                  {project.description}
                </div>
                {project.stack && project.stack.length > 0 && (
                  <div className="experience-detail-card__stack">
                    {project.stack.map((s) => (
                      <span
                        key={s}
                        className="experience-detail-card__stack-item"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="experience-detail-card__project-link"
                  >
                    View ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function ReducedMotionList() {
  const sortedRungs = [...RUNGS].sort((a, b) => b.id - a.id);
  return (
    <ol className="experience-reduced-motion-list">
      {sortedRungs.map((rung) => (
        <li key={rung.id} className="experience-reduced-motion-list__item">
          <div className="experience-reduced-motion-list__date">
            {rung.monthYear}
          </div>
          {rung.transitionLabel && (
            <div className="experience-reduced-motion-list__transition">
              {rung.transitionLabel}
            </div>
          )}
          {rung.role && rung.company && (
            <div className="experience-reduced-motion-list__role">
              {rung.role} <span aria-hidden="true">·</span> {rung.company}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

export default function Ladder3D() {
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  });
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mobileMQ = window.matchMedia("(max-width: 767px)");
    const updateMobile = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile(e.matches);
    mobileMQ.addEventListener("change", updateMobile);

    const motionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = (e: MediaQueryListEvent | MediaQueryList) =>
      setReducedMotion(e.matches);
    motionMQ.addEventListener("change", updateMotion);

    const handleScroll = () => {
      const region = document.querySelector<HTMLElement>(
        "[data-experience-sticky-region]",
      );
      if (!region) return;
      const rect = region.getBoundingClientRect();
      const regionHeight = region.offsetHeight;
      const viewportHeight = window.innerHeight;
      const scrollableDistance = Math.max(1, regionHeight - viewportHeight);
      const scrolled = Math.max(0, -rect.top);
      const p = Math.max(0, Math.min(1, scrolled / scrollableDistance));
      setProgress(p);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      mobileMQ.removeEventListener("change", updateMobile);
      motionMQ.removeEventListener("change", updateMotion);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (reducedMotion) {
    return <ReducedMotionList />;
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Canvas
        camera={{
          position: [0, 0, isMobile ? 14 : 11],
          fov: isMobile ? 38 : 33,
        }}
        style={{ background: "transparent" }}
        gl={{ antialias: true, alpha: true }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
      >
        <AnimatedScene
          progress={progress}
          hideLabels={isMobile}
          reduceBloom={isMobile}
        />
      </Canvas>
      {isMobile && <CurrentRungOverlay progress={progress} />}
      {!isMobile && <RungDetailCard progress={progress} />}
    </div>
  );
}
