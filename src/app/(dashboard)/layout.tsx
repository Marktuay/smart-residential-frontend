'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Cerrar el drawer en móvil cuando cambie la ruta
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="app-layout">
      {/* Telón oscuro semi-transparente para móvil */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="sidebar-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 90,
            cursor: 'pointer',
            transition: 'opacity 0.2s ease'
          }}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="main-wrapper">
        <Header 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          isSidebarOpen={sidebarOpen} 
        />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
