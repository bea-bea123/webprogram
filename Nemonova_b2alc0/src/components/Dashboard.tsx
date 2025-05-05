import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";

export function Dashboard() {
  const user = useQuery(api.auth.loggedInUser);
  const stats = useQuery(api.dashboard.getDashboardStats);

  if (!user || !stats) return <div>Loading...</div>;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h1>
        <p className="opacity-90">Ready to continue your learning journey?</p>
      </div>

      {/* Progress Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Today's Study Time</h3>
          <p className="text-2xl font-bold mt-1">{formatTime(stats.studyTime.today)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">This Week</h3>
          <p className="text-2xl font-bold mt-1">{formatTime(stats.studyTime.thisWeek)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tasks Completed</h3>
          <p className="text-2xl font-bold mt-1">{stats.tasks.completed}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tasks Remaining</h3>
          <p className="text-2xl font-bold mt-1">{stats.tasks.remaining}</p>
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold">Upcoming Tasks</h2>
        </div>
        <div className="p-4">
          {stats.upcomingTasks.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No upcoming tasks in the next 3 days</p>
          ) : (
            <ul className="space-y-3">
              {stats.upcomingTasks.map((task) => (
                <li 
                  key={task._id} 
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{task.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{task.type}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    task.dueIn === 0 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                      : task.dueIn === 1
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                    {task.dueIn === 0 
                      ? 'Due today'
                      : task.dueIn === 1
                      ? 'Due tomorrow'
                      : `Due in ${task.dueIn} days`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: 'Start Study Session', icon: '📚', href: '#assistant' },
          { name: 'Upload Notes', icon: '📝', href: '#files' },
          { name: 'Join Study Group', icon: '👥', href: '#groups' },
          { name: 'View Calendar', icon: '📅', href: '#calendar' },
        ].map((action) => (
          <a
            key={action.name}
            href={action.href}
            className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="text-2xl mb-2">{action.icon}</span>
            <span className="text-sm font-medium text-center">{action.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
