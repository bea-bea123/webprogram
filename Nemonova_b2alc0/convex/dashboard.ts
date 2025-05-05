import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    // Get today's and this week's study time
    const now = Date.now();
    const startOfDay = new Date(now).setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now - (new Date().getDay() * 24 * 60 * 60 * 1000)).setHours(0, 0, 0, 0);

    // Get upcoming tasks (due in ≤3 days)
    const threeDaysFromNow = now + (3 * 24 * 60 * 60 * 1000);
    const upcomingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_userId_and_time", (q) => 
        q.eq("userId", userId)
      )
      .filter(q => 
        q.and(
          q.lte(q.field("endTime"), threeDaysFromNow),
          q.gte(q.field("endTime"), now)
        )
      )
      .collect();

    // Get task completion stats
    const completedTasks = await ctx.db
      .query("tasks")
      .withIndex("by_userId_and_time", (q) => 
        q.eq("userId", userId)
      )
      .filter(q => 
        q.and(
          q.gte(q.field("endTime"), startOfDay),
          q.eq(q.field("completed"), true)
        )
      )
      .collect();

    const remainingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_userId_and_time", (q) => 
        q.eq("userId", userId)
      )
      .filter(q => 
        q.and(
          q.gte(q.field("endTime"), now),
          q.eq(q.field("completed"), false)
        )
      )
      .collect();

    // Calculate study time from completed tasks
    const todayStudyTime = completedTasks
      .filter(task => task.endTime >= startOfDay)
      .reduce((total, task) => total + (task.endTime - task.startTime) / (60 * 1000), 0);

    const weekStudyTime = completedTasks
      .filter(task => task.endTime >= startOfWeek)
      .reduce((total, task) => total + (task.endTime - task.startTime) / (60 * 1000), 0);

    return {
      studyTime: {
        today: todayStudyTime,
        thisWeek: weekStudyTime,
      },
      tasks: {
        completed: completedTasks.length,
        remaining: remainingTasks.length,
      },
      upcomingTasks: upcomingTasks.map(task => ({
        ...task,
        dueIn: Math.ceil((task.endTime - now) / (24 * 60 * 60 * 1000)),
      })),
    };
  },
});
