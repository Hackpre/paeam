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
  UserCheck,
  BookOpen,
  Handshake,
  ShieldCheck,
} from 'lucide-react';

interface LandingProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const features = [
  {
    icon: Users,
    title: 'Producer Registry',
    description:
      'Verified profiles with legal identity, association membership, and digital certificates. Every producer is authenticated and recognized by PAEAM.',
    detail:
      'Each producer receives a unique PAEAM Registration ID linked to their legal identity. Profiles include verified government ID, association membership status, and a publicly shareable digital certificate. This establishes an unambiguous chain of authorship recognized across Malawi and beyond.',
  },
  {
    icon: Disc3,
    title: 'Secure Catalog',
    description:
      'Register every song with full metadata -- ISRC codes, BPM, key, split sheets, and publishing details. Your creative work, permanently documented.',
    detail:
      'Upload tracks with comprehensive metadata: ISRC codes, tempo, key signature, genre, featured artists, and split sheet percentages. Every entry is timestamped and versioned, creating an indelible record of your creative output that stands as proof of creation.',
  },
  {
    icon: FileText,
    title: 'Contract & Royalty Management',
    description:
      'Exclusive, non-exclusive, and work-for-hire agreements with detailed royalty splits -- mechanical, performance, and publishing rights tracked precisely.',
    detail:
      'Define contract types, royalty splits (mechanical, performance, sync, publishing), payment terms, and exclusivity periods. Smart contract templates ensure no clause is overlooked. Track every agreement from signature to expiration with full audit history.',
  },
  {
    icon: Lock,
    title: 'Three-Way Lock System',
    description:
      'Records become immutable once approved by the Producer, Artist, and Association Witness. No one -- including backend admins -- can alter locked records.',
    detail:
      'Three independent approvals are required to seal a record: the Producer, the Artist, and a PAEAM Association Witness. Once all three sign, the record is cryptographically locked. Any attempted modification invalidates the signature chain, making tampering immediately detectable.',
  },
  {
    icon: Fingerprint,
    title: 'Cryptographic Verification',
    description:
      'SHA-256 content hashing on every locked record. Tamper-evident audit trail ensures legal proof of creation dates and ownership.',
    detail:
      'Every locked record is hashed with SHA-256, producing a unique fingerprint that changes if even a single byte is altered. The hash is stored on the record itself and in the audit log, creating a tamper-evident chain that can be independently verified by any party or court.',
  },
  {
    icon: Scale,
    title: 'Legal Protection',
    description:
      'Timestamp certificates, creation date proof, and Producer Registration IDs. Built to serve as evidence in court and strengthen producer rights in Malawi.',
    detail:
      'Locked records include timestamp certificates, SHA-256 hashes, and the PAEAM Registration ID of every signatory. These documents are designed to be court-admissible evidence of creation date, authorship, and agreement terms -- strengthening producer rights under Malawian law.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Register',
    desc: 'Create your verified producer profile with PAEAM',
    icon: UserCheck,
  },
  {
    step: '02',
    title: 'Catalog',
    desc: 'Upload your music with complete metadata and files',
    icon: BookOpen,
  },
  {
    step: '03',
    title: 'Contract',
    desc: 'Set up royalty agreements and contract terms',
    icon: Handshake,
  },
  {
    step: '04',
    title: 'Lock',
    desc: 'Three-party approval makes your records immutable',
    icon: ShieldCheck,
  },
];

const trustIndicators = [
  { icon: Lock, label: 'Three-Way Lock' },
  { icon: Fingerprint, label: 'SHA-256 Verified' },
  { icon: Scale, label: 'Legally Recognized' },
  { icon: Globe, label: 'PAEAM Backed' },
];

