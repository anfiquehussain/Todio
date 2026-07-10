import { useState, useRef } from 'react';
import { 
  Settings, User, Palette, CheckSquare, RefreshCw, Award, 
  Download, Upload, Check, Cloud, Flame, AlertCircle, Sun, Moon
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { setSoundEnabled, fetchAllTodoData, createTaskAsync } from '../store/slices/todoSlice';
import { 
  setShowListBadges, 
  setShowGlowBackdrops, 
  setDefaultTaskPriority, 
  setAutoArchiveCompleted, 
  setRoutineNotesPrompt,
  setAutoEscalatePriority,
  setFontFamily, 
  setFontSize,
  setTheme,
  setAccentTheme
} from '../store/slices/settingsSlice';
import { setAuthModalOpen } from '../store/slices/authSlice';
import { fetchAllRoutineData } from '../store/slices/routineSlice';
import { fetchAllTrackerData } from '../store/slices/trackerSlice';
import { playCompletionSound } from '../lib/sound';
import { useToast } from '../hooks/useToast';
import { PageHeader } from '../components/patterns/PageHeader';
import { SandboxPreview } from '../components/features/settings/SandboxPreview';
import type { SettingsFontFamily, SettingsFontSize, SettingsAccentTheme } from '../types';

type TabType = 'general' | 'sync' | 'appearance' | 'tasks' | 'routines' | 'gamification';

const FONTS: { id: SettingsFontFamily; name: string; description: string; sample: string; css: string }[] = [
  { 
    id: 'default', 
    name: 'Outfit & Inter (Default)', 
    description: 'Geometric headers + professional body text.',
    sample: 'Sphinx of black quartz, judge my vow.',
    css: "'Inter', 'Outfit', system-ui, sans-serif"
  },
  { 
    id: 'inter', 
    name: 'Inter Pro', 
    description: 'Ultra-clean sans-serif tailored for software.',
    sample: 'Focus intensely on completing key workflows.',
    css: "'Inter', sans-serif"
  },
  { 
    id: 'outfit', 
    name: 'Outfit Geometric', 
    description: 'Modern typeface with circular curves.',
    sample: 'Experience maximum workspace productivity.',
    css: "'Outfit', sans-serif"
  },
  { 
    id: 'roboto', 
    name: 'Roboto Neo', 
    description: 'Readable and friendly standard grotesque.',
    sample: 'Organize subtasks and checklists gracefully.',
    css: "'Roboto', sans-serif"
  },
  { 
    id: 'lexend', 
    name: 'Lexend High-Readability', 
    description: 'Scientifically designed to reduce reading strain.',
    sample: 'Acknowledge achievements and track progress.',
    css: "'Lexend', sans-serif"
  },
  { 
    id: 'playfair', 
    name: 'Playfair Editorial', 
    description: 'Classic serif for an editorial and high-end feel.',
    sample: 'Master all primary tasks with elegant focus.',
    css: "'Playfair Display', serif"
  },
  { 
    id: 'mono', 
    name: 'Console Monospace', 
    description: 'Structured grid ideal for coding workflows.',
    sample: 'npm run dev --port=3000 --open=true',
    css: "monospace"
  }
];

const SIZES: { id: SettingsFontSize; name: string; scale: string; pxValue: string }[] = [
  { id: 'xs', name: 'Extra Small', scale: '75%', pxValue: '12px' },
  { id: 'sm', name: 'Small', scale: '87.5%', pxValue: '14px' },
  { id: 'md', name: 'Medium', scale: '100%', pxValue: '16px' },
  { id: 'lg', name: 'Large', scale: '112.5%', pxValue: '18px' },
  { id: 'xl', name: 'Extra Large', scale: '125%', pxValue: '20px' },
  { id: '2xl', name: 'Huge', scale: '150%', pxValue: '24px' }
];

const ACCENT_THEMES_LIST: { id: SettingsAccentTheme; name: string; color: string; desc: string }[] = [
  { id: 'midnight-gold', name: 'Midnight Gold', color: '#c2883c', desc: 'Premium, luxury, elegant' },
  { id: 'nordic-frost', name: 'Nordic Frost', color: '#06b6d4', desc: 'Clean, professional, modern' },
  { id: 'sapphire-blue', name: 'Sapphire Blue', color: '#3b82f6', desc: 'Corporate, trustworthy' },
  { id: 'obsidian-emerald', name: 'Obsidian Emerald', color: '#10b981', desc: 'Calm, productive, organic' },
  { id: 'royal-amethyst', name: 'Royal Amethyst', color: '#8b5cf6', desc: 'Creative, premium' },
  { id: 'crimson-rose', name: 'Crimson Rose', color: '#f43f5e', desc: 'Bold, energetic, modern' },
  { id: 'copper-orange', name: 'Copper Orange', color: '#f97316', desc: 'Warm, vibrant, energetic' },
  { id: 'arctic-silver', name: 'Arctic Silver', color: '#94a3b8', desc: 'Minimal, neutral' },
  { id: 'ruby-red', name: 'Ruby Red', color: '#dc2626', desc: 'Strong, confident' },
  { id: 'catppuccin-mocha', name: 'Catppuccin Mocha', color: '#cba6f7', desc: 'Soft, aesthetic' },
  { id: 'dracula', name: 'Dracula', color: '#bd93f9', desc: 'Developer-focused, high contrast' },
  { id: 'solarized', name: 'Solarized Blue', color: '#268bd2', desc: 'Reading-friendly, balanced' },
];

export const SettingsPage = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [appearanceSubTab, setAppearanceSubTab] = useState<'typography' | 'theme'>('typography');

  // Redux state
  const { soundEnabled, tasks } = useAppSelector((state) => state.todo);
  const { user } = useAppSelector((state) => state.auth);
  const { streak, xp } = useAppSelector((state) => state.profile);
  const { 
    fontFamily, 
    fontSize, 
    showListBadges, 
    showGlowBackdrops, 
    defaultTaskPriority, 
    autoArchiveCompleted, 
    routineNotesPrompt,
    autoEscalatePriority,
    theme,
    accentTheme
  } = useAppSelector((state) => state.settings);

  // Sound handler
  const handleToggleSound = () => {
    dispatch(setSoundEnabled(!soundEnabled));
    playCompletionSound(!soundEnabled);
    toast(!soundEnabled ? 'Synthesizer audio bells activated! 🔔' : 'Synthesizer audio bells muted.', 'info');
  };

  // Sync handler
  const handleSync = async () => {
    if (!user) {
      toast('Please sign in to sync with cloud database.', 'info');
      dispatch(setAuthModalOpen(true));
      return;
    }
    try {
      await Promise.all([
        dispatch(fetchAllTodoData(user.uid)).unwrap(),
        dispatch(fetchAllRoutineData(user.uid)).unwrap(),
        dispatch(fetchAllTrackerData(user.uid)).unwrap()
      ]);
      toast('Workspace successfully synchronized! 🔄', 'success');
    } catch {
      toast('Failed to synchronize workspace.', 'error');
    }
  };

  // Backup handlers
  const handleExport = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `todo-cockpit-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast('Task database backup exported successfully! 📦', 'success');
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!Array.isArray(json)) {
          toast('Invalid backup format: root element must be a JSON array.', 'error');
          return;
        }

        let importCount = 0;
        for (const rawTask of json) {
          if (rawTask && typeof rawTask === 'object' && 'title' in rawTask) {
            const rawPriority = rawTask.priority;
            let finalPriority: 'low' | 'medium' | 'high' = 'low';
            if (typeof rawPriority === 'string') {
              if (rawPriority === 'medium' || rawPriority === 'high') {
                finalPriority = rawPriority;
              }
            } else if (typeof rawPriority === 'number') {
              if (rawPriority >= 4) {
                finalPriority = 'high';
              } else if (rawPriority >= 2) {
                finalPriority = 'medium';
              }
            }

            const task = {
              id: rawTask.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: String(rawTask.title),
              overview: String(rawTask.overview || ''),
              priority: finalPriority,
              dueDate: String(rawTask.dueDate || ''),
              completed: Boolean(rawTask.completed || false),
              collectionId: rawTask.collectionId || null,
              subcollectionId: rawTask.subcollectionId || null,
              userId: user?.uid || 'mock-user-id',
              createdAt: rawTask.createdAt || new Date().toISOString(),
              imported: true,
            };

            await dispatch(createTaskAsync(task)).unwrap();
            importCount++;
          }
        }

        if (importCount > 0) {
          toast(`Successfully imported ${importCount} tasks! 🚀`, 'success');
        } else {
          toast('No valid tasks found in JSON file to import.', 'info');
        }
      } catch {
        toast('Failed to parse backup JSON file.', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Tab configurations
  const tabs: { id: TabType; label: string; icon: LucideIcon }[] = [
    { id: 'general', label: 'General & Data', icon: Settings },
    { id: 'sync', label: 'Account & Sync', icon: Cloud },
    { id: 'appearance', label: 'Appearance & UI', icon: Palette },
    { id: 'tasks', label: 'Tasks & Checklists', icon: CheckSquare },
    { id: 'routines', label: 'Routines & Habits', icon: RefreshCw },
    { id: 'gamification', label: 'Gamification & XP', icon: Award },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 h-full overflow-y-auto no-scrollbar font-sans relative z-10 max-w-6xl mx-auto">
      {/* Decorative Blur Backdrops (conditional on appearance settings) */}
      {showGlowBackdrops && (
        <>
          <div
            className="absolute -top-24 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-15 pointer-events-none"
            style={{ backgroundColor: 'var(--color-brand-primary)' }}
          />
          <div
            className="absolute bottom-24 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none"
            style={{ backgroundColor: 'var(--color-brand-secondary)' }}
          />
        </>
      )}

      <PageHeader 
        title="Settings & Dashboard" 
        subtitle="Manage your cockpit details, custom typography preferences, routine behaviors, and priorities."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Navigation Menu (Responsive) */}
        <div className="lg:col-span-1 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 border-b lg:border-b-0 lg:border-r border-gray-border/50 pr-0 lg:pr-4 shrink-0 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:ring-2 focus-visible:ring-brand-primary/50 text-left ${
                  isActive
                    ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-md shadow-brand-primary/5'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Middle: Active Panel Configuration */}
        <div className="lg:col-span-2 flex flex-col gap-5 min-w-0">
          
          {activeTab === 'general' && (
            <div className="flex flex-col gap-4 animate-slide-in">
              <div className="border-b border-gray-border/50 pb-2">
                <h3 className="text-sm font-black text-text-primary">General Preferences</h3>
                <p className="text-xs text-text-secondary mt-0.5">Configure localized feedback sound synth settings and DB backups.</p>
              </div>

              {/* Sound bells row */}
              <div className="flex items-center justify-between gap-4 p-4 bg-bg-secondary/60 border border-gray-border/50 rounded-2xl">
                <div className="text-left">
                  <span className="text-xs font-extrabold text-text-primary block">Physical Audio Bells</span>
                  <span className="text-[10px] text-text-secondary leading-relaxed">Web Audio API powered synthesizer milestone resonances.</span>
                </div>
                <button
                  onClick={handleToggleSound}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all border ${
                    soundEnabled 
                      ? 'bg-brand-primary text-white border-brand-primary shadow-sm shadow-brand-primary/15'
                      : 'bg-transparent text-text-secondary border-gray-border hover:text-text-primary hover:bg-card'
                  }`}
                >
                  {soundEnabled ? 'Active 🔔' : 'Muted 🔇'}
                </button>
              </div>

              {/* Backups row */}
              <div className="flex flex-col gap-3 p-4 bg-bg-secondary/60 border border-gray-border/50 rounded-2xl">
                <div className="text-left border-b border-gray-border/30 pb-2.5">
                  <span className="text-xs font-extrabold text-text-primary block">Local Workspace Backups</span>
                  <span className="text-[10px] text-text-secondary">Export all checklist configurations or restore a local JSON copy.</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleExport}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-border bg-bg-primary text-text-primary text-xs font-bold hover:bg-card/50 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-border bg-bg-primary text-text-primary text-xs font-bold hover:bg-card/50 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import JSON</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportFile}
                    accept=".json"
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="flex flex-col gap-4 animate-slide-in">
              <div className="border-b border-gray-border/50 pb-2">
                <h3 className="text-sm font-black text-text-primary">Account & Cloud Sync</h3>
                <p className="text-xs text-text-secondary mt-0.5">Control authorization profiles and firestore backend connections.</p>
              </div>

              {user ? (
                <div className="flex flex-col gap-4 p-4 bg-bg-secondary/60 border border-gray-border/50 rounded-2xl text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-brand-primary font-black uppercase text-base">
                      {user.displayName ? user.displayName[0] : 'U'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-text-primary">{user.displayName || 'Active User'}</h4>
                      <p className="text-[10px] text-text-secondary mt-0.5">{user.email}</p>
                    </div>
                  </div>

                  <div className="h-px bg-gray-border/30" />

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary block">Backend Engine</span>
                      <span className="text-xs font-extrabold text-success mt-0.5 inline-block">● Cloud FireStore Synced</span>
                    </div>
                    <button
                      onClick={handleSync}
                      className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/15 transition-all text-xs font-extrabold cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Sync Now</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 bg-bg-secondary/60 border border-gray-border/50 rounded-2xl text-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gray-border/30 border border-gray-border/50 flex items-center justify-center text-text-secondary">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">Not Signed In</h4>
                    <p className="text-[10px] text-text-secondary mt-1 max-w-[280px] leading-relaxed">
                      Connect with our cloud dashboard to unlock secure multi-device streak backups.
                    </p>
                  </div>
                  <button
                    onClick={() => dispatch(setAuthModalOpen(true))}
                    className="mt-1 px-4.5 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-xl text-xs font-black cursor-pointer shadow-md shadow-brand-primary/10 transition-colors"
                  >
                    Establish Connection
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="flex flex-col gap-5 animate-slide-in">
              <div className="border-b border-gray-border/50 pb-2">
                <h3 className="text-sm font-black text-text-primary">Appearance Preferences</h3>
                <p className="text-xs text-text-secondary mt-0.5">Customize workspace font profiles, sizing scales, and theme modes.</p>
              </div>

              {/* Sub-tab Segmented Control */}
              <div className="flex items-center gap-1.5 p-1 bg-bg-secondary/60 border border-gray-border/55 rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => setAppearanceSubTab('typography')}
                  className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all ${
                    appearanceSubTab === 'typography'
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Typography & Fonts
                </button>
                <button
                  type="button"
                  onClick={() => setAppearanceSubTab('theme')}
                  className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all ${
                    appearanceSubTab === 'theme'
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Theme & Layout
                </button>
              </div>

              {appearanceSubTab === 'typography' && (
                <div className="flex flex-col gap-4 animate-slide-in">
                  {/* Fonts */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-black text-text-secondary/70 uppercase tracking-widest pl-1">Typography Fonts</span>
                    <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
                      {FONTS.map((font) => (
                        <button
                          key={font.id}
                          onClick={() => {
                            dispatch(setFontFamily(font.id));
                            playCompletionSound(soundEnabled);
                          }}
                          className={`flex items-center justify-between text-left gap-3 p-3 rounded-xl border transition-colors cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 ${
                            fontFamily === font.id
                              ? 'bg-brand-primary/5 border-brand-primary/40 border-l-4 border-l-brand-primary text-text-primary'
                              : 'bg-bg-secondary/60 border-gray-border/60 hover:border-text-secondary/40 text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          <div className="flex-1 overflow-hidden min-w-0">
                            <span className="text-xs font-bold text-text-primary block">{font.name}</span>
                            <span className="text-[10px] text-text-secondary block truncate mt-0.5">{font.description}</span>
                            <span 
                              className="text-[11px] font-semibold mt-1 inline-block opacity-80 truncate border-t border-gray-border/20 pt-0.5 w-full"
                              style={{ fontFamily: font.css }}
                            >
                              {font.sample}
                            </span>
                          </div>
                          {fontFamily === font.id && (
                            <div className="w-5.5 h-5.5 rounded-full bg-brand-primary text-white flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sizing */}
                  <div className="flex flex-col gap-3 mt-2">
                    <span className="text-[10px] font-black text-text-secondary/70 uppercase tracking-widest pl-1">Interface Sizing</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {SIZES.map((size) => (
                        <button
                          key={size.id}
                          onClick={() => {
                            dispatch(setFontSize(size.id));
                            playCompletionSound(soundEnabled);
                          }}
                          className={`flex flex-col text-left gap-1 p-3 rounded-xl border transition-colors cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 ${
                            fontSize === size.id
                              ? 'bg-brand-primary/5 border-brand-primary/40 border-l-4 border-l-brand-primary text-text-primary'
                              : 'bg-bg-secondary/60 border-gray-border/60 hover:border-text-secondary/40 text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="text-xs font-bold uppercase text-text-primary">{size.id}</span>
                            <span className="text-[9px] font-bold text-text-secondary">{size.scale}</span>
                          </div>
                          <span className="text-[10px] text-text-secondary/80 block mt-1">{size.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {appearanceSubTab === 'theme' && (
                <div className="flex flex-col gap-5 animate-slide-in">
                  {/* Theme Mode Selector */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-black text-text-secondary/70 uppercase tracking-widest pl-1">Appearance Modes</span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          dispatch(setTheme('dark'));
                          playCompletionSound(soundEnabled);
                          toast('Dark theme mode activated! 🌙', 'success');
                        }}
                        className={`flex flex-col items-start gap-1 p-4 rounded-xl border transition-colors cursor-pointer select-none text-left ${
                          theme === 'dark'
                            ? 'bg-brand-primary/5 border-brand-primary/40 text-text-primary'
                            : 'bg-bg-secondary/60 border-gray-border/60 hover:border-text-secondary/40 text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Moon className="w-4 h-4" />
                            <span className="text-xs font-black">Dark Mode</span>
                          </div>
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-brand-primary/20 text-brand-primary tracking-wider uppercase shrink-0">Recommended</span>
                        </div>
                        <span className="text-[10px] text-text-secondary mt-0.5">Modern, focused, low eye strain</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          dispatch(setTheme('light'));
                          playCompletionSound(soundEnabled);
                          toast('Light theme mode activated! ☀️', 'success');
                        }}
                        className={`flex flex-col items-start gap-1 p-4 rounded-xl border transition-colors cursor-pointer select-none text-left ${
                          theme === 'light'
                            ? 'bg-brand-primary/5 border-brand-primary/40 text-text-primary'
                            : 'bg-bg-secondary/60 border-gray-border/60 hover:border-text-secondary/40 text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Sun className="w-4 h-4" />
                          <span className="text-xs font-black">Light Mode</span>
                        </div>
                        <span className="text-[10px] text-text-secondary mt-0.5">Clean, bright, professional</span>
                      </button>
                    </div>
                  </div>

                  {/* Accent Themes */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-black text-text-secondary/70 uppercase tracking-widest pl-1">Accent Themes</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                      {ACCENT_THEMES_LIST.map((acc) => {
                        const isSelected = accentTheme === acc.id;
                        return (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => {
                              dispatch(setAccentTheme(acc.id));
                              playCompletionSound(soundEnabled);
                              toast(`${acc.name} theme applied! 🎨`, 'success');
                            }}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors cursor-pointer select-none text-left ${
                              isSelected
                                ? 'bg-brand-primary/5 border-brand-primary/40 text-text-primary'
                                : 'bg-bg-secondary/60 border-gray-border/60 hover:border-text-secondary/40 text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            <span 
                              className="w-3.5 h-3.5 rounded-full border border-black/25 shrink-0" 
                              style={{ backgroundColor: acc.color }}
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold block truncate">{acc.name}</span>
                              <span className="text-[9px] text-text-secondary block truncate mt-0.5">{acc.desc}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Display preferences rows */}
                  <div className="flex flex-col gap-2.5 mt-2">
                    <span className="text-[10px] font-black text-text-secondary/70 uppercase tracking-widest pl-1">Workspace Overlays</span>
                    
                    <div className="flex items-center justify-between p-3.5 bg-bg-secondary/60 border border-gray-border/50 rounded-xl">
                      <div className="text-left">
                        <span className="text-xs font-bold text-text-primary block">Show Workspace Badges</span>
                        <span className="text-[10px] text-text-secondary">Display parent category folder tags on tasks in lists.</span>
                      </div>
                      <button
                        onClick={() => {
                          dispatch(setShowListBadges(!showListBadges));
                          playCompletionSound(soundEnabled);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                          showListBadges
                            ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                            : 'bg-transparent text-text-secondary border-gray-border hover:text-text-primary hover:bg-card'
                        }`}
                      >
                        {showListBadges ? 'Showing' : 'Hidden'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-bg-secondary/60 border border-gray-border/50 rounded-xl">
                      <div className="text-left">
                        <span className="text-xs font-bold text-text-primary block">Glow Blur Backdrops</span>
                        <span className="text-[10px] text-text-secondary">Enable the decorative radial background gradients.</span>
                      </div>
                      <button
                        onClick={() => {
                          dispatch(setShowGlowBackdrops(!showGlowBackdrops));
                          playCompletionSound(soundEnabled);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                          showGlowBackdrops
                            ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                            : 'bg-transparent text-text-secondary border-gray-border hover:text-text-primary hover:bg-card'
                        }`}
                      >
                        {showGlowBackdrops ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="flex flex-col gap-4 animate-slide-in">
              <div className="border-b border-gray-border/50 pb-2">
                <h3 className="text-sm font-black text-text-primary">Tasks & Checklist Rules</h3>
                <p className="text-xs text-text-secondary mt-0.5">Control priority parameters and completion behaviors.</p>
              </div>

              {/* Default Task Priority */}
              <div className="flex flex-col gap-2.5 p-4 bg-bg-secondary/60 border border-gray-border/50 rounded-2xl">
                <div className="text-left">
                  <span className="text-xs font-extrabold text-text-primary block">Default Priority Weight</span>
                  <span className="text-[10px] text-text-secondary">Initial priority weight applied to newly established tasks.</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 bg-bg-primary/50 border border-gray-border/20 p-2 rounded-xl w-fit">
                  {[
                    { val: 'low' as const, label: 'Low', colorClass: 'bg-success' },
                    { val: 'medium' as const, label: 'Medium', colorClass: 'bg-warning' },
                    { val: 'high' as const, label: 'High', colorClass: 'bg-error' }
                  ].map((lvl) => (
                    <button
                      key={lvl.val}
                      type="button"
                      onClick={() => {
                        dispatch(setDefaultTaskPriority(lvl.val));
                        playCompletionSound(soundEnabled);
                      }}
                      className={`px-3 py-1.5 rounded-lg flex items-center justify-center text-[10px] font-black cursor-pointer transition-all ${
                        defaultTaskPriority === lvl.val
                          ? `${lvl.colorClass} text-white scale-105 shadow-sm`
                          : 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-card'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between p-3.5 bg-bg-secondary/60 border border-gray-border/50 rounded-xl">
                <div className="text-left">
                  <span className="text-xs font-bold text-text-primary block">Auto-Archive Completed</span>
                  <span className="text-[10px] text-text-secondary">Hide completed tasks immediately from active queues.</span>
                </div>
                <button
                  onClick={() => {
                    dispatch(setAutoArchiveCompleted(!autoArchiveCompleted));
                    playCompletionSound(soundEnabled);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                    autoArchiveCompleted
                      ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                      : 'bg-transparent text-text-secondary border-gray-border hover:text-text-primary hover:bg-card'
                  }`}
                >
                  {autoArchiveCompleted ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-bg-secondary/60 border border-gray-border/50 rounded-xl">
                <div className="text-left">
                  <span className="text-xs font-bold text-text-primary block">Auto-Escalate Priority</span>
                  <span className="text-[10px] text-text-secondary">Automatically escalate task priority to match higher priority subtasks.</span>
                </div>
                <button
                  onClick={() => {
                    dispatch(setAutoEscalatePriority(!autoEscalatePriority));
                    playCompletionSound(soundEnabled);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                    autoEscalatePriority
                      ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                      : 'bg-transparent text-text-secondary border-gray-border hover:text-text-primary hover:bg-card'
                  }`}
                >
                  {autoEscalatePriority ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-bg-secondary/60 border border-gray-border/50 rounded-xl">
                <div className="text-left">
                  <span className="text-xs font-bold text-text-primary block">Highlight High-Priority</span>
                  <span className="text-[10px] text-text-secondary">Visually apply red/amber highlight bounds for high priority tasks.</span>
                </div>
                <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-success/10 border border-success/20 text-success select-none">
                  Always Active
                </div>
              </div>
            </div>
          )}

          {activeTab === 'routines' && (
            <div className="flex flex-col gap-4 animate-slide-in">
              <div className="border-b border-gray-border/50 pb-2">
                <h3 className="text-sm font-black text-text-primary">Routines & Habits</h3>
                <p className="text-xs text-text-secondary mt-0.5">Adjust recurring check-in logging configurations.</p>
              </div>

              {/* Routine Notes Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-bg-secondary/60 border border-gray-border/50 rounded-xl">
                <div className="text-left">
                  <span className="text-xs font-bold text-text-primary block">Check-in Notes Prompt</span>
                  <span className="text-[10px] text-text-secondary">Prompt for notes when logging routine task milestones.</span>
                </div>
                <button
                  onClick={() => {
                    dispatch(setRoutineNotesPrompt(!routineNotesPrompt));
                    playCompletionSound(soundEnabled);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                    routineNotesPrompt
                      ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                      : 'bg-transparent text-text-secondary border-gray-border hover:text-text-primary hover:bg-card'
                  }`}
                >
                  {routineNotesPrompt ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {/* Streak Rules Info */}
              <div className="flex flex-col gap-2 p-4 bg-bg-secondary/60 border border-gray-border/50 rounded-2xl text-left">
                <div className="flex items-center gap-2 text-brand-primary border-b border-gray-border/30 pb-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-extrabold">Streak Reset Calculations</span>
                </div>
                <p className="text-[10px] text-text-secondary leading-relaxed font-semibold">
                  Routines are scheduled daily, weekly, or custom. To prevent streaks from resetting, completions must be logged before midnight in your local timezone.
                </p>
                <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-text-secondary/70">
                  <span>Current Timezone:</span>
                  <span className="text-text-primary bg-bg-primary px-2 py-0.5 rounded border border-gray-border/50">
                    {Intl.DateTimeFormat().resolvedOptions().timeZone}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gamification' && (
            <div className="flex flex-col gap-4 animate-slide-in">
              <div className="border-b border-gray-border/50 pb-2">
                <h3 className="text-sm font-black text-text-primary">Gamification & XP Rules</h3>
                <p className="text-xs text-text-secondary mt-0.5">Overview of streak scores and productivity metrics.</p>
              </div>

              {/* XP multipliers summary card */}
              <div className="flex flex-col gap-3 p-4 bg-bg-secondary/60 border border-gray-border/50 rounded-2xl text-left">
                <span className="text-xs font-extrabold text-text-primary border-b border-gray-border/30 pb-2 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-warning" />
                  <span>XP Reward Matrix</span>
                </span>
                
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-text-secondary">
                  <div className="flex justify-between p-2 bg-bg-primary/45 rounded-lg border border-gray-border/30">
                    <span>Task Added</span>
                    <span className="text-brand-primary">+10 XP</span>
                  </div>
                  <div className="flex justify-between p-2 bg-bg-primary/45 rounded-lg border border-gray-border/30">
                    <span>Subtask Done</span>
                    <span className="text-success">+35 XP</span>
                  </div>
                  <div className="flex justify-between p-2 bg-bg-primary/45 rounded-lg border border-gray-border/30">
                    <span>Task Done</span>
                    <span className="text-success">+50 XP</span>
                  </div>
                  <div className="flex justify-between p-2 bg-bg-primary/45 rounded-lg border border-gray-border/30">
                    <span>Habit Logged</span>
                    <span className="text-success">+25 XP</span>
                  </div>
                </div>
              </div>

              {/* Streak multiplier info */}
              <div className="flex flex-col gap-2 p-4 bg-bg-secondary/60 border border-gray-border/50 rounded-2xl text-left">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">Workspace Statistics</h4>
                    <p className="text-[10px] text-text-secondary mt-0.5">Consecutive logins and achievements record.</p>
                  </div>
                </div>
                <div className="h-px bg-gray-border/30 my-1" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-widest text-text-secondary/60 font-bold">XP Score Balance</span>
                    <span className="text-xl font-black text-text-primary mt-0.5">{xp} XP</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-widest text-text-secondary/60 font-bold">Active Streak</span>
                    <span className="text-xl font-black text-warning mt-0.5">{streak} Days 🔥</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Sticky Real-time Sandbox Preview (Desktop) */}
        <div className="lg:col-span-1">
          <SandboxPreview />
        </div>

      </div>

    </div>
  );
};

export default SettingsPage;
