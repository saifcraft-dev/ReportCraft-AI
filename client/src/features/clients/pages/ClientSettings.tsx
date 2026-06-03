import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  ArrowLeft, Save, Archive, PauseCircle, PlayCircle,
  Bell, BellOff, Building2, User, Mail, Globe, MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { clientsApi } from '../../../lib/api';
import { PageLoader } from '../../../components/shared/LoadingSpinner';

const inputBase =
  'w-full bg-[#0A0F1E] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/15 transition-all duration-200 min-h-[48px]';

const industries = ['E-commerce', 'SaaS / Tech', 'Healthcare', 'Real Estate', 'Finance', 'Education', 'Retail', 'Agency', 'Other'];

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-white/5">
      <div className="w-7 h-7 bg-[#6366F1]/12 rounded-lg flex items-center justify-center">
        <Icon size={13} className="text-[#818CF8]" />
      </div>
      <h2 className="text-sm font-bold text-white">{label}</h2>
    </div>
  );
}

export default function ClientSettings() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const { data: client, isLoading } = useQuery(['client', id], () => clientsApi.get(id!));

  const [form, setForm] = useState({
    name: '', industry: '', websiteUrl: '', contactName: '',
    contactEmail: '', emailSubjectTemplate: '', emailBodyTemplate: '',
  });

  useEffect(() => {
    if (client) setForm({
      name:                 client.name                 || '',
      industry:             client.industry             || '',
      websiteUrl:           client.websiteUrl           || '',
      contactName:          client.contactName          || '',
      contactEmail:         client.contactEmail         || '',
      emailSubjectTemplate: client.emailSubjectTemplate || '',
      emailBodyTemplate:    client.emailBodyTemplate    || '',
    });
  }, [client]);

  const updateMutation = useMutation(
    (data: any) => clientsApi.update(id!, data),
    {
      onSuccess: () => {
        qc.invalidateQueries(['client', id]);
        qc.invalidateQueries('clients');
        toast.success('Settings saved');
      },
    }
  );

  const archiveMutation = useMutation(
    () => clientsApi.archive(id!),
    { onSuccess: () => { toast.success('Client archived'); navigate('/dashboard'); } }
  );

  const pauseMutation = useMutation(
    (status: 'active' | 'paused') => clientsApi.update(id!, { status }),
    {
      onSuccess: (_data, status) => {
        qc.invalidateQueries(['client', id]);
        qc.invalidateQueries('clients');
        toast.success(status === 'paused' ? 'Client paused — reports and alerts suspended' : 'Client resumed');
      },
      onError: () => toast.error('Failed to update client status'),
    }
  );

  const anomalyMutation = useMutation(
    (enabled: boolean) => clientsApi.update(id!, { anomalyAlertsEnabled: enabled }),
    {
      onSuccess: (_data, enabled) => {
        qc.invalidateQueries(['client', id]);
        toast.success(enabled ? 'Anomaly alerts enabled' : 'Anomaly alerts disabled');
      },
    }
  );

  if (isLoading) return <PageLoader />;

  const isPaused      = client?.status === 'paused';
  const anomalyEnabled = client?.anomalyAlertsEnabled !== false;

  const field = (
    label: string,
    key: keyof typeof form,
    type = 'text',
    placeholder = '',
    icon?: React.ElementType,
    required = false,
  ) => {
    const Icon = icon;
    return (
      <div>
        <label className="block text-xs font-semibold text-[#94A3B8] mb-2">
          {label}{required && <span className="text-[#6366F1] ml-0.5">*</span>}
        </label>
        <div className="relative">
          {Icon && <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none" />}
          <input
            type={type}
            value={(form as any)[key]}
            placeholder={placeholder}
            onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
            className={`${inputBase} ${Icon ? 'pl-10' : ''}`}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link
          to={`/clients/${id}`}
          className="w-9 h-9 flex items-center justify-center border border-[#334155] hover:border-[#475569] hover:bg-white/4 text-[#64748B] hover:text-white rounded-xl transition-all duration-200 shrink-0"
        >
          <ArrowLeft size={15} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white leading-tight">Client Settings</h1>
          <p className="text-xs text-[#64748B] mt-0.5 truncate">{client?.name}</p>
        </div>
        {isPaused && (
          <span className="text-xs bg-amber-500/12 border border-amber-500/25 text-amber-400 px-2.5 py-1 rounded-full font-semibold shrink-0">
            Paused
          </span>
        )}
      </div>

      {/* ── Basic Info ── */}
      <div className="card p-5 md:p-6">
        <SectionHeader icon={Building2} label="Basic Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('Client Name', 'name', 'text', 'Acme Corp', Building2, true)}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-2">Industry</label>
            <select
              value={form.industry}
              onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
              className={`${inputBase} appearance-none`}
            >
              <option value="">Select industry</option>
              {industries.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            {field('Website URL', 'websiteUrl', 'url', 'https://example.com', Globe)}
          </div>
        </div>
      </div>

      {/* ── Contact ── */}
      <div className="card p-5 md:p-6">
        <SectionHeader icon={User} label="Contact Person" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('Contact Name', 'contactName', 'text', 'Jane Smith', User, true)}
          {field('Contact Email', 'contactEmail', 'email', 'jane@acmecorp.com', Mail, true)}
        </div>
      </div>

      {/* ── Email Templates ── */}
      <div className="card p-5 md:p-6">
        <SectionHeader icon={MessageSquare} label="Email Templates" />
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-2">Subject Line Template</label>
            <input
              type="text"
              value={form.emailSubjectTemplate}
              onChange={e => setForm(p => ({ ...p, emailSubjectTemplate: e.target.value }))}
              className={inputBase}
              placeholder="{client} — Performance Report — {date}"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-2">Email Body Template</label>
            <textarea
              value={form.emailBodyTemplate}
              rows={4}
              onChange={e => setForm(p => ({ ...p, emailBodyTemplate: e.target.value }))}
              className="w-full bg-[#0A0F1E] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/15 transition-all duration-200 resize-none"
              placeholder="Hi {contact}, please find your performance report attached..."
            />
            <p className="text-[10px] text-[#475569] mt-1.5 leading-relaxed">
              Variables: <code className="text-[#6366F1]">{'{client}'}</code>, <code className="text-[#6366F1]">{'{contact}'}</code>, <code className="text-[#6366F1]">{'{date}'}</code>
            </p>
          </div>
        </div>
      </div>

      {/* ── Anomaly Alerts ── */}
      <div className="card p-5 md:p-6">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${anomalyEnabled ? 'bg-[#6366F1]/15' : 'bg-white/5'}`}>
              {anomalyEnabled
                ? <Bell size={15} className="text-[#818CF8]" />
                : <BellOff size={15} className="text-[#475569]" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">Anomaly Alerts</h2>
              <p className="text-xs text-[#64748B] mt-0.5 leading-snug">
                Get emailed when a metric shifts ±20% vs. the prior period
              </p>
            </div>
          </div>
          <button
            onClick={() => anomalyMutation.mutate(!anomalyEnabled)}
            disabled={anomalyMutation.isLoading}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border transition-all duration-200 min-h-[40px] shrink-0 ${
              anomalyEnabled
                ? 'bg-[#6366F1]/12 border-[#6366F1]/30 text-[#818CF8] hover:bg-[#6366F1]/20'
                : 'border-[#334155] text-[#64748B] hover:border-[#475569] hover:text-white hover:bg-white/4'
            }`}
          >
            {anomalyEnabled ? <Bell size={12} /> : <BellOff size={12} />}
            {anomalyEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="flex flex-col xs:flex-row gap-3 pb-4">
        <button
          onClick={() => updateMutation.mutate(form)}
          disabled={updateMutation.isLoading}
          className="flex-1 flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] disabled:opacity-50 text-white px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 min-h-[48px] shadow-lg shadow-indigo-500/20"
        >
          <Save size={14} /> {updateMutation.isLoading ? 'Saving…' : 'Save Changes'}
        </button>

        <button
          onClick={() => pauseMutation.mutate(isPaused ? 'active' : 'paused')}
          disabled={pauseMutation.isLoading}
          className={`flex items-center justify-center gap-2 border text-sm font-semibold px-5 py-3 rounded-xl transition-all duration-200 min-h-[48px] ${
            isPaused
              ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
              : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
          }`}
        >
          {isPaused ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
          {isPaused ? 'Resume Client' : 'Pause Client'}
        </button>

        <button
          onClick={() => {
            if (confirm('Archive this client? They will no longer count toward your limit.')) archiveMutation.mutate();
          }}
          className="flex items-center justify-center gap-2 border border-red-500/30 hover:bg-red-500/10 text-red-400 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[48px] xs:ml-auto"
        >
          <Archive size={14} /> Archive
        </button>
      </div>
    </div>
  );
}
