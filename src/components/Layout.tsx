import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Ticket, Settings, BarChart3, Home, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Layout({ children, currentView, onNavigate }: LayoutProps) {
  const { user, profile, signOut, isAdmin, isSalesPerson } = useAuth();
  const { t, i18n } = useTranslation();

  const handleSignOut = async () => {
    await signOut();
    onNavigate('home');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'mk' ? 'en' : 'mk';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center space-x-2 text-slate-900 font-semibold text-lg hover:text-blue-600 transition-colors"
              >
                <Ticket className="w-6 h-6" />
                <span>{t('app.name')}</span>
              </button>

              <div className="hidden md:flex space-x-4">
                <button
                  onClick={() => onNavigate('home')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'home'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Home className="w-4 h-4 inline-block mr-1" />
                  {t('nav.browsePlays')}
                </button>

                {user && (
                  <button
                    onClick={() => onNavigate('my-bookings')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === 'my-bookings'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {t('nav.myBookings')}
                  </button>
                )}

                {(isAdmin || isSalesPerson) && (
                  <button
                    onClick={() => onNavigate('box-office')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === 'box-office'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Ticket className="w-4 h-4 inline-block mr-1" />
                    {t('nav.boxOffice')}
                  </button>
                )}

                {isAdmin && (
                  <>
                    <button
                      onClick={() => onNavigate('admin')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentView === 'admin'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Settings className="w-4 h-4 inline-block mr-1" />
                      {t('nav.admin')}
                    </button>
                    <button
                      onClick={() => onNavigate('reports')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentView === 'reports'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4 inline-block mr-1" />
                      {t('nav.reports')}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleLanguage}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors border border-slate-300"
                title="Change Language / Промени јазик"
              >
                <Languages className="w-4 h-4" />
                <span className="font-semibold">{i18n.language === 'mk' ? 'MK' : 'EN'}</span>
              </button>

              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 px-3 py-2 rounded-md bg-slate-100">
                    <User className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">
                      {profile?.full_name || user.email}
                    </span>
                    {profile?.role && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                        {profile.role.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('nav.signOut')}</span>
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => onNavigate('signin')}
                    className="px-4 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    {t('nav.signIn')}
                  </button>
                  <button
                    onClick={() => onNavigate('signup')}
                    className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    {t('nav.signUp')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-slate-600">
            <p>{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
