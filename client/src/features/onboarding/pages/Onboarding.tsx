import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import {
  Check, ArrowRight, ArrowLeft, Zap, Upload,
  Building2, UserRound, Plug, FileBarChart2,
  Shield, Clock, Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { agencyApi, clientsApi, connectorsApi, reportsApi } from '../../../lib/api';

/* ─── Constants ──────────────────────────────────────────── */

const STEPS = [
  { label: 'Your Agency',      icon: Building2 },
  { label: 'First Client',     icon: UserRound },
  { label: 'Connect Data',     icon: Plug },
  { label: 'Generate Report',  icon: FileBarChart2 },
];

const LEFT_PANEL = [
  { icon: Zap,    text: 'First report ready in under 15 minutes' },
  { icon: Shield, text: 'AES-256 encrypted — your data stays private' },
  { icon: Star,   text: 'Rated 4.9/5 by 400+ marketing agencies' },
  { icon: Clock,  text: 'Save 10+ hours per week on reporting' },
];

const PLATFORMS = [
  { id: 'google_analytics', name: 'Google Analytics 4',  emoji: '📊', desc: 'Website traffic & conversions' },
  { id: 'google_ads',       name: 'Google Ads',           emoji: '🎯', desc: 'Search & display performance' },
  { id: 'meta_ads',         name: 'Meta Ads',             emoji: '📘', desc: 'Facebook & Instagram ads' },
];

const REPORT_STEPS = [
  { label: 'Fetching data…',           pct: 20 },
  { label: 'Analyzing channels…',      pct: 45 },
  { label: 'Writing AI narrative…',    pct: 72 },
  { label: 'Building report…',         pct: 90 },
];

/* ─── Step progress bar ──────────────────────────────────── */

function StepBar({ current }: { current: number }) {
  return (
    <>
      {/* Mobile: slim progress bar + label */}
      <div className="sm:hidden mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#818CF8]">
            Step {current + 1} of {STEPS.length}
          </span>
          <span className="text-xs text-[#64748B]">{STEPS[current].label}</span>
        </div>
        <div className="h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#6366F1] to-[#818CF8] rounded-full transition-all duration-500"
            style={{ width: `${((current + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: pill steps */}
      <div className="hidden sm:flex items-center justify-center gap-2 mb-10">
        {STEPS.map((s, i) => {
          const done    = i < current;
          const active  = i === current;
          const Icon    = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  done   ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30' :
                  active ? 'bg-[#6366F1] shadow-md shadow-indigo-500/30' :
                           'bg-[#1E293B] border border-[#334155]'
                }`}>
                  {done
                    ? <Check size={14} className="text-white" strokeWidth={2.5} />
                    : <Icon size={13} className={active ? 'text-white' : 'text-[#475569]'} />
                  }
                </div>
                <span className={`text-xs font-medium hidden md:block transition-colors ${
                  active ? 'text-white' : done ? 'text-emerald-400' : 'text-[#475569]'
                }`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 md:w-10 h-px transition-colors duration-300 ${i < current ? 'bg-emerald-500/50' : 'bg-[#1E293B]'}`} />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ─── Reusable form input ────────────────────────────────── */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
}
function FormInput({ label, required, ...props }: InputProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 tracking-wide uppercase">
        {label} {required && <span className="text-[#6366F1]">*</span>}
      </label>
      <input
        {...props}
        className="w-full bg-[#0A0F1E] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white placeholder-[#334155] focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]/40 transition-all duration-200 min-h-[48px]"
      />
    </div>
  );
}

/* ─── Primary button ─────────────────────────────────────── */

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
}
function PrimaryBtn({ loading, children, className = '', ...props }: BtnProps) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`flex-1 flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] disabled:opacity-40 disabled:cursor-not-allowed text-white py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-px min-h-[48px] ${className}`}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : children}
    </button>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-white px-5 py-3.5 border border-[#334155] hover:border-[#475569] rounded-xl transition-all duration-200 min-h-[48px]"
    >
      <ArrowLeft size={14} /> Back
    </button>
  );
}

/* ─── Main component ─────────────────────────────────────── */

export default function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref') || sessionStorage.getItem('referral_code') || '';

  const [step, setStep] = useState(0);
  const [agencyForm, setAgencyForm] = useState({ name: '', brandColor: '#6366F1' });
  const [clientForm, setClientForm] = useState({ name: '', contactEmail: '', contactName: '' });
  const [connectedPlatform, setConnectedPlatform] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);
  const [reportLabel, setReportLabel] = useState('');
  const [createdClientId, setCreatedClientId] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const updateAgencyMutation  = useMutation(agencyApi.update);
  const createClientMutation  = useMutation(clientsApi.create);
  const addDemoMutation       = useMutation(({ platform, name }: any) => connectorsApi.addDemo(platform, name));

  /* ── Handlers ── */

  const handleStep1 = async () => {
    if (!agencyForm.name.trim()) { toast.error('Agency name is required'); return; }
    try {
      const payload: any = { name: agencyForm.name, brandColor: agencyForm.brandColor };
      if (refCode) payload.referredByCode = refCode;
      await updateAgencyMutation.mutateAsync(payload);
      if (refCode) sessionStorage.removeItem('referral_code');
      if (logoFile) { try { await agencyApi.uploadLogo(logoFile); } catch {} }
      setStep(1);
    } catch { toast.error('Failed to save agency profile'); }
  };

  const handleStep2 = async () => {
    if (!clientForm.name || !clientForm.contactEmail || !clientForm.contactName) {
      toast.error('All fields required'); return;
    }
    try {
      const client = await createClientMutation.mutateAsync({ ...clientForm, agencyId: undefined });
      setCreatedClientId(client.id);
      setStep(2);
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to create client'); }
  };

  const handleAddDemo = async (platform: string) => {
    try {
      await addDemoMutation.mutateAsync({ platform, name: `${clientForm.name} ${platform.replace(/_/g, ' ')}` });
      setConnectedPlatform(platform);
      toast.success('Data source connected!');
    } catch { toast.error('Failed to connect'); }
  };

  const handleStep4 = async () => {
    if (!createdClientId) { toast.error('Create a client first'); return; }
    setGeneratingReport(true);
    setReportProgress(10);
    setReportLabel('Fetching data…');

    try {
      const onboardingStartTime = Date.now();
      const end   = new Date();
      const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const report = await reportsApi.create({
        clientId: createdClientId,
        dateRangeStart: start.toISOString().slice(0, 10),
        dateRangeEnd:   end.toISOString().slice(0, 10),
        narrativeTone: 'professional',
      });

      let stepIdx = 0;
      const poll = setInterval(async () => {
        if (stepIdx < REPORT_STEPS.length) {
          setReportLabel(REPORT_STEPS[stepIdx].label);
          setReportProgress(REPORT_STEPS[stepIdx].pct);
          stepIdx++;
        }
        const r = await reportsApi.get(report.id);
        if (r.status === 'ready') {
          clearInterval(poll);
          setReportProgress(100);
          setReportLabel('Report ready! 🎉');
          await agencyApi.update({ onboardingCompletedAt: new Date().toISOString() });
          qc.invalidateQueries('agency');
          const { trackEvent } = await import('../../../lib/posthog');
          trackEvent('onboarding_completed', { timeToCompleteMs: Date.now() - onboardingStartTime });
          setTimeout(() => { navigate(`/reports/${report.id}`); toast.success('Welcome to ReportCraft AI! 🎉'); }, 800);
        } else if (r.status === 'error') {
          clearInterval(poll);
          toast.error('Report generation failed — please try again from the dashboard.');
          setGeneratingReport(false);
        }
      }, 3000);
    } catch { toast.error('Failed to generate report'); setGeneratingReport(false); }
  };

  /* ── Render ── */

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex flex-col lg:flex-row overflow-x-hidden">

      {/* ══ Left branding panel (desktop only) ══ */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] shrink-0 flex-col justify-between bg-gradient-to-b from-[#0D1424] to-[#0A0F1E] border-r border-white/5 px-10 py-12">
        {/* Logo */}
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-gradient-to-br from-[#6366F1] to-[#4F46E5] rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30">
              <Zap size={19} className="text-white" />
            </div>
            <div>
              <p className="text-base font-extrabold text-white leading-tight">ReportCraft <span className="text-[#818CF8]">AI</span></p>
              <p className="text-[10px] text-[#475569] font-medium tracking-widest uppercase">Setup wizard</p>
            </div>
          </div>

          <h2 className="text-2xl xl:text-3xl font-bold text-white leading-tight mb-3">
            You're 5 minutes away from your first AI report.
          </h2>
          <p className="text-sm text-[#64748B] leading-[1.7] mb-10">
            Connect your client data, and ReportCraft AI will write a 400-word cross-channel narrative automatically.
          </p>

          {/* Benefits list */}
          <div className="space-y-4">
            {LEFT_PANEL.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#6366F1]/12 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={15} className="text-[#818CF8]" />
                </div>
                <p className="text-sm text-[#94A3B8] leading-[1.6]">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quote */}
        <div className="bg-[#111827] rounded-2xl border border-white/5 p-5 mt-10">
          <div className="flex gap-0.5 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
            ))}
          </div>
          <p className="text-sm text-[#94A3B8] leading-[1.7] italic mb-3">
            "We went from 6 hours of manual reporting to one click. Our clients think we hired a data analyst."
          </p>
          <p className="text-xs font-semibold text-[#64748B]">— Sarah K., Digital Marketing Agency</p>
        </div>
      </div>

      {/* ══ Right: wizard form ══ */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-10 lg:py-12">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-[#6366F1] to-[#4F46E5] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-lg font-extrabold text-white">
            ReportCraft <span className="text-[#818CF8]">AI</span>
          </span>
        </div>

        <div className="w-full max-w-md">
          {/* Step title (mobile only header) */}
          <div className="lg:hidden text-center mb-2">
            <p className="text-xs text-[#475569] font-medium">Let's get you set up in under 5 minutes</p>
          </div>

          <StepBar current={step} />

          {/* Card */}
          <div className="bg-[#111827] border border-white/6 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
            <div className="p-6 sm:p-8">

              {/* ── Step 0: Agency ── */}
              {step === 0 && (
                <div className="animate-fade-in">
                  <div className="mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight mb-1.5">Your Agency</h1>
                    <p className="text-sm text-[#64748B] leading-relaxed">Set up your agency profile and branding</p>
                  </div>

                  <div className="space-y-5">
                    <FormInput
                      label="Agency Name"
                      required
                      type="text"
                      value={agencyForm.name}
                      onChange={e => setAgencyForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Acme Digital Agency"
                    />

                    {/* Logo upload */}
                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 tracking-wide uppercase">
                        Logo <span className="text-[#475569] normal-case font-normal">(optional)</span>
                      </label>
                      <label className="flex items-center gap-3 px-4 py-3 border border-[#334155] border-dashed rounded-xl text-sm text-[#64748B] cursor-pointer hover:border-[#6366F1]/50 hover:text-[#94A3B8] hover:bg-[#6366F1]/5 transition-all duration-200 min-h-[48px]">
                        <Upload size={15} className="shrink-0" />
                        <span className="truncate">{logoFile ? logoFile.name : 'Upload PNG, JPG, or SVG (max 2MB)'}</span>
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.svg"
                          onChange={e => setLogoFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Brand color */}
                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 tracking-wide uppercase">
                        Brand Color
                      </label>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl border-2 border-white/10 overflow-hidden relative cursor-pointer shadow-lg shrink-0"
                          style={{ boxShadow: `0 4px 16px ${agencyForm.brandColor}40` }}
                        >
                          <input
                            type="color"
                            value={agencyForm.brandColor}
                            onChange={e => setAgencyForm(f => ({ ...f, brandColor: e.target.value }))}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          />
                          <div className="w-full h-full" style={{ background: agencyForm.brandColor }} />
                        </div>
                        <input
                          type="text"
                          value={agencyForm.brandColor}
                          onChange={e => setAgencyForm(f => ({ ...f, brandColor: e.target.value }))}
                          className="bg-[#0A0F1E] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white font-mono w-32 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]/40 transition-all duration-200 min-h-[48px]"
                        />
                        <span className="text-xs text-[#475569]">Click swatch to pick</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-7">
                    <PrimaryBtn
                      onClick={handleStep1}
                      disabled={!agencyForm.name}
                      loading={updateAgencyMutation.isLoading}
                    >
                      Continue <ArrowRight size={16} />
                    </PrimaryBtn>
                  </div>
                </div>
              )}

              {/* ── Step 1: Client ── */}
              {step === 1 && (
                <div className="animate-fade-in">
                  <div className="mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight mb-1.5">First Client</h1>
                    <p className="text-sm text-[#64748B] leading-relaxed">Who are you reporting for?</p>
                  </div>

                  <div className="space-y-4">
                    <FormInput
                      label="Client Name"
                      required
                      type="text"
                      value={clientForm.name}
                      onChange={e => setClientForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Acme Corp"
                    />
                    <FormInput
                      label="Contact Name"
                      required
                      type="text"
                      value={clientForm.contactName}
                      onChange={e => setClientForm(f => ({ ...f, contactName: e.target.value }))}
                      placeholder="Jane Smith"
                    />
                    <FormInput
                      label="Contact Email"
                      required
                      type="email"
                      value={clientForm.contactEmail}
                      onChange={e => setClientForm(f => ({ ...f, contactEmail: e.target.value }))}
                      placeholder="jane@acmecorp.com"
                    />
                  </div>

                  <div className="flex gap-3 mt-7">
                    <BackBtn onClick={() => setStep(0)} />
                    <PrimaryBtn
                      onClick={handleStep2}
                      disabled={!clientForm.name || !clientForm.contactEmail || !clientForm.contactName}
                      loading={createClientMutation.isLoading}
                    >
                      Continue <ArrowRight size={16} />
                    </PrimaryBtn>
                  </div>
                </div>
              )}

              {/* ── Step 2: Connectors ── */}
              {step === 2 && (
                <div className="animate-fade-in">
                  <div className="mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight mb-1.5">Connect Data Source</h1>
                    <p className="text-sm text-[#64748B] leading-relaxed">Connect at least one platform to generate your first report</p>
                  </div>

                  <div className="space-y-3 mb-5">
                    {PLATFORMS.map(p => {
                      const isConnected = connectedPlatform === p.id;
                      return (
                        <div
                          key={p.id}
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                            isConnected
                              ? 'border-emerald-500/40 bg-emerald-500/5 shadow-sm shadow-emerald-500/10'
                              : 'border-white/6 bg-[#0A0F1E] hover:border-white/12'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <span className="text-2xl leading-none">{p.emoji}</span>
                            <div>
                              <p className="text-sm font-semibold text-white">{p.name}</p>
                              <p className="text-xs text-[#64748B]">{p.desc}</p>
                            </div>
                          </div>
                          {isConnected ? (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 shrink-0">
                              <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                <Check size={11} strokeWidth={3} />
                              </div>
                              Connected
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddDemo(p.id)}
                              disabled={addDemoMutation.isLoading}
                              className="shrink-0 text-xs bg-[#6366F1]/15 hover:bg-[#6366F1]/25 border border-[#6366F1]/30 hover:border-[#6366F1]/50 text-[#818CF8] px-4 py-2 rounded-lg font-semibold transition-all duration-200 min-h-[36px] disabled:opacity-50"
                            >
                              Connect
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 bg-[#0A0F1E] border border-white/5 rounded-xl px-4 py-3 mb-6">
                    <Zap size={13} className="text-[#6366F1] shrink-0" />
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      Demo connectors generate realistic sample data so you can see your first AI report instantly
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <BackBtn onClick={() => setStep(1)} />
                    <PrimaryBtn onClick={() => setStep(3)} disabled={!connectedPlatform}>
                      Continue <ArrowRight size={16} />
                    </PrimaryBtn>
                  </div>
                </div>
              )}

              {/* ── Step 3: Generate ── */}
              {step === 3 && (
                <div className="animate-fade-in">
                  {!generatingReport ? (
                    <>
                      <div className="mb-6">
                        <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight mb-1.5">Generate First Report</h1>
                        <p className="text-sm text-[#64748B] leading-relaxed">We'll pull 30 days of data and write your first AI narrative</p>
                      </div>

                      {/* What AI will do */}
                      <div className="bg-[#0A0F1E] rounded-xl border border-white/5 p-5 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-6 h-6 bg-gradient-to-br from-[#6366F1] to-[#4F46E5] rounded-lg flex items-center justify-center">
                            <Zap size={12} className="text-white" />
                          </div>
                          <p className="text-sm font-semibold text-white">What happens next</p>
                        </div>
                        <div className="space-y-2.5">
                          {[
                            'Fetch last 30 days of performance data',
                            'Analyze cross-channel metric correlations',
                            'Write a 400-word AI narrative with causal insights',
                            'Build a branded PDF-ready report',
                          ].map((s, i) => (
                            <div key={s} className="flex items-start gap-3">
                              <div className="w-5 h-5 bg-[#6366F1]/15 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-[9px] font-bold text-[#818CF8]">{i + 1}</span>
                              </div>
                              <p className="text-sm text-[#94A3B8] leading-snug">{s}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <BackBtn onClick={() => setStep(2)} />
                        <PrimaryBtn onClick={handleStep4}>
                          <Zap size={15} /> Generate Report
                        </PrimaryBtn>
                      </div>
                    </>
                  ) : (
                    /* Generating state */
                    <div className="text-center py-6">
                      {/* Spinner */}
                      <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="w-20 h-20 border-[3px] border-[#1E293B] rounded-full" />
                        <div className="absolute inset-0 border-[3px] border-[#6366F1] border-t-transparent rounded-full animate-spin" />
                        <div className="absolute inset-[6px] flex items-center justify-center">
                          <Zap size={18} className="text-[#6366F1]" />
                        </div>
                      </div>

                      <p className="text-base font-semibold text-white mb-1">{reportLabel}</p>
                      <p className="text-xs text-[#475569] mb-6">This usually takes 30–60 seconds</p>

                      {/* Progress bar */}
                      <div className="w-full bg-[#1E293B] rounded-full h-2 mb-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#6366F1] to-[#818CF8] rounded-full transition-all duration-1000"
                          style={{ width: `${reportProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-[#475569]">{reportProgress}%</p>

                      {/* Step pills */}
                      <div className="flex flex-wrap justify-center gap-2 mt-6">
                        {REPORT_STEPS.map((s, i) => (
                          <span
                            key={s.label}
                            className={`text-[11px] px-3 py-1 rounded-full font-medium transition-all duration-300 ${
                              reportProgress >= s.pct
                                ? 'bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30'
                                : 'bg-[#1E293B] text-[#334155] border border-transparent'
                            }`}
                          >
                            {s.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Card footer */}
            <div className="px-6 sm:px-8 py-3 bg-[#0A0F1E]/60 border-t border-white/4 flex items-center justify-between">
              <span className="text-xs text-[#334155]">Step {step + 1} of {STEPS.length}</span>
              <div className="flex gap-1">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === step ? 'w-6 bg-[#6366F1]' : i < step ? 'w-3 bg-emerald-500/60' : 'w-3 bg-[#1E293B]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Legal note */}
          <p className="text-center text-[11px] text-[#334155] mt-5 leading-relaxed">
            By continuing you agree to our{' '}
            <a href="/terms" className="text-[#475569] hover:text-[#64748B] transition-colors underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-[#475569] hover:text-[#64748B] transition-colors underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
