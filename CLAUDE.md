# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CondoPlus** — a SaaS condominium management system (SIGE-Condo) built with React + TypeScript, backed by Supabase. Manages billing (boletos), maintenance orders, residents (moradores), financial reports, service requests (atendimentos), and more.

## Commands

```bash
npm run dev        # Dev server on http://localhost:8080
npm run build      # Production build (copies .htaccess to dist/ for Hostinger SPA routing)
npm run build:dev  # Development-mode build
npm run lint       # ESLint checks
npm run preview    # Preview production build locally
npm run test       # Vitest unit tests (run once)
npm run test:watch # Vitest in watch mode
```

## Architecture

### Tech Stack
- **React 18 + TypeScript + Vite 5** (SWC plugin)
- **Routing**: React Router v6
- **UI**: shadcn/ui (Radix UI primitives) + TailwindCSS 3
- **Server state**: TanStack React Query v5
- **Backend**: Supabase (auth, PostgreSQL, storage, edge functions)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **PDF**: jsPDF + jsPDF-AutoTable (client-side export)
- **PWA**: Service Worker + Web App Manifest

### Environment Variables
Required in `.env`:
```
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
```

### Route & Layout Structure
`src/App.tsx` defines all routes. Two layout contexts:
- **MainLayout** (Admin/Sindico/Gerente/Operador): sidebar + header + protected content
- **Portal do Morador** (`/portal`): stripped layout for residents

`ProtectedRoute` redirects unauthenticated users to `/auth`. The sidebar adapts its menu items based on user role (Admin, Sindico, Gerente, Operador, Morador).

### Data Layer Pattern
All server state goes through **React Query hooks** in `src/hooks/`. Each hook:
1. Fetches from Supabase via `useQuery` with filters as query key deps
2. Exposes mutations via `useMutation` + invalidates queries on success
3. Shows toast notifications on error/success

Example: `useBoletos.ts` → `useFinanceiro.ts` → `useAtendimentos.ts`

Never bypass hooks to call Supabase directly in components — keep data logic in hooks.

### Supabase Integration
- Client init: `src/integrations/supabase/client.ts`
- Generated TypeScript types: `src/integrations/supabase/types.ts`
- Edge Functions (Deno): `supabase/functions/`
  - `gerar-boletos-recorrentes` — monthly billing generation
  - `enviar-email-cobranca` — billing email notifications
  - `admin-manage-user` — user creation/role assignment
  - `assistente-atendimento` — AI chat assistant ("Ana")
  - `parse-pdf` — PDF document parsing

### Audit Logging
Every mutation must call `useAuditLogger()` and log via `auditLog({ userId, userEmail, userRole, action, entityType, details })`. This is a compliance requirement — all CRUD actions are tracked in the `audit_logs` table.

### TypeScript Config
Relaxed: `noImplicitAny: false`, `strictNullChecks: false`. Do not tighten these without user confirmation, as many components rely on the loose typing.

### CSS / Design Tokens
HSL design tokens defined in `src/index.css`. Brand colors:
- Sidebar/Primary: dark blue (`hsl(210 60% 20-25%)`)
- Accent/CTA: orange (`hsl(35 92% 55%)`)
- Dark mode via `next-themes` class strategy

### Responsive Design
Tables convert to cards on mobile — this is a consistent pattern across all list pages. The sidebar becomes a drawer on mobile via `MobileMenuContext` in `MainLayout`.

### Deployment
Targets **Hostinger** static hosting. The `build` script copies `public/.htaccess` to `dist/` to handle React Router SPA redirects. The Vite base is `/` (root domain).
