import { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Wallet, Dumbbell, Heart, BookOpen, Code, Coffee, Briefcase, Car,
  Plus, X, GripVertical, ChevronDown
} from 'lucide-react';
import { useAppSelector } from '../../../hooks/useRedux';
import type { Tracker, TrackerField, TrackerFieldType, TrackerCategory } from '../../../types';
import { Modal } from '../../patterns/Modal';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';

interface TrackerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tracker: Tracker) => void;
  editingTracker?: Tracker | null;
}

const AVAILABLE_ICONS = [
  { name: 'BarChart3', Icon: BarChart3 },
  { name: 'TrendingUp', Icon: TrendingUp },
  { name: 'Wallet', Icon: Wallet },
  { name: 'Dumbbell', Icon: Dumbbell },
  { name: 'Heart', Icon: Heart },
  { name: 'BookOpen', Icon: BookOpen },
  { name: 'Code', Icon: Code },
  { name: 'Coffee', Icon: Coffee },
  { name: 'Briefcase', Icon: Briefcase },
  { name: 'Car', Icon: Car },
];

const AVAILABLE_COLORS = [
  { name: 'gold', value: '#c2883c' },
  { name: 'indigo', value: '#6366f1' },
  { name: 'cyan', value: '#06b6d4' },
  { name: 'purple', value: '#8b5cf6' },
  { name: 'emerald', value: '#10b981' },
  { name: 'amber', value: '#f59e0b' },
  { name: 'rose', value: '#f43f5e' },
  { name: 'sky', value: '#0ea5e9' },
];

const CATEGORIES: { value: TrackerCategory; label: string; emoji: string }[] = [
  { value: 'finance', label: 'Finance', emoji: '💰' },
  { value: 'health', label: 'Health & Fitness', emoji: '💪' },
  { value: 'productivity', label: 'Productivity', emoji: '🎯' },
  { value: 'work', label: 'Work', emoji: '💼' },
  { value: 'lifestyle', label: 'Lifestyle', emoji: '🌿' },
  { value: 'custom', label: 'Custom', emoji: '⚙️' },
];

const FIELD_TYPES: { value: TrackerFieldType; label: string; desc: string }[] = [
  { value: 'number', label: 'Number', desc: 'Numeric values (amount, weight, etc.)' },
  { value: 'text', label: 'Text', desc: 'Free text input' },
  { value: 'date', label: 'Date', desc: 'Date picker' },
  { value: 'time', label: 'Time', desc: 'Time picker' },
  { value: 'boolean', label: 'Yes / No', desc: 'Toggle switch' },
  { value: 'select', label: 'Selection', desc: 'Choose from predefined options' },
];

