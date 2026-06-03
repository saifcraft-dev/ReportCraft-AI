import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <nav className="border-b border-[#1E293B] px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg">ReportCraft <span className="text-[#6366F1]">AI</span></span>
        </Link>
        <Link to="/sign-in" className="text-sm text-[#94A3B8] hover:text-white">Sign in</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-extrabold mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#64748B] mb-10">Last updated: June 1, 2026</p>

        <div className="space-y-8 text-[#CBD5E1] leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly, such as your name, email address, and agency details when you create an account. We also collect data about how you use ReportCraft AI, including reports generated, connectors configured, and features accessed.</p>
            <p className="mt-2">We receive data from your connected advertising platforms (Google Analytics 4, Google Ads, Meta Ads, LinkedIn Ads) via OAuth. This data is used solely to generate performance reports for your clients.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>To provide, operate, and improve ReportCraft AI</li>
              <li>To generate AI-powered performance reports</li>
              <li>To send transactional emails (report delivery, billing notifications)</li>
              <li>To process payments via Lemon Squeezy</li>
              <li>To analyze product usage for improvement (via PostHog analytics)</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Data Security</h2>
            <p>All OAuth tokens for your connected ad platforms are encrypted at rest using AES-256-GCM encryption. We use HMAC-signed state parameters for all OAuth flows. Data is transmitted over TLS 1.2+. We never store raw access tokens in plaintext.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Data Sharing</h2>
            <p>We do not sell your personal data. We share data only with:</p>
            <ul className="list-disc list-inside mt-2 space-y-1.5">
              <li><strong className="text-white">Clerk</strong> — authentication and session management</li>
              <li><strong className="text-white">Lemon Squeezy</strong> — payment processing and subscription management</li>
              <li><strong className="text-white">Resend</strong> — transactional email delivery</li>
              <li><strong className="text-white">OpenAI / Anthropic</strong> — AI narrative generation (anonymized metric data only)</li>
              <li><strong className="text-white">PostHog</strong> — product analytics (no PII shared)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Data Retention</h2>
            <p>We retain your account data for as long as your account is active. Upon account deletion, we delete your data within 30 days, except where required by law. OAuth tokens for disconnected platforms are deleted immediately upon connector removal.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Your Rights</h2>
            <p>Depending on your location, you may have the right to access, correct, or delete your personal data. To exercise these rights, contact us at <a href="mailto:privacy@reportcraft.ai" className="text-[#6366F1] hover:underline">privacy@reportcraft.ai</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Cookies</h2>
            <p>We use essential cookies for authentication (Clerk session cookies) and optional analytics cookies (PostHog). You can disable analytics cookies by contacting us. We do not use advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Contact</h2>
            <p>For privacy questions or requests, contact us at <a href="mailto:privacy@reportcraft.ai" className="text-[#6366F1] hover:underline">privacy@reportcraft.ai</a>.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-[#1E293B] flex gap-6 text-sm text-[#64748B]">
          <Link to="/" className="hover:text-white">Home</Link>
          <Link to="/terms" className="hover:text-white">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}
