import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  ArrowLeft, FileText, Plus, Settings, Plug, Calendar,
  Send, RefreshCw, AlertCircle, ExternalLink, CheckCircle,
  XCircle, Clock, Zap, Mail,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { clientsApi, reportsApi } from '../../../lib/api';
import { formatDate, formatRelative } from '../../../utils/format';
import StatusBadge from '../../../components/shared/StatusBadge';
import EmptyState from '../../../components/shared/EmptyState';
import { PageLoader } from '../../../components/shared/LoadingSpinner';
import GenerateReportModal from '../../reports/components/GenerateReportModal';

/* ─── Platform emoji map ─────────────────────────────────── */

const PLATFORM_EMOJI: Record<string, string> = {
  google_analytics: '📊',
  google_ads: '🎯',
  meta_ads: '📘',
  linkedin_ads: '💼',
};

/* ─── Delivery status helpers ────────────────────────────── */

function DeliveryStatusChip({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
    sent:      { color: 'text-emerald-400', bg: 'bg-emerald-500/10',  icon: CheckCircle },
    delivered: { color: 'text-emerald-400', bg: 'bg-emerald-500/10',  icon: CheckCircle },
    opened:    { color: 'text-sky-400',     bg: 'bg-sky-500/10',      icon: Mail },
    sending:   { color: 'text-amber-400',   bg: 'bg-amber-500/10',    icon: Clock },
    failed:    { color: 'text-red-400',     bg: 'bg-red-500/10',      icon: XCircle },
    bounced:   { color: 'text-red-400',     bg: 'bg-red-500/10',      icon: XCircle },
  };
  const style = map[status] || { color: 'text-[#64748B]', bg: 'bg-white/5', icon: Clock };
  const Icon  = style.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${style.color} ${style.bg}`}>
      <Icon size={10} /> {status}
    </span>
  );
}

/* ─── Delivery history ───────────────────────────────────── */

function DeliveryHistory({ clientId }: { clientId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(
    ['deliveries', clientId],
    () => clientsApi.getDeliveries(clientId, 1),
    { staleTime: 30000 }
  );

  const retryMutation = useMutation(
    (reportId: string) => reportsApi.send(reportId),
    {
      onSuccess: () => { toast.success('Report re-sent!'); qc.invalidateQueries(['deliveries', clientId]); },
      onError: () => toast.error('Failed to retry send'),
    }
  );

  const deliveries = data?.deliveries || [];

  return (
    <div className="card overflow-hidden mt-5">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#334155]/60 rounded-lg flex items-center justify-center">
            <Send size={13} className="text-[#64748B]" />
          </div>
          <h3 className="text-sm font-bold text-white">Delivery History</h3>
        </div>
        <span className="text-xs text-[#475569]">{deliveries.length} sent</span>
      </div>

      {isLoading ? (
        <div className="px-5 py-8 text-center text-xs text-[#64748B]">Loading…</div>
      ) : deliveries.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <Send size={18} className="text-[#334155] mx-auto mb-2" />
          <p className="text-xs text-[#64748B]">No deliveries yet. Send a report to get started.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1E293B]">
                  {['Date Sent', 'Status', 'Opened', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-semibold text-[#64748B] uppercase tracking-wide text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {deliveries.map((d: any) => (
                  <tr key={d.id} className="hover:bg-[#0A0F1E]/50 transition-colors">
                    <td className="px-5 py-3 text-[#94A3B8]">{d.sentAt ? formatRelative(d.sentAt) : '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <DeliveryStatusChip status={d.status} />
                        {d.failureReason && (
                          <AlertCircle size={12} className="text-red-400 shrink-0" title={d.failureReason} />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[#64748B]">{d.openedAt ? formatRelative(d.openedAt) : '—'}</td>
                    <td className="px-5 py-3 text-right">
                      {(d.status === 'failed' || d.status === 'bounced') && (
                        <button
                          onClick={() => retryMutation.mutate(d.reportId)}
                          disabled={retryMutation.isLoading}
                          className="flex items-center gap-1.5 text-xs font-semibold text-[#6366F1] hover:text-[#818CF8] disabled:opacity-50 transition-colors ml-auto"
                        >
                          <RefreshCw size={11} /> Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="sm:hidden divide-y divide-[#1E293B]">
            {deliveries.map((d: any) => (
              <div key={d.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <DeliveryStatusChip status={d.status} />
                    {d.openedAt && <span className="text-[10px] text-sky-400 font-medium">Opened</span>}
                  </div>
                  <p className="text-xs text-[#475569]">{d.sentAt ? formatRelative(d.sentAt) : '—'}</p>
                </div>
                {(d.status === 'failed' || d.status === 'bounced') && (
                  <button
                    onClick={() => retryMutation.mutate(d.reportId)}
                    disabled={retryMutation.isLoading}
                    className="text-[#6366F1] hover:text-[#818CF8] disabled:opacity-50 transition-colors p-1.5"
                  >
                    <RefreshCw size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showGenerate, setShowGenerate] = useState(false);

  const { data: client, isLoading } = useQuery(['client', id], () => clientsApi.get(id!));
  const { data: reportsData } = useQuery(['reports', id], () => reportsApi.list({ clientId: id }));

  if (isLoading) return <PageLoader />;
  if (!client)   return <div className="text-[#94A3B8] p-8">Client not found</div>;

  const reports   = reportsData?.reports || [];
  const platforms = client.clientConnectors?.map((cc: any) => cc.oauthToken) || [];
  const initials  = client.name[0].toUpperCase();

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col xs:flex-row xs:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-9 h-9 hover:bg-[#1E293B] rounded-xl flex items-center justify-center text-[#64748B] hover:text-white transition-all duration-200 shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="w-11 h-11 bg-gradient-to-br from-[#6366F1] to-[#4F46E5] rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-indigo-500/20 shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-white leading-tight truncate">{client.name}</h1>
            <p className="text-xs text-[#64748B] mt-0.5 truncate">{client.industry || 'No industry set'} · {client.contactEmail}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px] shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30"
          >
            <Plus size={14} /> <span className="hidden xs:inline">Generate</span> Report
          </button>
          <Link
            to={`/clients/${id}/settings`}
            className="w-11 h-11 flex items-center justify-center border border-[#334155] hover:border-[#475569] hover:bg-white/4 text-[#64748B] hover:text-white rounded-xl transition-all duration-200"
            title="Client Settings"
          >
            <Settings size={15} />
          </Link>
        </div>
      </div>

      {/* ── Body: info sidebar + reports main ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left sidebar ── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Contact */}
          <div className="card p-4 md:p-5">
            <h3 className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-3">Contact</h3>
            <p className="text-sm font-bold text-white leading-tight">{client.contactName}</p>
            <p className="text-xs text-[#94A3B8] mt-0.5 truncate">{client.contactEmail}</p>
            {client.websiteUrl && (
              <a
                href={client.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[#6366F1] hover:text-[#818CF8] transition-colors mt-2 truncate"
              >
                <ExternalLink size={10} /> {client.websiteUrl}
              </a>
            )}
          </div>

          {/* Connected platforms */}
          <div className="card p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Connected Platforms</h3>
              <Link to="/connectors" className="text-[10px] font-semibold text-[#6366F1] hover:text-[#818CF8] transition-colors">Manage</Link>
            </div>
            {platforms.length === 0 ? (
              <div className="text-center py-4">
                <Plug size={18} className="text-[#334155] mx-auto mb-2" />
                <p className="text-xs text-[#64748B] mb-2">No platforms connected</p>
                <Link
                  to="/connectors"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6366F1] hover:text-[#818CF8] transition-colors"
                >
                  Connect now →
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {platforms.map((t: any) => (
                  <div key={t.id} className="flex items-center gap-2.5 bg-[#0A0F1E] rounded-xl px-3 py-2 border border-white/4">
                    <span className="text-base leading-none">{PLATFORM_EMOJI[t.platform] || '🔌'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#94A3B8] capitalize truncate">{t.platform?.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] text-[#475569] truncate">{t.accountName}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${t.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Report schedule */}
          <div className="card p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={12} className="text-[#64748B]" />
              <h3 className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Report Schedule</h3>
            </div>
            {client.reportSchedule ? (
              <>
                <p className="text-sm font-semibold text-white">{client.reportSchedule}</p>
                <p className="text-xs text-[#64748B] mt-0.5">{client.reportScheduleTimezone}</p>
              </>
            ) : (
              <p className="text-xs text-[#334155]">No schedule configured</p>
            )}
          </div>
        </div>

        {/* ── Report history ── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[#6366F1]/12 rounded-lg flex items-center justify-center">
                  <FileText size={13} className="text-[#818CF8]" />
                </div>
                <h3 className="text-sm font-bold text-white">Report History</h3>
              </div>
              <span className="text-xs text-[#475569]">{reports.length} report{reports.length !== 1 ? 's' : ''}</span>
            </div>

            {reports.length === 0 ? (
              <EmptyState
                icon={<FileText size={22} />}
                title="No reports yet"
                description="Generate your first report to see AI-powered insights."
                action={
                  <button
                    onClick={() => setShowGenerate(true)}
                    className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px]"
                  >
                    <Zap size={14} /> Generate First Report
                  </button>
                }
              />
            ) : (
              <div className="divide-y divide-[#1E293B]">
                {reports.map((report: any) => (
                  <div
                    key={report.id}
                    className="px-5 py-4 hover:bg-[#0A0F1E]/50 transition-colors flex flex-col xs:flex-row xs:items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-white whitespace-nowrap">
                          {formatDate(report.dateRangeStart)} → {formatDate(report.dateRangeEnd)}
                        </span>
                        <StatusBadge status={report.status} />
                        {report.narrativeRating && (
                          <span className="text-xs">{report.narrativeRating === 'up' ? '👍' : '👎'}</span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748B] leading-snug">
                        Generated {formatRelative(report.createdAt)}
                        {report.generationDurationMs && ` · ${(report.generationDurationMs / 1000).toFixed(1)}s`}
                      </p>
                    </div>

                    {report.status === 'ready' && (
                      <Link
                        to={`/reports/${report.id}`}
                        className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-white/5 hover:bg-[#6366F1]/15 border border-white/8 hover:border-[#6366F1]/30 text-[#94A3B8] hover:text-[#818CF8] px-4 py-2 rounded-xl transition-all duration-200 min-h-[36px] shrink-0"
                      >
                        View →
                      </Link>
                    )}
                    {report.status === 'generating' && (
                      <div className="flex items-center gap-2 text-xs text-amber-400 font-medium shrink-0">
                        <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        Generating…
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <DeliveryHistory clientId={id!} />
        </div>
      </div>

      {showGenerate && (
        <GenerateReportModal
          clientId={id!}
          clientName={client.name}
          onClose={() => setShowGenerate(false)}
          onSuccess={reportId => { setShowGenerate(false); navigate(`/reports/${reportId}`); }}
        />
      )}
    </div>
  );
}