export const TrackerFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingTracker,
}: TrackerFormModalProps) => {
  const { user } = useAppSelector((state) => state.auth);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('BarChart3');
  const [selectedColor, setSelectedColor] = useState('#c2883c');
  const [category, setCategory] = useState<TrackerCategory>('custom');
  const [fields, setFields] = useState<TrackerField[]>([]);
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Hydrate form fields on open/edit change
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (editingTracker) {
      setName(editingTracker.name || '');
      setDescription(editingTracker.description || '');
      setSelectedIcon(editingTracker.icon || 'BarChart3');
      setSelectedColor(editingTracker.color || '#c2883c');
      setCategory(editingTracker.category || 'custom');
      setFields(editingTracker.fields || []);
    } else {
      setName('');
      setDescription('');
      setSelectedIcon('BarChart3');
      setSelectedColor('#c2883c');
      setCategory('custom');
      setFields([]);
    }
    setShowIconPicker(false);
  }, [isOpen, editingTracker]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Field management
  const addField = () => {
    const newField: TrackerField = {
      id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: '',
      type: 'number',
      unit: '',
      options: [],
      required: false,
      order: fields.length,
    };
    setFields(prev => [...prev, newField]);
  };

  const updateField = (fieldId: string, updates: Partial<TrackerField>) => {
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, ...updates } : f));
  };

  const removeField = (fieldId: string) => {
    setFields(prev => prev.filter(f => f.id !== fieldId).map((f, i) => ({ ...f, order: i })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;

    // Validate that at least one field exists
    const validFields = fields.filter(f => f.name.trim());
    if (validFields.length === 0) return;

    const trackerData: Tracker = {
      id: editingTracker?.id || `tracker-${Date.now()}`,
      userId: user.uid,
      name: name.trim(),
      description: description.trim(),
      icon: selectedIcon,
      color: selectedColor,
      category,
      fields: validFields.map((f, i) => ({ ...f, name: f.name.trim(), order: i })),
      reminders: editingTracker?.reminders || [],
      archived: editingTracker?.archived || false,
      createdAt: editingTracker?.createdAt || new Date().toISOString(),
    };

    onSubmit(trackerData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTracker ? 'Edit Tracker' : 'Create Tracker'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Name & Description */}
        <div className="flex flex-col gap-4">
          <Input
            label="Tracker Name"
            placeholder="e.g., Expense Tracker, Gym Progress…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            autoComplete="off"
            name="tracker-name"
          />
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-semibold text-text-secondary select-none">
              Description (optional)
            </label>
            <textarea
              placeholder="What will you track…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-2xl border border-gray-border bg-bg-secondary text-text-primary text-sm transition-colors placeholder:text-text-secondary/40 focus:outline-hidden focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 resize-none"
              autoComplete="off"
              name="tracker-description"
            />
          </div>
        </div>

        {/* Category Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary select-none">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  category === cat.value
                    ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/30 shadow-sm'
                    : 'bg-bg-primary/50 text-text-secondary border-gray-border/30 hover:border-gray-border hover:text-text-primary'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Icon & Color Row */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Icon Picker */}
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-semibold text-text-secondary select-none">Icon</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-border bg-bg-secondary text-text-primary text-sm w-full cursor-pointer hover:border-brand-primary/40 transition-colors"
              >
                <span style={{ color: selectedColor }}>
                  {(() => {
                    const Found = AVAILABLE_ICONS.find(i => i.name === selectedIcon);
                    return Found ? <Found.Icon className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />;
                  })()}
                </span>
                <span className="flex-1 text-left font-semibold">{selectedIcon}</span>
                <ChevronDown className="w-4 h-4 text-text-secondary" />
              </button>

              {showIconPicker && (
                <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-bg-secondary border border-gray-border rounded-xl shadow-xl z-20 grid grid-cols-5 gap-1.5">
                  {AVAILABLE_ICONS.map(({ name: iconName, Icon }) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => {
                        setSelectedIcon(iconName);
                        setShowIconPicker(false);
                      }}
                      className={`p-2.5 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                        selectedIcon === iconName
                          ? 'bg-brand-primary/15 text-brand-primary ring-1 ring-brand-primary/30'
                          : 'text-text-secondary hover:bg-bg-primary hover:text-text-primary'
                      }`}
                      title={iconName}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Color Picker */}
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-semibold text-text-secondary select-none">Color</label>
            <div className="flex items-center gap-2 flex-wrap px-1 py-2">
              {AVAILABLE_COLORS.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-8 h-8 rounded-full cursor-pointer transition-all hover:scale-110 active:scale-95 ${
                    selectedColor === color.value
                      ? 'ring-2 ring-offset-2 ring-offset-bg-secondary scale-110'
                      : ''
                  }`}
                  style={{
                    backgroundColor: color.value,
                  }}
                  title={color.name}
                  aria-label={`Select ${color.name} color`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Field Builder */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-text-secondary select-none">
              Custom Fields
            </label>
            <button
              type="button"
              onClick={addField}
              className="flex items-center gap-1 text-[11px] font-bold text-brand-primary hover:text-brand-primary/80 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Field</span>
            </button>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-gray-border/50 rounded-2xl">
              <p className="text-xs text-text-secondary/60 font-medium">
                No fields added yet. Click "Add Field" to define what data you want to track.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="flex flex-col gap-2 p-3 rounded-xl border border-gray-border/30 bg-bg-primary/30"
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-text-secondary/30 shrink-0" aria-hidden="true" />
                    <span className="text-[10px] font-bold text-text-secondary/50 w-5">
                      {idx + 1}
                    </span>

                    {/* Field name */}
                    <input
                      type="text"
                      placeholder="Field name…"
                      value={field.name}
                      onChange={(e) => updateField(field.id, { name: e.target.value })}
                      className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-border/40 bg-bg-secondary text-text-primary text-xs font-semibold placeholder:text-text-secondary/40 focus:outline-hidden focus:border-brand-primary transition-colors"
                      autoComplete="off"
                      name={`field-name-${idx}`}
                    />

                    {/* Field type */}
                    <select
                      value={field.type}
                      onChange={(e) => updateField(field.id, { type: e.target.value as TrackerFieldType })}
                      className="px-2.5 py-2 rounded-lg border border-gray-border/40 bg-bg-secondary text-text-primary text-xs font-semibold focus:outline-hidden focus:border-brand-primary cursor-pointer appearance-none transition-colors"
                    >
                      {FIELD_TYPES.map(ft => (
                        <option key={ft.value} value={ft.value}>{ft.label}</option>
                      ))}
                    </select>

                    {/* Remove field */}
                    <button
                      type="button"
                      onClick={() => removeField(field.id)}
                      className="p-1.5 text-text-secondary hover:text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer shrink-0"
                      aria-label={`Remove field ${field.name || idx + 1}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Extra config row based on field type */}
                  <div className="flex items-center gap-2 ml-9">
                    {(field.type === 'number') && (
                      <input
                        type="text"
                        placeholder="Unit (e.g., ₹, kg, min)…"
                        value={field.unit || ''}
                        onChange={(e) => updateField(field.id, { unit: e.target.value })}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-border/30 bg-bg-secondary text-text-primary text-[11px] placeholder:text-text-secondary/40 focus:outline-hidden focus:border-brand-primary w-40 transition-colors"
                        autoComplete="off"
                        name={`field-unit-${idx}`}
                      />
                    )}

                    {field.type === 'select' && (
                      <input
                        type="text"
                        placeholder="Options (comma separated)…"
                        value={(field.options || []).join(', ')}
                        onChange={(e) => updateField(field.id, {
                          options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        })}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-border/30 bg-bg-secondary text-text-primary text-[11px] placeholder:text-text-secondary/40 focus:outline-hidden focus:border-brand-primary transition-colors"
                        autoComplete="off"
                        name={`field-options-${idx}`}
                      />
                    )}

                    <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        className="w-3.5 h-3.5 rounded accent-brand-primary cursor-pointer"
                      />
                      <span className="text-[10px] font-semibold text-text-secondary select-none">Required</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 mt-2 border-t border-gray-border/30 pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!name.trim() || fields.filter(f => f.name.trim()).length === 0}
          >
            {editingTracker ? 'Save Changes' : 'Create Tracker'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
