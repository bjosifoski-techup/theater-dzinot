import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';

interface AcceptInvitationProps {
  token: string;
  onComplete: () => void;
}

interface InvitationData {
  email: string;
  role: string;
  invited_by_name: string;
  expires_at: string;
}

export function AcceptInvitation({ token, onComplete }: AcceptInvitationProps) {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    try {
      const { data, error: invError } = await supabase
        .from('staff_invitations')
        .select('email, role, invited_by:user_profiles!staff_invitations_invited_by_fkey(full_name), expires_at, status')
        .eq('token', token)
        .maybeSingle();

      if (invError) throw invError;

      if (!data) {
        setError('Invitation not found or has expired.');
        setLoading(false);
        return;
      }

      if (data.status !== 'pending') {
        setError('This invitation has already been used.');
        setLoading(false);
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired.');
        setLoading(false);
        return;
      }

      setInvitation({
        email: data.email,
        role: data.role,
        invited_by_name: data.invited_by?.full_name || 'Administrator',
        expires_at: data.expires_at,
      });
      setLoading(false);
    } catch (err) {
      console.error('Error validating invitation:', err);
      setError('Failed to validate invitation. Please try again.');
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation!.email,
        password,
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error('Failed to create user account.');
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: invitation!.email,
          full_name: fullName,
          phone: phone || null,
          role: invitation!.role,
        });

      if (profileError) throw profileError;

      const { error: updateError } = await supabase
        .from('staff_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('token', token);

      if (updateError) throw updateError;

      onComplete();
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Failed to accept invitation. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Invalid Invitation</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={onComplete}
            className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Accept Invitation</h1>
          <p className="text-slate-600">
            You've been invited by <strong>{invitation!.invited_by_name}</strong> to join as{' '}
            <strong className="text-blue-600">
              {invitation!.role === 'admin' ? 'Administrator' : 'Sales Person'}
            </strong>
          </p>
        </div>

        <form onSubmit={handleAcceptInvitation} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={invitation!.email}
              disabled
              className="w-full px-4 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone (Optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Minimum 8 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Re-enter password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={processing}
            className="w-full py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Creating Account...' : 'Accept Invitation & Create Account'}
          </button>
        </form>

        <p className="text-sm text-slate-500 text-center mt-6">
          By accepting this invitation, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
