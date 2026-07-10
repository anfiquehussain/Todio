import { TrackerDetailPane } from '../components/features/trackers/TrackerDetailPane';

export const TrackerDetailsPage = () => {
  return (
    <div className="flex h-full w-full overflow-hidden bg-bg-primary">
      <div className="flex-1 h-full">
        <TrackerDetailPane />
      </div>
    </div>
  );
};
