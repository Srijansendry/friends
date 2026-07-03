import { Router, type IRouter } from "express";
import { and, count, desc, eq, gte, sql, inArray } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  postsTable,
  connectionRequestsTable,
  adminMessagesTable,
} from "@workspace/db/schema";
import {
  AdminLoginBody,
  AdminLoginResponse,
  GetAdminSessionResponse,
  GetAdminStatsResponse,
  ListAdminPostsQueryParams,
  ListAdminPostsResponse,
  UpdateAdminPostParams,
  UpdateAdminPostBody,
  UpdateAdminPostResponse,
  ListAdminRequestsQueryParams,
  ListAdminRequestsResponse,
  ApproveAdminRequestParams,
  ApproveAdminRequestResponse,
  RejectAdminRequestParams,
  RejectAdminRequestResponse,
  SendAdminMessageParams,
  SendAdminMessageBody,
  SendAdminMessageResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/adminAuth";

const router: IRouter = Router();

router.post("/admin/login", (req, res) => {
  const body = AdminLoginBody.parse(req.body);

  if (body.password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: "Incorrect password" });
    return;
  }

  req.session.isAdmin = true;
  const data = AdminLoginResponse.parse({ authenticated: true });
  res.json(data);
});

router.post("/admin/logout", requireAdmin, (req, res) => {
  req.session.destroy(() => {
    res.status(204).end();
  });
});

router.get("/admin/session", (req, res) => {
  const data = GetAdminSessionResponse.parse({
    authenticated: Boolean(req.session?.isAdmin),
  });
  res.json(data);
});

router.get("/admin/stats", requireAdmin, async (_req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [[totalPosts], [activePosts], [removedPosts], [postsToday]] =
    await Promise.all([
      db.select({ value: count() }).from(postsTable),
      db
        .select({ value: count() })
        .from(postsTable)
        .where(eq(postsTable.status, "active")),
      db
        .select({ value: count() })
        .from(postsTable)
        .where(eq(postsTable.status, "removed")),
      db
        .select({ value: count() })
        .from(postsTable)
        .where(gte(postsTable.createdAt, startOfDay)),
    ]);

  const [[pendingRequests], [approvedRequests]] = await Promise.all([
    db
      .select({ value: count() })
      .from(connectionRequestsTable)
      .where(eq(connectionRequestsTable.status, "pending")),
    db
      .select({ value: count() })
      .from(connectionRequestsTable)
      .where(eq(connectionRequestsTable.status, "approved")),
  ]);

  const data = GetAdminStatsResponse.parse({
    totalPosts: totalPosts.value,
    activePosts: activePosts.value,
    pendingRequests: pendingRequests.value,
    approvedRequests: approvedRequests.value,
    postsToday: postsToday.value,
    removedPosts: removedPosts.value,
  });
  res.json(data);
});

function normalizeAdminPost(row: any) {
  const imageUrls = row.imageUrls && row.imageUrls.length 
    ? row.imageUrls 
    : (row.imageUrl ? [row.imageUrl] : []);
  const imageUrl = imageUrls[0] || null;
  return {
    ...row,
    imageUrl,
    imageUrls
  };
}

router.get("/admin/posts", requireAdmin, async (req, res) => {
  const query = ListAdminPostsQueryParams.parse(req.query);

  const conditions = [];
  if (query.status) {
    conditions.push(eq(postsTable.status, query.status));
  }

  const rows = await db
    .select()
    .from(postsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(postsTable.createdAt))
    .limit(200);

  const normalized = rows.map(normalizeAdminPost);
  const data = ListAdminPostsResponse.parse(normalized);
  res.json(data);
});

router.patch("/admin/posts/:id", requireAdmin, async (req, res) => {
  const params = UpdateAdminPostParams.parse(req.params);
  const body = UpdateAdminPostBody.parse(req.body);

  const updateFields: any = { status: body.status };
  if (body.title !== undefined) updateFields.title = body.title;
  if (body.description !== undefined) updateFields.description = body.description;
  if (body.category !== undefined) updateFields.category = body.category;
  if (body.urgency !== undefined) updateFields.urgency = body.urgency;
  if (body.contactNote !== undefined) updateFields.contactNote = body.contactNote || null;
  if (body.skills !== undefined) updateFields.skills = body.skills;

  const [row] = await db
    .update(postsTable)
    .set(updateFields)
    .where(eq(postsTable.id, params.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const data = UpdateAdminPostResponse.parse(normalizeAdminPost(row));
  res.json(data);
});

async function loadRequestDetail(requestId: number) {
  const [request] = await db
    .select()
    .from(connectionRequestsTable)
    .where(eq(connectionRequestsTable.id, requestId));

  if (!request) return null;

  const [post] = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, request.postId));

  const messages = await db
    .select()
    .from(adminMessagesTable)
    .where(eq(adminMessagesTable.connectionRequestId, requestId))
    .orderBy(adminMessagesTable.createdAt);

  return {
    id: request.id,
    postId: request.postId,
    postTitle: post?.title ?? "Deleted post",
    postCategory: post?.category ?? "other",
    postAlias: post?.alias ?? "Unknown",
    status: request.status,
    message: request.message,
    contactNote: request.contactNote || undefined,
    createdAt: request.createdAt,
    messages,
  };
}

