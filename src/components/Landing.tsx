import { useState } from 'react';
import {
  Music,
  Shield,
  Lock,
  FileText,
  Disc3,
  Users,
  Fingerprint,
  Scale,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Globe,
} from 'lucide-react';

interface LandingProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function Landing({ onGetStarted, onSignIn }: LandingProps) {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: <Users size={24} />,
      title: 'Producer Registry',
      description: 'Verified profiles with legal identity, association membership, and digital certificates.',
      color: 'gold',
    },
    {
      icon: <Disc3 size={24} />,
      title: 'Secure Catalog',
      description: 'Register every song with full metadata — ISRC codes, BPM, key, split sheets.',
      color: 'blue',
    },
    {
      icon: <FileText size={24} />,
      title: 'Contract & Royalty Management',
      description: 'Exclusive, non-exclusive, and work-for-hire agreements with detailed royalty splits.',
      color: 'amber',
    },
    {
      icon: <Lock size={24} />,
      title: 'Three-Way Lock System',
      description: 'Records become immutable once approved by Producer, Artist, and Association Witness.',
      color: 'rose',
    },
    {
      icon: <Fingerprint size={24} />,
      title: 'Cryptographic Verification',
      description: 'SHA-256 content hashing on every locked record.',
      color: 'gold',
    },
    {
      icon: <Scale size={24} />,
      title: 'Legal Protection',
      description: 'Timestamp certificates, creation date proof, and Producer Registration IDs.',
      color: 'orange',
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    gold: { bg: 'bg-gold-500/10', border: 'border-gold-500/20', text: 'text-gold-400' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
    rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400' },
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400' },
  };

  const steps = [
    { step: '01', title: 'Register', desc: 'Create your verified producer profile with PAEAM' },
    { step: '02', title: 'Catalog', desc: 'Upload your music with complete metadata and files' },
    { step: '03', title: 'Contract', desc: 'Set up royalty agreements and contract terms' },
    { step: '04', title: 'Lock', desc: 'Three-party approval makes your records immutable' },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src="/PAEAM_Logo-Photoroom.png" alt="PAEAM" className="w-9 h-9" />
              <div>
                <span className="text-base font-bold text-white tracking-tight">PAEAM</span>
                <span className="hidden sm:inline text-xs text-neutral-500 ml-2">Producer Registry</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onSignIn}
                className="px-4 py-2 text-sm text-neutral-300 hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={onGetStarted}
                className="px-4 py-2 bg-gold-600 hover:bg-gold-500 text-neutral-950 text-sm font-medium rounded-xl transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold-500/10 border border-gold-500/20 rounded-full text-xs font-medium text-gold-400 mb-8">
            <Shield size={14} />
            Official PAEAM Digital Registry
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-6">
            Protect Your Music.<br />
            <span className="bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">
              Secure Your Rights.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-neutral-400 leading-relaxed mb-10">
            The official secure registry platform for Malawi's music producers. Register your catalog,
            protect your contracts, and lock your royalties with three-party cryptographic approval.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-500 hover:to-gold-600 text-neutral-950 font-semibold rounded-xl transition-all"
            >
              Register as Producer
              <ArrowRight size={18} />
            </button>
            <button
              onClick={onSignIn}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-xl transition-colors border border-neutral-700"
            >
              Sign In to Dashboard
            </button>
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-500">
            <span className="flex items-center gap-2">🔐 Three-Way Lock</span>
            <span className="flex items-center gap-2">🔒 SHA-256 Verified</span>
            <span className="flex items-center gap-2">⚖️ Legally Recognized</span>
            <span className="flex items-center gap-2">🌍 PAEAM Backed</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-t border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-neutral-400 max-w-xl mx-auto">Four steps to fully protect your music production rights</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.step} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center">
                <span className="text-3xl font-bold text-gold-500/20">{s.step}</span>
                <h3 className="text-lg font-semibold text-white mt-2 mb-2">{s.title}</h3>
                <p className="text-sm text-neutral-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IPI & Membership Section */}
      <section className="py-20 border-t border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* IPI Information */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">IPI Numbers Now Available</h3>
              <p className="text-neutral-400 text-sm mb-4">
                <strong className="text-gold-400">Cosoma is ready to issue IPI numbers</strong> to registered producers.
              </p>
              <div className="bg-black/40 rounded-xl p-4 mb-4">
                <p className="text-white text-sm font-semibold mb-2">What is an IPI Number?</p>
                <p className="text-neutral-400 text-sm">IPI is a unique international identification number for creators, used worldwide to track and distribute royalties.</p>
              </div>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>✓ Required for royalty collection across all CMOs</li>
                <li>✓ Internationally recognized identification</li>
                <li>✓ Prevents duplicate registrations</li>
                <li>✓ Ensures proper royalty payments</li>
              </ul>
            </div>

            {/* Membership Fee */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">Annual Membership Fee</h3>
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-gold-400">15,000 MWK</p>
                <p className="text-neutral-500 text-sm mt-1">(~$8.50 USD) per year</p>
              </div>
              <div className="bg-black/40 rounded-xl p-4 mb-4">
                <p className="text-white text-sm font-semibold mb-2">Accepted Payment Methods</p>
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-1 bg-gold-500/10 text-gold-400 text-sm rounded-lg">Airtel Money</span>
                  <span className="px-3 py-1 bg-gold-500/10 text-gold-400 text-sm rounded-lg">MPamba</span>
                  <span className="px-3 py-1 bg-gold-500/10 text-gold-400 text-sm rounded-lg">National Bank</span>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>✓ IPI number issuance included</li>
                <li>✓ Contract protection and royalty tracking</li>
                <li>✓ Access to three-way lock system</li>
                <li>✓ Verified producer profile</li>
              </ul>
              <button
                onClick={onGetStarted}
                className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-500 hover:to-gold-600 text-neutral-950 font-semibold rounded-xl transition-all"
              >
                Register Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">Built for Malawi's Producers</h2>
          <p className="text-neutral-400 text-center max-w-xl mx-auto mb-12">Every feature designed to protect creative work and ensure fair compensation</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const colors = colorMap[feature.color];
              return (
                <div
                  key={feature.title}
                  className={`p-6 rounded-2xl border ${colors.border} ${colors.bg} cursor-pointer transition-all hover:scale-105`}
                  onClick={() => setActiveFeature(i)}
                >
                  <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}>
                    <span className={colors.text}>{feature.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-neutral-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Protect Your Music?</h2>
          <p className="text-neutral-400 max-w-xl mx-auto mb-8">
            Join Malawi's official producer registry. Your creative work deserves permanent, legally recognized protection.
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-500 hover:to-gold-600 text-neutral-950 font-semibold rounded-xl transition-all"
          >
            Create Your Producer Profile
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-white">Producers & Audio Engineering Association of Malawi</p>
          <p className="text-xs text-neutral-500 mt-1">PAEAM — Official Digital Registry</p>
          <p className="text-xs text-neutral-600 mt-4">&copy; {new Date().getFullYear()} PAEAM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}