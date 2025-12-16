'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const Lanyard = dynamic(() => import('./lanyard'), { 
  ssr: false,
  loading: () => (
    <div className="relative z-0 w-full h-screen flex justify-center items-center">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  )
});

export default function LanyardWrapper() {
  return (
    <Suspense fallback={
      <div className="relative z-0 w-full h-screen flex justify-center items-center">
        <div className="text-muted-foreground">Loading 3D scene...</div>
      </div>
    }>
      <Lanyard />
    </Suspense>
  );
}
