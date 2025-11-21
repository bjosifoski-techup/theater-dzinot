import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus, Mail, Clock, XCircle, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
  invited_by: string;
}

export function StaffInvitation() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    role: 'sales_person',
  });

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    const { data } = await supabase
      .from('staff_invitations')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setInvitations(data);
    setLoading(false);
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMessage(null);

    try {
      const { data: tokenData, error: tokenError } = await supabase.rpc('generate_invitation_token');

      if (tokenError) throw tokenError;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error: invError } = await supabase
        .from('staff_invitations')
        .insert({
          email: formData.email,
          role: formData.role,
          token: tokenData,
          invited_by: profile?.id,
          expires_at: expiresAt.toISOString(),
        });

      if (invError) throw invError;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invitation-email`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: formData.email,
          role: formData.role,
          token: tokenData,
          inviterName: profile?.full_name || 'Theater Administrator',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send invitation email');
      }

      setMessage({ type: 'success', text: t('admin.invitationSent') });
      setFormData({ email: '', role: 'sales_person' });
      setShowForm(false);
      loadInvitations();
    } catch (error) {
      console.error('Error sending invitation:', error);
      setMessage({ type: 'error', text: t('admin.invitationError') });
    } finally {
      setSending(false);
    }
  };

  const handleCancelInvitation = async (id: string) => {
    if (confirm('Are you sure you want to cancel this invitation?')) {
      await supabase
        .from('staff_invitations')
        .update({ status: 'cancelled' })
        .eq('id', id);
      loadInvitations();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">{t('admin.inviteStaff')}</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            <span>{t('admin.inviteSalesPerson')}</span>
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-md flex items-start space-x-2 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {message.text}
            </p>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSendInvitation} className="mb-8 p-6 bg-slate-50 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {t('admin.sendInvitation')}
            </h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('admin.email')}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('admin.role')}
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              >
                <option value="sales_person">{t('admin.salesPerson')}</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? t('common.loading') : t('admin.sendInvitation')}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400"
              >
                {t('admin.cancel')}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('admin.pendingInvitations')}</h3>

          {invitations.filter(inv => inv.status === 'pending').length === 0 ? (
            <p className="text-slate-600 text-center py-8">No pending invitations</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      {t('admin.email')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      {t('admin.role')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      {t('admin.status')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      {t('admin.expiresAt')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                      {t('admin.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invitations.map((invitation) => (
                    <tr key={invitation.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-900">{invitation.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {invitation.role === 'sales_person' ? t('admin.salesPerson') : 'Administrator'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          invitation.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          invitation.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {invitation.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(invitation.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {invitation.status === 'pending' && (
                          <button
                            onClick={() => handleCancelInvitation(invitation.id)}
                            className="text-red-600 hover:text-red-800"
                            title={t('admin.cancelInvitation')}
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
