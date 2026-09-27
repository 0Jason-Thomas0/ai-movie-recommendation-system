import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, User, LogOut, Settings, LayoutDashboard, Shield, Menu, X, Film, Heart, Bookmark, Star, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/userService';
import type { Notification } from '../../types/movie';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      notificationService.getNotifications().then(setNotifications).catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Film className="text-primary w-7 h-7" />
            <span className="text-2xl font-black text-white tracking-tight">
              Cine<span className="text-primary">AI</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 ml-8">
            {[
              { label: 'Home', to: '/' },
              { label: 'Movies', to: '/search' },
              { label: 'Trending', to: '/search?sort=trending' },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'text-white bg-white/10'
                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Search + Actions */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Search bar */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-surface-elevated border border-surface-border text-white placeholder-text-muted text-sm rounded-full pl-9 pr-4 py-1.5 w-48 focus:w-64 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all duration-300"
                />
              </div>
            </form>

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <div ref={notifRef} className="relative">
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="btn-icon relative"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 top-12 w-80 glass-card shadow-xl p-2 animate-slide-up z-50">
                      <p className="text-sm font-semibold text-white px-2 py-1 mb-1">Notifications</p>
                      {notifications.length === 0 ? (
                        <p className="text-text-muted text-sm px-2 py-4 text-center">No notifications yet</p>
                      ) : (
                        notifications.slice(0, 5).map((n) => (
                          <div
                            key={n.id}
                            className={`px-3 py-2 rounded-lg mb-1 cursor-pointer hover:bg-white/5 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}
                          >
                            <p className="text-sm text-white font-medium">{n.title}</p>
                            <p className="text-xs text-text-muted mt-0.5">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Profile dropdown */}
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 hover:bg-white/10 rounded-lg px-2 py-1.5 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold">
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <ChevronDown className="w-3 h-3 text-text-secondary" />
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 top-12 w-52 glass-card shadow-xl py-1 animate-slide-up z-50">
                      <div className="px-3 py-2 border-b border-surface-border">
                        <p className="text-white text-sm font-semibold">{user?.username}</p>
                        <p className="text-text-muted text-xs">{user?.email}</p>
                      </div>
                      {[
                        { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
                        { label: 'Watchlist', icon: Bookmark, to: '/watchlist' },
                        { label: 'Favorites', icon: Heart, to: '/favorites' },
                        { label: 'Recommendations', icon: Star, to: '/recommendations' },
                        { label: 'Settings', icon: Settings, to: '/settings' },
                        ...(isAdmin ? [{ label: 'Admin Panel', icon: Shield, to: '/admin' }] : []),
                      ].map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </Link>
                      ))}
                      <div className="border-t border-surface-border mt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
                <Link to="/signup" className="btn-primary text-sm py-1.5">Get Started</Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden btn-icon"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden glass-card mx-0 mb-4 p-4 animate-slide-up">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-9"
                />
              </div>
            </form>
            <div className="flex flex-col gap-1">
              {[
                { label: 'Home', to: '/' },
                { label: 'Browse Movies', to: '/search' },
                ...(isAuthenticated ? [
                  { label: 'Dashboard', to: '/dashboard' },
                  { label: 'Watchlist', to: '/watchlist' },
                  { label: 'Favorites', to: '/favorites' },
                  { label: 'Recommendations', to: '/recommendations' },
                  { label: 'Settings', to: '/settings' },
                  ...(isAdmin ? [{ label: 'Admin Panel', to: '/admin' }] : []),
                ] : [
                  { label: 'Sign In', to: '/login' },
                  { label: 'Sign Up', to: '/signup' },
                ]),
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-text-secondary hover:text-white px-2 py-2 rounded-md hover:bg-white/5 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-400 hover:text-red-300 px-2 py-2 rounded-md hover:bg-red-500/10 transition-colors text-left mt-2"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
