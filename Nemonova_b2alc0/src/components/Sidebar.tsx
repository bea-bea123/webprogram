import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { cn } from "@/lib/utils";

export function Sidebar({ onNavigate }: { onNavigate: (section: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const user = useQuery(api.auth.loggedInUser);

  const sections = [
    { id: "home", name: "Home", icon: "🏠" },
    { id: "files", name: "File Manager", icon: "📁" },
    { id: "assistant", name: "AI Assistant", icon: "🤖" },
    { id: "calendar", name: "Calendar", icon: "📅" },
    { id: "groups", name: "Study Groups", icon: "👥" },
    { id: "settings", name: "Settings", icon: "⚙️" },
  ];

  return (
    <div className={cn(
      "h-screen bg-white dark:bg-gray-800 border-r transition-all",
      isExpanded ? "w-64" : "w-16"
    )}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
      >
        {isExpanded ? "◀️" : "▶️"}
      </button>
      
      <nav className="space-y-1">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onNavigate(section.id)}
            className="flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
          >
            <span className="text-xl">{section.icon}</span>
            {isExpanded && (
              <span className="ml-3 text-gray-900 dark:text-gray-100">
                {section.name}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
