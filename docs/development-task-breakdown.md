# Development Task Breakdown

## Product Constraints

- Product positioning stays unchanged: Japanese hiking and camping equipment decision platform.
- Main app language is Japanese.
- Mobile-first web app only.
- Phase 1 excludes public `gear_items`, PDF export, and share links.
- UI should feel closer to Apple + YAMAP than an admin dashboard.

## Phase 1 Epics

### E1. Foundation

- Create Next.js App Router project.
- Configure TypeScript strict mode.
- Configure Tailwind CSS.
- Add mobile-first layout primitives.
- Add environment variable contract.
- Add Supabase clients for browser and server usage.

### E2. Authentication

- Supabase email/password sign up.
- Supabase email/password login.
- Logout.
- Authenticated app shell.
- Profile bootstrap through database trigger.

### E3. Gear Management

- Default gear categories.
- Create user gear.
- Edit user gear.
- Delete user gear.
- Gear list.
- Search by name or brand.
- Filter by category and status.
- Sort by newest, weight, or price.

### E4. Dashboard

- Total gear count.
- Total weight.
- Total value.
- Owned vs wishlist count.
- Base / consumable / worn weight.
- Category weight summary.
- Recent gear.

### E5. AI Recommendation

- Recommendation input form.
- OpenAI structured response.
- Store recommendation records.
- Existing gear vs missing gear analysis.
- Safety-focused Japanese output.

### E6. AI Recommendation History

- Recommendation history list.
- Recommendation detail page.
- Reuse previous input.
- Show missing required and recommended gear.

### E7. Pack Lists

- Create pack list.
- Add owned gear.
- Mark missing gear.
- Calculate total value and weight.
- Convert AI result into draft pack list.

## Sprint 1 Deliverables

- Auth screens.
- App shell.
- Database migration.
- Gear categories.
- User gear CRUD.
- Dashboard summary.
- Mobile-first visual foundation.

## Out of Scope For Sprint 1

- OpenAI integration.
- Pack List CRUD.
- AI recommendation history.
- PDF export.
- Share links.
- Public gear database.

