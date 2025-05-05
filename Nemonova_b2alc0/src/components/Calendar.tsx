import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO } from "date-fns";
import { toast } from "sonner";

type Task = {
  title: string;
  type: string;
  startTime: number;
  endTime: number;
  reminderTime?: number;
  completed: boolean;
};

export function Calendar() {
  const [selectedDate, setSelectedDate] = useState(new Date(2025, 0, 1));
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [taskForm, setTaskForm] = useState<Partial<Task>>({
    title: "",
    type: "assignment",
    startTime: Date.now(),
    endTime: Date.now(),
  });

  const tasks = useQuery(api.tasks.listTasks) || [];
  const createTask = useMutation(api.tasks.createTask);
  const updateTask = useMutation(api.tasks.updateTask);

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.endTime);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getTaskColor = (task: any) => {
    if (task.completed) return "bg-green-100 dark:bg-green-900/30";
    const now = Date.now();
    if (task.endTime < now) return "bg-red-100 dark:bg-red-900/30";
    if (task.endTime - now < 72 * 60 * 60 * 1000) return "bg-yellow-100 dark:bg-yellow-900/30";
    return "bg-blue-100 dark:bg-blue-900/30";
  };

  const handleSaveTask = async () => {
    if (!taskForm.title || !taskForm.type || !taskForm.startTime || !taskForm.endTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createTask({
        title: taskForm.title,
        type: taskForm.type,
        startTime: new Date(taskForm.startTime).getTime(),
        endTime: new Date(taskForm.endTime).getTime(),
        reminderTime: taskForm.reminderTime,
        completed: false,
      });
      setShowTaskDialog(false);
      setTaskForm({});
      toast.success("Task created successfully");
    } catch (error) {
      toast.error("Failed to create task");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Calendar</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)))}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
          >
            ◀️
          </button>
          <span className="text-xl font-semibold">
            {format(selectedDate, "MMMM yyyy")}
          </span>
          <button
            onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)))}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
          >
            ▶️
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="bg-gray-100 dark:bg-gray-800 p-2 text-center font-semibold">
            {day}
          </div>
        ))}
        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-white dark:bg-gray-800 p-2 min-h-[100px]" />
        ))}
        {daysInMonth.map((date) => {
          const dayTasks = getTasksForDate(date);
          return (
            <div
              key={date.toISOString()}
              onClick={() => {
                setSelectedDate(date);
                setTaskForm(prev => ({
                  ...prev,
                  startTime: date.setHours(9, 0, 0, 0),
                  endTime: date.setHours(17, 0, 0, 0),
                }));
                setShowTaskDialog(true);
              }}
              className={`bg-white dark:bg-gray-800 p-2 min-h-[100px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                isToday(date) ? "border-2 border-blue-500" : ""
              }`}
            >
              <div className="font-medium mb-1">{format(date, "d")}</div>
              <div className="space-y-1">
                {dayTasks.map((task) => (
                  <div
                    key={task._id}
                    className={`${getTaskColor(task)} p-1 rounded text-xs truncate`}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showTaskDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[500px]">
            <h3 className="text-lg font-semibold mb-4">
              {format(new Date(taskForm.startTime || Date.now()), "MMMM d, yyyy")}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={taskForm.title || ""}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Task title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={taskForm.type || ""}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="assignment">Assignment</option>
                  <option value="exam">Exam</option>
                  <option value="study">Study Session</option>
                  <option value="meeting">Meeting</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={format(new Date(taskForm.startTime || Date.now()), "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, startTime: new Date(e.target.value).getTime() }))}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={format(new Date(taskForm.endTime || Date.now()), "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, endTime: new Date(e.target.value).getTime() }))}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reminder (hours before)</label>
                <select
                  value={taskForm.reminderTime ? (taskForm.endTime! - taskForm.reminderTime) / (60 * 60 * 1000) : ""}
                  onChange={(e) => {
                    const hours = parseInt(e.target.value);
                    setTaskForm(prev => ({
                      ...prev,
                      reminderTime: hours ? prev.endTime! - (hours * 60 * 60 * 1000) : undefined
                    }));
                  }}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">No reminder</option>
                  <option value="1">1 hour</option>
                  <option value="2">2 hours</option>
                  <option value="4">4 hours</option>
                  <option value="24">24 hours</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowTaskDialog(false);
                  setTaskForm({});
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTask}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
