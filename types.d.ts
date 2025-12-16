/// <reference types="react" />

declare module '*.glb' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module 'meshline' {
  import { BufferGeometry, Material } from 'three';
  
  export class MeshLineGeometry extends BufferGeometry {
    setPoints(points: any): void;
  }
  
  export class MeshLineMaterial extends Material {
    constructor(params?: any);
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    meshLineGeometry: any;
    meshLineMaterial: any;
  }
}
