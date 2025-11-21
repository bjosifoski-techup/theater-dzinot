import { Play } from '../../types/database';
import { Clock, Calendar, Star } from 'lucide-react';

interface PlayCardProps {
  play: Play;
  onClick: () => void;
}

export function PlayCard({ play, onClick }: PlayCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
    >
      <div className="relative h-64 bg-slate-200">
        {play.poster_url ? (
          <img
            src={play.poster_url}
            alt={play.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Star className="w-16 h-16 text-slate-400" />
          </div>
        )}
        {play.is_featured && (
          <div className="absolute top-3 right-3 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold">
            FEATURED
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2">
          {play.title}
        </h3>
        {play.subtitle && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-1">{play.subtitle}</p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {play.genre}
          </span>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
            {play.age_rating}
          </span>
        </div>

        <p className="text-sm text-slate-600 mb-4 line-clamp-3">
          {play.description}
        </p>

        <div className="flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{play.duration_minutes} min</span>
          </div>
          {play.director_name && (
            <div className="text-xs">
              Dir: {play.director_name}
            </div>
          )}
        </div>

        <button className="w-full mt-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors">
          View Details & Book
        </button>
      </div>
    </div>
  );
}
