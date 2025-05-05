import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.CONVEX_OPENAI_API_KEY,
});

export const getCurrentChat = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const chats = await ctx.db
      .query("aiChats")
      .withIndex("by_user_and_time", (q) => q.eq("userId", userId))
      .order("desc")
      .take(1);

    return chats[0] || { messages: [] };
  },
});

export const getChatHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("aiChats")
      .withIndex("by_user_and_time", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const startNewChat = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("aiChats", {
      userId,
      messages: [],
      lastActive: Date.now(),
    });
  },
});

export const sendMessage = mutation({
  args: {
    content: v.string(),
    tone: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const chats = await ctx.db
      .query("aiChats")
      .withIndex("by_user_and_time", (q) => q.eq("userId", userId))
      .order("desc")
      .take(1);

    let chatId;
    if (chats.length === 0) {
      chatId = await ctx.db.insert("aiChats", {
        userId,
        messages: [],
        lastActive: Date.now(),
      });
    } else {
      chatId = chats[0]._id;
    }

    const userMessage = {
      role: "user",
      content: args.content,
      timestamp: Date.now(),
    };

    await ctx.db.patch(chatId, {
      messages: [...(chats[0]?.messages || []), userMessage],
      lastActive: Date.now(),
    });

    // Schedule the AI response
    await ctx.scheduler.runAfter(0, api.aiChats.generateResponse, {
      chatId,
      tone: args.tone,
    });

    return chatId;
  },
});

export const generateResponse = action({
  args: {
    chatId: v.id("aiChats"),
    tone: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.runQuery(api.aiChats.getChat, { chatId: args.chatId });
    if (!chat) return;

    const messages = chat.messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages: [
          {
            role: "system",
            content: `You are a helpful AI study assistant. Your tone should be ${args.tone}. If the user seems stressed or vents, offer support and mental wellness advice. If insulted, apologize and ask for clarification.`,
          },
          ...messages,
        ],
      });

      const assistantMessage = {
        role: "assistant",
        content: completion.choices[0].message.content || "I'm not sure how to respond to that.",
        timestamp: Date.now(),
      };

      await ctx.runMutation(api.aiChats.addMessage, {
        chatId: args.chatId,
        message: assistantMessage,
      });
    } catch (error) {
      console.error("Failed to generate response:", error);
      const errorMessage = {
        role: "assistant",
        content: "I apologize, but I'm having trouble responding right now. Please try again.",
        timestamp: Date.now(),
      };
      await ctx.runMutation(api.aiChats.addMessage, {
        chatId: args.chatId,
        message: errorMessage,
      });
    }
  },
});

export const getChat = query({
  args: {
    chatId: v.id("aiChats"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.chatId);
  },
});

export const addMessage = mutation({
  args: {
    chatId: v.id("aiChats"),
    message: v.object({
      role: v.string(),
      content: v.string(),
      timestamp: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) return;

    await ctx.db.patch(args.chatId, {
      messages: [...chat.messages, args.message],
      lastActive: Date.now(),
    });
  },
});

export const processFile = mutation({
  args: {
    fileId: v.id("files"),
    action: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const file = await ctx.db.get(args.fileId);
    if (!file || file.userId !== userId) {
      throw new Error("File not found or access denied");
    }

    // Get file content from storage
    const fileUrl = await ctx.storage.getUrl(file.storageId!);
    if (!fileUrl) throw new Error("File not found in storage");

    // Schedule file processing
    await ctx.scheduler.runAfter(0, api.aiChats.processFileContent, {
      fileId: args.fileId,
      action: args.action,
    });
  },
});

export const processFileContent = action({
  args: {
    fileId: v.id("files"),
    action: v.string(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.runQuery(api.files.getFile, { fileId: args.fileId });
    if (!file) return;

    // In a real app, you would:
    // 1. Download the file content
    // 2. Process it based on the action (summarize, quiz, etc.)
    // 3. Generate the appropriate response
    // For now, we'll just send a placeholder message

    const message = {
      role: "assistant",
      content: `I've processed "${file.name}". Here's a summary: [File processing coming soon]`,
      timestamp: Date.now(),
    };

    const chats = await ctx.runQuery(api.aiChats.getCurrentChat);
    if (!chats) return;

    await ctx.runMutation(api.aiChats.addMessage, {
      chatId: chats._id,
      message,
    });
  },
});
