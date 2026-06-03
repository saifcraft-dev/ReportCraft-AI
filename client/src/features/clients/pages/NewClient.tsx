import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'react-query';
import { ArrowLeft, User, Building2, Globe, Mail, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { clientsApi, agencyApi } from '../../../lib/api';
import UpgradeModal from '../../../components/shared/UpgradeModal';

const industries = ['E-commerce', 'SaaS / Tech', 'Healthcare', 'Real Estate', 'Finance', 'Education', 'Retail', 'Agency', 'Other'];

const inputBase =
  'w-full bg-[#0A0F1E] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/15 transition-all duration-200 min-h-[48px]';

export default function NewClient() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', industry: '', websiteUrl: '', contactName: '', contactEmail: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeDetails, setUpgradeDetails] = useState<any>(null);

  const { data: agency } = useQuery('agency', agencyApi.get);

  const mutation = useMutation(clientsApi.create, {
    onSuccess: client => { toast.success('Client created!'); navigate(`/clients/${client.id}`); },
    onError: (e: any) => {
      const data = e.response?.data;
      if (data?.error === 'CLIENT_LIMIT_EXCEEDED') {
        setUpgradeDetails({ activeClients: data.activeClients, limit: data.limit, message: data.message });
        setShowUpgrade(true);
      } else {
        toast.error(data?.message || 'Failed to create client');
      }
    },
  });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim())          errs.name         = 'Client name is required';
    if (!form.contactName.trim())   errs.contactName  = 'Contact name is required';
    if (!form.contactEmail.trim())  errs.contactEmail = 'Contact email is required';
    else if (!/\S+@\S+\.\S+/.test(form.contactEmail)) errs.contactEmail = 'Invalid email address';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) mutation.mutate(form); };

  return (
    <div className="max-w-xl mx-auto animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-7">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-9 h-9 flex items-center justify-center border border-[#334155] hover:border-[#475569] hover:bg-white/4 text-[#64748B] hover:text-white rounded-xl transition-all duration-200 shrink-0"
        >
          <ArrowLeft size={15} />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">Add New Client</h1>
          <p className="text-sm text-[#64748B] mt-0.5 leading-snug">Fill in the details to add a client to your agency</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Client info ── */}
        <div className="card p-5 md:p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={13} className="text-[#6366F1]" />
            <p className="text-[10px] font-bold text-[#6366F1] uppercase tracking-widest">Business Details</p>
          </div>

          {/* Client name */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-2">Client Name <span className="text-[#6366F1]">*</span></label>
            <div className="relative">
              <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none" />
              <input
                type="text"
                value={form.name}
                maxLength={100}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={`${inputBase} pl-10`}
                placeholder="Acme Corp"
              />
            </div>
            {errors.name && <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">⚠ {errors.name}</p>}
          </div>

          {/* Industry */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-2">Industry</label>
            <div className="relative">
              <select
                value={form.industry}
                onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                className={`${inputBase} appearance-none pr-10`}
              >
                <option value="">Select industry</option>
                {industries.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none" />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-2">Website URL</label>
            <div className="relative">
              <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none" />
              <input
                type="url"
                value={form.websiteUrl}
                onChange={e => setForm(f => ({ ...f, websiteUrl: e.target.value }))}
                className={`${inputBase} pl-10`}
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        {/* ── Contact ── */}
        <div className="card p-5 md:p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <User size={13} className="text-[#6366F1]" />
            <p className="text-[10px] font-bold text-[#6366F1] uppercase tracking-widest">Contact Person</p>
          </div>

          {/* Contact name */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-2">Full Name <span className="text-[#6366F1]">*</span></label>
            <div className="relative">
              <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none" />
              <input
                type="text"
                value={form.contactName}
                onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                className={`${inputBase} pl-10`}
                placeholder="Jane Smith"
              />
            </div>
            {errors.contactName && <p className="text-xs text-red-400 mt-1.5">⚠ {errors.contactName}</p>}
          </div>

          {/* Contact email */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-2">Email Address <span className="text-[#6366F1]">*</span></label>
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none" />
              <input
                type="email"
                value={form.contactEmail}
                onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                className={`${inputBase} pl-10`}
                placeholder="jane@acmecorp.com"
              />
            </div>
            {errors.contactEmail && <p className="text-xs text-red-400 mt-1.5">⚠ {errors.contactEmail}</p>}
          </div>
        </div>

        {/* ── Footer actions ── */}
        <div className="flex gap-3 pb-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex-1 border border-[#334155] hover:border-[#475569] hover:bg-white/4 text-[#94A3B8] hover:text-white py-3 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[48px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isLoading}
            className="flex-1 bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold transition-all duration-200 min-h-[48px] shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35"
          >
            {mutation.isLoading ? 'Creating…' : 'Create Client'}
          </button>
        </div>
      </form>

      {showUpgrade && (
        <UpgradeModal
          onClose={() => setShowUpgrade(false)}
          reason="client_limit"
          currentTier={agency?.subscriptionTier}
          details={upgradeDetails}
        />
      )}
    </div>
  );
}
