import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  postsTable,
  connectionRequestsTable,
  adminMessagesTable,
} from "@workspace/db/schema";
import {
  ListPostsQueryParams,
  ListPostsResponse,
  CreatePostBody,
  CreatePostResponse,
  ListTrendingPostsQueryParams,
  ListTrendingPostsResponse,
  GetPostParams,
  GetPostResponse,
  CreateConnectionRequestParams,
  CreateConnectionRequestHeader,
  CreateConnectionRequestBody,
  CreateConnectionRequestResponse,
  ListMyPostsHeader,
  ListMyPostsResponse,
  ListMyRequestsHeader,
  ListMyRequestsResponse,
} from "@workspace/api-zod";
import { generateAlias, generateToken, looksLikeSpam } from "../lib/anon";
import { CATEGORIES } from "./categories";

const router: IRouter = Router();

const CATEGORY_LABELS = new Map(CATEGORIES.map((c) => [c.slug, c.label]));

router.get("/posts", async (req, res) => {
  const query = ListPostsQueryParams.parse(req.query);

  const conditions = [eq(postsTable.status, "active")];
  if (query.category) {
    conditions.push(eq(postsTable.category, query.category));
  }
  if (query.search) {
    const term = `%${query.search}%`;
    conditions.push(
      or(
        ilike(postsTable.title, term),
        ilike(postsTable.description, term),
      )!,
    );
  }

  const orderBy =
    query.sort === "trending"
      ? [
          desc(
            sql`${postsTable.requestCount} * 3 + ${postsTable.viewCount}`,
          ),
          desc(postsTable.createdAt),
        ]
      : [desc(postsTable.createdAt)];

  const rows = await db
    .select()
    .from(postsTable)
    .where(and(...conditions))
    .orderBy(...orderBy)
    .limit(100);

  const data = ListPostsResponse.parse(rows);
  res.json(data);
});

router.post("/posts", async (req, res) => {
  const body = CreatePostBody.parse(req.body);

  if (looksLikeSpam(body.title) || looksLikeSpam(body.description)) {
    res.status(400).json({
      error:
        "Your post looks like it may contain spam or contact info. Please remove links, phone numbers, or social handles — the admin will help share contact info once a connection is approved.",
    });
    return;
  }

  const ownerToken = generateToken();
  const alias = generateAlias();

  const [row] = await db
    .insert(postsTable)
    .values({
      ownerToken,
      category: body.category,
      alias,
      title: body.title,
      description: body.description,
      skills: body.skills ?? [],
    })
    .returning();

  const data = CreatePostResponse.parse({ ...row, ownerToken });
  res.status(201).json(data);
});

router.get("/posts/trending", async (req, res) => {
  const query = ListTrendingPostsQueryParams.parse(req.query);
  const limit = query.limit ?? 6;

  const rows = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.status, "active"))
    .orderBy(
      desc(sql`${postsTable.requestCount} * 3 + ${postsTable.viewCount}`),
      desc(postsTable.createdAt),
    )
    .limit(limit);

  const data = ListTrendingPostsResponse.parse(rows);
  res.json(data);
});

router.get("/posts/:id", async (req, res) => {
  const params = GetPostParams.parse(req.params);

  const [row] = await db
    .update(postsTable)
    .set({ viewCount: sql`${postsTable.viewCount} + 1` })
    .where(eq(postsTable.id, params.id))
    .returning();

  if (!row || row.status === "removed") {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const data = GetPostResponse.parse(row);
  res.json(data);
});

router.post("/posts/:id/requests", async (req, res) => {
  const params = CreateConnectionRequestParams.parse(req.params);
  const headers = CreateConnectionRequestHeader.parse(req.headers);
  const body = CreateConnectionRequestBody.parse(req.body);

  if (looksLikeSpam(body.message)) {
    res.status(400).json({
      error:
        "Your message looks like it may contain spam or contact info. Please remove links, phone numbers, or social handles.",
    });
    return;
  }

  const [post] = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, params.id));

  if (!post || post.status !== "active") {
    res.status(404).json({ error: "Post not found or no longer active" });
    return;
  }

  // The client sends all its stored tokens as a comma-joined header.
  // We need a single, stable token for this requester — pick the first one.
  const rawToken = headers["x-anon-token"];
  const requesterToken = rawToken
    ? (rawToken.split(",").map((t) => t.trim()).filter(Boolean)[0] ?? generateToken())
    : generateToken();

  const [row] = await db
    .insert(connectionRequestsTable)
    .values({
      postId: params.id,
      requesterToken,
      message: body.message,
      contactNote: body.contactNote,
    })
    .returning();

  await db
    .update(postsTable)
    .set({ requestCount: sql`${postsTable.requestCount} + 1` })
    .where(eq(postsTable.id, params.id));

  const data = CreateConnectionRequestResponse.parse({
    ...row,
    requesterToken,
  });
  res.status(201).json(data);
});

function splitTokens(header: string): string[] {
  return header
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

router.get("/me/posts", async (req, res) => {
  const headers = ListMyPostsHeader.parse(req.headers);
  const tokens = splitTokens(headers["x-anon-token"]);

  if (tokens.length === 0) {
    res.json(ListMyPostsResponse.parse([]));
    return;
  }

  const posts = await db
    .select()
    .from(postsTable)
    .where(inArray(postsTable.ownerToken, tokens))
    .orderBy(desc(postsTable.createdAt));

  const result = [];
  for (const post of posts) {
    const requests = await db
      .select()
      .from(connectionRequestsTable)
      .where(eq(connectionRequestsTable.postId, post.id))
      .orderBy(desc(connectionRequestsTable.createdAt));

    const requestsWithMessages = [];
    for (const request of requests) {
      const messages = await db
        .select()
        .from(adminMessagesTable)
        .where(eq(adminMessagesTable.connectionRequestId, request.id))
        .orderBy(adminMessagesTable.createdAt);
      requestsWithMessages.push({
        id: request.id,
        status: request.status,
        message: request.message,
        createdAt: request.createdAt,
        messages: messages.filter((m) => m.toParty === "poster"),
      });
    }

    result.push({ ...post, incomingRequests: requestsWithMessages });
  }

  const data = ListMyPostsResponse.parse(result);
  res.json(data);
});

router.get("/me/requests", async (req, res) => {
  const headers = ListMyRequestsHeader.parse(req.headers);
  const tokens = splitTokens(headers["x-anon-token"]);

  if (tokens.length === 0) {
    res.json(ListMyRequestsResponse.parse([]));
    return;
  }

  const requests = await db
    .select()
    .from(connectionRequestsTable)
    .where(inArray(connectionRequestsTable.requesterToken, tokens))
    .orderBy(desc(connectionRequestsTable.createdAt));

  const result = [];
  for (const request of requests) {
    const [post] = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.id, request.postId));

    const messages = await db
      .select()
      .from(adminMessagesTable)
      .where(eq(adminMessagesTable.connectionRequestId, request.id))
      .orderBy(adminMessagesTable.createdAt);

    result.push({
      id: request.id,
      postId: request.postId,
      postTitle: post?.title ?? "Deleted post",
      postCategory: post?.category ?? "other",
      status: request.status,
      message: request.message,
      createdAt: request.createdAt,
      messages: messages.filter((m) => m.toParty === "requester"),
    });
  }

  const data = ListMyRequestsResponse.parse(result);
  res.json(data);
});

export default router;
export { CATEGORY_LABELS };
