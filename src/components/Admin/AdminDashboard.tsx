import { useState } from 'react';
import { PlayManagement } from './PlayManagement';
import { VenueManagement } from './VenueManagement';
import { UserManagement } from './UserManagement';
import { StaffInvitation } from './StaffInvitation';
import { Reports } from './Reports';
import { Settings as SettingsIcon, Users, Building, Film, UserPlus, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AdminDashboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'plays' | 'venues' | 'users' | 'invitations' | 'reports'>('plays');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Admin Dashboard</h1>

        <div className="flex space-x-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('plays')}
            className={`flex items-center space-x-2 px-4 py-3 font-medium transition-colors ${
              activeTab === 'plays'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Film className="w-5 h-5" />
            <span>Plays & Performances</span>
          </button>
          <button
            onClick={() => setActiveTab('venues')}
            className={`flex items-center space-x-2 px-4 py-3 font-medium transition-colors ${
              activeTab === 'venues'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-5 h-5" />
            <span>Venues & Seating</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-2 px-4 py-3 font-medium transition-colors ${
              activeTab === 'users'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>{t('admin.userManagement')}</span>
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`flex items-center space-x-2 px-4 py-3 font-medium transition-colors ${
              activeTab === 'invitations'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-5 h-5" />
            <span>{t('admin.inviteStaff')}</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center space-x-2 px-4 py-3 font-medium transition-colors ${
              activeTab === 'reports'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Reports</span>
          </button>
        </div>
      </div>

      {activeTab === 'plays' && <PlayManagement />}
      {activeTab === 'venues' && <VenueManagement />}
      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'invitations' && <StaffInvitation />}
      {activeTab === 'reports' && <Reports />}
    </div>
  );
}
