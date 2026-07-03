import { Router, type IRouter } from "express";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
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

  const data = ListAdminPostsResponse.parse(rows);
  res.json(data);
});

router.patch("/admin/posts/:id", requireAdmin, async (req, res) => {
  const params = UpdateAdminPostParams.parse(req.params);
  const body = UpdateAdminPostBody.parse(req.body);

  const [row] = await db
    .update(postsTable)
    .set({ status: body.status })
    .where(eq(postsTable.id, params.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const data = UpdateAdminPostResponse.parse(row);
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
    contactNote: request.contactNote,
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

export default router;
