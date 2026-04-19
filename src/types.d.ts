// Ambient type declarations for assets and third-party libraries without types.
// This file is picked up automatically by TypeScript via tsconfig's "include".

import type { Object3DNode, MaterialNode } from '@react-three/fiber';
import type { MeshLineGeometry, MeshLineMaterial } from 'meshline';

// Asset imports — tell TS that `.glb` imports resolve to a string URL
declare module '*.glb' {
  const src: string;
  export default src;
}

// meshline ships without its own types — declare minimal shape
declare module 'meshline' {
  export class MeshLineGeometry {
    setPoints(points: Array<{ x: number; y: number; z: number }>): void;
  }
  export class MeshLineMaterial {
    constructor(parameters?: Record<string, unknown>);
  }
}

// Extend React Three Fiber's JSX to know about meshLineGeometry/Material
// after they're registered via R3F's `extend()` call
declare module '@react-three/fiber' {
  interface ThreeElements {
    meshLineGeometry: Object3DNode<MeshLineGeometry, typeof MeshLineGeometry>;
    meshLineMaterial: MaterialNode<MeshLineMaterial, typeof MeshLineMaterial>;
  }
}

export {};
