import { useAppSelector } from '../hooks/useRedux';
import { TrackerList } from '../components/features/trackers/TrackerList';
import { TrackerDetailPane } from '../components/features/trackers/TrackerDetailPane';

export const TrackersPage = () => {
  const { activeTrackerId } = useAppSelector((state) => state.tracker);

  return (
    <div className="flex h-full w-full overflow-hidden bg-bg-primary">
      <div className={`flex-1 md:flex-none md:w-[380px] lg:w-[440px] shrink-0 h-full border-r border-gray-border/30 ${
        activeTrackerId ? 'hidden md:block' : 'block'
      }`}>
        <TrackerList />
      </div>
      <div className={`flex-1 h-full ${
        activeTrackerId ? 'block' : 'hidden md:block'
      }`}>
        <TrackerDetailPane />
      </div>
    </div>
  );
};
