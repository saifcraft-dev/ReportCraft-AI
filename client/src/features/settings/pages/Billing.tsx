import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Check, CreditCard, ExternalLink, Copy, Gift,
  AlertTriangle, Archive, Zap, Star, Crown,
  Clock, TrendingUp, Users, FileText, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { agencyApi, referralsApi, billingApi, clientsApi } from '../../../lib/api';
import { formatDate } from '../../../utils/format';
import StatusBadge from '../../../components/shared/StatusBadge';
import { PageLoader } from '../../../components/shared/LoadingSpinner';

/* ─── Plan definitions ───────────────────────────────────── */

const PLANS = [
  {
    tier: 'STARTER',
    name: 'Starter',
    price: 79,
    clients: 5,
    reports: '5 AI reports/mo',
    icon: Zap,
    iconBg: 'bg-sky-500/12',
    iconColor: 'text-sky-400',
    accentColor: '#38BDF8',
    features: ['Logo white-label', 'GA4 + Google Ads + Meta', 'PDF export', 'Email delivery'],
  },
  {
    tier: 'AGENCY',
    name: 'Agency',
    price: 199,
    clients: 15,
    reports: 'Unlimited AI reports',
    icon: Star,
    iconBg: 'bg-[#6366F1]/12',
    iconColor: 'text-[#818CF8]',
    accentColor: '#6366F1',
    features: ['Full white-label', 'LinkedIn Ads', 'Team members', 'Priority support'],
    popular: true,
  },
  {
    tier: 'AGENCY_PRO',
    name: 'Agency Pro',
    price: 349,
    clients: 'Unlimited',
    reports: 'Unlimited AI reports',
    icon: Crown,
    iconBg: 'bg-amber-500/12',
    iconColor: 'text-amber-400',
    accentColor: '#F59E0B',
    features: ['Everything in Agency', 'Shareable client portals', 'Referral program'],
  },
];

const LS_CHECKOUT_URLS: Record<string, string> = {
  STARTER:    import.meta.env.VITE_LS_STARTER_URL    || '#',
  AGENCY:     import.meta.env.VITE_LS_AGENCY_URL     || '#',
  AGENCY_PRO: import.meta.env.VITE_LS_AGENCY_PRO_URL || '#',
};

/* ─── LS outage banner ───────────────────────────────────── */

function LsOutageBanner() {
  const { data } = useQuery('ls-status', billingApi.getLsStatus, {
    staleTime: 2 * 60 * 1000,
    retry: false,
    onError: () => {},
  });

  if (data?.available !== false) return null;

  return (
    <div className="flex items-start gap-3 bg-yellow-500/8 border border-yellow-500/25 rounded-xl px-4 py-4 mb-6">
      <div className="w-8 h-8 bg-yellow-500/15 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        <AlertTriangle size={15} className="text-yellow-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-yellow-400 mb-0.5">Payment provider temporarily unavailable</p>
        <p className="text-xs text-[#94A3B8] leading-[1.7]">
          Lemon Squeezy is experiencing issues. Subscriptions and upgrades may be delayed —{' '}
          <strong className="text-white">your access is not affected.</strong>{' '}
          <a
            href="https://status.lemonsqueezy.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-400 hover:text-yellow-300 underline inline-flex items-center gap-0.5 transition-colors"
          >
            Check status <ExternalLink size={10} />
          </a>
        </p>
      </div>
    </div>
  );
}

/* ─── Downgrade modal ────────────────────────────────────── */

