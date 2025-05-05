import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  files: defineTable({
    userId: v.id("users"),
    name: v.string(),
    path: v.string(),
    type: v.string(),
    parentFolderId: v.optional(v.id("files")),
    isFolder: v.boolean(),
    color: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
  }).index("by_userId_and_parent", ["userId", "parentFolderId"]),

  tasks: defineTable({
    userId: v.id("users"),
    title: v.string(),
    type: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    reminderTime: v.optional(v.number()),
    completed: v.boolean(),
  }).index("by_userId_and_time", ["userId", "endTime"]),

  studyGroups: defineTable({
    name: v.string(),
    description: v.string(),
    creatorId: v.id("users"),
    members: v.array(v.id("users")),
    points: v.object({
      monthly: v.record(v.string(), v.number()),
      total: v.record(v.string(), v.number()),
    }),
    lastActive: v.number(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_member", ["members"]),

  groupMessages: defineTable({
    groupId: v.id("studyGroups"),
    userId: v.id("users"),
    type: v.union(
      v.literal("text"),
      v.literal("file"),
      v.literal("link"),
      v.literal("image")
    ),
    content: v.string(),
    fileId: v.optional(v.id("files")),
    timestamp: v.number(),
  }).index("by_group_and_time", ["groupId", "timestamp"]),

  studySessions: defineTable({
    groupId: v.id("studyGroups"),
    scheduledBy: v.id("users"),
    title: v.string(),
    description: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    attendees: v.array(v.id("users")),
  }).index("by_group", ["groupId"]),

  quizzes: defineTable({
    groupId: v.id("studyGroups"),
    createdBy: v.id("users"),
    title: v.string(),
    questions: v.array(
      v.object({
        question: v.string(),
        options: v.array(v.string()),
        correctAnswer: v.number(),
      })
    ),
    participants: v.array(
      v.object({
        userId: v.id("users"),
        score: v.number(),
        completed: v.boolean(),
      })
    ),
    fileId: v.optional(v.id("files")),
    expiresAt: v.number(),
  }).index("by_group", ["groupId"]),

  friendships: defineTable({
    userId1: v.id("users"),
    userId2: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted")),
  })
    .index("by_user1", ["userId1"])
    .index("by_user2", ["userId2"]),

  userSettings: defineTable({
    userId: v.id("users"),
    serialNumber: v.string(),
    theme: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
    studyMode: v.union(v.literal("normal"), v.literal("pomodoro")),
    focusMode: v.boolean(),
    notifications: v.boolean(),
    studyPreferences: v.object({
      preferredStudyTime: v.number(),
      focusDuration: v.number(),
      breakDuration: v.number(),
    }),
    aiMemory: v.array(
      v.object({
        role: v.string(),
        content: v.string(),
        timestamp: v.number(),
      })
    ),
    totalStudyTime: v.number(),
  }).index("by_serial", ["serialNumber"]),

  aiChats: defineTable({
    userId: v.id("users"),
    messages: v.array(
      v.object({
        role: v.string(),
        content: v.string(),
        timestamp: v.number(),
      })
    ),
    lastActive: v.number(),
  }).index("by_user_and_time", ["userId", "lastActive"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
