import { useAppSelector } from '../hooks/useRedux';
import { TaskList } from '../components/features/media/TaskList';
import { TaskDetailPane } from '../components/features/media/TaskDetailPane';

export const HomePage = () => {
  const { isDetailsPaneExpanded } = useAppSelector((state) => state.todo);

  return (
    <div className="flex h-full w-full overflow-hidden bg-bg-primary">
      {!isDetailsPaneExpanded && <TaskList />}
      <TaskDetailPane />
    </div>
  );
};
