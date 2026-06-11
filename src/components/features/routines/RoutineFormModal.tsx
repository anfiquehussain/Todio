import React, { useState, useEffect } from 'react';
import { 
  Activity, BookOpen, Coffee, Dumbbell, GlassWater, Heart, Smile, Compass, Code, Camera, Laptop, Music 
} from 'lucide-react';
import { useAppSelector } from '../../../hooks/useRedux';
import type { Routine, RecurrenceType } from '../../../types';
import { Modal } from '../../patterns/Modal';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';

interface RoutineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (routine: Routine) => void;
  editingRoutine?: Routine | null;
}

const AVAILABLE_ICONS = [
  { name: 'GlassWater', Icon: GlassWater },
  { name: 'Dumbbell', Icon: Dumbbell },
  { name: 'BookOpen', Icon: BookOpen },
  { name: 'Activity', Icon: Activity },
  { name: 'Coffee', Icon: Coffee },
  { name: 'Heart', Icon: Heart },
  { name: 'Smile', Icon: Smile },
  { name: 'Compass', Icon: Compass },
  { name: 'Code', Icon: Code },
  { name: 'Camera', Icon: Camera },
  { name: 'Laptop', Icon: Laptop },
  { name: 'Music', Icon: Music },
];

const AVAILABLE_COLORS = [
  { name: 'indigo', value: '#6366f1' }, // brand-primary
  { name: 'cyan', value: '#06b6d4' },   // brand-secondary
  { name: 'purple', value: '#8b5cf6' }, // brand-accent
  { name: 'emerald', value: '#10b981' }, // success
  { name: 'amber', value: '#f59e0b' },   // warning
  { name: 'rose', value: '#f43f5e' },    // error variant
];

