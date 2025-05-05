import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { Id } from "../../convex/_generated/dataModel";

type Message = {
  role: string;
  content: string;
  timestamp: number;
};

type AssistantTone = "calm" | "encouraging" | "formal" | "friendly";

export function AIAssistant() {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedTone, setSelectedTone] = useState<AssistantTone>("friendly");
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const currentChat = useQuery(api.aiChats.getCurrentChat) || { messages: [] };
  const chatHistory = useQuery(api.aiChats.getChatHistory) || [];
  const sendMessage = useMutation(api.aiChats.sendMessage);
  const startNewChat = useMutation(api.aiChats.startNewChat);
  const processFile = useMutation(api.aiChats.processFile);
  const files = useQuery(api.files.listFiles, { parentFolderId: undefined }) || [];

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [currentChat.messages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      await sendMessage({ content: message, tone: selectedTone });
      setMessage("");
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleFileSelect = async (fileId: Id<"files">) => {
    try {
      await processFile({ fileId, action: "summarize" });
      setShowFileSelector(false);
    } catch (error) {
      toast.error("Failed to process file");
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        // In a real app, you would send this to a speech-to-text service
        toast.info("Voice recording feature coming soon!");
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast.error("Failed to start voice recording");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">AI Assistant</h2>
          <select
            value={selectedTone}
            onChange={(e) => setSelectedTone(e.target.value as AssistantTone)}
            className="px-3 py-1 rounded border dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="calm">Calm</option>
            <option value="encouraging">Encouraging</option>
            <option value="formal">Formal</option>
            <option value="friendly">Friendly</option>
          </select>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            History
          </button>
          <button
            onClick={() => startNewChat()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            New Chat
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        <div className="flex-1 flex flex-col">
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            {currentChat.messages.map((msg: Message, index: number) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-700"
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {format(msg.timestamp, "HH:mm")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-end space-x-2">
            <button
              onClick={() => setShowFileSelector(true)}
              className="p-2 text-gray-600 hover:text-gray-800"
            >
              +
            </button>
            <button
              onMouseDown={startVoiceRecording}
              onMouseUp={stopVoiceRecording}
              className={`p-2 rounded-full ${
                isRecording ? "bg-red-500" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              🎤
            </button>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message..."
              className="flex-1 p-3 rounded-lg border resize-none dark:bg-gray-700 dark:border-gray-600"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>

        {showHistory && (
          <div className="w-64 ml-4 p-4 bg-white dark:bg-gray-800 rounded-lg overflow-y-auto">
            <h3 className="font-semibold mb-4">Chat History</h3>
            <div className="space-y-2">
              {chatHistory.map((chat) => (
                <button
                  key={chat._id}
                  onClick={() => {
                    // Load this chat
                  }}
                  className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <p className="font-medium truncate">
                    {chat.messages[0]?.content.slice(0, 30)}...
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(chat.lastActive, "MMM d, yyyy")}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {showFileSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[500px]">
            <h3 className="text-lg font-semibold mb-4">Select a File</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {files.map((file) => (
                <button
                  key={file._id}
                  onClick={() => handleFileSelect(file._id)}
                  className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center"
                >
                  <span className="text-2xl mr-3">
                    {file.isFolder ? "📁" : "📄"}
                  </span>
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">{file.type}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowFileSelector(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
