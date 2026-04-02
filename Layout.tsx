import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { CalendarDays, FilePlus2, History, CheckSquare, Settings, LogOut, User as UserIcon, Sun, Moon, Globe, Banknote, Bell, ArrowRightLeft, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import clsx from 'clsx';
import { Language } from '../i18n';

export const Layout: React.FC = () => {
  const { currentUser, logout, users, login, t, language, setLanguage, theme, setTheme, notifications, markNotificationRead, checkReminders } = useAppContext();
  const [showNotifications, setShowNotifications] = React.useState(false);

  React.useEffect(() => {
    if (currentUser) {
      checkReminders();
    }
  }, [currentUser, checkReminders]);

  const [loginInput, setLoginInput] = React.useState('');
  const [loginError, setLoginError] = React.useState('');

  if (!currentUser) {
    const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      const user = users.find(u => u.phone === loginInput || u.email === loginInput || u.id === loginInput);
      if (user) {
        if (user.role === 'admin' && loginInput === user.phone) {
          setLoginError('Admins cannot login with phone number.');
        } else {
          login(user.id);
          setLoginError('');
        }
      } else {
        setLoginError('Invalid login credential.');
      }
    };

    return (
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-slate-100">{t('app.title')}</h2>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">{t('app.login')}</p>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form onSubmit={handleLogin} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Login with Phone Number or Email
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="e.g. 91234567 or a@company.com"
                  />
                  <button
                    type="submit"
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                  >
                    Login
                  </button>
                </div>
                {loginError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{loginError}</p>}
              </div>
            </form>
            
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-slate-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">Or quick login</span>
              </div>
            </div>

            <div className="space-y-4">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => login(u.id)}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                >
                  {t('app.login_btn')} {u.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isManager = users.some(u => u.managerIds.includes(currentUser.id));
  const isAdmin = currentUser.role === 'admin';

  const navItems = [
    { to: '/', icon: CalendarDays, label: t('nav.calendar') },
    { to: '/apply', icon: FilePlus2, label: t('nav.apply') },
    { to: '/history', icon: History, label: t('nav.history') },
    { to: '/attendance', icon: Clock, label: '打卡紀錄' },
    { to: '/swap', icon: ArrowRightLeft, label: t('swap.title') },
    { to: '/payroll', icon: Banknote, label: t('nav.payroll') },
  ];

  if (isManager) {
    navItems.push({ to: '/approvals', icon: CheckSquare, label: t('nav.approvals') });
  }
  
  if (isAdmin) {
    navItems.push({ to: '/admin', icon: Settings, label: t('nav.admin') });
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const cycleLanguage = () => {
    const langs: Language[] = ['zh-HK', 'zh-CN', 'en'];
    const nextIndex = (langs.indexOf(language) + 1) % langs.length;
    setLanguage(langs[nextIndex]);
  };

  const userNotifications = notifications.filter(n => n.userId === currentUser?.id);
  const unreadCount = userNotifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
        <div className="flex-1 flex flex-col min-h-0 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('app.title')}</h1>
          </div>
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => clsx(
                  isActive ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100',
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
                )}
              >
                <item.icon className="mr-3 flex-shrink-0 h-6 w-6" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex-shrink-0 flex flex-col border-t border-slate-200 dark:border-slate-700 p-4 space-y-4">
          <div className="flex items-center space-x-4 relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </button>
            <button onClick={toggleTheme} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
            <button onClick={cycleLanguage} className="flex items-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm font-medium">
              <Globe className="h-5 w-5 mr-1" />
              {language === 'zh-HK' ? '繁' : language === 'zh-CN' ? '简' : 'EN'}
            </button>
            
            {showNotifications && (
              <div className="absolute bottom-10 left-0 w-64 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('nav.notifications') || 'Notifications'}</h3>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {userNotifications.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-center">
                      {t('nav.no_notifications') || 'No notifications'}
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {userNotifications.map(n => (
                        <li 
                          key={n.id} 
                          className={clsx(
                            "px-4 py-3 text-sm transition-colors cursor-pointer",
                            n.read ? "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400" : "bg-blue-50 dark:bg-blue-900/20 text-slate-800 dark:text-slate-200"
                          )}
                          onClick={() => markNotificationRead(n.id)}
                        >
                          <p className="line-clamp-2">{n.message}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            {new Date(n.createdAt).toLocaleString()}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <div>
                <div className="inline-block h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">{currentUser.name}</p>
                <button onClick={logout} className="text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 flex items-center mt-1">
                  <LogOut className="h-3 w-3 mr-1" /> {t('nav.logout')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:pl-64 pb-16 md:pb-0">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 relative">
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('app.title')}</h1>
          <div className="flex items-center space-x-3">
            <button onClick={() => setShowNotifications(!showNotifications)} className="text-slate-500 dark:text-slate-400 relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </button>
            <button onClick={cycleLanguage} className="text-slate-500 dark:text-slate-400">
              <Globe className="h-5 w-5" />
            </button>
            <button onClick={toggleTheme} className="text-slate-500 dark:text-slate-400">
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
            <button onClick={logout} className="text-slate-500 dark:text-slate-400">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
          
          {showNotifications && (
            <div className="absolute top-14 right-4 w-64 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('nav.notifications') || 'Notifications'}</h3>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {userNotifications.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-center">
                    {t('nav.no_notifications') || 'No notifications'}
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {userNotifications.map(n => (
                      <li 
                        key={n.id} 
                        className={clsx(
                          "px-4 py-3 text-sm transition-colors cursor-pointer",
                          n.read ? "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400" : "bg-blue-50 dark:bg-blue-900/20 text-slate-800 dark:text-slate-200"
                        )}
                        onClick={() => markNotificationRead(n.id)}
                      >
                        <p className="line-clamp-2">{n.message}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-around pb-safe">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => clsx(
              isActive ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100',
              'flex flex-col items-center py-2 px-3 text-xs font-medium transition-colors'
            )}
          >
            <item.icon className="h-6 w-6 mb-1" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
};
