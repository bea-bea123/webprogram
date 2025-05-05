import { Authenticated, Unauthenticated } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { FileManager } from "./components/FileManager";
import { Calendar } from "./components/Calendar";
import { AIAssistant } from "./components/AIAssistant";
import { StudyGroups } from "./components/StudyGroups";
import { Settings } from "./components/Settings";
import { Toaster } from "sonner";
import { useState } from "react";

export default function App() {
  const [currentSection, setCurrentSection] = useState("home");

  const renderSection = () => {
    switch (currentSection) {
      case "files":
        return <FileManager />;
      case "calendar":
        return <Calendar />;
      case "assistant":
        return <AIAssistant />;
      case "groups":
        return <StudyGroups />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex">
      <Authenticated>
        <Sidebar onNavigate={setCurrentSection} />
        <div className="flex-1">
          <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 flex justify-between items-center border-b">
            <h2 className="text-xl font-semibold">Nemonova</h2>
            <SignOutButton />
          </header>
          <main className="p-8">
            {renderSection()}
          </main>
        </div>
      </Authenticated>
      <Unauthenticated>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold mb-4">Nemonova</h1>
              <p className="text-xl text-gray-600">Sign in to start studying smarter</p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
      <Toaster />
    </div>
  );
}
