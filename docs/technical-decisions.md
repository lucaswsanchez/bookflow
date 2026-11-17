# Technical decisions

Short records of the main decisions taken while building BookFlow, with the reasoning and
the trade-offs accepted.

## 1. Availability is a pure function, computed on the server

**Decision:** `computeAvailableSlots()` (`apps/api/src/availability/availability.engine.ts`)
receives working hours, service duration, busy intervals, the time zone and `now`, and
returns slots. It does no I/O and never reads the clock.

**Why:** availability is the core business rule and the easiest place to introduce subtle
bugs (split shifts, back-to-back bookings, partial overlaps, today vs. future, time zones).
Keeping it pure made it possible to cover those cases with 19 fast unit tests. Computing it
on the server means the client can never offer a slot that isn't valid, and the same function
is reused to re-validate a booking right before it is inserted.

**Trade-off:** slots are generated on a fixed 15-minute grid. That's fine for a barbershop.
Variable grids would be a configuration option, not a redesign.

## 2. Double booking is prevented by the database, not only by code

**Decision:** a PostgreSQL exclusion constraint (`btree_gist` + `tstzrange`) rejects
overlapping non-cancelled appointments for the same staff member. The booking endpoint also
re-checks availability inside a transaction and maps the constraint violation (`23P01`) to
`409 Conflict`.

**Why:** "check, then insert" in application code has a race window: two clients can see the
same free slot and both submit. The constraint makes the invariant impossible to break,
whatever the code path (public booking, re-activating a cancelled appointment, future
features). An e2e test fires two concurrent bookings for the same slot and expects exactly
one `201` and one `409`.

**Trade-off:** it ties the project to PostgreSQL, and Prisma can't express exclusion
constraints, so that part of the migration is hand-written SQL.

## 3. Short-lived JWT access tokens + rotating opaque refresh tokens

**Decision:** access tokens are JWTs that last 15 minutes and are kept in memory in the
browser. Refresh tokens are random strings (`<id>.<secret>`), stored as SHA-256 hashes,
valid for 7 days and **rotated on every use**. Logout revokes them.

**Why:** stateless JWTs keep authorization cheap on every request, while server-side refresh
tokens can be revoked. With rotation, a stolen refresh token only works once. Refresh tokens
are sent in the request body instead of cookies because the web app (Vercel) and the API
(Render) live on different domains, which makes third-party cookies unreliable.

**Trade-off:** the refresh token lives in `localStorage`, so it could be read by an XSS bug.
That risk is reduced by React's escaping and the absence of `dangerouslySetInnerHTML`. With a
custom domain for both apps, an `HttpOnly` same-site cookie would be the next step.

## 4. Roles enforced with global guards; STAFF scoping in the service layer

**Decision:** a global `JwtAuthGuard` (opt-out with `@Public()`) and a global `RolesGuard`
(`@Roles(Role.ADMIN)`). On top of that, `AppointmentsService` always forces
`staffId = user.staffId` for STAFF users, whatever filter they send.

**Why:** secure by default: a new endpoint is protected unless someone marks it public on
purpose. Role checks answer "can this role call this endpoint?", but "which rows can this user
see?" is a data rule, so it lives next to the query. The e2e tests check that a STAFF user
asking for another staff member's agenda still only gets their own, and that changing someone
else's appointment returns 404.

## 5. Dates: `timestamptz` in UTC, business time zone for everything human

**Decision:** appointments are stored as `timestamptz` (UTC instants). Working hours are stored
as "minutes from local midnight" plus a weekday. All conversions use the business's IANA time
zone (`America/Argentina/Buenos_Aires`) via Luxon on the API and `Intl` on the web app.

**Why:** the server (Render, UTC) and the business (UTC-3) disagree about what "today" and
"Tuesday" mean. For example, 21:00 on Tuesday in Corrientes is 00:00 on Wednesday in UTC.
Making the time zone explicit avoids "slots on the wrong day" bugs, and a unit test covers
that exact case.

## 6. Monorepo with pnpm workspaces

**Decision:** `apps/api` and `apps/web` live in one repository with one lockfile and one CI
workflow (two jobs).

**Why:** a single PR can change an endpoint and the screen that uses it, and CI validates both.
The trade-off is that request and response types are duplicated in `apps/web/src/lib/types.ts`.
Generating a typed client from the OpenAPI spec is on the roadmap.

## 7. Deterministic demo seed, re-applied on every deploy

**Decision:** the seed wipes the data and recreates it with a seeded PRNG. Appointments are
generated relative to "today": the past week as history and the next two weeks as upcoming.
It runs on every Render deploy.

**Why:** recruiters and automated E2E tests (Playwright/Postman) need a demo that always has
realistic data, the same users, and free slots to book. Fixed slugs, names and credentials keep
tests stable, and relative dates keep the agenda from going stale.
