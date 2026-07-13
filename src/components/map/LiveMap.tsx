'use client';

import dynamic from 'next/dynamic';

const MapContainerComponent = dynamic(() => import('./MapContainerComponent'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full w-full bg-slate-800 text-slate-400">Cargando mapa...</div>
});

export default MapContainerComponent;
