export type SettingsFontFamily = 'default' | 'inter' | 'outfit' | 'roboto' | 'lexend' | 'playfair' | 'mono';
export type SettingsFontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type SettingsAccentTheme = 
  | 'midnight-gold' 
  | 'nordic-frost' 
  | 'sapphire-blue' 
  | 'obsidian-emerald' 
  | 'royal-amethyst' 
  | 'crimson-rose' 
  | 'copper-orange' 
  | 'arctic-silver' 
  | 'ruby-red' 
  | 'catppuccin-mocha' 
  | 'dracula' 
  | 'solarized';

export interface SettingsState {
  fontFamily: SettingsFontFamily;
  fontSize: SettingsFontSize;
  subtaskFilter: 'all' | 'priority';
  showListBadges: boolean;
  showGlowBackdrops: boolean;
  defaultTaskPriority: 'low' | 'medium' | 'high';
  autoArchiveCompleted: boolean;
  routineNotesPrompt: boolean;
  theme: 'dark' | 'light';
  accentTheme: SettingsAccentTheme;
}

