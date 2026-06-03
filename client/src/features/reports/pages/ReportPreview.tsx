import { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  ArrowLeft, Download, Send, RefreshCw, ThumbsUp, ThumbsDown,
  Share2, ExternalLink, Calendar, Plug, Zap, X,
  TrendingUp, TrendingDown, Settings2, ChevronRight,
  FileText, Clock, Cpu, BookOpen, BarChart2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reportsApi } from '../../../lib/api';
import { trackEvent } from '../../../lib/posthog';
import { formatDate, formatDelta, formatNumber } from '../../../utils/format';
import StatusBadge from '../../../components/shared/StatusBadge';
import { PageLoader } from '../../../components/shared/LoadingSpinner';

/* ═══════════════════════════════════════════════════════
   METRIC CARD
═══════════════════════════════════════════════════════ */

interface MetricCardProps {
  label: string;
  value: number | string;
  prev?: number;
  invert?: boolean;
  prefix?: string;
  suffix?: string;
  color?: string;
}

function MetricCard({ label, value, prev, invert = false, prefix = '', suffix = '', color = '#6366F1' }: MetricCardProps) {
  const delta = typeof value === 'number' && prev !== undefined
    ? formatDelta(value, prev)
    : null;
  const good = delta ? (invert ? !delta.isPositive : delta.isPositive) : null;

  const displayValue = typeof value === 'number'
    ? (value % 1 !== 0 ? value.toFixed(2) : formatNumber(Math.round(value)))
    : value;

  return (
    <div
      className="relative rounded-2xl border border-white/[0.07] bg-[#111827] p-5 flex flex-col gap-2 overflow-hidden transition-all duration-200 hover:border-white/[0.12] hover:bg-[#141f35] group"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 0 0 0 transparent' }}
    >
      {/* Accent glow top-left */}
      <div
        className="absolute -top-8 -left-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none"
        style={{ background: color + '30' }}
      />

      <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.1em] leading-none">
        {label}
      </p>

      <p className="text-[1.75rem] font-bold text-white leading-none tracking-tight">
        <span className="text-[1.1rem] font-semibold text-[#94A3B8] mr-0.5">{prefix}</span>
        {displayValue}
        <span className="text-[1.1rem] font-semibold text-[#94A3B8] ml-0.5">{suffix}</span>
      </p>

      {delta && !delta.isNA && (
        <div className={`inline-flex items-center gap-1.5 text-[11px] font-semibold self-start px-2 py-0.5 rounded-full ${
          good
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {good
            ? <TrendingUp size={10} strokeWidth={2.5} />
            : <TrendingDown size={10} strokeWidth={2.5} />
          }
          {delta.value}
          <span className="text-[10px] opacity-70 font-normal">vs prev</span>
        </div>
      )}
      {delta && delta.isNA && (
        <span className="text-[11px] text-[#475569] font-medium">No prev data</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   NARRATIVE SECTION
═══════════════════════════════════════════════════════ */

const NARRATIVE_ICONS: Record<string, JSX.Element> = {
  '📊': <BarChart2 size={14} />,
  '📈': <TrendingUp size={14} />,
  '🏆': <span className="text-[13px]">🏆</span>,
  '⚠️': <span className="text-[13px]">⚠️</span>,
  '🎯': <span className="text-[13px]">🎯</span>,
};

function NarrativeSection({ title, body, color }: { title: string; body: string; color: string }) {
  const emoji = title.match(/^[\p{Emoji}]/u)?.[0] || '';
  const cleanTitle = title.replace(/^[\p{Emoji}\s]+/u, '').trim();

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111827] overflow-hidden mb-3 transition-all duration-200 hover:border-white/[0.11]">
      <div
        className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06]"
        style={{ background: `linear-gradient(90deg, ${color}10 0%, transparent 100%)` }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[13px]"
          style={{ background: color + '20', border: `1px solid ${color}30` }}
        >
          {emoji}
        </div>
        <h4 className="text-sm font-bold text-white leading-none tracking-wide">
          {cleanTitle}
        </h4>
      </div>
      <div className="px-5 py-4">
        <p className="text-[15px] text-[#CBD5E1] leading-[1.75]">{body}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CONNECT PLATFORM CTA
═══════════════════════════════════════════════════════ */

function ConnectPlatformCTA({ platform, brandColor }: { platform: string; platformId: string; brandColor: string }) {
  return (
    <div className="mb-4 rounded-2xl border border-dashed border-[#1E293B] hover:border-[#334155] p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-colors duration-200">
      <div className="w-10 h-10 rounded-xl bg-[#1E293B] flex items-center justify-center shrink-0">
        <Plug size={16} className="text-[#475569]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#94A3B8]">{platform} not connected</p>
        <p className="text-xs text-[#475569] mt-0.5 leading-snug">
          Connect this platform to include live data in future reports
        </p>
      </div>
      <Link
        to="/connectors"
        className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all duration-200 min-h-[40px] hover:opacity-90"
        style={{ borderColor: brandColor + '50', color: brandColor, background: brandColor + '12' }}
      >
        Connect <ChevronRight size={12} />
      </Link>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TONE SELECTOR
═══════════════════════════════════════════════════════ */

function ToneSelector({ current, onChange, disabled }: { current: string; onChange: (t: string) => void; disabled?: boolean }) {
  const tones = [
    { id: 'professional',   label: 'Pro' },
    { id: 'conversational', label: 'Casual' },
    { id: 'executive',      label: 'Exec' },
  ];
  return (
    <div className="flex rounded-xl overflow-hidden border border-[#1E293B] bg-[#0A0F1E] text-[11px]">
      {tones.map(t => (
        <button
          key={t.id}
          disabled={disabled}
          onClick={() => onChange(t.id)}
          className={`flex-1 py-2.5 font-semibold transition-all duration-200 disabled:opacity-40 ${
            current === t.id
              ? 'bg-[#6366F1] text-white shadow-md shadow-indigo-500/20'
              : 'text-[#64748B] hover:text-white hover:bg-[#1E293B]'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DATE RANGE SELECTOR
═══════════════════════════════════════════════════════ */

function DateRangeSelector({ report, clientId, onNewReport }: {
  report: any; clientId: string; onNewReport: (id: string) => void;
}) {
  const [customStart, setCustomStart] = useState('');
  const [customEnd,   setCustomEnd]   = useState('');
  const [creating,    setCreating]    = useState(false);

  const presets = [{ label: '7d', days: 7 }, { label: '30d', days: 30 }, { label: '90d', days: 90 }];
  const currentDays = Math.round(
    (new Date(report.dateRangeEnd).getTime() - new Date(report.dateRangeStart).getTime()) / 86400000
  );

  const createReport = async (start: string, end: string) => {
    setCreating(true);
    try {
      const result = await reportsApi.create({
        clientId, dateRangeStart: start, dateRangeEnd: end, narrativeTone: report.narrativeTone,
      });
      onNewReport(result.id);
      toast.success('Generating new report…');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create report');
    } finally { setCreating(false); }
  };

  const handlePreset = (days: number) => {
    const end   = new Date();
    const start = new Date(Date.now() - days * 86400000);
    createReport(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10));
  };

  const handleCustom = () => {
    if (!customStart || !customEnd) { toast.error('Select both dates'); return; }
    if (customStart > customEnd) { toast.error('Start must be before end'); return; }
    createReport(customStart, customEnd);
  };

  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#0A0F1E] p-4 space-y-3">
      <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest flex items-center gap-1.5">
        <Calendar size={10} /> Date Range
      </p>
      <div className="flex gap-1.5">
        {presets.map(p => (
          <button
            key={p.label} disabled={creating} onClick={() => handlePreset(p.days)}
            className={`flex-1 py-2 text-[11px] font-semibold rounded-lg transition-all duration-200 border min-h-[36px] ${
              currentDays === p.days
                ? 'bg-[#6366F1]/15 border-[#6366F1]/40 text-[#818CF8]'
                : 'border-[#1E293B] text-[#64748B] hover:text-white hover:border-[#334155]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        <input
          type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
          className="w-full bg-[#111827] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1] transition-colors min-h-[36px]"
        />
        <input
          type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
          className="w-full bg-[#111827] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1] transition-colors min-h-[36px]"
        />
        <button
          onClick={handleCustom} disabled={creating || !customStart || !customEnd}
          className="w-full py-2 text-xs font-semibold border border-[#1E293B] hover:border-[#334155] text-[#64748B] hover:text-white rounded-lg transition-all duration-200 disabled:opacity-40 min-h-[36px]"
        >
          {creating ? 'Creating…' : 'Apply Range'}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   RATING WIDGET
═══════════════════════════════════════════════════════ */

function RatingWidget({ reportId, currentRating }: { reportId: string; currentRating?: string }) {
  const [rated,        setRated]        = useState<string | null>(currentRating || null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [section,      setSection]      = useState('');
  const [note,         setNote]         = useState('');
  const qc = useQueryClient();

  const rateMutation = useMutation(
    ({ rating, section, note }: any) => reportsApi.rate(reportId, rating, section, note),
    {
      onSuccess: data => {
        setRated(data.narrativeRating);
        qc.invalidateQueries(['report', reportId]);
        setShowFeedback(false);
        toast.success('Feedback submitted — thank you!');
      },
      onError: () => toast.error('Failed to submit feedback'),
    }
  );

  const sections = [
    { label: 'Executive Summary',    value: 'executive_summary' },
    { label: 'Campaign Performance', value: 'campaign_performance' },
    { label: 'Key Wins',             value: 'key_wins' },
    { label: 'Areas of Concern',     value: 'areas_of_concern' },
    { label: 'Recommendations',      value: 'recommendations' },
    { label: 'Overall quality',      value: 'overall' },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111827] p-5 mt-3">
      <p className="text-xs font-semibold text-[#64748B] mb-3">Was this AI narrative helpful?</p>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => { rateMutation.mutate({ rating: 'up' }); setRated('up'); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border min-h-[44px] ${
            rated === 'up'
              ? 'bg-emerald-500/12 border-emerald-500/30 text-emerald-400'
              : 'border-[#1E293B] text-[#94A3B8] hover:border-emerald-500/30 hover:text-emerald-400 hover:bg-emerald-500/8'
          }`}
        >
          <ThumbsUp size={13} /> Helpful
        </button>
        <button
          onClick={() => setShowFeedback(v => !v)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border min-h-[44px] ${
            rated === 'down'
              ? 'bg-red-500/12 border-red-500/30 text-red-400'
              : 'border-[#1E293B] text-[#94A3B8] hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/8'
          }`}
        >
          <ThumbsDown size={13} /> Not helpful
        </button>
      </div>

      {showFeedback && (
        <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3 animate-fade-in">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Which section was least useful? *</label>
            <select
              value={section} onChange={e => setSection(e.target.value)}
              className="w-full bg-[#0A0F1E] border border-[#1E293B] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#6366F1] transition-colors min-h-[42px]"
            >
              <option value="">Select section…</option>
              {sections.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">What was wrong? (optional)</label>
            <textarea
              value={note} onChange={e => setNote(e.target.value)} maxLength={500} rows={2}
              placeholder="E.g. The recommendation was too generic…"
              className="w-full bg-[#0A0F1E] border border-[#1E293B] rounded-xl px-3 py-2.5 text-xs text-white resize-none focus:outline-none focus:border-[#6366F1] transition-colors placeholder-[#334155]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFeedback(false)} className="text-xs text-[#64748B] hover:text-white transition-colors px-3 py-2 min-h-[36px]">
              Cancel
            </button>
            <button
              onClick={() => {
                if (!section) { toast.error('Please select a section'); return; }
                rateMutation.mutate({ rating: 'down', section, note });
              }}
              disabled={!section || rateMutation.isLoading}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-40 text-white px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 min-h-[40px]"
            >
              {rateMutation.isLoading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit Feedback'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PLATFORM SECTION WRAPPER
═══════════════════════════════════════════════════════ */

function PlatformSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}60` }} />
        <h3 className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color }}>
          {title}
        </h3>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${color}20, transparent)` }} />
      </div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ACTION BUTTON (reusable)
═══════════════════════════════════════════════════════ */

function ActionBtn({
  onClick, disabled, loading, icon: Icon, label, variant = 'secondary',
}: {
  onClick: () => void; disabled?: boolean; loading?: boolean;
  icon: React.ElementType; label: string; variant?: 'primary' | 'secondary' | 'ghost';
}) {
  const base = 'w-full flex items-center gap-2.5 text-xs font-semibold px-4 py-3 rounded-xl transition-all duration-200 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed';
  const variants = {
    primary:   'bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white shadow-md shadow-indigo-500/20',
    secondary: 'border border-[#1E293B] hover:border-[#334155] hover:bg-white/[0.04] text-[#94A3B8] hover:text-white',
    ghost:     'text-[#64748B] hover:text-white hover:bg-white/[0.04]',
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} className={`${base} ${variants[variant]}`}>
      {loading
        ? <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        : <Icon size={13} />
      }
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   SIDEBAR CONTENT (stable component, no re-mount)
═══════════════════════════════════════════════════════ */

interface SidebarContentProps {
  report: any;
  exportingPdf: boolean;
  sendingEmail: boolean;
  refreshing: boolean;
  changingTone: boolean;
  isBusy: boolean;
  isGenerating: boolean;
  brandColor: string;
  onExportPdf: () => void;
  onSend: () => void;
  onRefresh: () => void;
  onShare: () => void;
  onToneChange: (t: string) => void;
  onNewReport: (id: string) => void;
}

function SidebarPanelContent({
  report, exportingPdf, sendingEmail, refreshing, changingTone,
  isBusy, isGenerating, brandColor,
  onExportPdf, onSend, onRefresh, onShare, onToneChange, onNewReport,
}: SidebarContentProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {/* Actions */}
      <div className="rounded-xl border border-[#1E293B] bg-[#0A0F1E] p-4 space-y-2">
        <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-2">Actions</p>

        <ActionBtn onClick={onExportPdf} disabled={exportingPdf || isGenerating}
          loading={exportingPdf} icon={Download} label={exportingPdf ? 'Exporting…' : 'Export PDF'} variant="primary" />

        <ActionBtn onClick={onSend} disabled={sendingEmail || isGenerating}
          loading={sendingEmail} icon={Send} label={sendingEmail ? 'Sending…' : 'Send to Client'} />

        <ActionBtn onClick={onRefresh} disabled={isBusy}
          loading={refreshing} icon={RefreshCw} label={refreshing ? 'Refreshing…' : 'Refresh Data'} />

        <button
          onClick={onShare}
          className={`w-full flex items-center gap-2.5 text-xs font-semibold px-4 py-3 rounded-xl border transition-all duration-200 min-h-[44px] ${
            report.shareEnabled
              ? 'border-[#6366F1]/40 bg-[#6366F1]/8 text-[#818CF8]'
              : 'border-[#1E293B] text-[#94A3B8] hover:border-[#334155] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Share2 size={13} />
          {report.shareEnabled ? 'Sharing On' : 'Share Link'}
        </button>

        {report.shareEnabled && report.shareToken && (
          <a
            href={`/p/${report.shareToken}`} target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center gap-2 text-xs text-[#6366F1] hover:text-[#818CF8] px-2 py-1.5 transition-colors"
          >
            <ExternalLink size={11} /> View public link
          </a>
        )}
      </div>

      {/* Tone selector */}
      <div className="rounded-xl border border-[#1E293B] bg-[#0A0F1E] p-4 space-y-2.5">
        <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Narrative Tone</p>
        <ToneSelector current={report.narrativeTone || 'professional'} onChange={onToneChange} disabled={isBusy} />
        {changingTone && (
          <p className="text-[10px] text-[#64748B] text-center animate-pulse">Regenerating with new tone…</p>
        )}
      </div>

      {/* Date range */}
      {!isGenerating && report.clientId && (
        <DateRangeSelector
          report={report} clientId={report.clientId}
          onNewReport={id => navigate(`/reports/${id}`)}
        />
      )}

      {/* Report info */}
      <div className="rounded-xl border border-[#1E293B] bg-[#0A0F1E] p-4">
        <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-3">Report Info</p>
        <div className="space-y-2.5 text-xs">
          {[
            { label: 'Status',    icon: <span className="w-1.5 h-1.5 rounded-full bg-[#475569] inline-block" />, value: <StatusBadge status={report.status} /> },
            { label: 'Client',    icon: <FileText size={10} className="text-[#475569]" />, value: <span className="text-white font-medium truncate max-w-[110px]">{report.client?.name}</span> },
            { label: 'Range',     icon: <Calendar size={10} className="text-[#475569]" />, value: <span className="text-white text-[10px]">{formatDate(report.dateRangeStart)} – {formatDate(report.dateRangeEnd)}</span> },
            report.generationDurationMs ? { label: 'Gen time', icon: <Clock size={10} className="text-[#475569]" />, value: <span className="text-white">{(report.generationDurationMs / 1000).toFixed(1)}s</span> } : null,
            report.aiModel          ? { label: 'AI Model', icon: <Cpu size={10} className="text-[#475569]" />, value: <span className="text-white text-[10px] truncate max-w-[110px]">{report.aiModel}</span> } : null,
            (report.narrative as any)?.wordCount ? { label: 'Words', icon: <BookOpen size={10} className="text-[#475569]" />, value: <span className="text-white">{(report.narrative as any).wordCount}</span> } : null,
          ].filter(Boolean).map((row: any) => (
            <div key={row.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[#64748B] shrink-0">
                {row.icon}
                {row.label}
              </div>
              <div className="overflow-hidden">{row.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */

export default function ReportPreview() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const { data: report, isLoading } = useQuery(
    ['report', id],
    () => reportsApi.get(id!),
    { refetchInterval: data => data?.status === 'generating' ? 3000 : false }
  );

  const [exportingPdf,  setExportingPdf]  = useState(false);
  const [sendingEmail,  setSendingEmail]  = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);
  const [changingTone,  setChangingTone]  = useState(false);
  const [drawerOpen,    setDrawerOpen]    = useState(false);

  const handleExportPdf = useCallback(async () => {
    setExportingPdf(true);
    try {
      const blob = await reportsApi.exportPdf(id!);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${report?.client?.name || 'Report'}-Performance-Report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
      trackEvent('report_exported', { clientId: report?.clientId, reportId: id });
    } catch { toast.error('PDF generation failed'); }
    finally  { setExportingPdf(false); }
  }, [id, report]);

  const handleSend = useCallback(async () => {
    setSendingEmail(true);
    try {
      await reportsApi.send(id!);
      toast.success('Report sent to client!');
      trackEvent('report_sent', { clientId: report?.clientId, reportId: id });
    } catch { toast.error('Failed to send report'); }
    finally  { setSendingEmail(false); }
  }, [id, report]);

  const handleRefreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      await reportsApi.regenerate(id!);
      toast.success('Refreshing data and narrative…');
      qc.invalidateQueries(['report', id]);
    } catch { toast.error('Failed to refresh'); }
    finally  { setRefreshing(false); }
  }, [id, qc]);

  const handleToneChange = useCallback(async (tone: string) => {
    if (tone === report?.narrativeTone) return;
    setChangingTone(true);
    try {
      await reportsApi.regenerate(id!, tone);
      toast.success(`Tone changed to ${tone} — regenerating…`);
      qc.invalidateQueries(['report', id]);
    } catch { toast.error('Failed to change tone'); }
    finally  { setChangingTone(false); }
  }, [id, report, qc]);

  const handleShare = useCallback(async () => {
    const enabled = !report?.shareEnabled;
    try {
      await reportsApi.share(id!, enabled);
      qc.invalidateQueries(['report', id]);
      toast.success(enabled ? 'Shareable link enabled!' : 'Sharing disabled');
    } catch { toast.error('Failed to update sharing'); }
  }, [id, report, qc]);

  if (isLoading) return <PageLoader />;
  if (!report)   return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#111827] border border-[#1E293B] flex items-center justify-center">
        <FileText size={24} className="text-[#334155]" />
      </div>
      <div>
        <p className="text-white font-semibold mb-1">Report not found</p>
        <p className="text-sm text-[#64748B]">This report may have been deleted or you don't have access.</p>
      </div>
      <button onClick={() => navigate(-1)} className="text-xs font-semibold text-[#6366F1] hover:text-[#818CF8] transition-colors">
        ← Go back
      </button>
    </div>
  );

  const rawData      = report.rawData as any;
  const narrative    = report.narrative as any;
  const brandColor   = report.agency?.brandColor || '#6366F1';
  const isGenerating = report.status === 'generating';
  const isBusy       = isGenerating || refreshing || changingTone;

  const sidebarProps: SidebarContentProps = {
    report, exportingPdf, sendingEmail, refreshing, changingTone,
    isBusy, isGenerating, brandColor,
    onExportPdf: handleExportPdf,
    onSend:      handleSend,
    onRefresh:   handleRefreshData,
    onShare:     handleShare,
    onToneChange: handleToneChange,
    onNewReport: (newId) => navigate(`/reports/${newId}`),
  };

  return (
    <div className="max-w-[1280px] mx-auto pb-28 lg:pb-8 animate-fade-in">

      {/* ── PAGE HEADER ── */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-[#64748B] hover:text-white transition-colors min-h-[40px] px-1 rounded-lg group"
        >
          <span className="w-7 h-7 rounded-lg bg-[#111827] border border-[#1E293B] flex items-center justify-center group-hover:border-[#334155] transition-colors">
            <ArrowLeft size={13} />
          </span>
          <span className="hidden sm:inline">Back to Reports</span>
        </button>

        {/* Mobile action buttons */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={handleExportPdf} disabled={exportingPdf || isGenerating}
            className="flex items-center gap-1.5 text-xs font-semibold bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-40 text-white px-3 py-2 rounded-xl transition-all duration-200 min-h-[40px] shadow-md shadow-indigo-500/20"
          >
            <Download size={13} />
            <span className="hidden xs:inline">PDF</span>
          </button>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold border border-[#1E293B] hover:border-[#334155] hover:bg-white/[0.04] text-[#94A3B8] hover:text-white px-3 py-2 rounded-xl transition-all duration-200 min-h-[40px]"
            aria-label="Open settings"
          >
            <Settings2 size={13} />
            <span className="hidden xs:inline">Options</span>
          </button>
        </div>
      </div>

      {/* ── MOBILE REPORT HEADER (above content) ── */}
      <div
        className="lg:hidden rounded-2xl border mb-5 p-5 overflow-hidden relative"
        style={{ borderColor: brandColor + '25', background: `linear-gradient(135deg, ${brandColor}08, transparent)` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1">Performance Report</p>
            <h1 className="text-xl font-bold text-white leading-tight truncate">{report.client?.name}</h1>
            <p className="text-sm text-[#64748B] mt-1">
              {formatDate(report.dateRangeStart)} – {formatDate(report.dateRangeEnd)}
            </p>
          </div>
          <StatusBadge status={report.status} />
        </div>
        {report.agency?.name && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.05]">
            {report.agency?.logoUrl ? (
              <img src={report.agency.logoUrl} alt="" className="w-5 h-5 rounded object-contain" />
            ) : (
              <div className="w-5 h-5 rounded" style={{ background: brandColor + '30' }} />
            )}
            <span className="text-xs text-[#475569]">Generated by <span className="text-[#94A3B8] font-medium">{report.agency.name}</span></span>
          </div>
        )}
      </div>

      {/* ── TWO-COLUMN LAYOUT ── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="hidden lg:block w-60 xl:w-64 shrink-0 sticky top-4 self-start space-y-1">
          <SidebarPanelContent {...sidebarProps} />
        </aside>

        {/* ── REPORT CANVAS ── */}
        <main className="flex-1 min-w-0">

          {/* Generating state */}
          {isGenerating ? (
            <div className="rounded-2xl border border-[#1E293B] bg-[#111827] p-10 md:p-16 text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="w-20 h-20 border-[3px] border-[#1E293B] rounded-full" />
                <div className="absolute inset-0 border-[3px] rounded-full animate-spin"
                  style={{ borderColor: `${brandColor} transparent transparent transparent` }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: brandColor + '20' }}>
                    <Zap size={18} style={{ color: brandColor }} />
                  </div>
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Generating your report…</h2>
              <p className="text-sm text-[#64748B] leading-relaxed max-w-xs mx-auto">
                AI is analyzing your data across all connected channels. This takes 20–45 seconds.
              </p>
              <div className="mt-6 flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: brandColor, animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: brandColor, animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: brandColor, animationDelay: '300ms' }} />
              </div>
            </div>
          ) : (
            <>
              {/* ── REPORT HEADER (desktop) ── */}
              <div
                className="hidden lg:block rounded-2xl border mb-6 p-6 overflow-hidden"
                style={{ borderColor: brandColor + '20', background: `linear-gradient(135deg, ${brandColor}08, transparent)` }}
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-[#475569] uppercase tracking-[0.1em] mb-1">Performance Report</p>
                    <h1 className="text-2xl font-bold text-white leading-tight">{report.client?.name}</h1>
                    <p className="text-sm text-[#64748B] mt-1.5">
                      {formatDate(report.dateRangeStart)} – {formatDate(report.dateRangeEnd)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatusBadge status={report.status} />
                    {report.agency?.name && (
                      <div className="flex items-center gap-2">
                        {report.agency?.logoUrl && (
                          <img src={report.agency.logoUrl} alt="" className="h-5 object-contain rounded" />
                        )}
                        <span className="text-xs text-[#475569]">by <span className="text-[#94A3B8] font-medium">{report.agency.name}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── GA4 METRICS ── */}
              {rawData?.ga4 ? (
                <PlatformSection title="Google Analytics 4" color={brandColor}>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <MetricCard label="Sessions"    value={rawData.ga4.sessions}                prev={rawData.ga4.sessionsPrev}         color={brandColor} />
                    <MetricCard label="Users"       value={rawData.ga4.users}                   prev={rawData.ga4.usersPrev}            color={brandColor} />
                    <MetricCard label="Bounce Rate" value={rawData.ga4.bounceRate * 100}        prev={rawData.ga4.bounceRatePrev * 100} suffix="%" invert color={brandColor} />
                    <MetricCard label="Conv. Rate"  value={rawData.ga4.conversionRate * 100}    prev={rawData.ga4.conversionRatePrev * 100} suffix="%" color={brandColor} />
                  </div>
                </PlatformSection>
              ) : (
                <ConnectPlatformCTA platform="Google Analytics 4" platformId="ga4" brandColor={brandColor} />
              )}

              {/* ── GOOGLE ADS ── */}
              {rawData?.googleAds ? (
                <PlatformSection title="Google Ads" color={brandColor}>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <MetricCard label="Spend"       value={rawData.googleAds.spend}       prev={rawData.googleAds.spendPrev}       prefix="$" invert color={brandColor} />
                    <MetricCard label="CTR"         value={rawData.googleAds.ctr * 100}   prev={rawData.googleAds.ctrPrev * 100}   suffix="%" color={brandColor} />
                    <MetricCard label="ROAS"        value={rawData.googleAds.roas}         prev={rawData.googleAds.roasPrev}        suffix="x" color={brandColor} />
                    <MetricCard label="Conversions" value={rawData.googleAds.conversions}  prev={rawData.googleAds.conversionsPrev} color={brandColor} />
                  </div>
                </PlatformSection>
              ) : (
                <ConnectPlatformCTA platform="Google Ads" platformId="google_ads" brandColor={brandColor} />
              )}

              {/* ── META ADS ── */}
              {rawData?.meta ? (
                <PlatformSection title="Meta Ads" color={brandColor}>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <MetricCard label="Spend" value={rawData.meta.spend}       prev={rawData.meta.spendPrev}       prefix="$" invert color={brandColor} />
                    <MetricCard label="CTR"   value={rawData.meta.ctr * 100}   prev={rawData.meta.ctrPrev * 100}   suffix="%" color={brandColor} />
                    <MetricCard label="ROAS"  value={rawData.meta.roas}         prev={rawData.meta.roasPrev}        suffix="x" color={brandColor} />
                    <MetricCard label="CPM"   value={rawData.meta.cpm}          prev={rawData.meta.cpmPrev}         prefix="$" invert color={brandColor} />
                  </div>
                </PlatformSection>
              ) : (
                <ConnectPlatformCTA platform="Meta Ads" platformId="meta_ads" brandColor={brandColor} />
              )}

              {/* ── AI NARRATIVE ── */}
              {narrative ? (
                <div className="mb-4">
                  {/* Narrative header */}
                  <div
                    className="rounded-2xl mb-3 p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                    style={{
                      background: `linear-gradient(135deg, ${brandColor}10, ${brandColor}04)`,
                      border: `1px solid ${brandColor}20`,
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)`, boxShadow: `0 4px 16px ${brandColor}40` }}
                      >
                        <span className="text-white text-xs font-extrabold tracking-tight">AI</span>
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base font-bold text-white leading-tight">AI Insight Write</h2>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          Cross-channel analysis · <span className="capitalize">{report.narrativeTone || 'professional'}</span> tone
                          {narrative.wordCount && ` · ${narrative.wordCount} words`}
                        </p>
                      </div>
                    </div>
                    {report.aiModel && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Cpu size={11} className="text-[#475569]" />
                        <span className="text-[10px] text-[#475569] font-medium">{report.aiModel}</span>
                      </div>
                    )}
                  </div>

                  {/* Narrative sections */}
                  {[
                    { title: '📊 Executive Summary',    body: narrative.executiveSummary },
                    { title: '📈 Campaign Performance', body: narrative.campaignPerformance },
                    { title: '🏆 Key Wins',             body: narrative.keyWins },
                    { title: '⚠️ Areas of Concern',     body: narrative.areasOfConcern },
                    { title: '🎯 Recommendations',      body: narrative.recommendations },
                  ].filter(s => s.body).map(s => (
                    <NarrativeSection key={s.title} title={s.title} body={s.body} color={brandColor} />
                  ))}

                  <RatingWidget reportId={id!} currentRating={report.narrativeRating} />
                </div>
              ) : (
                /* No narrative yet */
                <div className="rounded-2xl border border-dashed border-[#1E293B] p-8 text-center mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#111827] border border-[#1E293B] flex items-center justify-center mx-auto mb-3">
                    <Zap size={20} className="text-[#334155]" />
                  </div>
                  <p className="text-sm font-semibold text-[#475569]">No AI narrative yet</p>
                  <p className="text-xs text-[#334155] mt-1">Generate a report with connected data to see the AI analysis</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ══════════════════════════════════════════════════
          MOBILE STICKY BOTTOM ACTION BAR
      ══════════════════════════════════════════════════ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0F1E]/95 backdrop-blur-xl border-t border-[#1E293B] px-4 py-3 safe-area-bottom">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <button
            onClick={handleExportPdf} disabled={exportingPdf || isGenerating}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-40 text-white py-3 rounded-xl transition-all duration-200 min-h-[48px] shadow-lg shadow-indigo-500/25"
          >
            {exportingPdf ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={15} />}
            PDF
          </button>
          <button
            onClick={handleSend} disabled={sendingEmail || isGenerating}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold border border-[#1E293B] hover:border-[#334155] hover:bg-white/[0.04] disabled:opacity-40 text-[#94A3B8] hover:text-white py-3 rounded-xl transition-all duration-200 min-h-[48px]"
          >
            {sendingEmail ? <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : <Send size={15} />}
            Send
          </button>
          <button
            onClick={handleRefreshData} disabled={isBusy}
            className="w-12 h-12 flex items-center justify-center border border-[#1E293B] hover:border-[#334155] hover:bg-white/[0.04] disabled:opacity-40 text-[#64748B] hover:text-white rounded-xl transition-all duration-200"
            title="Refresh data"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-12 h-12 flex items-center justify-center border border-[#1E293B] hover:border-[#334155] hover:bg-white/[0.04] text-[#64748B] hover:text-white rounded-xl transition-all duration-200"
            title="More options"
          >
            <Settings2 size={15} />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          MOBILE SIDEBAR DRAWER
      ══════════════════════════════════════════════════ */}

      {/* Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Drawer panel */}
      <div
        className={`lg:hidden fixed top-0 right-0 h-full w-[min(340px,90vw)] z-50 bg-[#0D1524] border-l border-[#1E293B] overflow-y-auto transition-transform duration-300 ease-in-out ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ boxShadow: '-8px 0 32px rgba(0,0,0,0.5)' }}
      >
        {/* Drawer header */}
        <div className="sticky top-0 z-10 bg-[#0D1524] flex items-center justify-between px-5 py-4 border-b border-[#1E293B]">
          <div>
            <p className="text-sm font-bold text-white">Report Options</p>
            <p className="text-xs text-[#475569] mt-0.5">{report.client?.name}</p>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-9 h-9 rounded-xl border border-[#1E293B] hover:border-[#334155] flex items-center justify-center text-[#64748B] hover:text-white transition-all duration-200"
          >
            <X size={15} />
          </button>
        </div>

        {/* Drawer content */}
        <div className="p-4 pb-8">
          <SidebarPanelContent {...sidebarProps} />
        </div>
      </div>
    </div>
  );
}
