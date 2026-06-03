import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Check, CreditCard, ExternalLink, Copy, Gift, AlertTriangle, Archive } from 'lucide-react';
import toast from 'react-hot-toast';
import { agencyApi, referralsApi, billingApi, clientsApi } from '../../../lib/api';
import { formatDate } from '../../../utils/format';
import StatusBadge from '../../../components/shared/StatusBadge';
import { PageLoader } from '../../../components/shared/LoadingSpinner';

const PLANS = [
  { tier: 'STARTER', name: 'Starter', price: 79, clients: 5, reports: '5 AI reports/mo', features: ['Logo white-label', 'GA4 + Google Ads + Meta', 'PDF export', 'Email delivery'] },
  { tier: 'AGENCY', name: 'Agency', price: 199, clients: 15, reports: 'Unlimited AI reports', features: ['Full white-label', 'LinkedIn Ads', 'Team members', 'Priority support'], popular: true },
  { tier: 'AGENCY_PRO', name: 'Agency Pro', price: 349, clients: 'Unlimited', reports: 'Unlimited AI reports', features: ['Everything in Agency', 'Shareable client portals', 'Referral program'] },
];

const LS_CHECKOUT_URLS: Record<string, string> = {
  STARTER: import.meta.env.VITE_LS_STARTER_URL || '#',
  AGENCY: import.meta.env.VITE_LS_AGENCY_URL || '#',
  AGENCY_PRO: import.meta.env.VITE_LS_AGENCY_PRO_URL || '#',
};

function LsOutageBanner() {
  const { data } = useQuery('ls-status', billingApi.getLsStatus, {
    staleTime: 2 * 60 * 1000,
    retry: false,
    onError: () => {},
  });

  if (data?.available !== false) return null;

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
      <AlertTriangle size={15} className="text-yellow-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-yellow-400">Payment provider temporarily unavailable</p>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Our payment provider (Lemon Squeezy) is experiencing issues. Subscriptions and upgrades may be delayed —{' '}
          <strong>your access is not affected.</strong>{' '}
          <a href="https://status.lemonsqueezy.com" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">
            Check status <ExternalLink size={10} className="inline" />
          </a>
        </p>
      </div>
    </div>
  );
}

