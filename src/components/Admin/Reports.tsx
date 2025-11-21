import { useState } from 'react';
import { FileText, Download, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function Reports() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const downloadReport = async (reportType: 'previous' | 'upcoming') => {
    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-plays-report`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType === 'previous' ? 'Previous' : 'Upcoming'}_Plays_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Error downloading report:', err);
      setError(err.message || 'Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-3 mb-6">
        <FileText className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-slate-900">Reports</h2>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-slate-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Previous Plays Report</h3>
              <p className="text-sm text-slate-600">
                Download a comprehensive report of all past performances including ticket sales and revenue data.
              </p>
            </div>
          </div>
          <ul className="text-sm text-slate-600 space-y-2 mb-6">
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              <span>Performance dates and times</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              <span>Total tickets sold per performance</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              <span>Revenue generated per performance</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              <span>Total summary with aggregated statistics</span>
            </li>
          </ul>
          <button
            onClick={() => downloadReport('previous')}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Download Report</span>
              </>
            )}
          </button>
        </div>

        <div className="border border-slate-200 rounded-lg p-6 hover:border-green-300 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Upcoming Plays Report</h3>
              <p className="text-sm text-slate-600">
                Download a report of all scheduled performances with available tickets and occupancy rates.
              </p>
            </div>
          </div>
          <ul className="text-sm text-slate-600 space-y-2 mb-6">
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
              <span>Scheduled performance dates and times</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
              <span>Available tickets per performance</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
              <span>Current occupancy percentages</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
              <span>Ticket pricing information</span>
            </li>
          </ul>
          <button
            onClick={() => downloadReport('upcoming')}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Download Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="font-semibold text-blue-900 mb-2">About These Reports</h4>
        <p className="text-sm text-blue-800">
          All reports are generated in PDF format and include detailed information about performances, ticket sales, and venue data.
          Reports are generated in real-time based on the current database state.
        </p>
      </div>
    </div>
  );
}
