import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Plus, Edit2, Trash2, Loader, Save } from 'lucide-react';

interface Seat {
  id: string;
  row_label: string;
  seat_number: string;
  section_id: string | null;
  is_wheelchair_accessible: boolean;
  is_companion_seat: boolean;
  is_restricted_view: boolean;
  is_available: boolean;
  notes: string | null;
}

interface SeatSection {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
}

interface SeatManagementProps {
  venueId: string;
  venueName: string;
  onClose: () => void;
}

export function SeatManagement({ venueId, venueName, onClose }: SeatManagementProps) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [sections, setSections] = useState<SeatSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [showAddSeat, setShowAddSeat] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null);

  const [seatForm, setSeatForm] = useState({
    row_label: '',
    seat_number: '',
    section_id: '',
    is_wheelchair_accessible: false,
    is_companion_seat: false,
    is_restricted_view: false,
    is_available: true,
    notes: '',
  });

  const [sectionForm, setSectionForm] = useState({
    name: '',
    description: '',
    display_order: 0,
  });

  useEffect(() => {
    loadData();
  }, [venueId]);

  const loadData = async () => {
    setLoading(true);

    const [seatsResult, sectionsResult] = await Promise.all([
      supabase
        .from('seats')
        .select('*')
        .eq('venue_id', venueId)
        .order('row_label')
        .order('seat_number'),
      supabase
        .from('seat_sections')
        .select('*')
        .eq('venue_id', venueId)
        .order('display_order')
    ]);

    if (seatsResult.data) setSeats(seatsResult.data);
    if (sectionsResult.data) setSections(sectionsResult.data);

    setLoading(false);
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('seat_sections').insert({
      venue_id: venueId,
      ...sectionForm,
    });

    if (!error) {
      setSectionForm({ name: '', description: '', display_order: 0 });
      setShowAddSection(false);
      loadData();
    }
  };

  const handleSaveSeat = async (e: React.FormEvent) => {
    e.preventDefault();

    const seatData = {
      ...seatForm,
      venue_id: venueId,
      section_id: seatForm.section_id || null,
    };

    if (editingSeat) {
      await supabase
        .from('seats')
        .update(seatData)
        .eq('id', editingSeat.id);
    } else {
      await supabase.from('seats').insert(seatData);
    }

    resetSeatForm();
    loadData();
  };

  const handleDeleteSeat = async (seatId: string) => {
    if (confirm('Are you sure you want to delete this seat?')) {
      await supabase.from('seats').delete().eq('id', seatId);
      loadData();
    }
  };

  const handleEditSeat = (seat: Seat) => {
    setEditingSeat(seat);
    setSeatForm({
      row_label: seat.row_label,
      seat_number: seat.seat_number,
      section_id: seat.section_id || '',
      is_wheelchair_accessible: seat.is_wheelchair_accessible,
      is_companion_seat: seat.is_companion_seat,
      is_restricted_view: seat.is_restricted_view,
      is_available: seat.is_available,
      notes: seat.notes || '',
    });
    setShowAddSeat(true);
  };

  const resetSeatForm = () => {
    setSeatForm({
      row_label: '',
      seat_number: '',
      section_id: '',
      is_wheelchair_accessible: false,
      is_companion_seat: false,
      is_restricted_view: false,
      is_available: true,
      notes: '',
    });
    setEditingSeat(null);
    setShowAddSeat(false);
  };

  const getSectionName = (sectionId: string | null) => {
    if (!sectionId) return 'No Section';
    return sections.find(s => s.id === sectionId)?.name || 'Unknown';
  };

  const filteredSeats = selectedSection === 'all'
    ? seats
    : seats.filter(s => s.section_id === selectedSection || (selectedSection === 'none' && !s.section_id));

  const groupedSeats = filteredSeats.reduce((acc, seat) => {
    const key = seat.row_label;
    if (!acc[key]) acc[key] = [];
    acc[key].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Manage Seats</h2>
            <p className="text-sm text-slate-600">{venueName} - {seats.length} total seats</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-md"
              >
                <option value="all">All Sections</option>
                <option value="none">No Section</option>
                {sections.map(section => (
                  <option key={section.id} value={section.id}>{section.name}</option>
                ))}
              </select>

              <button
                onClick={() => setShowAddSection(!showAddSection)}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add Section</span>
              </button>

              <button
                onClick={() => setShowAddSeat(!showAddSeat)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add Seat</span>
              </button>
            </div>
          </div>

          {showAddSection && (
            <form onSubmit={handleAddSection} className="mb-6 p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold mb-4">Add New Section</h3>
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Section Name"
                  value={sectionForm.name}
                  onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                  required
                  className="px-3 py-2 border border-slate-300 rounded-md"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={sectionForm.description}
                  onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-md"
                />
                <input
                  type="number"
                  placeholder="Display Order"
                  value={sectionForm.display_order}
                  onChange={(e) => setSectionForm({ ...sectionForm, display_order: parseInt(e.target.value) })}
                  className="px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>
              <div className="flex space-x-2 mt-4">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Save Section
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSection(false)}
                  className="px-4 py-2 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {showAddSeat && (
            <form onSubmit={handleSaveSeat} className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-4">{editingSeat ? 'Edit Seat' : 'Add New Seat'}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Row (e.g., A, 1)"
                  value={seatForm.row_label}
                  onChange={(e) => setSeatForm({ ...seatForm, row_label: e.target.value })}
                  required
                  className="px-3 py-2 border border-slate-300 rounded-md"
                />
                <input
                  type="text"
                  placeholder="Seat Number"
                  value={seatForm.seat_number}
                  onChange={(e) => setSeatForm({ ...seatForm, seat_number: e.target.value })}
                  required
                  className="px-3 py-2 border border-slate-300 rounded-md"
                />
                <select
                  value={seatForm.section_id}
                  onChange={(e) => setSeatForm({ ...seatForm, section_id: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-md"
                >
                  <option value="">No Section</option>
                  {sections.map(section => (
                    <option key={section.id} value={section.id}>{section.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Notes"
                  value={seatForm.notes}
                  onChange={(e) => setSeatForm({ ...seatForm, notes: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={seatForm.is_wheelchair_accessible}
                    onChange={(e) => setSeatForm({ ...seatForm, is_wheelchair_accessible: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Wheelchair Accessible</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={seatForm.is_companion_seat}
                    onChange={(e) => setSeatForm({ ...seatForm, is_companion_seat: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Companion Seat</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={seatForm.is_restricted_view}
                    onChange={(e) => setSeatForm({ ...seatForm, is_restricted_view: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Restricted View</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={seatForm.is_available}
                    onChange={(e) => setSeatForm({ ...seatForm, is_available: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Available</span>
                </label>
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  <Save className="w-4 h-4" />
                  <span>{editingSeat ? 'Update' : 'Save'} Seat</span>
                </button>
                <button
                  type="button"
                  onClick={resetSeatForm}
                  className="px-4 py-2 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {Object.entries(groupedSeats).map(([row, rowSeats]) => (
              <div key={row} className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-3">Row {row}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {rowSeats.map(seat => (
                    <div
                      key={seat.id}
                      className={`p-3 border rounded-lg text-sm ${
                        !seat.is_available
                          ? 'bg-slate-100 border-slate-300'
                          : seat.is_wheelchair_accessible
                          ? 'bg-blue-50 border-blue-300'
                          : seat.is_restricted_view
                          ? 'bg-yellow-50 border-yellow-300'
                          : 'bg-white border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-900">
                          {row}{seat.seat_number}
                        </span>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditSeat(seat)}
                            className="p-1 hover:bg-slate-200 rounded"
                          >
                            <Edit2 className="w-3 h-3 text-slate-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteSeat(seat.id)}
                            className="p-1 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-slate-600">
                        {getSectionName(seat.section_id)}
                      </div>
                      {seat.notes && (
                        <div className="text-xs text-slate-500 mt-1">{seat.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {Object.keys(groupedSeats).length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-600">No seats found for this section.</p>
              <button
                onClick={() => setShowAddSeat(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Your First Seat
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
