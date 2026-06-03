# Project Folder Structure

```text
.
├─ app
│  ├─ (auth)
│  │  ├─ login
│  │  │  └─ page.tsx
│  │  └─ signup
│  │     └─ page.tsx
│  ├─ (app)
│  │  ├─ ai
│  │  │  ├─ history
│  │  │  │  └─ page.tsx
│  │  │  ├─ recommendations
│  │  │  │  └─ [id]
│  │  │  │     └─ page.tsx
│  │  │  └─ page.tsx
│  │  ├─ dashboard
│  │  │  └─ page.tsx
│  │  ├─ gear
│  │  │  ├─ [id]
│  │  │  │  └─ edit
│  │  │  │     └─ page.tsx
│  │  │  ├─ new
│  │  │  │  └─ page.tsx
│  │  │  └─ page.tsx
│  │  ├─ profile
│  │  │  └─ page.tsx
│  │  └─ layout.tsx
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ docs
│  ├─ development-task-breakdown.md
│  ├─ project-folder-structure.md
│  └─ sprint-1-plan.md
├─ src
│  ├─ components
│  │  ├─ app-nav.tsx
│  │  ├─ ai-recommendation-form.tsx
│  │  ├─ auth-form.tsx
│  │  ├─ gear-form.tsx
│  │  ├─ gear-list.tsx
│  │  ├─ recommendation-detail.tsx
│  │  ├─ recommendation-history-list.tsx
│  │  ├─ stat-card.tsx
│  │  └─ submit-button.tsx
│  └─ lib
│     ├─ actions
│     │  ├─ ai.ts
│     │  ├─ auth.ts
│     │  └─ gear.ts
│     ├─ data
│     │  ├─ dashboard.ts
│     │  ├─ gear.ts
│     │  └─ recommendations.ts
│     ├─ i18n
│     │  └─ labels.ts
│     ├─ supabase
│     │  ├─ client.ts
│     │  ├─ middleware.ts
│     │  └─ server.ts
│     ├─ utils
│     │  └─ format.ts
│     └─ types.ts
├─ supabase
│  └─ migrations
│     └─ 001_initial_schema.sql
├─ package.json
├─ middleware.ts
├─ tailwind.config.ts
├─ tsconfig.json
└─ next.config.mjs
```

## Structure Notes

- `app/(auth)` contains public authentication routes.
- `app/(app)` contains authenticated product routes.
- `src/lib/actions` contains Server Actions.
- `src/lib/data` contains server-side query helpers.
- `src/components` contains lightweight UI components, not an admin UI kit.
- `supabase/migrations` contains source-controlled database changes.
