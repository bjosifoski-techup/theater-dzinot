import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Venue } from '../../types/database';
import { Plus, Edit, Loader } from 'lucide-react';

export function VenueManagement() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    capacity: 0,
  });

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    const { data } = await supabase
      .from('venues')
      .select('*')
      .order('name');

    if (data) setVenues(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingVenue) {
      await supabase
        .from('venues')
        .update(formData)
        .eq('id', editingVenue.id);
    } else {
      await supabase.from('venues').insert(formData);
    }

    resetForm();
    loadVenues();
  };

  const handleEdit = (venue: Venue) => {
    setEditingVenue(venue);
    setFormData({
      name: venue.name,
      description: venue.description || '',
      address: venue.address,
      capacity: venue.capacity,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      address: '',
      capacity: 0,
    });
    setEditingVenue(null);
    setShowForm(false);
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
        <h2 className="text-2xl font-bold text-slate-900">Venue Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Venue</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-slate-50 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {editingVenue ? 'Edit Venue' : 'Add New Venue'}
          </h3>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Venue Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Capacity</label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingVenue ? 'Update Venue' : 'Create Venue'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {venues.map((venue) => (
          <div key={venue.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">{venue.name}</h3>
                <p className="text-sm text-slate-600 mt-1">{venue.address}</p>
                {venue.description && (
                  <p className="text-sm text-slate-600 mt-2">{venue.description}</p>
                )}
                <div className="mt-2 flex items-center space-x-4 text-sm">
                  <span className="text-slate-600">Capacity: <span className="font-medium">{venue.capacity}</span></span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    venue.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {venue.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleEdit(venue)}
                className="text-blue-600 hover:text-blue-800"
              >
                <Edit className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
