import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Plug,
  Settings,
  CreditCard,
  Zap,
  ArrowRight,
} from 'lucide-react';

const mainNav = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'reports', icon: FileText, label: 'Reports' },
  { id: 'connectors', icon: Plug, label: 'Connectors' },
];

const accountNav = [
  { id: 'settings', icon: Settings, label: 'Settings' },
  { id: 'billing', icon: CreditCard, label: 'Billing' },
];

export function SlickDark() {
  const [activeItem, setActiveItem] = useState('dashboard');

  return (
    <div
      style={{
        width: '1280px',
        height: '800px',
        display: 'flex',
        overflow: 'hidden',
        backgroundColor: '#030712', // Dark background for the overall app
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: '220px',
          backgroundColor: '#09101f',
          borderRight: '1px solid rgba(255, 255, 255, 0.03)',
        }}
        className="flex flex-col h-full shrink-0 relative z-10"
      >
        {/* Logo Area */}
        <div className="h-16 px-5 flex items-center gap-3 shrink-0 mt-2">
          <div className="text-indigo-500">
            <Zap size={18} fill="currentColor" strokeWidth={0} />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold text-gray-100 tracking-tight leading-none">
              ReportCraft
            </span>
            <span className="text-[10px] font-mono text-indigo-400 font-medium tracking-widest mt-1 leading-none">
              AI
            </span>
          </div>
        </div>

        {/* Agency Block */}
        <div className="px-5 py-4 shrink-0 mt-2">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-6 h-6 rounded bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-[10px] font-mono font-bold tracking-tighter group-hover:bg-indigo-500/20 transition-colors">
              AW
            </div>
            <span className="text-xs text-gray-400 group-hover:text-gray-300 font-medium tracking-tight transition-colors">
              Acme Workspace
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto mt-2">
          {/* Main Nav */}
          <div className="space-y-0.5">
            {mainNav.map((item) => {
              const isActive = activeItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveItem(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium tracking-tight transition-all duration-200 relative ${
                    isActive
                      ? 'text-gray-100 bg-indigo-500/[0.03]'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
                  }`}
                >
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-3/5 bg-indigo-500 rounded-r-full"
                      style={{
                        boxShadow: '0 0 10px 1px rgba(99, 102, 241, 0.5)',
                      }}
                    />
                  )}
                  <item.icon
                    size={16}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`${isActive ? 'text-indigo-400' : ''}`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Account Nav */}
          <div className="space-y-0.5">
            {accountNav.map((item) => {
              const isActive = activeItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveItem(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium tracking-tight transition-all duration-200 relative ${
                    isActive
                      ? 'text-gray-100 bg-indigo-500/[0.03]'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
                  }`}
                >
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-3/5 bg-indigo-500 rounded-r-full"
                      style={{
                        boxShadow: '0 0 10px 1px rgba(99, 102, 241, 0.5)',
                      }}
                    />
                  )}
                  <item.icon
                    size={16}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`${isActive ? 'text-indigo-400' : ''}`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Upgrade / Tier Block */}
        <div className="p-5 shrink-0 mb-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono text-gray-500 tracking-wider uppercase">
              Starter Plan
            </span>
            <button className="flex items-center gap-1.5 text-[12px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors group w-fit">
              <span>Upgrade to Agency</span>
              <ArrowRight
                size={14}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area Fake Widgets */}
      <main className="flex-1 p-8 flex flex-col gap-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-[#040814] pointer-events-none" />
        
        {/* Fake Header */}
        <div className="h-10 w-48 bg-white/[0.02] rounded-md relative z-10 animate-pulse" />
        
        {/* Fake Stats Row */}
        <div className="flex gap-6 relative z-10">
          <div className="flex-1 h-32 bg-white/[0.02] rounded-xl border border-white/[0.02] animate-pulse" />
          <div className="flex-1 h-32 bg-white/[0.02] rounded-xl border border-white/[0.02] animate-pulse delay-75" />
          <div className="flex-1 h-32 bg-white/[0.02] rounded-xl border border-white/[0.02] animate-pulse delay-150" />
        </div>

        {/* Fake Chart Area */}
        <div className="flex-1 bg-white/[0.02] rounded-xl border border-white/[0.02] relative z-10 animate-pulse delay-300" />
      </main>
    </div>
  );
}
