import { PageHeader } from '../components/patterns/PageHeader';
import { SoundManager } from '../components/features/settings/SoundManager';
import { BackupManager } from '../components/features/settings/BackupManager';

export const BrowsePage = () => {
  return (
    <div className="flex flex-col gap-8 font-sans">
      <PageHeader
        title="Exploration & Tools"
        subtitle="Manage localized workspace utilities, synthesizer settings, and JSON backup imports/exports."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SoundManager />
        <BackupManager />
      </div>
    </div>
  );
};
