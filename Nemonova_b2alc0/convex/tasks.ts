import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const createTask = mutation({
  args: {
    title: v.string(),
    type: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    reminderTime: v.optional(v.number()),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const taskId = await ctx.db.insert("tasks", {
      userId,
      ...args,
    });

    // Schedule reminder if set
    if (args.reminderTime) {
      const now = Date.now();
      if (args.reminderTime > now) {
        await ctx.scheduler.runAfter(args.reminderTime - now, api.tasks.sendReminder, {
          taskId,
        });
      }
    }

    return taskId;
  },
});

export const listTasks = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("tasks")
      .withIndex("by_userId_and_time", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) {
      throw new Error("Task not found or access denied");
    }

    await ctx.db.patch(args.taskId, {
      completed: args.completed,
    });
  },
});

export const sendReminder = action({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.runQuery(api.tasks.getTask, { taskId: args.taskId });
    if (!task) return;

    // In a real app, you would integrate with a notification service here
    console.log(`Reminder: Task "${task.title}" is due in a few hours!`);
  },
});

export const getTask = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  },
});