function DowngradeModal({
  newTier,
  excessClients,
  onCancel,
  onDone,
}: {
  newTier: string;
  excessClients: any[];
  onCancel: () => void;
  onDone: (url: string) => void;
}) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set(excessClients.map((c) => c.id)));
  const [archiving, setArchiving] = useState(false);

  const toggleClient = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleArchiveAndContinue = async () => {
    if (selected.size === 0) {
      toast.error('Select at least one client to archive before continuing.');
      return;
    }
    setArchiving(true);
    try {
      await Promise.all([...selected].map((id) => clientsApi.archive(id)));
      qc.invalidateQueries('clients');

      // Re-check downgrade eligibility
      const result = await billingApi.checkDowngrade(newTier).catch((e: any) => e.response?.data);
      if (result?.error === 'CLIENT_LIMIT_EXCEEDED') {
        toast.error(`Still ${result.activeClients - result.newLimit} client(s) over the limit. Archive more to continue.`);
        setArchiving(false);
        return;
      }
      toast.success('Clients archived. Redirecting to checkout...');
      onDone(LS_CHECKOUT_URLS[newTier] || '#');
    } catch {
      toast.error('Failed to archive clients');
      setArchiving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <Archive size={16} className="text-yellow-400" />
          <h3 className="text-base font-semibold text-white">Too many active clients</h3>
        </div>
        <p className="text-sm text-[#94A3B8] mb-5">
          The <strong className="text-white">{PLANS.find((p) => p.tier === newTier)?.name}</strong> plan supports up to{' '}
          <strong className="text-white">{PLANS.find((p) => p.tier === newTier)?.clients}</strong> clients.
          Select the clients below to archive before switching plans. Archived clients are hidden but not deleted.
        </p>

        <div className="space-y-2 max-h-64 overflow-y-auto mb-5">
          {excessClients.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-3 bg-[#0F172A] rounded-lg px-3 py-2.5 cursor-pointer hover:bg-[#0F172A]/80 transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.has(c.id)}
                onChange={() => toggleClient(c.id)}
                className="w-4 h-4 accent-[#6366F1]"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{c.name}</p>
                <p className="text-xs text-[#64748B]">{c.contactEmail}</p>
              </div>
              {c.lastReportAt && (
                <span className="text-[10px] text-[#475569] shrink-0">Last report: {formatDate(c.lastReportAt)}</span>
              )}
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-[#334155] text-[#94A3B8] hover:text-white py-2.5 rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleArchiveAndContinue}
            disabled={archiving || selected.size === 0}
            className="flex-1 bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {archiving ? 'Archiving...' : `Archive ${selected.size} & Continue`}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReferralSection({ agency }: { agency: any }) {
  const isEligible = ['AGENCY', 'AGENCY_PRO'].includes(agency?.subscriptionTier);

  const { data: referralData } = useQuery('referrals', referralsApi.getMe, {
    enabled: isEligible,
  });

  if (!isEligible) return null;

  const copyLink = () => {
    if (referralData?.referralLink) {
      navigator.clipboard.writeText(referralData.referralLink);
      toast.success('Referral link copied!');
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Gift size={16} className="text-[#6366F1]" />
        <h2 className="text-sm font-semibold text-white">Referral Program</h2>
      </div>
      <p className="text-xs text-[#94A3B8] mb-4">
        Refer agencies to ReportCraft AI and earn 1 month free for each agency that converts to a paid plan.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Your Referral Code', value: referralData?.referralCode || '—' },
          { label: 'Converted', value: `${referralData?.converted ?? 0} / ${referralData?.referralCount ?? 0}` },
          { label: 'Credits Earned', value: referralData?.creditsEarned != null ? `${referralData.creditsEarned} mo` : '—' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#0F172A] rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-white">{stat.value}</p>
            <p className="text-[10px] text-[#64748B] mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {referralData?.referralLink && (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#94A3B8] truncate font-mono">
            {referralData.referralLink}
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-2 border border-[#334155] hover:border-[#475569] text-[#94A3B8] hover:text-white rounded-lg text-xs transition-colors"
          >
            <Copy size={12} /> Copy
          </button>
        </div>
      )}
    </div>
  );
}

export default function Billing() {
  const { data: agency, isLoading } = useQuery('agency', agencyApi.get);
  const [downgradeModal, setDowngradeModal] = useState<{ newTier: string; excessClients: any[] } | null>(null);

  const handlePlanAction = async (planTier: string) => {
    const currentTier = agency?.subscriptionTier || 'FREE_TRIAL';

    // Determine tier ordering for downgrade detection
    const tierOrder: Record<string, number> = { FREE_TRIAL: 0, STARTER: 1, AGENCY: 2, AGENCY_PRO: 3 };
    const isDowngrade = (tierOrder[planTier] ?? 0) < (tierOrder[currentTier] ?? 0);

    if (isDowngrade) {
      try {
        await billingApi.checkDowngrade(planTier);
        // No conflict — proceed to checkout
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

  const isTrial = agency?.subscriptionTier === 'FREE_TRIAL';
  const daysLeft = agency?.trialEndsAt
    ? Math.ceil((new Date(agency.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 14;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Billing & Plans</h1>
        <p className="text-sm text-[#94A3B8]">Manage your subscription and plan</p>
      </div>

      {/* LS outage banner */}
      <LsOutageBanner />

      {/* Current plan */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-[#64748B] mb-1">Current Plan</p>
            <p className="text-xl font-bold text-white">{isTrial ? '14-day Free Trial' : agency?.subscriptionTier?.replace('_', ' ')}</p>
            {isTrial && (
              <p className="text-sm text-yellow-400 mt-1">⏰ {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining in trial</p>
            )}
            {agency?.currentPeriodEnd && !isTrial && (
              <p className="text-xs text-[#64748B] mt-1">Renews {formatDate(agency.currentPeriodEnd)}</p>
            )}
          </div>
          <StatusBadge status={isTrial ? 'FREE_TRIAL' : agency?.subscriptionTier || 'trial'} size="md" />
        </div>

        {isTrial && (
          <div className="mt-4 p-3 bg-[#6366F1]/10 border border-[#6366F1]/20 rounded-lg">
            <p className="text-xs text-[#6366F1]">You're on the free trial with all Agency features. Upgrade before your trial ends to keep access.</p>
          </div>
        )}
      </div>

      {/* Plan comparison */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {PLANS.map(plan => {
          const isCurrent = agency?.subscriptionTier === plan.tier;
          return (
            <div key={plan.tier} className={`card p-5 relative ${plan.popular ? 'border-[#6366F1]/40' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#6366F1] text-white text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                  Most Popular
                </div>
              )}
              <p className="text-xs text-[#94A3B8]">{plan.name}</p>
              <p className="text-2xl font-bold text-white mt-0.5">${plan.price}<span className="text-sm text-[#64748B] font-normal">/mo</span></p>
              <p className="text-[10px] text-[#64748B] mb-3">{typeof plan.clients === 'number' ? `${plan.clients} clients` : plan.clients} · {plan.reports}</p>
              <ul className="space-y-1.5 mb-4">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                    <Check size={11} className="text-green-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="w-full py-2 text-center text-xs font-medium bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg">
                  Current Plan
                </div>
              ) : (
                <button
                  onClick={() => handlePlanAction(plan.tier)}
                  className={`w-full py-2 text-center text-xs font-medium rounded-lg transition-colors ${plan.popular ? 'bg-[#6366F1] hover:bg-[#4F46E5] text-white' : 'border border-[#334155] hover:border-[#475569] text-[#94A3B8] hover:text-white'}`}
                >
                  {isTrial ? 'Subscribe' : agency?.subscriptionTier === 'STARTER' && plan.tier === 'AGENCY' ? 'Upgrade' : 'Switch'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Referral Program (Agency / Agency Pro only) */}
      <div className="mb-6">
        <ReferralSection agency={agency} />
      </div>

      {/* Lemon Squeezy manage */}
      <div className="card p-5">
        <div className="flex items-center gap-3">
          <CreditCard size={16} className="text-[#64748B]" />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Manage Subscription</p>
            <p className="text-xs text-[#64748B]">Update payment method, download invoices, or cancel at Lemon Squeezy</p>
          </div>
          <a href="https://app.lemonsqueezy.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#6366F1] hover:underline">
            Manage <ExternalLink size={11} />
          </a>
        </div>
      </div>

      <p className="text-xs text-[#475569] text-center mt-4">
        Billing powered by Lemon Squeezy · All prices in USD · Cancel anytime
      </p>

      {/* Downgrade archive-selection modal */}
      {downgradeModal && (
        <DowngradeModal
          newTier={downgradeModal.newTier}
          excessClients={downgradeModal.excessClients}
          onCancel={() => setDowngradeModal(null)}
          onDone={(url) => {
            setDowngradeModal(null);
            window.open(url, '_blank');
          }}
        />
      )}
    </div>
  );
}
