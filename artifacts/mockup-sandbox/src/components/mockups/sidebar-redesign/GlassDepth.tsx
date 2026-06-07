import React, { useState } from 'react';
import {
  LayoutDashboard, FileText, Plug, Settings, CreditCard,
  ChevronRight, Zap, Users, Sparkles
} from 'lucide-react';

export function GlassDepth() {
  const [activeNav, setActiveNav] = useState('Dashboard');

  return (
    <div style={{ width: '1280px', height: '800px', display: 'flex', overflow: 'hidden', backgroundColor: '#050d1a' }} className="font-sans text-white relative">
      {/* Ambient background glows for the whole dashboard */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar */}
      <aside 
        className="relative w-[220px] h-full flex flex-col shrink-0 border-r border-white/5 z-10"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: 'inset -1px 0 0 rgba(255, 255, 255, 0.05), inset 1px 0 0 rgba(255, 255, 255, 0.02)'
        }}
      >
        {/* Logo area */}
        <div className="h-[72px] px-5 flex items-center shrink-0 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/80 to-purple-600/80 shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-white/20 overflow-hidden">
              <div className="absolute inset-0 bg-white/10" style={{ backdropFilter: 'blur(4px)' }} />
              <Zap size={18} className="text-white relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" fill="currentColor" />
            </div>
            <div className="leading-tight">
              <p className="text-[14px] font-bold text-white tracking-wide text-shadow-sm">ReportCraft</p>
              <p className="text-[10px] font-bold text-indigo-300 tracking-[0.2em] uppercase mt-0.5 opacity-90 drop-shadow-[0_0_5px_rgba(99,102,241,0.8)]">AI</p>
            </div>
          </div>
        </div>

        {/* Agency Block */}
        <div className="px-4 pt-5 pb-2 shrink-0">
          <div 
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-white/[0.08] cursor-pointer transition-all hover:bg-white/[0.04]"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.2)'
            }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-900 to-purple-800 flex items-center justify-center border border-white/10 shadow-inner">
              <span className="text-[11px] font-bold text-white tracking-wider">AC</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-white truncate text-shadow-sm">Acme Agency</p>
              <p className="text-[11px] text-white/40 truncate">Workspace</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6 custom-scrollbar">
          {/* Main */}
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] px-4 mb-2">Main</p>
            <div className="space-y-1">
              {[
                { label: 'Dashboard', icon: LayoutDashboard },
                { label: 'Reports', icon: FileText },
                { label: 'Connectors', icon: Plug }
              ].map(item => {
                const isActive = activeNav === item.label;
                return (
                  <button
                    key={item.label}
                    onClick={() => setActiveNav(item.label)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative group overflow-hidden ${
                      isActive 
                        ? 'text-white' 
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <>
                        <div className="absolute inset-0 bg-indigo-500/20 border border-indigo-400/30 rounded-xl" />
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent rounded-xl" />
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-indigo-400 rounded-r-full shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
                      </>
                    )}
                    {!isActive && (
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.03] transition-colors rounded-xl" />
                    )}
                    <item.icon 
                      size={18} 
                      className={`relative z-10 transition-all duration-300 ${
                        isActive 
                          ? 'text-indigo-300 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]' 
                          : 'text-white/40 group-hover:text-white/80 group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]'
                      }`} 
                    />
                    <span className={`relative z-10 ${isActive ? 'drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]' : ''}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account */}
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] px-4 mb-2">Account</p>
            <div className="space-y-1">
              {[
                { label: 'Settings', icon: Settings },
                { label: 'Billing', icon: CreditCard }
              ].map(item => {
                const isActive = activeNav === item.label;
                return (
                  <button
                    key={item.label}
                    onClick={() => setActiveNav(item.label)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative group overflow-hidden ${
                      isActive 
                        ? 'text-white' 
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <>
                        <div className="absolute inset-0 bg-indigo-500/20 border border-indigo-400/30 rounded-xl" />
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-indigo-400 rounded-r-full shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
                      </>
                    )}
                    {!isActive && (
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.03] transition-colors rounded-xl" />
                    )}
                    <item.icon 
                      size={18} 
                      className={`relative z-10 transition-all duration-300 ${
                        isActive 
                          ? 'text-indigo-300 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]' 
                          : 'text-white/40 group-hover:text-white/80 group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]'
                      }`} 
                    />
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Upgrade Card */}
        <div className="p-4 shrink-0">
          <div className="relative rounded-2xl p-[1px] overflow-hidden group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/50 via-purple-500/30 to-white/5 group-hover:from-indigo-400/80 group-hover:via-purple-400/50 group-hover:to-white/10 transition-colors duration-500" />
            <div className="absolute inset-0 blur-md bg-gradient-to-br from-indigo-500/30 to-purple-500/30 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div 
              className="relative h-full w-full rounded-2xl p-4 flex flex-col gap-3"
              style={{
                background: 'linear-gradient(135deg, rgba(13, 21, 38, 0.9) 0%, rgba(13, 21, 38, 0.7) 100%)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Free Trial</span>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">14 Days</span>
              </div>
              
              <div>
                <p className="text-[13px] font-semibold text-white mb-0.5">Upgrade to Pro</p>
                <p className="text-[11px] text-white/50 leading-relaxed">Unlock custom connectors and white-labeling.</p>
              </div>

              <div className="flex items-center justify-between mt-1 text-indigo-300 group-hover:text-indigo-200 transition-colors">
                <span className="text-[12px] font-semibold drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]">View plans</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area (Mock) */}
      <main className="flex-1 relative z-0 p-8 flex flex-col gap-6 overflow-y-auto">
        {/* Header mock */}
        <div className="h-10 w-1/3 bg-white/[0.02] border border-white/[0.05] rounded-xl" style={{ backdropFilter: 'blur(12px)' }} />
        
        {/* Widget Grid mock */}
        <div className="grid grid-cols-3 gap-6">
          <div className="h-32 bg-white/[0.02] border border-white/[0.05] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]" style={{ backdropFilter: 'blur(12px)' }} />
          <div className="h-32 bg-white/[0.02] border border-white/[0.05] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]" style={{ backdropFilter: 'blur(12px)' }} />
          <div className="h-32 bg-white/[0.02] border border-white/[0.05] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]" style={{ backdropFilter: 'blur(12px)' }} />
        </div>
        
        <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]" style={{ backdropFilter: 'blur(12px)' }} />
      </main>
    </div>
  );
}
