import React from 'react';
import { LayoutDashboard, FileText, Plug, Settings, CreditCard, ChevronRight, Zap, Users, Sparkles } from 'lucide-react';

export function BoldColor() {
  return (
    <div style={{ width: '1280px', height: '800px', display: 'flex', overflow: 'hidden' }}>
      
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 flex flex-col bg-gradient-to-b from-[#1e1b4b] to-[#2e1065] text-white overflow-hidden shadow-[2px_0_15px_rgba(0,0,0,0.3)] z-10">
        
        {/* Logo Area */}
        <div className="h-[64px] px-4 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <div className="leading-none flex flex-col justify-center">
            <span className="text-[14px] font-bold text-white tracking-tight">ReportCraft</span>
            <span className="text-[10px] font-bold text-indigo-200 tracking-[0.2em] uppercase mt-0.5">AI</span>
          </div>
        </div>

        {/* Agency Block */}
        <div className="px-3 pt-2 pb-4">
          <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center shrink-0 shadow-sm text-white text-xs font-bold">
              AC
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-white truncate leading-snug">
                Acme Corp
              </p>
              <p className="text-[11px] text-indigo-200/80 leading-snug mt-0.5 truncate">
                Agency workspace
              </p>
            </div>
            <ChevronRight size={14} className="text-indigo-300" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 overflow-y-auto space-y-6 pt-2">
          
          <div>
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.15em] px-3 mb-2">Main</p>
            <div className="space-y-1">
              {/* Active Item */}
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-full bg-[#f8fafc] text-[#1e1b4b] font-semibold text-[13px] shadow-sm transition-transform hover:scale-[1.02]">
                <LayoutDashboard size={16} className="text-[#3730a3]" />
                <span>Dashboard</span>
              </a>
              
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-full text-indigo-200 hover:bg-white/10 hover:text-white font-medium text-[13px] transition-colors">
                <FileText size={16} className="text-indigo-200/80 group-hover:text-white" />
                <span>Reports</span>
              </a>
              
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-full text-indigo-200 hover:bg-white/10 hover:text-white font-medium text-[13px] transition-colors">
                <Plug size={16} className="text-indigo-200/80 group-hover:text-white" />
                <span>Connectors</span>
              </a>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.15em] px-3 mb-2">Account</p>
            <div className="space-y-1">
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-full text-indigo-200 hover:bg-white/10 hover:text-white font-medium text-[13px] transition-colors">
                <Settings size={16} className="text-indigo-200/80 group-hover:text-white" />
                <span>Settings</span>
              </a>
              
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-full text-indigo-200 hover:bg-white/10 hover:text-white font-medium text-[13px] transition-colors">
                <CreditCard size={16} className="text-indigo-200/80 group-hover:text-white" />
                <span>Billing</span>
              </a>
            </div>
          </div>
        </nav>

        {/* Upgrade Card */}
        <div className="p-4 mt-auto">
          <div className="rounded-2xl p-4 bg-[#0F0C29] border border-indigo-500/30 relative overflow-hidden shadow-xl">
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/20 rounded-full blur-xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="relative z-10">
              <p className="text-[13px] font-bold text-white mb-1">Starter Plan</p>
              <p className="text-[11px] text-indigo-200 mb-4 leading-relaxed">
                Unlock custom domains and unlimited client reports.
              </p>
              <button className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-[#431407] text-[12px] font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.6)] hover:-translate-y-0.5">
                <span>Upgrade to Pro</span>
                <ChevronRight size={14} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area (Dark) */}
      <main className="flex-1 bg-[#0a0a0f] p-8 flex flex-col gap-6">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10"></div>
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10"></div>
          </div>
        </header>
        
        {/* Placeholder Content */}
        <div className="grid grid-cols-3 gap-6">
          <div className="h-32 rounded-xl bg-white/[0.02] border border-white/[0.05]"></div>
          <div className="h-32 rounded-xl bg-white/[0.02] border border-white/[0.05]"></div>
          <div className="h-32 rounded-xl bg-white/[0.02] border border-white/[0.05]"></div>
        </div>
        
        <div className="flex-1 rounded-xl bg-white/[0.02] border border-white/[0.05] mt-2"></div>
      </main>
      
    </div>
  );
}
