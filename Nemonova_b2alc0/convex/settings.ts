import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

function generateSerialNumber() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export const initUserSettings = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const serialNumber = generateSerialNumber();
    return await ctx.db.insert("userSettings", {
      userId,
      serialNumber,
      theme: "system",
      studyMode: "normal",
      focusMode: false,
      notifications: true,
      studyPreferences: {
        preferredStudyTime: 25 * 60 * 1000, // 25 minutes
        focusDuration: 25 * 60 * 1000,
        breakDuration: 5 * 60 * 1000,
      },
      aiMemory: [],
      totalStudyTime: 0,
    });
  },
});

export const getUserSettings = query({
  args: {},
  handler: async (ctx) => {
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

export const updateSettings = mutation({
  args: {
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"), v.literal("system"))),
    studyMode: v.optional(v.union(v.literal("normal"), v.literal("pomodoro"))),
    focusMode: v.optional(v.boolean()),
    notifications: v.optional(v.boolean()),
    studyPreferences: v.optional(
      v.object({
        preferredStudyTime: v.number(),
        focusDuration: v.number(),
        breakDuration: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const settings = await ctx.db
      .query("userSettings")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (!settings) throw new Error("Settings not found");

    await ctx.db.patch(settings._id, {
      ...args,
    });
  },
});

export const updateStudyTime = mutation({
  args: {
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const settings = await ctx.db
      .query("userSettings")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (!settings) throw new Error("Settings not found");

    await ctx.db.patch(settings._id, {
      totalStudyTime: settings.totalStudyTime + args.duration,
    });
  },
});

export const clearAIMemory = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const settings = await ctx.db
      .query("userSettings")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (!settings) throw new Error("Settings not found");

    await ctx.db.patch(settings._id, {
      aiMemory: [],
    });
  },
});