function DowngradeModal({
  newTier, excessClients, onCancel, onDone,
}: {
  newTier: string;
  excessClients: any[];
  onCancel: () => void;
  onDone: (url: string) => void;
}) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set(excessClients.map(c => c.id)));
  const [archiving, setArchiving] = useState(false);

  const toggleClient = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleArchiveAndContinue = async () => {
    if (selected.size === 0) { toast.error('Select at least one client to archive before continuing.'); return; }
    setArchiving(true);
    try {
      await Promise.all([...selected].map(id => clientsApi.archive(id)));
      qc.invalidateQueries('clients');
      const result = await billingApi.checkDowngrade(newTier).catch((e: any) => e.response?.data);
      if (result?.error === 'CLIENT_LIMIT_EXCEEDED') {
        toast.error(`Still ${result.activeClients - result.newLimit} client(s) over the limit. Archive more to continue.`);
        setArchiving(false);
        return;
      }
      toast.success('Clients archived. Redirecting to checkout…');
      onDone(LS_CHECKOUT_URLS[newTier] || '#');
    } catch {
      toast.error('Failed to archive clients');
      setArchiving(false);
    }
  };

  const plan = PLANS.find(p => p.tier === newTier);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#111827] border border-white/8 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl shadow-black/60">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-yellow-500/12 rounded-xl flex items-center justify-center">
              <Archive size={16} className="text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Too many active clients</h3>
              <p className="text-xs text-[#64748B] mt-0.5">Select clients to archive before switching plans</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-[#64748B] hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="bg-[#0A0F1E] border border-white/5 rounded-xl px-4 py-3 mb-4">
            <p className="text-xs text-[#94A3B8] leading-[1.7]">
              The <strong className="text-white">{plan?.name}</strong> plan supports up to{' '}
              <strong className="text-white">{plan?.clients}</strong> clients. Select clients below to archive —
              they're hidden but not deleted and can be restored anytime.
            </p>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 -mr-1">
            {excessClients.map(c => (
              <label
                key={c.id}
                className="flex items-center gap-3 bg-[#0A0F1E] border border-white/5 rounded-xl px-3.5 py-3 cursor-pointer hover:border-white/10 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => toggleClient(c.id)}
                  className="w-4 h-4 accent-[#6366F1] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-semibold truncate">{c.name}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">{c.contactEmail}</p>
                </div>
                {c.lastReportAt && (
                  <span className="text-[10px] text-[#475569] shrink-0 hidden xs:block">
                    {formatDate(c.lastReportAt)}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 border border-white/8 hover:border-white/15 text-[#64748B] hover:text-white py-3 rounded-xl text-sm font-medium transition-all duration-200 min-h-[48px]"
          >
            Cancel
          </button>
          <button
            onClick={handleArchiveAndContinue}
            disabled={archiving || selected.size === 0}
            className="flex-1 flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[48px] shadow-lg shadow-indigo-500/20"
          >
            {archiving
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Archiving…</>
              : `Archive ${selected.size} & Continue`
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Referral section ───────────────────────────────────── */

function ReferralSection({ agency }: { agency: any }) {
  const isEligible = ['AGENCY', 'AGENCY_PRO'].includes(agency?.subscriptionTier);
  const { data: referralData } = useQuery('referrals', referralsApi.getMe, { enabled: isEligible });

  if (!isEligible) return null;

  const copyLink = () => {
    if (referralData?.referralLink) {
      navigator.clipboard.writeText(referralData.referralLink);
      toast.success('Referral link copied!');
    }
  };

  const stats = [
    { label: 'Referral Code',    value: referralData?.referralCode || '—',      icon: Gift },
    { label: 'Converted',        value: `${referralData?.converted ?? 0}/${referralData?.referralCount ?? 0}`, icon: TrendingUp },
    { label: 'Credits Earned',   value: referralData?.creditsEarned != null ? `${referralData.creditsEarned} mo` : '—', icon: Zap },
  ];

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3.5 px-5 md:px-6 py-5 border-b border-white/5">
        <div className="w-10 h-10 bg-[#6366F1]/12 rounded-xl flex items-center justify-center shrink-0">
          <Gift size={18} className="text-[#818CF8]" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white leading-tight">Referral Program</h2>
          <p className="text-xs text-[#64748B] mt-0.5">Earn 1 month free per agency that converts to a paid plan</p>
        </div>
      </div>

      <div className="px-5 md:px-6 py-5 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-[#0A0F1E] border border-white/5 rounded-xl p-3 text-center">
              <Icon size={14} className="text-[#475569] mx-auto mb-1.5" />
              <p className="text-base font-bold text-white leading-tight">{value}</p>
              <p className="text-[10px] text-[#64748B] mt-0.5 leading-snug">{label}</p>
            </div>
          ))}
        </div>

        {/* Referral link */}
        {referralData?.referralLink && (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#0A0F1E] border border-[#334155] rounded-xl px-3 py-2.5 text-xs text-[#94A3B8] truncate font-mono min-h-[44px] flex items-center">
              {referralData.referralLink}
            </div>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-[#334155] hover:border-[#6366F1]/50 hover:bg-[#6366F1]/8 text-[#94A3B8] hover:text-white rounded-xl text-xs font-semibold transition-all duration-200 min-h-[44px] shrink-0"
            >
              <Copy size={12} /> Copy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */

export default function Billing() {
  const { data: agency, isLoading } = useQuery('agency', agencyApi.get);
  const [downgradeModal, setDowngradeModal] = useState<{ newTier: string; excessClients: any[] } | null>(null);

  const handlePlanAction = async (planTier: string) => {
    const currentTier = agency?.subscriptionTier || 'FREE_TRIAL';
    const tierOrder: Record<string, number> = { FREE_TRIAL: 0, STARTER: 1, AGENCY: 2, AGENCY_PRO: 3 };
    const isDowngrade = (tierOrder[planTier] ?? 0) < (tierOrder[currentTier] ?? 0);

    if (isDowngrade) {
      try {
        await billingApi.checkDowngrade(planTier);
        window.open(LS_CHECKOUT_URLS[planTier] || '#', '_blank');
      } catch (e: any) {
        const errData = e.response?.data;
        if (errData?.error === 'CLIENT_LIMIT_EXCEEDED') {
          setDowngradeModal({ newTier: planTier, excessClients: errData.excessClients || [] });
        } else {
          window.open(LS_CHECKOUT_URLS[planTier] || '#', '_blank');
        }
      }
    } else {
      window.open(LS_CHECKOUT_URLS[planTier] || '#', '_blank');
    }
  };

  if (isLoading) return <PageLoader />;

  const isTrial   = agency?.subscriptionTier === 'FREE_TRIAL';
  const daysLeft  = agency?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(agency.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 14;
  const trialPct  = Math.max(0, Math.min(100, Math.round(((14 - daysLeft) / 14) * 100)));

  return (
    <div className="max-w-3xl mx-auto animate-fade-in space-y-5">

      {/* ── Page header ── */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">Billing & Plans</h1>
        <p className="text-sm text-[#64748B] mt-1">Manage your subscription and plan</p>
      </div>

      {/* ── Outage banner ── */}
      <LsOutageBanner />

      {/* ── Current plan card ── */}
      <div className="card p-5 md:p-6">
        <div className="flex flex-col xs:flex-row xs:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-widest mb-1.5">Current Plan</p>
            <p className="text-xl md:text-2xl font-bold text-white leading-tight">
              {isTrial ? '14-day Free Trial' : agency?.subscriptionTier?.replace(/_/g, ' ')}
            </p>
            {isTrial && (
              <p className="text-sm text-amber-400 mt-1 flex items-center gap-1.5">
                <Clock size={13} />
                {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining in trial
              </p>
            )}
            {agency?.currentPeriodEnd && !isTrial && (
              <p className="text-xs text-[#64748B] mt-1">Renews {formatDate(agency.currentPeriodEnd)}</p>
            )}
          </div>
          <div className="shrink-0">
            <StatusBadge status={isTrial ? 'FREE_TRIAL' : agency?.subscriptionTier || 'trial'} size="md" />
          </div>
        </div>

        {/* Trial progress bar */}
        {isTrial && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#64748B]">Trial progress</span>
              <span className="text-xs text-amber-400 font-semibold">{daysLeft}d left</span>
            </div>
            <div className="h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${trialPct}%` }}
              />
            </div>
            <div className="mt-3 bg-[#6366F1]/8 border border-[#6366F1]/20 rounded-xl px-4 py-3">
              <p className="text-xs text-[#94A3B8] leading-[1.7]">
                You're on the free trial with all Agency features unlocked.{' '}
                <strong className="text-white">Upgrade before your trial ends</strong> to keep access.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Plan comparison ── */}
      <div>
        <h2 className="text-xs font-semibold text-[#64748B] uppercase tracking-widest mb-3">Available Plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANS.map(plan => {
            const isCurrent = agency?.subscriptionTier === plan.tier;
            const PlanIcon  = plan.icon;

            return (
              <div
                key={plan.tier}
                className={`card p-5 relative flex flex-col transition-all duration-200 ${
                  plan.popular
                    ? 'border-[#6366F1]/40 shadow-lg shadow-indigo-500/10'
                    : 'border-white/6'
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white text-[10px] px-3 py-1 rounded-full font-bold tracking-wide whitespace-nowrap shadow-lg shadow-indigo-500/30">
                      ✦ Most Popular
                    </div>
                  </div>
                )}

                {/* Plan icon + name */}
                <div className="flex items-center gap-3 mb-4 mt-1">
                  <div className={`w-10 h-10 ${plan.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                    <PlanIcon size={17} className={plan.iconColor} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{plan.name}</p>
                    <p className="text-[10px] text-[#64748B]">
                      {typeof plan.clients === 'number' ? `${plan.clients} clients` : plan.clients}
                    </p>
                  </div>
                </div>

                {/* Pricing */}
                <div className="mb-1">
                  <span className="text-3xl font-extrabold text-white">${plan.price}</span>
                  <span className="text-sm text-[#64748B] font-normal">/mo</span>
                </div>
                <p className="text-[11px] text-[#64748B] mb-4 flex items-center gap-1">
                  <FileText size={10} /> {plan.reports}
                </p>

                {/* Divider */}
                <div className="h-px bg-white/5 mb-4" />

                {/* Features */}
                <ul className="space-y-2 mb-5 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-[#94A3B8]">
                      <div className="w-4 h-4 bg-emerald-500/15 rounded-full flex items-center justify-center shrink-0">
                        <Check size={9} className="text-emerald-400" strokeWidth={3} />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <div className="w-full py-3 text-center text-xs font-semibold bg-emerald-500/8 border border-emerald-500/20 text-emerald-400 rounded-xl min-h-[44px] flex items-center justify-center gap-1.5">
                    <Check size={12} strokeWidth={3} /> Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handlePlanAction(plan.tier)}
                    className={`w-full py-3 text-center text-sm font-semibold rounded-xl transition-all duration-200 min-h-[44px] ${
                      plan.popular
                        ? 'bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-px'
                        : 'border border-white/8 hover:border-white/15 hover:bg-white/4 text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    {isTrial
                      ? 'Subscribe'
                      : agency?.subscriptionTier === 'STARTER' && plan.tier === 'AGENCY'
                        ? 'Upgrade'
                        : 'Switch Plan'
                    }
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Referral program ── */}
      <ReferralSection agency={agency} />

      {/* ── Manage subscription card ── */}
      <div className="card p-5 md:p-6">
        <div className="flex flex-col xs:flex-row xs:items-center gap-4">
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <div className="w-10 h-10 bg-[#334155]/50 rounded-xl flex items-center justify-center shrink-0">
              <CreditCard size={17} className="text-[#64748B]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">Manage Subscription</p>
              <p className="text-xs text-[#64748B] mt-0.5 leading-snug">
                Update payment method, download invoices, or cancel
              </p>
            </div>
          </div>
          <a
            href="https://app.lemonsqueezy.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 border border-[#334155] hover:border-[#6366F1]/40 hover:bg-[#6366F1]/5 text-[#94A3B8] hover:text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px] shrink-0 self-start xs:self-auto"
          >
            Manage <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* ── Footer note ── */}
      <p className="text-[11px] text-[#334155] text-center pb-4 leading-[1.7]">
        Billing powered by Lemon Squeezy · All prices in USD · Cancel anytime
      </p>

      {/* ── Downgrade modal ── */}
      {downgradeModal && (
        <DowngradeModal
          newTier={downgradeModal.newTier}
          excessClients={downgradeModal.excessClients}
          onCancel={() => setDowngradeModal(null)}
          onDone={url => { setDowngradeModal(null); window.open(url, '_blank'); }}
        />
      )}
    </div>
  );
}
