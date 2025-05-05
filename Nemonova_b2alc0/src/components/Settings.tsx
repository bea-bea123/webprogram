import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function Settings() {
  const user = useQuery(api.auth.loggedInUser);
  const settings = useQuery(api.settings.getUserSettings);
  const updateSettings = useMutation(api.settings.updateSettings);
  const clearAIMemory = useMutation(api.settings.clearAIMemory);

  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [breakTime, setBreakTime] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);

  useEffect(() => {
    if (settings?.studyMode === "pomodoro" && !pomodoroActive) {
      startPomodoro();
    }
  }, [settings?.studyMode]);

  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timer]);

  const startPomodoro = () => {
    setPomodoroActive(true);
    setBreakTime(false);
    const interval = setInterval(() => {
      const duration = settings?.studyPreferences.focusDuration || 25 * 60 * 1000;
      if (breakTime) {
        // Break time finished
        setBreakTime(false);
        toast.info("Break time over! Back to studying!");
      } else {
        // Study time finished
        setBreakTime(true);
        toast.info("Time for a break!");
      }
    }, settings?.studyPreferences.focusDuration || 25 * 60 * 1000);
    setTimer(interval);
  };

  const handleThemeChange = async (theme: "light" | "dark" | "system") => {
    try {
      await updateSettings({ theme });
      if (theme === "system") {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", isDark);
      } else {
        document.documentElement.classList.toggle("dark", theme === "dark");
      }
      toast.success("Theme updated");
    } catch (error) {
      toast.error("Failed to update theme");
    }
  };

  const handleStudyModeChange = async (studyMode: "normal" | "pomodoro") => {
    try {
      await updateSettings({ studyMode });
      if (studyMode === "normal" && timer) {
        clearInterval(timer);
        setTimer(null);
        setPomodoroActive(false);
      }
      toast.success("Study mode updated");
    } catch (error) {
      toast.error("Failed to update study mode");
    }
  };

  const handleClearAIMemory = async () => {
    try {
      await clearAIMemory();
      toast.success("AI memory cleared");
    } catch (error) {
      toast.error("Failed to clear AI memory");
    }
  };

  if (!user || !settings) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Account Settings</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Username</p>
            <p className="font-medium">{user.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Serial Number</p>
            <p className="font-medium">{settings.serialNumber}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Appearance</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Theme</p>
            <div className="flex space-x-4">
              <button
                onClick={() => handleThemeChange("light")}
                className={`p-3 rounded-lg ${
                  settings.theme === "light"
                    ? "bg-blue-100 dark:bg-blue-900"
                    : "bg-gray-100 dark:bg-gray-700"
                }`}
              >
                ☀️ Light
              </button>
              <button
                onClick={() => handleThemeChange("dark")}
                className={`p-3 rounded-lg ${
                  settings.theme === "dark"
                    ? "bg-blue-100 dark:bg-blue-900"
                    : "bg-gray-100 dark:bg-gray-700"
                }`}
              >
                🌙 Dark
              </button>
              <button
                onClick={() => handleThemeChange("system")}
                className={`p-3 rounded-lg ${
                  settings.theme === "system"
                    ? "bg-blue-100 dark:bg-blue-900"
                    : "bg-gray-100 dark:bg-gray-700"
                }`}
              >
                💻 System
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Study Mode</h2>
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium mb-2">Mode Selection</p>
            <div className="flex space-x-4">
              <button
                onClick={() => handleStudyModeChange("normal")}
                className={`p-3 rounded-lg ${
                  settings.studyMode === "normal"
                    ? "bg-blue-100 dark:bg-blue-900"
                    : "bg-gray-100 dark:bg-gray-700"
                }`}
              >
                📚 Normal Mode
              </button>
              <button
                onClick={() => handleStudyModeChange("pomodoro")}
                className={`p-3 rounded-lg ${
                  settings.studyMode === "pomodoro"
                    ? "bg-blue-100 dark:bg-blue-900"
                    : "bg-gray-100 dark:bg-gray-700"
                }`}
              >
                🍅 Pomodoro Mode
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Focus Mode</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Hide notifications and activate focus UI
              </p>
            </div>
            <button
              onClick={() => updateSettings({ focusMode: !settings.focusMode })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                settings.focusMode ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  settings.focusMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notifications</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enable study reminders and alerts
              </p>
            </div>
            <button
              onClick={() =>
                updateSettings({ notifications: !settings.notifications })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                settings.notifications
                  ? "bg-blue-600"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  settings.notifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">AI Assistant</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Clear AI memory to start fresh conversations
            </p>
            <button
              onClick={handleClearAIMemory}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Clear AI Memory
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Study Statistics</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Study Time
            </p>
            <p className="text-2xl font-bold">
              {Math.floor(settings.totalStudyTime / (60 * 60 * 1000))}h{" "}
              {Math.floor((settings.totalStudyTime % (60 * 60 * 1000)) / (60 * 1000))}m
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
