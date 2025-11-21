import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Play } from '../../types/database';
import { Plus, Edit, Trash2, Loader } from 'lucide-react';

export function PlayManagement() {
  const [plays, setPlays] = useState<Play[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlay, setEditingPlay] = useState<Play | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    genre: '',
    duration_minutes: 120,
    age_rating: 'G',
    director_name: '',
    language: 'English',
    poster_url: '',
    is_featured: false,
  });

  useEffect(() => {
    loadPlays();
  }, []);

  const loadPlays = async () => {
    const { data } = await supabase
      .from('plays')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setPlays(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPlay) {
      await supabase
        .from('plays')
        .update(formData)
        .eq('id', editingPlay.id);
    } else {
      await supabase.from('plays').insert(formData);
    }

    resetForm();
    loadPlays();
  };

  const handleEdit = (play: Play) => {
    setEditingPlay(play);
    setFormData({
      title: play.title,
      subtitle: play.subtitle || '',
      description: play.description,
      genre: play.genre,
      duration_minutes: play.duration_minutes,
      age_rating: play.age_rating,
      director_name: play.director_name || '',
      language: play.language,
      poster_url: play.poster_url || '',
      is_featured: play.is_featured,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this play?')) {
      await supabase.from('plays').update({ is_active: false }).eq('id', id);
      loadPlays();
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      genre: '',
      duration_minutes: 120,
      age_rating: 'G',
      director_name: '',
      language: 'English',
      poster_url: '',
      is_featured: false,
    });
    setEditingPlay(null);
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Play Management</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Play</span>
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 p-6 bg-slate-50 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {editingPlay ? 'Edit Play' : 'Add New Play'}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subtitle</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Genre</label>
                <input
                  type="text"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  placeholder="Drama, Comedy, Musical..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Age Rating</label>
                <select
                  value={formData.age_rating}
                  onChange={(e) => setFormData({ ...formData, age_rating: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                >
                  <option value="G">G</option>
                  <option value="PG">PG</option>
                  <option value="PG-13">PG-13</option>
                  <option value="R">R</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Director</label>
                <input
                  type="text"
                  value={formData.director_name}
                  onChange={(e) => setFormData({ ...formData, director_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Language</label>
                <input
                  type="text"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Poster URL</label>
                <input
                  type="url"
                  value={formData.poster_url}
                  onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_featured"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="is_featured" className="text-sm font-medium text-slate-700">
                Featured Play
              </label>
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingPlay ? 'Update Play' : 'Create Play'}
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

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Title</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Genre</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Duration</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Rating</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {plays.map((play) => (
                <tr key={play.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{play.title}</p>
                      {play.subtitle && <p className="text-sm text-slate-600">{play.subtitle}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{play.genre}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{play.duration_minutes} min</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{play.age_rating}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        play.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {play.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {play.is_featured && (
                      <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                        Featured
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEdit(play)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(play.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
