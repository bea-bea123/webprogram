import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listFiles = query({
  args: {
    parentFolderId: v.optional(v.id("files")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const files = await ctx.db
      .query("files")
      .withIndex("by_userId_and_parent", (q) => 
        q.eq("userId", userId).eq("parentFolderId", args.parentFolderId)
      )
      .collect();

    return files;
  },
});

export const getFile = query({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const file = await ctx.db.get(args.fileId);
    if (!file || file.userId !== userId) return null;

    return file;
  },
});

export const createFolder = mutation({
  args: {
    name: v.string(),
    parentFolderId: v.optional(v.id("files")),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("files", {
      userId,
      name: args.name,
      path: args.name,
      type: "folder",
      parentFolderId: args.parentFolderId,
      isFolder: true,
      color: args.color,
    });
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveFile = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(),
    parentFolderId: v.optional(v.id("files")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("files", {
      userId,
      name: args.name,
      path: args.name,
      type: args.type,
      parentFolderId: args.parentFolderId,
      isFolder: false,
      storageId: args.storageId,
    });
  },
});

export const deleteFile = mutation({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const file = await ctx.db.get(args.fileId);
    if (!file || file.userId !== userId) {
      throw new Error("File not found or access denied");
    }

    await ctx.db.delete(args.fileId);
  },
});

export const getFileUrl = query({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const file = await ctx.db.get(args.fileId);
    if (!file || file.userId !== userId || file.isFolder) {
      return null;
    }

    if (!file.storageId) return null;

    return await ctx.storage.getUrl(file.storageId);
  },
});
