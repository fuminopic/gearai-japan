# Sprint 1 Development Plan

## Sprint Goal

Build the foundation that lets Japanese users sign up, log in, and manage personal hiking or camping gear from a mobile-first web app.

## Scope

### Authentication

- Sign up page.
- Login page.
- Logout action.
- Profile creation through database trigger.
- Protected app shell.

### Database

- `profiles`
- `gear_categories`
- `user_gear`
- `pack_lists`
- `pack_list_items`
- `mountains`
- `ai_recommendations`
- Row Level Security.
- Default Japanese gear categories.

### Gear Management

- Gear list.
- Create gear.
- Edit gear.
- Delete gear.
- Search by name and brand.
- Filter by status and category.
- Sort by newest, weight, or price.
- Mobile-first card list.

### Dashboard

- Total gear count.
- Total weight.
- Total value.
- Owned / wishlist counts.
- Weight by type.
- Category weight summary.
- Recent gear.

## UI Direction

- Calm, clean, product-like interface.
- Mobile-first spacing and hierarchy.
- Large readable numbers for weight and value.
- Card-like summaries, but not dense admin tables.
- Japanese labels and product copy.
- Outdoor context through terminology and information hierarchy rather than decorative clutter.

## Acceptance Criteria

- User can sign up and log in with Supabase Auth.
- User can only read and write their own gear.
- User can create, edit, delete, search, filter, and sort gear.
- Dashboard reflects current user gear.
- Default categories are available in Japanese.
- App works comfortably on a phone viewport.
- No public gear database is included.
- PDF export and share links are not included.

## Implementation Order

1. Project config.
2. Supabase schema migration.
3. Supabase server and browser clients.
4. Auth actions and auth pages.
5. App shell and navigation.
6. Gear data helpers.
7. Gear Server Actions.
8. Gear list, create, and edit pages.
9. Dashboard summary.
10. Final review.