export const RoutineFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingRoutine,
}: RoutineFormModalProps) => {
  const { user } = useAppSelector((state) => state.auth);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('GlassWater');
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('daily');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [customIntervalDays, setCustomIntervalDays] = useState<number>(1);
  const [startDate, setStartDate] = useState('');
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState('');

  // Hydrate form fields on open/edit change
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (editingRoutine) {
      setTitle(editingRoutine.title || '');
      setDescription(editingRoutine.description || '');
      setSelectedIcon(editingRoutine.icon || 'GlassWater');
      setSelectedColor(editingRoutine.color || '#6366f1');
      setRecurrenceType(editingRoutine.recurrenceType || 'daily');
      setRecurrenceDays(editingRoutine.recurrenceDays || []);
      setCustomIntervalDays(editingRoutine.customIntervalDays || 1);
      setStartDate(editingRoutine.startDate || '');
      setHasEndDate(!!editingRoutine.endDate);
      setEndDate(editingRoutine.endDate || '');
    } else {
      setTitle('');
      setDescription('');
      setSelectedIcon('GlassWater');
      setSelectedColor('#6366f1');
      setRecurrenceType('daily');
      setRecurrenceDays([]);
      setCustomIntervalDays(1);
      setStartDate(new Date().toISOString().split('T')[0]);
      setHasEndDate(false);
      setEndDate('');
    }
  }, [editingRoutine, isOpen]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleDayOfWeekToggle = (dayIndex: number) => {
    setRecurrenceDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex) 
        : [...prev, dayIndex]
    );
  };

  const handleDayOfMonthToggle = (dayNumber: number) => {
    setRecurrenceDays(prev => 
      prev.includes(dayNumber) 
        ? prev.filter(d => d !== dayNumber) 
        : [...prev, dayNumber]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    // Validate recurrence fields
    let finalRecurrenceDays = recurrenceDays;
    let finalCustomInterval: number | null = null;

    if (recurrenceType === 'weekly') {
      if (recurrenceDays.length === 0) {
        // Default to all days if none selected
        finalRecurrenceDays = [0, 1, 2, 3, 4, 5, 6];
      }
    } else if (recurrenceType === 'monthly') {
      if (recurrenceDays.length === 0) {
        // Default to 1st of month if none selected
        finalRecurrenceDays = [1];
      }
    } else if (recurrenceType === 'custom') {
      finalRecurrenceDays = [];
      finalCustomInterval = customIntervalDays > 0 ? customIntervalDays : 1;
    } else {
      finalRecurrenceDays = [];
    }

    const routine: Routine = {
      id: editingRoutine?.id || `routine-${Date.now()}`,
      userId: user.uid,
      title: title.trim(),
      description: description.trim(),
      icon: selectedIcon,
      color: selectedColor,
      recurrenceType,
      recurrenceDays: finalRecurrenceDays,
      customIntervalDays: finalCustomInterval,
      startDate,
      endDate: hasEndDate && endDate ? endDate : null,
      currentStreak: editingRoutine?.currentStreak || 0,
      bestStreak: editingRoutine?.bestStreak || 0,
      archived: editingRoutine?.archived || false,
      createdAt: editingRoutine?.createdAt || new Date().toISOString()
    };

    onSubmit(routine);
    onClose();
  };

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingRoutine ? 'Modify Routine Cockpit' : 'Draft New Routine'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2 font-sans pb-2">
        <Input
          label="Routine Title"
          type="text"
          placeholder="e.g. Morning Meditation 🧘"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoComplete="off"
        />

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-xs font-semibold text-text-secondary select-none">
            Routine Notes / Context
          </label>
          <textarea
            placeholder="What needs to be done, motivations, or targets..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full min-h-[80px] px-4 py-3 rounded-2xl border border-gray-border bg-bg-secondary text-text-primary text-sm transition-all placeholder:text-text-secondary/40 focus:outline-hidden focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50"
          />
        </div>

        {/* Recurrence Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary select-none">
            Frequency Pattern
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['daily', 'weekly', 'monthly', 'custom'] as RecurrenceType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setRecurrenceType(type);
                  setRecurrenceDays([]);
                }}
                className={`py-2 px-1 text-xs font-bold rounded-xl capitalize transition-all cursor-pointer ${
                  recurrenceType === type
                    ? 'bg-brand-primary text-white shadow-md'
                    : 'bg-card text-text-secondary hover:text-text-primary border border-gray-border/50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Conditional Recurrence Settings */}
        {recurrenceType === 'weekly' && (
          <div className="flex flex-col gap-1.5 animate-fade-in">
            <label className="text-xs font-semibold text-text-secondary select-none">
              Repeat On
            </label>
            <div className="flex justify-between items-center gap-1.5">
              {weekdays.map((label, index) => {
                const isSelected = recurrenceDays.includes(index);
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDayOfWeekToggle(index)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-brand-primary text-white ring-2 ring-brand-primary/30'
                        : 'bg-card text-text-secondary hover:text-text-primary border border-gray-border/50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {recurrenceType === 'monthly' && (
          <div className="flex flex-col gap-1.5 animate-fade-in">
            <label className="text-xs font-semibold text-text-secondary select-none">
              Day of Month
            </label>
            <div className="grid grid-cols-7 gap-1 max-h-[120px] overflow-y-auto pr-1 border border-gray-border/30 rounded-xl p-2 bg-card/20">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const isSelected = recurrenceDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayOfMonthToggle(day)}
                    className={`h-7 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-brand-primary text-white'
                        : 'bg-card text-text-secondary hover:text-text-primary border border-gray-border/30'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {recurrenceType === 'custom' && (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="flex-1">
              <Input
                label="Repeat Interval (Days)"
                type="number"
                min={1}
                value={customIntervalDays}
                onChange={(e) => setCustomIntervalDays(Math.max(1, Number(e.target.value)))}
              />
            </div>
            <div className="text-xs font-semibold text-text-secondary/70 pt-5">
              {`Every ${customIntervalDays} ${customIntervalDays === 1 ? 'day' : 'days'}`}
            </div>
          </div>
        )}

        {/* Icon Picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary select-none">
            Visual Icon Ident
          </label>
          <div className="grid grid-cols-6 gap-2 border border-gray-border/30 rounded-2xl p-3 bg-card/20">
            {AVAILABLE_ICONS.map(({ name, Icon }) => {
              const isSelected = selectedIcon === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedIcon(name)}
                  className={`aspect-square flex items-center justify-center rounded-xl transition-all cursor-pointer hover:bg-white/5 ${
                    isSelected
                      ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary'
                      : 'text-text-secondary hover:text-text-primary border border-gray-border/20'
                  }`}
                  title={name}
                  aria-label={`Select ${name} icon`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary select-none">
            Routine Theme Color
          </label>
          <div className="flex gap-3 border border-gray-border/30 rounded-2xl p-3.5 bg-card/20 justify-around">
            {AVAILABLE_COLORS.map(({ name, value }) => {
              const isSelected = selectedColor === value;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedColor(value)}
                  className={`w-7.5 h-7.5 rounded-full transition-all cursor-pointer border border-black/30 hover:scale-110 ${
                    isSelected
                      ? 'ring-3 ring-offset-2 ring-offset-bg-secondary ring-brand-primary scale-105'
                      : ''
                  }`}
                  style={{ backgroundColor: value }}
                  title={name}
                  aria-label={`Select ${name} color`}
                />
              );
            })}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Schedule Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between select-none">
              <label className="text-xs font-semibold text-text-secondary">
                Limit End Date?
              </label>
              <input
                type="checkbox"
                checked={hasEndDate}
                onChange={(e) => setHasEndDate(e.target.checked)}
                className="w-3.5 h-3.5 accent-brand-primary cursor-pointer"
                id="limit-end-date"
              />
            </div>
            {hasEndDate ? (
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required={hasEndDate}
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-border bg-bg-secondary text-text-primary text-sm focus:outline-hidden focus:border-brand-primary"
              />
            ) : (
              <div className="h-[46px] flex items-center justify-center rounded-2xl border border-dashed border-gray-border/50 text-[11px] text-text-secondary/50 select-none">
                Indefinite Loop ∞
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 mt-4 border-t border-gray-border/50 pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Discard
          </Button>
          <Button type="submit" variant="primary" size="md">
            {editingRoutine ? 'Save Modifications' : 'Create Routine'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
