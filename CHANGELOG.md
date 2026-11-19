# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Nightly workflow that redeploys the API so the demo seed always matches today.
- Open Graph and Twitter preview image and tags for sharing the live demo.

### Changed

- The web app wakes the free-tier API with a `/health` ping on load.
- `zod` 4 and `@hookform/resolvers` 5 (security advisory fixed).

## [1.0.0] - 2026-11-17

### Added

- Public booking page (`/book/:slug`): service → professional → day → time → details →
  confirmation code, with no account needed.
- Server-side availability engine based on working hours, service duration, existing
  appointments, minimum notice and the business time zone.
- Double-booking protection with a PostgreSQL exclusion constraint plus transactional
  re-validation (`409 Conflict` on races).
- JWT authentication with rotating refresh tokens, `ADMIN` and `STAFF` roles, and login rate
  limiting.
- Admin panel: dashboard (today/week appointments, estimated revenue), agenda with day and week
  views, appointment status changes, and CSV export.
- Management screens for services, staff (with weekly working hours) and clients.
- STAFF users only see and manage their own agenda.
- REST API documented with Swagger/OpenAPI at `/docs`.
- Deterministic demo seed: "Barbería Costanera — Corrientes" with 3 staff members, 6 services,
  20 clients, ~300 appointments, and demo users.
- Test suite: API unit tests (availability engine, guards, validation), API e2e tests with
  Supertest against PostgreSQL, and web component tests with Vitest + Testing Library.
- GitHub Actions CI (lint, typecheck, tests, build), Dockerfiles and docker-compose, Render
  Blueprint and Vercel config.
- Design system (forest / sage / sand palette, Manrope and DM Serif Display) with a `/app/ui`
  showcase page.
- Appointments list with search and filters, and a reports page (revenue, occupancy,
  cancellations, no-shows, most booked services).
- Mobile-first booking page with an "Add to calendar" (.ics) download on confirmation.
- Lazy-loaded admin panel to keep the public booking page light.

[1.0.0]: https://github.com/lucaswsanchez/bookflow/releases/tag/v1.0.0
