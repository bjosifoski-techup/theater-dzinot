import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { SignIn } from './components/Auth/SignIn';
import { SignUp } from './components/Auth/SignUp';
import { AcceptInvitation } from './components/Auth/AcceptInvitation';
import { PlayList } from './components/Customer/PlayList';
import { BookingFlow } from './components/Customer/BookingFlow';
import { MyBookings } from './components/Customer/MyBookings';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { BoxOffice } from './components/BoxOffice/BoxOffice';
import { Loader } from 'lucide-react';

function AppContent() {
  const { loading, isAdmin, isSalesPerson } = useAuth();
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedPlayId, setSelectedPlayId] = useState<string | null>(null);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invitation');
    if (token) {
      setInvitationToken(token);
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    setSelectedPlayId(null);
  };

  const handlePlaySelect = (playId: string) => {
    setSelectedPlayId(playId);
    setCurrentView('booking');
  };

  const handleInvitationComplete = () => {
    setInvitationToken(null);
    setCurrentView('home');
  };

  if (invitationToken) {
    return <AcceptInvitation token={invitationToken} onComplete={handleInvitationComplete} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <Layout currentView={currentView} onNavigate={handleNavigate}>
      {currentView === 'home' && (
        <PlayList onPlaySelect={handlePlaySelect} />
      )}

      {currentView === 'booking' && selectedPlayId && (
        <BookingFlow
          playId={selectedPlayId}
          onBack={() => handleNavigate('home')}
        />
      )}

      {currentView === 'signin' && (
        <SignIn
          onSuccess={() => handleNavigate('home')}
          onSwitchToSignUp={() => handleNavigate('signup')}
        />
      )}

      {currentView === 'signup' && (
        <SignUp
          onSuccess={() => handleNavigate('home')}
          onSwitchToSignIn={() => handleNavigate('signin')}
        />
      )}

      {currentView === 'my-bookings' && (
        <MyBookings />
      )}

      {currentView === 'box-office' && (isAdmin || isSalesPerson) && (
        <BoxOffice />
      )}

      {currentView === 'admin' && isAdmin && (
        <AdminDashboard />
      )}

      {currentView === 'reports' && isAdmin && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Reports & Analytics</h1>
          <p className="text-slate-600">Sales reports and analytics will appear here.</p>
        </div>
      )}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
