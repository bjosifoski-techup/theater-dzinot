import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Play } from '../../types/database';
import { PlayCard } from './PlayCard';
import { Search, Filter, Loader } from 'lucide-react';

interface PlayListProps {
  onPlaySelect: (playId: string) => void;
}

export function PlayList({ onPlaySelect }: PlayListProps) {
  const [plays, setPlays] = useState<Play[]>([]);
  const [filteredPlays, setFilteredPlays] = useState<Play[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [genres, setGenres] = useState<string[]>([]);

  useEffect(() => {
    loadPlays();
  }, []);

  useEffect(() => {
    filterPlays();
  }, [plays, searchTerm, selectedGenre]);

  const loadPlays = async () => {
    const { data, error } = await supabase
      .from('plays')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPlays(data);
      const uniqueGenres = Array.from(new Set(data.map(p => p.genre)));
      setGenres(uniqueGenres);
    }
    setLoading(false);
  };

  const filterPlays = () => {
    let filtered = [...plays];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        play =>
          play.title.toLowerCase().includes(term) ||
          play.description.toLowerCase().includes(term) ||
          play.genre.toLowerCase().includes(term)
      );
    }

    if (selectedGenre !== 'all') {
      filtered = filtered.filter(play => play.genre === selectedGenre);
    }

    setFilteredPlays(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Browse Plays</h1>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search plays by title, description, or genre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="pl-10 pr-8 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-[200px]"
            >
              <option value="all">All Genres</option>
              {genres.map(genre => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-600">
          Showing {filteredPlays.length} {filteredPlays.length === 1 ? 'play' : 'plays'}
        </div>
      </div>

      {filteredPlays.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-500 text-lg">No plays found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlays.map(play => (
            <PlayCard
              key={play.id}
              play={play}
              onClick={() => onPlaySelect(play.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
