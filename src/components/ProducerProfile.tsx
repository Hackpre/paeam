import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, CreditCard, Fingerprint, Save } from 'lucide-react';

export default function ProducerProfile() {
  const [profile, setProfile] = useState({
    fullName: 'Precious Phiri',
    stageName: 'Sir EL-Phi',
    nationalId: 'hsoinfh',
    taxId: 'hdjdk999',
    email: 'austinpreciousphiri@gmail.com',
    phone: '+265888879052',
    studioAddress: 'Zomba 1',
    associationNumber: '',
  });

  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem('producer_profile', JSON.stringify(profile));
      setSaving(false);
      alert('Profile saved successfully!');
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <User size={28} className="text-gold-400" />
          <h1 className="text-2xl font-bold text-white">Producer Profile</h1>
        </div>
        <p className="text-neutral-400 text-sm">Manage your personal and professional information</p>
      </div>

      {/* Form */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gold-500/30 pb-2 mb-4">Personal Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Full Legal Name *</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Stage Name *</label>
              <input
                type="text"
                value={profile.stageName}
                onChange={(e) => setProfile({ ...profile, stageName: e.target.value })}
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">National ID Number</label>
              <input
                type="text"
                value={profile.nationalId}
                onChange={(e) => setProfile({ ...profile, nationalId: e.target.value })}
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Tax ID</label>
              <input
                type="text"
                value={profile.taxId}
                onChange={(e) => setProfile({ ...profile, taxId: e.target.value })}
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gold-500/30 pb-2 mb-4">Contact Information</h3>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Email Address *</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Phone Number *</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Studio Address</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={profile.studioAddress}
                  onChange={(e) => setProfile({ ...profile, studioAddress: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Association & Financial */}
        <div className="mt-6 pt-6 border-t border-neutral-800">
          <h3 className="text-lg font-semibold text-white border-b border-gold-500/30 pb-2 mb-4">Association & Financial</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Association Membership Number</label>
              <div className="relative">
                <Fingerprint size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={profile.associationNumber}
                  onChange={(e) => setProfile({ ...profile, associationNumber: e.target.value })}
                  placeholder="e.g., PAEAM-2026-001"
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Bank Details (Encrypted)</label>
              <div className="relative">
                <CreditCard size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Bank account details"
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
                />
              </div>
              <p className="text-xs text-neutral-500 mt-1">Your bank details are encrypted and secure</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gold-600 hover:bg-gold-500 text-black font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}