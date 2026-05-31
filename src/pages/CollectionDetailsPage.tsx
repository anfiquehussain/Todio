import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Folder } from 'lucide-react';
import { useAppSelector } from '../hooks/useRedux';
import { PageHeader } from '../components/patterns/PageHeader';

export const CollectionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { collections, tasks } = useAppSelector((state) => state.todo);
  const collection = collections.find((c) => c.id === id);

  if (!collection) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 select-none font-sans">
        <Folder className="w-12 h-12 text-text-secondary/20 mb-3" />
        <h2 className="text-base font-bold text-text-primary">Workspace category not found</h2>
        <button
          onClick={() => navigate('/collections')}
          className="mt-4 flex items-center gap-2 px-4 py-2 border border-gray-border rounded-xl text-xs font-bold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/15 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Collections</span>
        </button>
      </div>
    );
  }

  const collectionTasks = tasks.filter((t) => t.collectionId === id);

  return (
    <div className="flex flex-col gap-8 font-sans">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/collections')}
          className="p-2 hover:bg-bg-secondary rounded-xl text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0"
          aria-label="Back to Collections"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <PageHeader
          title={`Category: ${collection.name}`}
          subtitle={`Review specific workflow lists and sublists grouped under ${collection.name}.`}
        />
      </div>

      <div className="bg-card border border-gray-border rounded-3xl p-6 select-none relative overflow-hidden flex flex-col gap-4">
        <h3 className="text-sm font-bold text-text-primary tracking-wide">Category Tasks ({collectionTasks.length})</h3>
        {collectionTasks.length > 0 ? (
          <div className="flex flex-col gap-2">
            {collectionTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => navigate(`/task/${task.id}`)}
                className="flex items-center justify-between p-4 bg-bg-secondary border border-gray-border/60 rounded-2xl hover:border-brand-primary/45 hover:bg-bg-secondary/80 transition-colors cursor-pointer"
              >
                <span className="text-xs font-bold text-text-primary">{task.title}</span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                    task.completed
                      ? 'bg-success/10 text-success'
                      : 'bg-brand-primary/10 text-brand-primary'
                  }`}
                >
                  {task.completed ? 'Completed' : 'Active'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-text-secondary/50 py-4 text-center">
            No active workflows found in this list. Click Home to compose a new task.
          </div>
        )}
      </div>
    </div>
  );
};
