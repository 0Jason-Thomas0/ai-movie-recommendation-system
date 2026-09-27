import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Lock, Bell, Film, Trash2, Save, Eye, EyeOff,
  AlertCircle, CheckCircle, Settings, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';

const ALL_GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
  'Romance', 'Science Fiction', 'Thriller', 'War', 'Western',
];

type Tab = 'profile' | 'security' | 'notifications' | 'genres' | 'danger';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [saving, setSaving] = useState(false);

  // Profile form
  const [profile, setProfile] = useState({
    full_name: '',
    username: '',
    bio: '',
  });

  // Password form
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState({
    email_notifications: true,
    recommendation_notifications: true,
  });

  // Genres
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (user) {
      setProfile({
        full_name: user.full_name || '',
        username: user.username || '',
        bio: user.bio || '',
      });
      setNotifPrefs({
        email_notifications: user.email_notifications ?? true,
        recommendation_notifications: user.recommendation_notifications ?? true,
      });
      setSelectedGenres(user.favorite_genres || []);
    }
  }, [user, isAuthenticated, navigate]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await userService.updateProfile(profile);
      await refreshUser();
      toast.success('Profile updated!');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new_password !== passwords.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwords.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await userService.changePassword(passwords.current_password, passwords.new_password);
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
      toast.success('Password changed successfully!');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await userService.updateProfile(notifPrefs);
      await refreshUser();
      toast.success('Notification preferences saved!');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGenres = async () => {
    setSaving(true);
    try {
      await userService.updateProfile({ favorite_genres: selectedGenres });
      await refreshUser();
      toast.success('Genre preferences saved!');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.username) {
      toast.error('Username does not match');
      return;
    }
    try {
      await userService.deleteAccount();
      await logout();
      navigate('/');
      toast.success('Account deleted');
    } catch {
      toast.error('Failed to delete account');
    }
  };

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'genres', label: 'Genre Preferences', icon: Film },
    { id: 'danger', label: 'Danger Zone', icon: Trash2 },
  ];

  return (
    <div className="min-h-screen bg-surface pt-20">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Settings</h1>
            <p className="text-text-muted text-sm">Manage your account preferences</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full md:w-56 shrink-0">
            <div className="glass-card p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-1 last:mb-0 ${
                    activeTab === tab.id
                      ? 'bg-primary/15 text-primary'
                      : tab.id === 'danger'
                      ? 'text-red-400 hover:bg-red-500/10'
                      : 'text-text-secondary hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </span>
                  {activeTab === tab.id && <ChevronRight className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* ── Profile Tab ── */}
            {activeTab === 'profile' && (
              <div className="glass-card p-6">
                <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> Profile Information
                </h2>

                {/* Avatar */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-black text-white">
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{user?.username}</p>
                    <p className="text-text-muted text-sm">{user?.email}</p>
                    <span className="badge badge-red mt-1">{user?.role}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-text-secondary text-sm mb-1.5 block" htmlFor="s-fullname">Full Name</label>
                    <input
                      id="s-fullname"
                      className="input-field"
                      placeholder="Your full name"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-text-secondary text-sm mb-1.5 block" htmlFor="s-username">Username</label>
                    <input
                      id="s-username"
                      className="input-field"
                      placeholder="username"
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-text-secondary text-sm mb-1.5 block" htmlFor="s-bio">Bio</label>
                    <textarea
                      id="s-bio"
                      className="input-field resize-none h-24"
                      placeholder="Tell us a little about yourself..."
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="btn-primary mt-6"
                  id="save-profile-btn"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            )}

            {/* ── Security Tab ── */}
            {activeTab === 'security' && (
              <div className="glass-card p-6">
                <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" /> Change Password
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-text-secondary text-sm mb-1.5 block" htmlFor="s-current-pw">Current Password</label>
                    <div className="relative">
                      <input
                        id="s-current-pw"
                        type={showCurrent ? 'text' : 'password'}
                        className="input-field pr-10"
                        placeholder="••••••••"
                        value={passwords.current_password}
                        onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                      />
                      <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white">
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-text-secondary text-sm mb-1.5 block" htmlFor="s-new-pw">New Password</label>
                    <div className="relative">
                      <input
                        id="s-new-pw"
                        type={showNew ? 'text' : 'password'}
                        className="input-field pr-10"
                        placeholder="Min 8 characters"
                        value={passwords.new_password}
                        onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                      />
                      <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white">
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-text-secondary text-sm mb-1.5 block" htmlFor="s-confirm-pw">Confirm New Password</label>
                    <input
                      id="s-confirm-pw"
                      type="password"
                      className="input-field"
                      placeholder="Repeat new password"
                      value={passwords.confirm_password}
                      onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                    />
                    {passwords.new_password && passwords.confirm_password && (
                      <p className={`text-xs mt-1.5 flex items-center gap-1 ${passwords.new_password === passwords.confirm_password ? 'text-accent-green' : 'text-red-400'}`}>
                        {passwords.new_password === passwords.confirm_password
                          ? <><CheckCircle className="w-3 h-3" /> Passwords match</>
                          : <><AlertCircle className="w-3 h-3" /> Passwords do not match</>}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={saving || !passwords.current_password || !passwords.new_password}
                  className="btn-primary mt-6"
                  id="change-pw-btn"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
                  Change Password
                </button>
              </div>
            )}

            {/* ── Notifications Tab ── */}
            {activeTab === 'notifications' && (
              <div className="glass-card p-6">
                <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" /> Notification Preferences
                </h2>
                <div className="space-y-4">
                  {[
                    { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive updates and news via email' },
                    { key: 'recommendation_notifications', label: 'AI Recommendation Alerts', desc: 'Get notified when your recommendations are refreshed' },
                  ].map((pref) => (
                    <label key={pref.key} className="flex items-center justify-between p-4 bg-surface-elevated rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                      <div>
                        <p className="text-white font-medium">{pref.label}</p>
                        <p className="text-text-muted text-sm mt-0.5">{pref.desc}</p>
                      </div>
                      <div className="relative shrink-0 ml-4">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notifPrefs[pref.key as keyof typeof notifPrefs]}
                          onChange={(e) => setNotifPrefs({ ...notifPrefs, [pref.key]: e.target.checked })}
                        />
                        <div className="w-10 h-6 bg-surface-border peer-checked:bg-primary rounded-full transition-colors duration-200 after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-5 after:h-5 after:transition-transform peer-checked:after:translate-x-4" />
                      </div>
                    </label>
                  ))}
                </div>
                <button onClick={handleSaveNotifications} disabled={saving} className="btn-primary mt-6" id="save-notif-btn">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Preferences
                </button>
              </div>
            )}

            {/* ── Genres Tab ── */}
            {activeTab === 'genres' && (
              <div className="glass-card p-6">
                <h2 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                  <Film className="w-5 h-5 text-primary" /> Favorite Genres
                </h2>
                <p className="text-text-muted text-sm mb-5">Select genres you enjoy. This helps our AI tailor recommendations for you.</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {ALL_GENRES.map((g) => (
                    <button
                      key={g}
                      onClick={() => toggleGenre(g)}
                      className={selectedGenres.includes(g) ? 'genre-pill-active' : 'genre-pill'}
                    >
                      {selectedGenres.includes(g) && '✓ '}{g}
                    </button>
                  ))}
                </div>
                <p className="text-text-muted text-sm mb-4">{selectedGenres.length} genre{selectedGenres.length !== 1 ? 's' : ''} selected</p>
                <button onClick={handleSaveGenres} disabled={saving} className="btn-primary" id="save-genres-btn">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Genres
                </button>
              </div>
            )}

            {/* ── Danger Zone ── */}
            {activeTab === 'danger' && (
              <div className="glass-card p-6 border border-red-500/30">
                <h2 className="text-red-400 font-bold text-lg mb-2 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" /> Danger Zone
                </h2>
                <p className="text-text-muted text-sm mb-6">
                  Permanently delete your account and all associated data. This action is <strong className="text-red-400">irreversible</strong>.
                </p>
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
                  <p className="text-text-secondary text-sm mb-3">
                    To confirm, type your username: <span className="text-white font-mono font-bold">{user?.username}</span>
                  </p>
                  <input
                    className="input-field mb-4 border-red-500/30 focus:ring-red-500/50 focus:border-red-500"
                    placeholder="Enter your username"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    id="delete-confirm-input"
                  />
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirm !== user?.username}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-lg transition-colors duration-200"
                    id="delete-account-btn"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete My Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
