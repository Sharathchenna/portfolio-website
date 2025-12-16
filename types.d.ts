/// <reference types="react" />

import 'react';

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

declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshLineGeometry: React.DetailedHTMLProps<any, any>;
      meshLineMaterial: React.DetailedHTMLProps<any, any>;
    }
  }
}
