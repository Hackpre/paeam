import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { validatePassword } from '../lib/utils';
import type { IpiApplication } from '../lib/types';
import {
  Sun,
  Moon,
  Monitor,
  Palette,
  Globe,
  Bell,
  Shield,
  User,
  Link2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Smartphone,
  LogOut,
  Send,
  FileJson,
  FileSpreadsheet,
  Hash,
} from 'lucide-react';

type SettingsTab = 'appearance' | 'language' | 'notifications' | 'security' | 'account' | 'api';

interface NotificationSettings {
  email: boolean;
  payment_reminders: boolean;
  lock_approval: boolean;
  weekly_digest: boolean;
}

const TAB_CONFIG: { id: SettingsTab; label: string; icon: typeof Sun }[] = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'language', label: 'Language', icon: Globe },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'account', label: 'Account', icon: User },
  { id: 'api', label: 'API & Integrations', icon: Link2 },
];

const THEME_OPTIONS = [
  { id: 'dark' as const, label: 'Dark', icon: Moon, description: 'Default dark theme' },
  { id: 'light' as const, label: 'Light', icon: Sun, description: 'Light background theme' },
  { id: 'system' as const, label: 'System', icon: Monitor, description: 'Follow system preference' },
];

const ACCENT_PRESETS = [
  { name: 'Gold', color: '#FFD700' },
  { name: 'Blue', color: '#3B82F6' },
  { name: 'Green', color: '#22C55E' },
  { name: 'Red', color: '#EF4444' },
];

const LANGUAGE_OPTIONS = [
  { id: 'en', label: 'English', description: 'Default language' },
  { id: 'ny', label: 'Chichewa', description: 'Malawi national language' },
];

