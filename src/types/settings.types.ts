export type SettingsFontFamily = 'default' | 'inter' | 'outfit' | 'roboto' | 'lexend' | 'playfair' | 'mono';
export type SettingsFontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface SettingsState {
  fontFamily: SettingsFontFamily;
  fontSize: SettingsFontSize;
  showSubtasksInline: 'none' | 'all' | 'imported-priority';
  showListBadges: boolean;
}
