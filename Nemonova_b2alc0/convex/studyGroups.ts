import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

function generateSerialNumber() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export const getUserSettings = query({
  args: {},
  handler: async (ctx): Promise<Doc<"userSettings"> | null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const settings = await ctx.db
      .query("userSettings")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (!settings) {
      const settingsId = await ctx.runMutation(internal.settings.initUserSettings);
      return await ctx.db.get(settingsId);
    }

    return settings;
  },
});

export const addFriend = mutation({
  args: {
    serialNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const friendSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_serial", (q) => q.eq("serialNumber", args.serialNumber))
      .first();

    if (!friendSettings) throw new Error("User not found");
    if (friendSettings.userId === userId) throw new Error("Cannot add yourself");

    // Check if friendship already exists
    const existingFriendship = await ctx.db
      .query("friendships")
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("userId1"), userId),
            q.eq(q.field("userId2"), friendSettings.userId)
          ),
          q.and(
            q.eq(q.field("userId1"), friendSettings.userId),
            q.eq(q.field("userId2"), userId)
          )
        )
      )
      .first();

    if (existingFriendship) throw new Error("Friendship already exists");

    return await ctx.db.insert("friendships", {
      userId1: userId,
      userId2: friendSettings.userId,
      status: "pending",
    });
  },
});

export const listFriends = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const friendships = await ctx.db
      .query("friendships")
      .filter((q) =>
        q.or(
          q.eq(q.field("userId1"), userId),
          q.eq(q.field("userId2"), userId)
        )
      )
      .collect();

    const friendIds = friendships.map((f) =>
      f.userId1 === userId ? f.userId2 : f.userId1
    );

    const friends = await Promise.all(
      friendIds.map(async (friendId) => {
        const user = await ctx.db.get(friendId);
        const settings = await ctx.db
          .query("userSettings")
          .filter((q) => q.eq(q.field("userId"), friendId))
          .first();
        return { ...user, serialNumber: settings?.serialNumber };
      })
    );

    return friends;
  },
});

export const createGroup = mutation({
  args: {
    name: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("studyGroups", {
      name: args.name,
      description: args.description,
      creatorId: userId,
      members: [userId],
      points: {
        monthly: {},
        total: {},
      },
      lastActive: Date.now(),
    });
  },
});

export const listGroups = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("studyGroups")
      .filter((q) =>
        q.eq(q.field("members"), [userId])
      )
      .collect();
  },
});

export const getGroupDetails = query({
  args: {
    groupId: v.id("studyGroups"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const group = await ctx.db.get(args.groupId);
    if (!group || !group.members.includes(userId)) return null;

    return group;
  },
});

export const getGroupMessages = query({
  args: {
    groupId: v.id("studyGroups"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const group = await ctx.db.get(args.groupId);
    if (!group || !group.members.includes(userId)) return [];

    return await ctx.db
      .query("groupMessages")
      .withIndex("by_group_and_time", (q) => q.eq("groupId", args.groupId))
      .order("desc")
      .take(50);
  },
});

export const sendMessage = mutation({
  args: {
    groupId: v.id("studyGroups"),
    type: v.union(
      v.literal("text"),
      v.literal("file"),
      v.literal("link"),
      v.literal("image")
    ),
    content: v.string(),
    fileId: v.optional(v.id("files")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const group = await ctx.db.get(args.groupId);
    if (!group || !group.members.includes(userId)) {
      throw new Error("Group not found or access denied");
    }

    await ctx.db.patch(args.groupId, {
      lastActive: Date.now(),
    });

    return await ctx.db.insert("groupMessages", {
      groupId: args.groupId,
      userId,
      type: args.type,
      content: args.content,
      fileId: args.fileId,
      timestamp: Date.now(),
    });
  },
});

export const scheduleSession = mutation({
  args: {
    groupId: v.id("studyGroups"),
    title: v.string(),
    description: v.string(),
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const group = await ctx.db.get(args.groupId);
    if (!group || !group.members.includes(userId)) {
      throw new Error("Group not found or access denied");
    }

    return await ctx.db.insert("studySessions", {
      groupId: args.groupId,
      scheduledBy: userId,
      title: args.title,
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      attendees: [userId],
    });
  },
});