router.get("/admin/requests", requireAdmin, async (req, res) => {
  const query = ListAdminRequestsQueryParams.parse(req.query);

  const conditions = [];
  if (query.status) {
    conditions.push(eq(connectionRequestsTable.status, query.status));
  }

  const requests = await db
    .select()
    .from(connectionRequestsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(connectionRequestsTable.createdAt))
    .limit(200);

  const result = [];
  for (const request of requests) {
    const detail = await loadRequestDetail(request.id);
    if (detail) result.push(detail);
  }

  const data = ListAdminRequestsResponse.parse(result);
  res.json(data);
});

router.post("/admin/requests/:id/approve", requireAdmin, async (req, res) => {
  const params = ApproveAdminRequestParams.parse(req.params);

  const [updated] = await db
    .update(connectionRequestsTable)
    .set({ status: "approved" })
    .where(eq(connectionRequestsTable.id, params.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  const detail = await loadRequestDetail(params.id);
  const data = ApproveAdminRequestResponse.parse(detail);
  res.json(data);
});

router.post("/admin/requests/:id/reject", requireAdmin, async (req, res) => {
  const params = RejectAdminRequestParams.parse(req.params);

  const [updated] = await db
    .update(connectionRequestsTable)
    .set({ status: "rejected" })
    .where(eq(connectionRequestsTable.id, params.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  const detail = await loadRequestDetail(params.id);
  const data = RejectAdminRequestResponse.parse(detail);
  res.json(data);
});

router.post("/admin/requests/:id/messages", requireAdmin, async (req, res) => {
  const params = SendAdminMessageParams.parse(req.params);
  const body = SendAdminMessageBody.parse(req.body);

  const [request] = await db
    .select()
    .from(connectionRequestsTable)
    .where(eq(connectionRequestsTable.id, params.id));

  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  await db.insert(adminMessagesTable).values({
    connectionRequestId: params.id,
    toParty: body.toParty,
    body: body.body,
  });

  const detail = await loadRequestDetail(params.id);
  const data = SendAdminMessageResponse.parse(detail);
  res.json(data);
});

// Permanent Delete Post
router.delete("/admin/posts/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  
  // 1. Delete messages associated with this post's connection requests
  const requests = await db
    .select()
    .from(connectionRequestsTable)
    .where(eq(connectionRequestsTable.postId, id));
    
  if (requests.length > 0) {
    const requestIds = requests.map(r => r.id);
    await db
      .delete(adminMessagesTable)
      .where(inArray(adminMessagesTable.connectionRequestId, requestIds));
  }
  
  // 2. Delete connection requests
  await db
    .delete(connectionRequestsTable)
    .where(eq(connectionRequestsTable.postId, id));
    
  // 3. Delete the post
  const [deleted] = await db
    .delete(postsTable)
    .where(eq(postsTable.id, id))
    .returning();
    
  if (!deleted) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  
  res.json({ success: true, deletedId: id });
});

// Extend Post Expiry by 7 days
router.post("/admin/posts/:id/extend", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const [post] = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, id));
    
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  
  const currentExpiry = post.expiresAt ? new Date(post.expiresAt).getTime() : Date.now();
  const newExpiry = new Date(currentExpiry + 7 * 24 * 60 * 60 * 1000);
  
  const [row] = await db
    .update(postsTable)
    .set({ expiresAt: newExpiry })
    .where(eq(postsTable.id, id))
    .returning();
    
  res.json({ success: true, post: normalizeAdminPost(row) });
});

// Adjust View Count
router.post("/admin/posts/:id/views", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const delta = parseInt(req.body.delta, 10) || 0;
  
  const [post] = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, id));
    
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  
  const newViewCount = Math.max(0, post.viewCount + delta);
  
  const [row] = await db
    .update(postsTable)
    .set({ viewCount: newViewCount })
    .where(eq(postsTable.id, id))
    .returning();
    
  res.json({ success: true, post: normalizeAdminPost(row) });
});

// Reset System
router.post("/admin/reset", requireAdmin, async (req, res) => {
  await db.delete(adminMessagesTable);
  await db.delete(connectionRequestsTable);
  await db.delete(postsTable);
  res.json({ success: true, message: "System database fully reset" });
});

// Seed Mock Data
router.post("/admin/seed", requireAdmin, async (req, res) => {
  const mockPosts = [
    {
      ownerToken: "mocktoken1",
      category: "study_group",
      alias: "Coding Koala #112",
      title: "Algorithms Exam prep group",
      description: "Looking for 3-4 people to solve previous year mid-sem DSA question papers. We will meet in the library twice a week.",
      skills: ["DSA", "C++", "Java"],
      urgency: "urgent",
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      viewCount: 12,
      requestCount: 2
    },
    {
      ownerToken: "mocktoken2",
      category: "project_collab",
      alias: "Aesthetic Fox #402",
      title: "UI designer needed for Hackathon",
      description: "Entering a local mobile app hackathon. We have the backend and ideas set up, just need someone to build the Figma layout.",
      skills: ["Figma", "UI/UX", "Mobile Design"],
      urgency: "casual",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      viewCount: 28,
      requestCount: 4
    },
    {
      ownerToken: "mocktoken3",
      category: "find_friends",
      alias: "Curious Cat #882",
      title: "Bhopal sightseeing / food walk weekend",
      description: "Hey! Just joined LNCT, looking for friends to explore the lake view, try street food, and hang out on Saturday.",
      skills: ["Food", "Bhopal", "Sightseeing"],
      urgency: "casual",
      expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      viewCount: 15,
      requestCount: 1
    }
  ];
  
  const inserted = [];
  for (const p of mockPosts) {
    const [row] = await db.insert(postsTable).values(p).returning();
    inserted.push(row);
  }
  
  res.json({ success: true, count: inserted.length, posts: inserted.map(normalizeAdminPost) });
});

export default router;
