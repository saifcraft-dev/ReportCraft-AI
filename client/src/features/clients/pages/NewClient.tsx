import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'react-query';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { clientsApi, agencyApi } from '../../../lib/api';
import UpgradeModal from '../../../components/shared/UpgradeModal';

const industries = ['E-commerce', 'SaaS / Tech', 'Healthcare', 'Real Estate', 'Finance', 'Education', 'Retail', 'Agency', 'Other'];

export default function NewClient() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', industry: '', websiteUrl: '', contactName: '', contactEmail: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeDetails, setUpgradeDetails] = useState<any>(null);

  const { data: agency } = useQuery('agency', agencyApi.get);

  const mutation = useMutation(clientsApi.create, {
    onSuccess: (client) => {
      toast.success('Client created!');
      navigate(`/clients/${client.id}`);
    },
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
    if (!form.name.trim()) errs.name = 'Client name is required';
    if (!form.contactName.trim()) errs.contactName = 'Contact name is required';
    if (!form.contactEmail.trim()) errs.contactEmail = 'Contact email is required';
    else if (!/\S+@\S+\.\S+/.test(form.contactEmail)) errs.contactEmail = 'Invalid email address';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate(form);
  };

  const field = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">{label}</label>
      <input
        type={type}
        value={form[key]}
        maxLength={key === 'name' ? 100 : undefined}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#6366F1] transition-colors"
        placeholder={placeholder}
      />
      {errors[key] && <p className="text-xs text-red-400 mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Add New Client</h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">Fill in the details to add a new client to your agency</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {field('Client Name *', 'name', 'text', 'Acme Corp')}

        <div>
          <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Industry</label>
          <select
            value={form.industry}
            onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
            className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#6366F1] transition-colors"
          >
            <option value="">Select industry</option>
            {industries.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>

        {field('Website URL', 'websiteUrl', 'url', 'https://example.com')}

        <div className="border-t border-[#334155] pt-5">
          <p className="text-xs font-semibold text-[#6366F1] uppercase tracking-wider mb-4">Contact Person</p>
          <div className="space-y-4">
            {field('Contact Name *', 'contactName', 'text', 'Jane Smith')}
            {field('Contact Email *', 'contactEmail', 'email', 'jane@acmecorp.com')}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex-1 border border-[#334155] hover:border-[#475569] text-[#94A3B8] hover:text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isLoading}
            className="flex-1 bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {mutation.isLoading ? 'Creating...' : 'Create Client'}
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