export default function Landing({ onGetStarted, onSignIn }: LandingProps) {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 overflow-x-hidden">
      {/* ===== NAVIGATION ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img
                src="/PAEAM_Logo-Photoroom.png"
                alt="PAEAM"
                className="w-9 h-9"
              />
              <div>
                <span className="text-base font-bold text-white tracking-tight">
                  PAEAM
                </span>
                <span className="hidden sm:inline text-xs text-neutral-500 ml-2">
                  Producer Registry
                </span>
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

      {/* ===== HERO ===== */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold-700/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* PAEAM badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold-500/10 border border-gold-500/20 rounded-full text-xs font-medium text-gold-400 mb-8">
            <Shield size={14} />
            Official PAEAM Digital Registry
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-6">
            Protect Your Music.
            <br />
            <span className="bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 bg-clip-text text-transparent">
              Secure Your Rights.
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-neutral-400 leading-relaxed mb-10">
            The official secure registry platform for Malawi's music producers.
            Register your catalog, protect your contracts, and lock your
            royalties with three-party cryptographic approval.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-gold-600 hover:bg-gold-500 text-neutral-950 font-semibold rounded-xl transition-all shadow-lg shadow-gold-500/20"
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

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-neutral-500">
            {trustIndicators.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-2">
                <Icon size={16} className="text-gold-500" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 border-t border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              Four steps to fully protect your music production rights
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => {
              const StepIcon = s.icon;
              return (
                <div key={s.step} className="relative">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 h-full">
                    <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center mb-4">
                      <StepIcon size={20} className="text-gold-400" />
                    </div>
                    <span className="text-3xl font-bold text-gold-500/20">
                      {s.step}
                    </span>
                    <h3 className="text-lg font-semibold text-white mt-2 mb-2">
                      {s.title}
                    </h3>
                    <p className="text-sm text-neutral-400">{s.desc}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="hidden lg:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                      <ChevronRight size={20} className="text-neutral-600" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="py-20 border-t border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Built for Malawi's Producers
            </h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              Every feature designed to protect creative work and ensure fair
              compensation
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Feature list */}
            <div className="space-y-3">
              {features.map((feature, i) => {
                const FeatureIcon = feature.icon;
                const isActive = activeFeature === i;
                return (
                  <button
                    key={feature.title}
                    onClick={() => setActiveFeature(i)}
                    className={`w-full text-left flex items-start gap-4 p-5 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-gold-500/10 border-gold-500/20'
                        : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-gold-500/10' : 'bg-neutral-800'
                      }`}
                    >
                      <FeatureIcon
                        size={24}
                        className={isActive ? 'text-gold-400' : 'text-neutral-500'}
                      />
                    </div>
                    <div>
                      <h3
                        className={`font-semibold mb-1 ${
                          isActive ? 'text-white' : 'text-neutral-300'
                        }`}
                      >
                        {feature.title}
                      </h3>
                      <p
                        className={`text-sm leading-relaxed ${
                          isActive ? 'text-neutral-300' : 'text-neutral-500'
                        }`}
                      >
                        {feature.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Feature detail panel (desktop) */}
            <div className="hidden lg:block">
              <div className="sticky top-24 bg-neutral-900 border border-neutral-800 rounded-2xl p-8 min-h-[320px] flex items-center justify-center">
                <div className="text-center max-w-sm">
                  <div className="w-20 h-20 rounded-2xl bg-gold-500/10 flex items-center justify-center mx-auto mb-6">
                    {(() => {
                      const ActiveIcon = features[activeFeature].icon;
                      return <ActiveIcon size={40} className="text-gold-400" />;
                    })()}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {features[activeFeature].title}
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    {features[activeFeature].detail}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== THREE-WAY LOCK DEEP DIVE ===== */}
      <section className="py-20 border-t border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 rounded-3xl p-8 sm:p-12">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold-500/10 border border-gold-500/20 rounded-full text-xs font-medium text-gold-400 mb-4">
                <Lock size={14} />
                Core Security Feature
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Three-Way Lock System
              </h2>
              <p className="text-neutral-400 max-w-2xl mx-auto">
                Once all three parties approve, records become cryptographically
                sealed. No one -- including backend administrators -- can alter
                locked data without invalidating the signature.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              {/* Producer */}
              <div className="bg-neutral-800/50 border border-gold-500/20 rounded-2xl p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gold-500/10 flex items-center justify-center mx-auto mb-4">
                  <Users size={28} className="text-gold-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Producer</h3>
                <p className="text-sm text-neutral-400">
                  Initiates the lock and provides digital signature with SHA-256
                  hash
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gold-500 font-medium">
                  <div className="w-2 h-2 rounded-full bg-gold-500" />
                  First Signatory
                </div>
              </div>

              {/* Artist */}
              <div className="bg-neutral-800/50 border border-gold-500/20 rounded-2xl p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gold-500/10 flex items-center justify-center mx-auto mb-4">
                  <Music size={28} className="text-gold-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Artist</h3>
                <p className="text-sm text-neutral-400">
                  Confirms agreement terms and co-signs the record with
                  cryptographic proof
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gold-500 font-medium">
                  <div className="w-2 h-2 rounded-full bg-gold-500" />
                  Second Signatory
                </div>
              </div>

              {/* Association Witness */}
              <div className="bg-neutral-800/50 border border-gold-500/20 rounded-2xl p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gold-500/10 flex items-center justify-center mx-auto mb-4">
                  <Shield size={28} className="text-gold-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">
                  Association Witness
                </h3>
                <p className="text-sm text-neutral-400">
                  PAEAM witness verifies and seals the record, making it legally
                  binding
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gold-500 font-medium">
                  <div className="w-2 h-2 rounded-full bg-gold-500" />
                  Final Seal
                </div>
              </div>
            </div>

            {/* Bottom properties */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-neutral-400">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-gold-400" /> Immutable
                records
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-gold-400" />{' '}
                Tamper-evident
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-gold-400" />{' '}
                Version-controlled
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-gold-400" />{' '}
                Court-admissible
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 border-t border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Protect Your Music?
          </h2>
          <p className="text-neutral-400 max-w-xl mx-auto mb-8">
            Join Malawi's official producer registry. Your creative work deserves
            permanent, legally recognized protection.
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gold-600 hover:bg-gold-500 text-neutral-950 font-semibold rounded-xl transition-all shadow-lg shadow-gold-500/20"
          >
            Create Your Producer Profile
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-neutral-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img
                src="/PAEAM_Logo-Photoroom.png"
                alt="PAEAM"
                className="w-9 h-9"
              />
              <div>
                <p className="text-sm font-semibold text-white">
                  Producers & Audio Engineering Association of Malawi
                </p>
                <p className="text-xs text-neutral-500">
                  PAEAM -- Official Digital Registry
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs text-neutral-500">
              <span>Secure Rights Management</span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">
                Immutable Record Keeping
              </span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">
                Three-Way Lock Protection
              </span>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-neutral-800/50 text-center">
            <p className="text-xs text-neutral-600">
              &copy; {new Date().getFullYear()} Producers & Audio Engineering
              Association of Malawi (PAEAM). All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
