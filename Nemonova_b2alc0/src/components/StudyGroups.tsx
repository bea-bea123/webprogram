import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { Id } from "../../convex/_generated/dataModel";

export function StudyGroups() {
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Id<"studyGroups"> | null>(null);
  const [serialNumber, setSerialNumber] = useState("");
  const [groupForm, setGroupForm] = useState({ name: "", description: "" });
  const [message, setMessage] = useState("");

  const user = useQuery(api.auth.loggedInUser);
  const userSettings = useQuery(api.studyGroups.getUserSettings);
  const groups = useQuery(api.studyGroups.listGroups) || [];
  const friends = useQuery(api.studyGroups.listFriends) || [];
  const selectedGroupData = useQuery(
    api.studyGroups.getGroupDetails,
    selectedGroup ? { groupId: selectedGroup } : "skip"
  );
  const messages = useQuery(
    api.studyGroups.getGroupMessages,
    selectedGroup ? { groupId: selectedGroup } : "skip"
  ) || [];

  const addFriend = useMutation(api.studyGroups.addFriend);
  const createGroup = useMutation(api.studyGroups.createGroup);
  const sendMessage = useMutation(api.studyGroups.sendMessage);
  const scheduleSession = useMutation(api.studyGroups.scheduleSession);

  const handleAddFriend = async () => {
    try {
      await addFriend({ serialNumber });
      setSerialNumber("");
      setShowAddFriend(false);
      toast.success("Friend request sent!");
    } catch (error) {
      toast.error("Failed to add friend");
    }
  };

  const handleCreateGroup = async () => {
    try {
      await createGroup(groupForm);
      setGroupForm({ name: "", description: "" });
      setShowCreateGroup(false);
      toast.success("Group created!");
    } catch (error) {
      toast.error("Failed to create group");
    }
  };

  const handleSendMessage = async () => {
    if (!selectedGroup || !message.trim()) return;
    try {
      await sendMessage({
        groupId: selectedGroup,
        type: "text",
        content: message,
      });
      setMessage("");
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  if (!user || !userSettings) return <div>Loading...</div>;

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 p-4 border-r">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Your Groups</h2>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="p-2 bg-blue-600 text-white rounded-lg"
            >
              +
            </button>
          </div>
          <div className="space-y-2">
            {groups.map((group) => (
              <button
                key={group._id}
                onClick={() => setSelectedGroup(group._id)}
                className={`w-full text-left p-3 rounded-lg ${
                  selectedGroup === group._id
                    ? "bg-blue-100 dark:bg-blue-900"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <p className="font-medium">{group.name}</p>
                <p className="text-sm text-gray-500 truncate">
                  {group.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Friends</h2>
            <button
              onClick={() => setShowAddFriend(true)}
              className="p-2 bg-green-600 text-white rounded-lg"
            >
              +
            </button>
          </div>
          <div className="space-y-2">
            {friends.map((friend) => (
              <div
                key={friend._id}
                className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <p className="font-medium">{friend.name}</p>
                <p className="text-sm text-gray-500">
                  {friend.serialNumber}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedGroup && selectedGroupData ? (
          <>
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">{selectedGroupData.name}</h2>
              <p className="text-gray-600">{selectedGroupData.description}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${
                    msg.userId === user._id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      msg.userId === user._id
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

            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a group to start chatting
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Add Friend</h3>
            <p className="text-sm text-gray-500 mb-4">
              Your serial number: {userSettings.serialNumber}
            </p>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="Enter friend's serial number"
              className="w-full p-2 border rounded mb-4 dark:bg-gray-700 dark:border-gray-600"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAddFriend(false)}
                className="px-4 py-2 text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFriend}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Add Friend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Create Study Group</h3>
            <input
              type="text"
              value={groupForm.name}
              onChange={(e) =>
                setGroupForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Group name"
              className="w-full p-2 border rounded mb-4 dark:bg-gray-700 dark:border-gray-600"
            />
            <textarea
              value={groupForm.description}
              onChange={(e) =>
                setGroupForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Group description"
              className="w-full p-2 border rounded mb-4 dark:bg-gray-700 dark:border-gray-600"
              rows={3}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateGroup(false)}
                className="px-4 py-2 text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
