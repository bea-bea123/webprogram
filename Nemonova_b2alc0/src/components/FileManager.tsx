import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export function FileManager() {
  const [currentFolderId, setCurrentFolderId] = useState<Id<"files"> | undefined>(undefined);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const files = useQuery(api.files.listFiles, { 
    parentFolderId: currentFolderId 
  }) || [];

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFile = useMutation(api.files.saveFile);
  const createFolder = useMutation(api.files.createFolder);
  const deleteFile = useMutation(api.files.deleteFile);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const postUrl = await generateUploadUrl();

      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      await saveFile({
        storageId,
        name: file.name,
        type: file.type,
        parentFolderId: currentFolderId,
      });

      toast.success("File uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload file");
      console.error(error);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await createFolder({
        name: newFolderName,
        parentFolderId: currentFolderId,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      });
      setNewFolderName("");
      setShowNewFolderDialog(false);
      toast.success("Folder created");
    } catch (error) {
      toast.error("Failed to create folder");
      console.error(error);
    }
  };

  const handleDelete = async (fileId: Id<"files">) => {
    try {
      await deleteFile({ fileId });
      toast.success("File deleted");
    } catch (error) {
      toast.error("Failed to delete file");
      console.error(error);
    }
  };

  const navigateToFolder = (folderId: Id<"files"> | undefined) => {
    setCurrentFolderId(folderId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">File Manager</h2>
        <div className="space-x-4">
          <button
            onClick={() => setShowNewFolderDialog(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            New Folder
          </button>
          <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
            Upload File
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              ref={fileInputRef}
            />
          </label>
        </div>
      </div>

      <div className="flex items-center space-x-2 text-sm">
        <button
          onClick={() => navigateToFolder(undefined)}
          className="text-blue-600 hover:underline"
        >
          Root
        </button>
        {currentFolderId && (
          <>
            <span>/</span>
            <span>Current Folder</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {files.map((file) => (
          <div
            key={file._id}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div 
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => file.isFolder && navigateToFolder(file._id)}
              >
                <span className="text-2xl">
                  {file.isFolder ? "📁" : "📄"}
                </span>
                <div>
                  <h3 className="font-medium truncate">{file.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {file.isFolder ? "Folder" : file.type}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(file._id)}
                className="text-red-600 hover:text-red-800"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {showNewFolderDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Create New Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full p-2 border rounded mb-4 dark:bg-gray-700 dark:border-gray-600"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowNewFolderDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
