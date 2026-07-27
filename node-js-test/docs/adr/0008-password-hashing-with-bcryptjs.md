# ADR 0008: Password hashing with bcryptjs

**Status:** Accepted

## Context

User passwords must never be stored or logged in plain text. The two common options in the Node ecosystem are `bcrypt` (a native addon, faster) and `bcryptjs` (a pure JavaScript reimplementation of the same algorithm, slower under heavy load).

## Decision

Use `bcryptjs`.

## Consequences

Installing dependencies never requires a native addon compilation step (`node-gyp`/build tools), which removes a class of "works on my machine but not on the evaluator's machine" install failures — a real risk for a project someone else will clone and run for the first time. The trade-off is that `bcryptjs` is measurably slower than native `bcrypt` under high concurrent hashing load; irrelevant at this project's scale (login/create-user are not high-throughput paths here), but worth reconsidering if that ever changes.
