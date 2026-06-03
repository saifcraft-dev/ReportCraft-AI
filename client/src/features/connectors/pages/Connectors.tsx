import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Plus, Trash2, CheckCircle, XCircle, AlertCircle,
  RefreshCw, Clock, Plug, Link2, Zap, Info, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { connectorsApi, connectorsRefreshApi } from '../../../lib/api';
import { trackEvent } from '../../../lib/posthog';
import { formatRelative } from '../../../utils/format';
import { PageLoader } from '../../../components/shared/LoadingSpinner';

/* ─── Platform definitions ───────────────────────────────── */

const PLATFORMS = [
  {
    id: 'google_analytics',
    name: 'Google Analytics 4',
    emoji: '📊',
    iconBg: 'from-orange-500/20 to-amber-500/10',
    iconColor: 'text-orange-400',
    accentColor: '#E37400',
    borderActive: 'border-orange-500/30',
    bgActive: 'bg-orange-500/5',
    desc: 'Sessions, users, bounce rate, conversions',
    metrics: ['Sessions', 'Users', 'Bounce rate', 'Conversions'],
  },
  {
    id: 'google_ads',
    name: 'Google Ads',
    emoji: '🎯',
    iconBg: 'from-blue-500/20 to-sky-500/10',
    iconColor: 'text-blue-400',
    accentColor: '#4285F4',
    borderActive: 'border-blue-500/30',
    bgActive: 'bg-blue-500/5',
    desc: 'CTR, CPC, ROAS, conversions, spend',
    metrics: ['CTR', 'CPC', 'ROAS', 'Spend'],
  },
  {
    id: 'meta_ads',
    name: 'Meta Ads',
    emoji: '📘',
    iconBg: 'from-indigo-500/20 to-blue-600/10',
    iconColor: 'text-indigo-400',
    accentColor: '#1877F2',
    borderActive: 'border-indigo-500/30',
    bgActive: 'bg-indigo-500/5',
    desc: 'Reach, impressions, CTR, CPM, ROAS',
    metrics: ['Reach', 'Impressions', 'CPM', 'ROAS'],
  },
  {
    id: 'linkedin_ads',
    name: 'LinkedIn Ads',
    emoji: '💼',
    iconBg: 'from-sky-600/20 to-cyan-500/10',
    iconColor: 'text-sky-400',
    accentColor: '#0A66C2',
    borderActive: 'border-sky-500/30',
    bgActive: 'bg-sky-500/5',
    desc: 'Impressions, clicks, conversions, leads',
    metrics: ['Impressions', 'Clicks', 'Leads', 'CPL'],
    comingSoon: true,
  },
];

/* ─── Status badge ───────────────────────────────────────── */

function StatusBadge({ connected, hasError }: { connected: boolean; hasError: boolean }) {
  if (!connected) return (
    <div className="flex items-center gap-1.5 text-xs text-[#475569] font-medium">
      <div className="w-1.5 h-1.5 rounded-full bg-[#334155]" />
      Not connected
    </div>
  );
  if (hasError) return (
    <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
      <XCircle size={13} strokeWidth={2.5} />
      Error
    </div>
  );
  return (
    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
      <CheckCircle size={13} strokeWidth={2.5} />
      Connected
    </div>
  );
}

/* ─── Add Demo Modal ─────────────────────────────────────── */

function AddDemoModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [platform, setPlatform] = useState('google_analytics');
  const [accountName, setAccountName] = useState('');

  const mutation = useMutation(
    () => connectorsApi.addDemo(platform, accountName),
    {
      onSuccess: () => { toast.success('Demo connector added!'); onSuccess(); },
      onError:   () => toast.error('Failed to add connector'),
    }
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#111827] border border-white/8 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl shadow-black/60">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#6366F1]/15 rounded-lg flex items-center justify-center">
              <Plug size={15} className="text-[#818CF8]" />
            </div>
            <h3 className="text-base font-semibold text-white">Add Demo Connector</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-[#64748B] hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-[#64748B] leading-relaxed">
            Demo connectors generate realistic sample data so you can build and preview reports without real OAuth credentials.
          </p>

          {/* Platform selector */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-2">Platform</label>
            <select
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              className="w-full bg-[#0A0F1E] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]/30 transition-all duration-200 min-h-[48px] appearance-none cursor-pointer"
            >
              {PLATFORMS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Account name */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-2">Account Name</label>
            <input
              type="text"
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
              placeholder="My Business Account"
              className="w-full bg-[#0A0F1E] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white placeholder-[#334155] focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]/30 transition-all duration-200 min-h-[48px]"
            />
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 border border-white/8 hover:border-white/15 text-[#64748B] hover:text-white py-3 rounded-xl text-sm font-medium transition-all duration-200 min-h-[48px]"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!accountName || mutation.isLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[48px] shadow-lg shadow-indigo-500/20"
          >
            {mutation.isLoading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Plug size={14} /> Add Demo</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */

export default function Connectors() {
  const qc = useQueryClient();
  const [showDemo, setShowDemo] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: tokens, isLoading } = useQuery('connectors', connectorsApi.list);

  useEffect(() => {
    const success = searchParams.get('success');
    const error   = searchParams.get('error');
    if (success) {
      trackEvent('connector_connected', { platform: success });
      toast.success(`${success.replace(/_/g, ' ')} connected successfully!`);
      qc.invalidateQueries('connectors');
      setSearchParams({}, { replace: true });
    } else if (error) {
      const msgs: Record<string, string> = {
        cancelled:               'OAuth cancelled — no changes made.',
        invalid_state:           'OAuth session expired. Please try again.',
        oauth_failed:            'Connection failed. Check your OAuth credentials.',
        linkedin_not_available:  'LinkedIn Ads is coming soon.',
      };
      toast.error(msgs[error] || `Connection error: ${error}`);
      setSearchParams({}, { replace: true });
    }
  }, []);

  const removeMutation = useMutation(connectorsApi.remove, {
    onSuccess: () => { qc.invalidateQueries('connectors'); toast.success('Connector removed'); },
    onError:   () => toast.error('Failed to remove connector'),
  });

  const refreshMutation = useMutation(connectorsRefreshApi.refresh, {
    onSuccess: () => { qc.invalidateQueries('connectors'); toast.success('Token refreshed'); },
    onError:   () => toast.error('Failed to refresh token'),
  });

  const handleConnect = async (platform: string) => {
    try {
      let urlData: any;
      if (platform === 'google_analytics' || platform === 'google_ads') {
        urlData = await connectorsApi.getGoogleAuthUrl(platform);
      } else if (platform === 'meta_ads') {
        urlData = await connectorsApi.getMetaAuthUrl();
      } else if (platform === 'linkedin_ads') {
        return;
      }
      if (!urlData?.url) {
        toast('OAuth not configured. Add GOOGLE_CLIENT_ID / META_APP_ID to enable real connections.', { duration: 5000 });
        setShowDemo(true);
        return;
      }
      window.open(urlData.url, '_blank', 'width=600,height=700');
    } catch {
      toast.error('Failed to start OAuth flow');
    }
  };

  if (isLoading) return <PageLoader />;

  const connectedByPlatform = (tokens || []).reduce((acc: Record<string, any[]>, t: any) => {
    if (!acc[t.platform]) acc[t.platform] = [];
    acc[t.platform].push(t);
    return acc;
  }, {});

  const connectedCount   = Object.keys(connectedByPlatform).length;
  const totalAccounts    = (tokens || []).length;
  const availablePlatforms = PLATFORMS.filter(p => !p.comingSoon).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">

      {/* ── Page header ── */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">Data Connectors</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Connect your clients' ad platforms via OAuth</p>
        </div>
        <button
          onClick={() => setShowDemo(true)}
          className="flex items-center gap-2 border border-[#334155] hover:border-[#6366F1]/50 hover:bg-[#6366F1]/5 text-[#94A3B8] hover:text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px] self-start xs:self-auto"
        >
          <Plus size={15} /> Add Demo
        </button>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-[#6366F1]/15 rounded-xl flex items-center justify-center shrink-0">
            <Link2 size={16} className="text-[#818CF8]" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-none">{connectedCount}<span className="text-sm font-normal text-[#475569]">/{availablePlatforms}</span></p>
            <p className="text-xs text-[#64748B] mt-0.5">Platforms</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle size={16} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-none">{totalAccounts}</p>
            <p className="text-xs text-[#64748B] mt-0.5">Accounts</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
            <Zap size={16} className="text-amber-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-none">Ready</p>
            <p className="text-xs text-[#64748B] mt-0.5">To generate reports</p>
          </div>
        </div>
      </div>

      {/* ── Info banner ── */}
      <div className="flex items-start gap-3 bg-[#6366F1]/8 border border-[#6366F1]/20 rounded-xl p-4">
        <div className="w-7 h-7 bg-[#6366F1]/15 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
          <Info size={14} className="text-[#818CF8]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#818CF8] mb-1">Demo mode active</p>
          <p className="text-xs text-[#64748B] leading-[1.7]">
            Add{' '}
            <code className="bg-[#0A0F1E] border border-white/8 text-[#94A3B8] px-1.5 py-0.5 rounded text-[11px] font-mono">GOOGLE_CLIENT_ID</code>
            {' '}and{' '}
            <code className="bg-[#0A0F1E] border border-white/8 text-[#94A3B8] px-1.5 py-0.5 rounded text-[11px] font-mono">META_APP_ID</code>
            {' '}secrets to enable real OAuth. Until then, use <strong className="text-[#94A3B8] font-semibold">Add Demo</strong> to simulate connected accounts with realistic sample data.
          </p>
        </div>
      </div>

      {/* ── Platform cards ── */}
      <div>
        <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-widest mb-3">Available Platforms</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLATFORMS.map(platform => {
            const connected  = connectedByPlatform[platform.id] || [];
            const isConnected = connected.length > 0;
            const hasError    = connected.some((t: any) => t.status === 'error');

            if (platform.comingSoon) {
              return (
                <div
                  key={platform.id}
                  className="card p-5 border border-white/4 opacity-60 relative overflow-hidden"
                >
                  {/* Coming soon badge */}
                  <div className="absolute top-4 right-4">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase bg-[#6366F1]/15 border border-[#6366F1]/30 text-[#818CF8] px-2.5 py-1 rounded-full">
                      <Clock size={9} /> Soon
                    </span>
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${platform.iconBg} rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm`}>
                      {platform.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{platform.name}</p>
                      <p className="text-xs text-[#475569] mt-0.5">{platform.desc}</p>
                    </div>
                  </div>

                  <p className="text-xs text-[#475569] leading-[1.6] mb-4">
                    Requires MDP Standard Tier API approval. Coming soon to Agency plan.
                  </p>

                  {/* Metric pills */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {platform.metrics.map(m => (
                      <span key={m} className="text-[10px] text-[#334155] bg-[#1E293B] px-2 py-0.5 rounded-full">{m}</span>
                    ))}
                  </div>

                  <button disabled className="w-full text-xs font-semibold py-2.5 rounded-xl border border-[#1E293B] text-[#334155] cursor-not-allowed min-h-[44px]">
                    Coming Soon
                  </button>
                </div>
              );
            }

            return (
              <div
                key={platform.id}
                className={`card p-5 border transition-all duration-200 ${
                  hasError    ? 'border-red-500/30 bg-red-500/3'     :
                  isConnected ? `${platform.borderActive} ${platform.bgActive}` :
                                'border-white/6 hover:border-white/12'
                }`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3.5">
                    <div className={`w-12 h-12 bg-gradient-to-br ${platform.iconBg} rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm`}>
                      {platform.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white leading-tight">{platform.name}</p>
                      <p className="text-xs text-[#64748B] mt-0.5 leading-snug">{platform.desc}</p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge connected={isConnected} hasError={hasError} />
                  </div>
                </div>

                {/* Metric pills */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {platform.metrics.map(m => (
                    <span key={m} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      isConnected
                        ? 'bg-white/8 text-[#94A3B8]'
                        : 'bg-[#1E293B] text-[#475569]'
                    }`}>{m}</span>
                  ))}
                </div>

                {/* Connected accounts */}
                {connected.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {connected.map((t: any) => (
                      <div key={t.id} className="flex items-center gap-2.5 bg-[#0A0F1E] rounded-xl px-3 py-2.5 border border-white/4">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${t.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span className="text-xs text-[#CBD5E1] flex-1 truncate font-medium">{t.accountName}</span>
                        <span className="text-[10px] text-[#475569] shrink-0">{formatRelative(t.createdAt)}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {t.status !== 'active' && (
                            <button
                              onClick={() => refreshMutation.mutate(t.id)}
                              disabled={refreshMutation.isLoading}
                              className="w-7 h-7 rounded-lg hover:bg-amber-500/15 flex items-center justify-center text-red-400 hover:text-amber-400 transition-colors"
                              aria-label="Refresh token"
                              title="Reconnect"
                            >
                              <RefreshCw size={12} />
                            </button>
                          )}
                          <button
                            onClick={() => removeMutation.mutate(t.id)}
                            className="w-7 h-7 rounded-lg hover:bg-red-500/15 flex items-center justify-center text-[#475569] hover:text-red-400 transition-colors"
                            aria-label="Remove connector"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Connect / Add another button */}
                <button
                  onClick={() => handleConnect(platform.id)}
                  className={`w-full text-sm font-semibold py-2.5 rounded-xl transition-all duration-200 min-h-[44px] ${
                    isConnected
                      ? 'border border-white/8 hover:border-white/15 hover:bg-white/5 text-[#94A3B8] hover:text-white'
                      : 'bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30'
                  }`}
                >
                  {isConnected ? '+ Add Another Account' : `Connect ${platform.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Connected accounts summary ── */}
      {(tokens?.length || 0) > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-[#334155] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Connected accounts</h2>
              <p className="text-xs text-[#64748B] mt-0.5">{totalAccounts} account{totalAccounts !== 1 ? 's' : ''} across {connectedCount} platform{connectedCount !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1E293B]">
                  {['Platform', 'Account', 'Connected', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 md:px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {(tokens || []).map((t: any) => {
                  const plat = PLATFORMS.find(p => p.id === t.platform);
                  return (
                    <tr key={t.id} className="hover:bg-[#0A0F1E]/60 transition-colors">
                      <td className="px-4 md:px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{plat?.emoji || '🔌'}</span>
                          <span className="text-xs text-[#94A3B8] font-medium capitalize">{t.platform?.replace(/_/g, ' ')}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3.5 text-xs text-white font-medium">{t.accountName}</td>
                      <td className="px-4 md:px-6 py-3.5 text-xs text-[#64748B]">{formatRelative(t.createdAt)}</td>
                      <td className="px-4 md:px-6 py-3.5">
                        <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          t.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-current" />
                          {t.status}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3.5 text-right">
                        <button
                          onClick={() => removeMutation.mutate(t.id)}
                          className="text-xs text-[#64748B] hover:text-red-400 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-red-500/10 min-h-[36px]"
                        >
                          Disconnect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden divide-y divide-[#1E293B]">
            {(tokens || []).map((t: any) => {
              const plat = PLATFORMS.find(p => p.id === t.platform);
              return (
                <div key={t.id} className="px-4 py-4 flex items-center gap-3">
                  <span className="text-xl shrink-0">{plat?.emoji || '🔌'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white truncate">{t.accountName}</p>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        t.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        <div className="w-1 h-1 rounded-full bg-current" />
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5 capitalize">{t.platform?.replace(/_/g, ' ')} · {formatRelative(t.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => removeMutation.mutate(t.id)}
                    className="w-9 h-9 rounded-lg hover:bg-red-500/15 flex items-center justify-center text-[#475569] hover:text-red-400 transition-colors shrink-0"
                    aria-label="Disconnect"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showDemo && (
        <AddDemoModal
          onClose={() => setShowDemo(false)}
          onSuccess={() => { setShowDemo(false); qc.invalidateQueries('connectors'); }}
        />
      )}
    </div>
  );
}
