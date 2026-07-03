---
name: Anonymous multi-token auth pattern
description: How to support users who accumulate multiple anonymous bearer tokens (no login system) across several actions/sessions.
---

When a product has no login system and instead issues an opaque per-action token (e.g. `ownerToken` on create, `requesterToken` on a follow-up action) that the client stores and replays via a header to list "my stuff," a single user/browser will end up holding *multiple* tokens over time (one per post/request/etc).

The natural client-side move is to concatenate all known tokens into one header value (e.g. comma-joined) and send a single request rather than one request per token.

**Why:** A backend route written with a naive `eq(column, header)` match will silently return empty results for every token except the one that happens to equal the full header string — this passes local demo/happy-path testing (single token) but breaks the moment a real user has 2+ tokens, with no error, just missing data.

**How to apply:** Any server route that authenticates via a client-replayed token header in a multi-token-per-user design must: split the header on the client's chosen delimiter (e.g. comma), trim, filter empties, and match with a set-membership operator (SQL `IN` / Drizzle `inArray`) instead of exact equality. Apply this on both ends of the relationship if there are multiple token types (e.g. an "owner" token for created resources and a separate "requester" token for actions taken on other people's resources).