const SAMPLE_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    Dashboard: 'Dashboard',
    Catalog: 'Catalog',
    Contracts: 'Contracts',
    Settings: 'Settings',
  },
  ny: {
    Dashboard: 'Dasibodi',
    Catalog: 'Katalogo',
    Contracts: 'Mapepala',
    Settings: 'Zosintha',
  },
};

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-neutral-900 ${
        enabled ? 'bg-gold-500' : 'bg-neutral-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const { user, session, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');

  // Appearance state
  const [theme, setTheme] = useState<string>('dark');
  const [accentColor, setAccentColor] = useState('#FFD700');

  // Language state
  const [language, setLanguage] = useState<string>('en');

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    payment_reminders: true,
    lock_approval: true,
    weekly_digest: false,
  });

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Account state
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // API state
  const [ipiApplication, setIpiApplication] = useState<IpiApplication | null>(null);
  const [ipiLoading, setIpiLoading] = useState(false);
  const [ipiMessage, setIpiMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Export state
  const [exportLoading, setExportLoading] = useState(false);

  // Initialize settings from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('paeam_theme');
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'light') {
        document.documentElement.classList.add('light');
      } else if (savedTheme === 'system') {
        if (window.matchMedia('(prefers-color-scheme: light)').matches) {
          document.documentElement.classList.add('light');
        }
      }
    }

    const savedLang = localStorage.getItem('paeam_lang');
    if (savedLang) setLanguage(savedLang);

    const savedNotifs = localStorage.getItem('paeam_notifications');
    if (savedNotifs) {
      try {
        setNotifications(JSON.parse(savedNotifs));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  // Theme handler
  const handleThemeChange = useCallback((newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('paeam_theme', newTheme);

    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
    } else if (newTheme === 'dark') {
      document.documentElement.classList.remove('light');
    } else if (newTheme === 'system') {
      if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    }
  }, []);

  // Language handler
  const handleLanguageChange = useCallback((newLang: string) => {
    setLanguage(newLang);
    localStorage.setItem('paeam_lang', newLang);
  }, []);

  // Notification handler
  const handleNotificationChange = useCallback((key: keyof NotificationSettings, value: boolean) => {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('paeam_notifications', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Password validation on input
  useEffect(() => {
    if (newPassword) {
      const { errors } = validatePassword(newPassword);
      setPasswordErrors(errors);
    } else {
      setPasswordErrors([]);
    }
  }, [newPassword]);

  // Change password
  const handleChangePassword = async () => {
    if (!newPassword) {
      setPasswordMessage({ type: 'error', text: 'Please enter a new password.' });
      return;
    }
    const { valid, errors } = validatePassword(newPassword);
    if (!valid) {
      setPasswordMessage({ type: 'error', text: errors.join('. ') });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (!currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Please enter your current password.' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordMessage({ type: 'error', text: error.message });
      } else {
        setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordErrors([]);
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Change email
  const handleChangeEmail = async () => {
    if (!newEmail) {
      setEmailMessage({ type: 'error', text: 'Please enter a new email address.' });
      return;
    }
    if (!emailPassword) {
      setEmailMessage({ type: 'error', text: 'Please enter your password to confirm.' });
      return;
    }

    setEmailLoading(true);
    setEmailMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) {
        setEmailMessage({ type: 'error', text: error.message });
      } else {
        setEmailMessage({ type: 'success', text: 'Confirmation email sent. Please check your inbox to verify the new address.' });
        setNewEmail('');
        setEmailPassword('');
      }
    } catch {
      setEmailMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setEmailLoading(false);
    }
  };

  // Export data
  const handleExportJSON = async () => {
    if (!user || !profile) return;
    setExportLoading(true);
    try {
      const [profileRes, catalogRes, contractsRes, paymentsRes] = await Promise.all([
        supabase.from('producer_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('catalog_entries').select('*').eq('producer_id', profile.id),
        supabase.from('contracts').select('*').in('catalog_entry_id', (await supabase.from('catalog_entries').select('id').eq('producer_id', profile.id)).data?.map((c: { id: string }) => c.id) || []),
        supabase.from('payments').select('*').eq('user_id', user.id),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        profile: profileRes.data,
        catalog: catalogRes.data,
        contracts: contractsRes.data,
        payments: paymentsRes.data,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `paeam_data_${profile.stage_name || 'export'}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!user || !profile) return;
    setExportLoading(true);
    try {
      const [catalogRes, paymentsRes] = await Promise.all([
        supabase.from('catalog_entries').select('*').eq('producer_id', profile.id),
        supabase.from('payments').select('*').eq('user_id', user.id),
      ]);

      const toCSV = (data: Record<string, unknown>[]) => {
        if (!data.length) return '';
        const headers = Object.keys(data[0]);
        const rows = data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(','));
        return [headers.join(','), ...rows].join('\n');
      };

      const catalogCSV = toCSV(catalogRes.data || []);
      const paymentsCSV = toCSV(paymentsRes.data || []);

      const combined = `--- CATALOG ---\n${catalogCSV || 'No data'}\n\n--- PAYMENTS ---\n${paymentsCSV || 'No data'}`;
      const blob = new Blob([combined], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `paeam_data_${profile.stage_name || 'export'}_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    } finally {
      setExportLoading(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleteLoading(true);
    try {
      await supabase.auth.signOut();
      setShowDeleteModal(false);
    } catch {
      // user is signed out regardless
    } finally {
      setDeleteLoading(false);
    }
  };

  // Sign out other devices
  const handleSignOutOtherDevices = async () => {
    if (!user || !session) return;
    try {
      await supabase.auth.signOut({ scope: 'global' });
      // Re-sign in with current credentials - this is handled by the auth flow
    } catch {
      // handle error
    }
  };

  // Load IPI application status
  useEffect(() => {
    if (!profile) return;
    const loadIpiApplication = async () => {
      const { data } = await supabase
        .from('ipi_applications')
        .select('*')
        .eq('producer_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setIpiApplication(data);
    };
    loadIpiApplication();
  }, [profile]);

  // Request IPI number
  const handleRequestIPI = async () => {
    if (!profile || !user) return;
    setIpiLoading(true);
    setIpiMessage(null);
    try {
      const { data, error } = await supabase
        .from('ipi_applications')
        .insert({
          producer_id: profile.id,
          requested_by: user.id,
          status: 'pending',
          notes: '',
        })
        .select()
        .maybeSingle();

      if (error) {
        setIpiMessage({ type: 'error', text: error.message });
      } else {
        setIpiApplication(data);
        setIpiMessage({ type: 'success', text: 'IPI number request submitted successfully.' });
      }
    } catch {
      setIpiMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIpiLoading(false);
    }
  };

  // Parse user agent
  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';

    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';

    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    return { browser, os };
  };

  const deviceInfo = getDeviceInfo();

  const inputClass =
    'w-full bg-neutral-800 border border-neutral-700 rounded-xl text-white px-4 py-3 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600 transition-colors placeholder:text-neutral-500';

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-neutral-400 mt-1">Manage your preferences and account settings</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-neutral-800 pb-4">
          {TAB_CONFIG.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gold-600 text-black'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* ======================== APPEARANCE TAB ======================== */}
          {activeTab === 'appearance' && (
            <div className="space-y-8">
              {/* Theme Selector */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Theme</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {THEME_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = theme === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleThemeChange(opt.id)}
                        className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-gold-600 bg-gold-600/10'
                            : 'border-neutral-700 bg-neutral-900 hover:border-neutral-600'
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-gold-400' : 'text-neutral-400'}`} />
                        <span className={`font-medium ${isSelected ? 'text-gold-400' : 'text-neutral-300'}`}>
                          {opt.label}
                        </span>
                        <span className="text-xs text-neutral-500">{opt.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accent Color Picker */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Accent Color</h2>
                <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-10 h-10 rounded-full border-2 border-neutral-600"
                      style={{ backgroundColor: accentColor }}
                    />
                    <span className="text-neutral-300 font-mono text-sm">{accentColor}</span>
                  </div>
                  <div className="flex gap-3">
                    {ACCENT_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setAccentColor(preset.color)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                          accentColor === preset.color
                            ? 'border-gold-600 bg-neutral-800'
                            : 'border-neutral-700 hover:border-neutral-600'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full inline-block"
                          style={{ backgroundColor: preset.color }}
                        />
                        <span className="text-sm text-neutral-300">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================== LANGUAGE TAB ======================== */}
          {activeTab === 'language' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Language</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {LANGUAGE_OPTIONS.map((opt) => {
                    const isSelected = language === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleLanguageChange(opt.id)}
                        className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-gold-600 bg-gold-600/10'
                            : 'border-neutral-700 bg-neutral-900 hover:border-neutral-600'
                        }`}
                      >
                        <Globe className={`w-6 h-6 ${isSelected ? 'text-gold-400' : 'text-neutral-400'}`} />
                        <span className={`font-medium ${isSelected ? 'text-gold-400' : 'text-neutral-300'}`}>
                          {opt.label}
                        </span>
                        <span className="text-xs text-neutral-500">{opt.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sample Translations */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Sample Translations</h2>
                <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-800">
                        <th className="text-left px-6 py-3 text-sm font-medium text-neutral-400">English</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-neutral-400">Chichewa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(SAMPLE_TRANSLATIONS.en).map(([key, enVal]) => (
                        <tr key={key} className="border-b border-neutral-800 last:border-0">
                          <td className="px-6 py-3 text-sm text-neutral-300">{enVal}</td>
                          <td className="px-6 py-3 text-sm text-gold-400">{SAMPLE_TRANSLATIONS.ny[key]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================== NOTIFICATIONS TAB ======================== */}
          {activeTab === 'notifications' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Notification Preferences</h2>
                <div className="bg-neutral-900 rounded-xl border border-neutral-800 divide-y divide-neutral-800">
                  {/* Email notifications */}
                  <div className="flex items-center justify-between px-6 py-5">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-neutral-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Email Notifications</p>
                        <p className="text-xs text-neutral-500">Receive important updates via email</p>
                      </div>
                    </div>
                    <ToggleSwitch
                      enabled={notifications.email}
                      onChange={(val) => handleNotificationChange('email', val)}
                    />
                  </div>

                  {/* Payment reminders */}
                  <div className="flex items-center justify-between px-6 py-5">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-neutral-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Payment Reminders</p>
                        <p className="text-xs text-neutral-500">Get notified about upcoming and overdue payments</p>
                      </div>
                    </div>
                    <ToggleSwitch
                      enabled={notifications.payment_reminders}
                      onChange={(val) => handleNotificationChange('payment_reminders', val)}
                    />
                  </div>

                  {/* Lock approval alerts */}
                  <div className="flex items-center justify-between px-6 py-5">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-neutral-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Lock Approval Alerts</p>
                        <p className="text-xs text-neutral-500">Get notified when lock approvals are requested</p>
                      </div>
                    </div>
                    <ToggleSwitch
                      enabled={notifications.lock_approval}
                      onChange={(val) => handleNotificationChange('lock_approval', val)}
                    />
                  </div>

                  {/* Weekly digest */}
                  <div className="flex items-center justify-between px-6 py-5">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-neutral-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Weekly Digest</p>
                        <p className="text-xs text-neutral-500">Receive a weekly summary of your activity</p>
                      </div>
                    </div>
                    <ToggleSwitch
                      enabled={notifications.weekly_digest}
                      onChange={(val) => handleNotificationChange('weekly_digest', val)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================== SECURITY TAB ======================== */}
          {activeTab === 'security' && (
            <div className="space-y-8">
              {/* Change Password */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Change Password</h2>
                <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={inputClass + ' pr-10'}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={inputClass + ' pr-10'}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordErrors.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {passwordErrors.map((err, i) => (
                          <li key={i} className="text-xs text-red-400 flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            {err}
                          </li>
                        ))}
                      </ul>
                    )}
                    {newPassword && passwordErrors.length === 0 && (
                      <p className="mt-2 text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Password meets all requirements
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={inputClass + ' pr-10'}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Passwords do not match
                      </p>
                    )}
                  </div>

                  {/* Password message */}
                  {passwordMessage && (
                    <div
                      className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                        passwordMessage.type === 'success'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {passwordMessage.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      {passwordMessage.text}
                    </div>
                  )}

                  <button
                    onClick={handleChangePassword}
                    disabled={passwordLoading}
                    className="bg-gold-600 hover:bg-gold-700 text-black font-medium px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Two-Factor Authentication</h2>
                <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-neutral-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Email OTP</p>
                        <p className="text-xs text-neutral-500">Coming Soon - Email OTP verification</p>
                      </div>
                    </div>
                    <div className="relative">
                      <ToggleSwitch enabled={false} onChange={() => {}} />
                      <div className="absolute inset-0 cursor-not-allowed" />
                    </div>
                  </div>
                  <span className="inline-block mt-3 text-xs text-neutral-500 bg-neutral-800 px-3 py-1 rounded-full">
                    Coming Soon
                  </span>
                </div>
              </div>

              {/* Active Sessions */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Active Sessions</h2>
                <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-gold-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Current Session</p>
                      <p className="text-xs text-neutral-500">
                        {deviceInfo.browser} on {deviceInfo.os}
                      </p>
                    </div>
                    <span className="ml-auto text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                      Active
                    </span>
                  </div>
                  <button
                    onClick={handleSignOutOtherDevices}
                    className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out Other Devices
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================== ACCOUNT TAB ======================== */}
          {activeTab === 'account' && (
            <div className="space-y-8">
              {/* Change Email */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Change Email</h2>
                <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Current Email</label>
                    <p className="text-sm text-neutral-400 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3">
                      {user?.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">New Email</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className={inputClass}
                      placeholder="Enter new email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Password Confirmation</label>
                    <input
                      type="password"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      className={inputClass}
                      placeholder="Enter your password to confirm"
                    />
                  </div>

                  {emailMessage && (
                    <div
                      className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                        emailMessage.type === 'success'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {emailMessage.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      {emailMessage.text}
                    </div>
                  )}

                  <button
                    onClick={handleChangeEmail}
                    disabled={emailLoading}
                    className="bg-gold-600 hover:bg-gold-700 text-black font-medium px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {emailLoading ? 'Updating...' : 'Update Email'}
                  </button>
                </div>
              </div>

              {/* Export Data */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Export Data</h2>
                <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
                  <p className="text-sm text-neutral-400 mb-4">
                    Download all your data from PAEAM, including profile, catalog entries, contracts, and payments.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleExportJSON}
                      disabled={exportLoading}
                      className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium px-5 py-2.5 rounded-xl border border-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileJson className="w-4 h-4" />
                      Export JSON
                    </button>
                    <button
                      onClick={handleExportCSV}
                      disabled={exportLoading}
                      className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium px-5 py-2.5 rounded-xl border border-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Export CSV
                    </button>
                  </div>
                </div>
              </div>

              {/* Delete Account */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Delete Account</h2>
                <div className="bg-neutral-900 rounded-xl border border-red-900/50 p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-400">Danger Zone</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        This action is permanent and cannot be undone. All your data, including profile, catalog entries,
                        contracts, and payment history will be removed.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                </div>
              </div>

              {/* Delete Account Modal */}
              {showDeleteModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Delete Account</h3>
                        <p className="text-xs text-neutral-400">This action cannot be undone</p>
                      </div>
                    </div>

                    <p className="text-sm text-neutral-300 mb-4">
                      To confirm, type <span className="font-mono text-red-400 font-bold">DELETE</span> in the field below.
                    </p>

                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className={inputClass}
                      placeholder='Type "DELETE" to confirm'
                    />

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => {
                          setShowDeleteModal(false);
                          setDeleteConfirmText('');
                        }}
                        className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-medium px-4 py-2.5 rounded-xl border border-neutral-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleteLoading ? 'Deleting...' : 'Delete Account'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================== API & INTEGRATIONS TAB ======================== */}
          {activeTab === 'api' && (
            <div className="space-y-8">
              {/* IPI Number */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">IPI Number</h2>
                <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center">
                      <Hash className="w-5 h-5 text-gold-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">IPI Number Status</p>
                      {profile?.ipi_number ? (
                        <p className="text-xs text-gold-400 font-mono">{profile.ipi_number}</p>
                      ) : (
                        <p className="text-xs text-neutral-500">No IPI number assigned</p>
                      )}
                    </div>
                    {profile?.ipi_number && (
                      <span className="ml-auto text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                        Assigned
                      </span>
                    )}
                  </div>

                  {/* IPI Application Status */}
                  {ipiApplication && !profile?.ipi_number && (
                    <div className="mb-4 p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                      <div className="flex items-center gap-2">
                        {ipiApplication.status === 'pending' && (
                          <>
                            <Clock className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm text-yellow-400">Application Pending</span>
                          </>
                        )}
                        {ipiApplication.status === 'approved' && (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-green-400">Application Approved</span>
                          </>
                        )}
                        {ipiApplication.status === 'rejected' && (
                          <>
                            <XCircle className="w-4 h-4 text-red-400" />
                            <span className="text-sm text-red-400">Application Rejected</span>
                          </>
                        )}
                        {ipiApplication.status === 'assigned' && (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-green-400">IPI Number Assigned</span>
                          </>
                        )}
                      </div>
                      {ipiApplication.notes && (
                        <p className="text-xs text-neutral-400 mt-2">{ipiApplication.notes}</p>
                      )}
                    </div>
                  )}

                  {ipiMessage && (
                    <div
                      className={`flex items-center gap-2 text-sm p-3 rounded-lg mb-4 ${
                        ipiMessage.type === 'success'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {ipiMessage.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      {ipiMessage.text}
                    </div>
                  )}

                  {!profile?.ipi_number && (
                    <button
                      onClick={handleRequestIPI}
                      disabled={ipiLoading || (ipiApplication?.status === 'pending')}
                      className="flex items-center gap-2 bg-gold-600 hover:bg-gold-700 text-black font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                      {ipiLoading ? 'Requesting...' : 'Request IPI Number'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
