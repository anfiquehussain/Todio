import { useAppSelector } from '../hooks/useRedux';
import { RoutineList } from '../components/features/routines/RoutineList';
import { RoutineDetailPane } from '../components/features/routines/RoutineDetailPane';

export const RoutinesPage = () => {
  const { activeRoutineId } = useAppSelector((state) => state.routine);

  return (
    <div className="flex h-full w-full overflow-hidden bg-bg-primary">
      <div className={`flex-1 md:flex-none md:w-[380px] lg:w-[440px] shrink-0 h-full border-r border-gray-border/30 ${
        activeRoutineId ? 'hidden md:block' : 'block'
      }`}>
        <RoutineList />
      </div>
      <div className={`flex-1 h-full ${
        activeRoutineId ? 'block' : 'hidden md:block'
      }`}>
        <RoutineDetailPane />
      </div>
    </div>
  );
};
