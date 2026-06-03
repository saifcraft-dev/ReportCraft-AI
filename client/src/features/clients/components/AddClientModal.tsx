import { useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { X, Building2, User, Mail, Globe, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { clientsApi, agencyApi } from '../../../lib/api';
import UpgradeModal from '../../../components/shared/UpgradeModal';

interface Props { onClose: () => void; onSuccess: () => void; }

const inputBase =
  'w-full bg-[#0A0F1E] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/15 transition-all duration-200 min-h-[48px]';

const industries = ['E-commerce', 'SaaS / Tech', 'Healthcare', 'Real Estate', 'Finance', 'Education', 'Retail', 'Agency', 'Other'];

export default function AddClientModal({ onClose, onSuccess }: Props) {
  const [form, setForm]           = useState({ name: '', industry: '', websiteUrl: '', contactName: '', contactEmail: '' });
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [showUpgrade, setShowUpgrade]     = useState(false);
  const [upgradeDetails, setUpgradeDetails] = useState<any>(null);

  const { data: agency } = useQuery('agency', agencyApi.get);

  const mutation = useMutation(clientsApi.create, {
    onSuccess: () => { toast.success('Client created!'); onSuccess(); },
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
    else if (!/\S+@\S+\.\S+/.test(form.contactEmail)) errs.contactEmail = 'Invalid email';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) mutation.mutate(form); };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer — full-height on desktop, bottom-sheet on narrow mobile */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full sm:w-[400px] flex-col bg-[#111827] border-l border-[#1E293B] shadow-2xl animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E293B] shrink-0">
          <div>
            <h2 className="text-base font-bold text-white leading-tight">Add New Client</h2>
            <p className="text-[11px] text-[#64748B] mt-0.5">All required fields marked <span className="text-[#6366F1]">*</span></p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-[#1E293B] rounded-xl text-[#64748B] hover:text-white transition-all duration-200"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Business Details */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Building2 size={11} className="text-[#6366F1]" />
              <p className="text-[10px] font-bold text-[#6366F1] uppercase tracking-widest">Business Details</p>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-2">
                  Client Name <span className="text-[#6366F1]">*</span>
                </label>
                <div className="relative">
                  <Building2 size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none" />
                  <input
                    type="text" value={form.name} maxLength={100}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className={`${inputBase} pl-10`}
                    placeholder="Acme Corp"
                  />
                </div>
                {errors.name && <p className="text-xs text-red-400 mt-1.5">⚠ {errors.name}</p>}
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
                  <ChevronDown size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none" />
                </div>
              </div>

              {/* Website */}
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-2">Website URL</label>
                <div className="relative">
                  <Globe size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none" />
                  <input
                    type="url" value={form.websiteUrl}
                    onChange={e => setForm(f => ({ ...f, websiteUrl: e.target.value }))}
                    className={`${inputBase} pl-10`}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#1E293B]" />

          {/* Contact Person */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <User size={11} className="text-[#6366F1]" />
              <p className="text-[10px] font-bold text-[#6366F1] uppercase tracking-widest">Contact Person</p>
            </div>

            <div className="space-y-4">
              {/* Contact name */}
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-2">
                  Full Name <span className="text-[#6366F1]">*</span>
                </label>
                <div className="relative">
                  <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none" />
                  <input
                    type="text" value={form.contactName}
                    onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                    className={`${inputBase} pl-10`}
                    placeholder="Jane Smith"
                  />
                </div>
                {errors.contactName && <p className="text-xs text-red-400 mt-1.5">⚠ {errors.contactName}</p>}
              </div>

              {/* Contact email */}
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-2">
                  Email Address <span className="text-[#6366F1]">*</span>
                </label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none" />
                  <input
                    type="email" value={form.contactEmail}
                    onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                    className={`${inputBase} pl-10`}
                    placeholder="jane@acmecorp.com"
                  />
                </div>
                {errors.contactEmail && <p className="text-xs text-red-400 mt-1.5">⚠ {errors.contactEmail}</p>}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#1E293B] flex gap-3 shrink-0 bg-[#111827]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-[#334155] hover:border-[#475569] hover:bg-white/4 text-[#94A3B8] hover:text-white py-3 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[48px]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isLoading}
            className="flex-1 bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold transition-all duration-200 min-h-[48px] shadow-lg shadow-indigo-500/20"
          >
            {mutation.isLoading ? 'Creating…' : 'Create Client'}
          </button>
        </div>
      </div>

      {showUpgrade && (
        <UpgradeModal
          onClose={() => setShowUpgrade(false)}
          reason="client_limit"
          currentTier={agency?.subscriptionTier}
          details={upgradeDetails}
        />
      )}
    </>
  );
}
