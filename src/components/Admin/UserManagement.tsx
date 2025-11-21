import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { UserProfile } from '../../lib/supabase';
import { Loader, Shield } from 'lucide-react';

export function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setUsers(data);
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('id', userId);

    loadUsers();
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    await supabase
      .from('user_profiles')
      .update({ is_active: !isActive })
      .eq('id', userId);

    loadUsers();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <Shield className="w-4 h-4" />
          <span>Total Users: {users.length}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Phone</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Role</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Joined</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-900">{user.full_name}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{user.email}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{user.phone || '-'}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="text-sm border border-slate-300 rounded px-2 py-1"
                  >
                    <option value="customer">Customer</option>
                    <option value="sales_person">Sales Person</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleActive(user.id, user.is_active)}
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleToggleActive(user.id, user.is_active)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
