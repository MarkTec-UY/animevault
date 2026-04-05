<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Frontend Rules for the Anime Web App AnimeVault

These rules guide any AI agent working on the frontend of this project.

## Tech Stack

* Next.js 16.2.2 with the App Router
* React
* TypeScript
* Tailwind CSS
* TanStack Query (React Query) only where it is useful
* Laravel API on the backend
* Sanctum cookie-based auth

## Product Shape

This is an anime/manga platform similar to MyAnimeList or AniList.

The app is mostly public and SEO-driven:

* anime and manga detail pages
* season pages
* rankings and discovery pages
* search and category pages
* public profiles and public lists when applicable

The app also has user-specific features:

* watchlist / reading list
* favorites
* progress tracking
* ratings and reviews
* personalized dashboards

## Core Rendering Strategy

### Use SSG or ISR by default for public content

Use static generation or incremental static regeneration for pages that:

* are public
* need SEO
* do not depend on the logged-in user
* can be shared across all visitors

Examples:

* `/anime/[slug]`
* `/manga/[slug]`
* `/top-anime`
* `/season/[year]-[season]`
* `/genre/[slug]`
* public landing pages

Rules:

* Prefer static output for page shells and public data.
* Use revalidation for content that changes occasionally.
* Keep the first response fast and cacheable.

### Use CSR for user-specific UI on top of static pages

Use client-side rendering for data that depends on the current user or browser state.

Examples:

* login state
* “Add to list” buttons
* user score
* watched/read progress
* favorite toggles
* notifications
* client-only filters or local UI state

Rules:

* Do not make the whole page dynamic just to show a user-specific widget.
* Keep the page static, then hydrate user-specific parts in client components.
* Use browser fetches with `credentials: "include"` when calling the Laravel API.

### Use SSR only when the page truly needs request-time data

Use server-side rendering for routes that must read request-time information before rendering.

Examples:

* authenticated dashboard pages that must redirect immediately
* pages that depend on request headers or cookies on the server
* server-side redirects or access checks that must happen before HTML is sent

Rules:

* SSR is allowed only when the UX or security requirement justifies it.
* Do not convert a public page to SSR just because it has a login button or a small user widget.
* Keep SSR limited to private routes and request-dependent flows.

## Cookie and Auth Rules

* Authentication is cookie-based through Laravel Sanctum.
* Cookies are stored and validated by the browser and backend, not by static pages.
* Static pages must not read cookies in server code.
* Read cookies() and headers() only in intentionally dynamic server code or Route Handlers.
* Never use cookies(), headers(), or other request-time APIs in routes that are meant to stay static.
* If a route needs cookies on the server, mark it dynamic intentionally.

## TanStack Query Rules

### Use TanStack Query for server state that lives in the browser

Use TanStack Query for data that:

* comes from the Laravel API
* belongs to the user session
* must be cached in the client
* may need refetching or invalidation
* is shared across multiple client components

Good use cases:

* current user profile
* user anime list
* favorites
* progress tracking
* review lists
* search results that the user revisits
* paginated or infinite scrolling lists
* mutations like add/remove/update status

### Do not use TanStack Query for static page content

Do not use TanStack Query for data that:

* is already available at build time
* is public and rendered by SSG or ISR
* does not need client caching
* is only used once in a single component and never reused

Examples that usually do not need TanStack Query:

* static hero content
* public SEO content already rendered by the server
* simple one-off UI state
* local form state
* modal state
* tab state
* pure client-side derived values

### Use TanStack Query when it saves complexity

Use it when any of these are true:

* the same data is needed in multiple components
* the data should stay fresh automatically
* the data can become stale quickly
* you need mutation invalidation
* you want optimistic updates
* you need pagination or infinite scrolling
* you want to avoid duplicated fetch logic

### Keep TanStack Query out of the critical render path for static pages

Rules:

* Do not require TanStack Query for content that should render statically.
* Do not block the main page shell on client-only queries.
* Use it for personalized subcomponents, not for the whole SEO page.

### Query design rules

* Every query must have a stable, serializable query key.
* Include all relevant identifiers in the key, such as IDs, filters, page numbers, and sort order.
* Keep query functions small and reusable.
* Use mutations for writes.
* Invalidate or update the affected queries after mutations.
* Prefer optimistic updates only when the UI benefit is clear and the rollback is safe.

## Recommended Pattern

For public anime/manga pages:

1. Render the public page with SSG or ISR.
2. Load user-specific data in client components.
3. Use TanStack Query for the user-specific API calls.
4. Keep auth cookie handling outside static server rendering.

## Avoid These Mistakes

* Do not use SSR for every page.
* Do not read cookies in static routes.
* Do not store session data in localStorage.
* Do not use TanStack Query as a replacement for all React state.
* Do not use TanStack Query for data that is already static and cacheable at the page level.
* Do not mix public static content and request-specific logic in the same route unless the route is intentionally dynamic.

## Practical Decision Tree

### Use SSG/ISR when:

* the page is public
* SEO matters
* content should be cacheable
* the page does not depend on the current user

### Use CSR when:

* the data belongs to the logged-in user
* the UI depends on browser state
* the feature is interactive and session-based
* the page should stay static but needs personalized widgets

### Use SSR when:

* the server must know the user before rendering
* you need immediate protected redirects
* the route must inspect cookies or headers during render
* the content changes per request and cannot be safely static

### Use TanStack Query when:

* fetching client-side server state
* caching API responses in the browser
* handling pagination or infinite lists
* performing mutations
* syncing user-specific data after login

### Do not use TanStack Query when:

* the content is already statically rendered
* the data is only local UI state
* the feature is a one-off fetch with no reuse, no cache benefit, and no mutation flow

## Default Architecture Rule

Public first, personalized second.

Build the page as static public content whenever possible, then layer user-specific features on top with client components and TanStack Query only where it improves cache, freshness, or mutation handling.

## Design System and UI Rules

### Use shadcn/ui for app UI components

Use shadcn/ui for reusable UI primitives and interactive components.

Good candidates include:

* buttons
* dialogs and sheets
* dropdown menus
* tabs
* alerts
* avatars
* forms
* tables
* tooltips
* badges
* navigation menus
* dropdowns and popovers

Rules:

* Prefer shadcn/ui over inventing custom one-off primitives.
* Keep the generated component code in the codebase so it can be customized.
* Wrap or extend shadcn components only when the app needs a project-specific variant.
* Use `components/ui` for base shadcn components.
* Use `components/shared` or `components/layout` for app-specific wrappers.

### Use Tailwind CSS 4 for styling

Use Tailwind CSS 4 utilities as the primary styling system.

Rules:

* Prefer utility classes over handwritten CSS whenever practical.
* Use CSS variables and semantic theme tokens for colors, surfaces, and accents.
* Avoid Sass, Less, or other CSS preprocessors for the main styling flow.
* Keep global styles minimal and reserve them for theme tokens, base styles, and resets.
* Prefer the Tailwind 4 `@import "tailwindcss";` style setup in the global stylesheet.

### Loading states must feel polished

Any async user-facing area must have a pleasant loading state.

Rules:

* Prefer skeletons over empty space.
* Use skeletons for cards, lists, posters, grids, profile blocks, and tables.
* Match the skeleton layout to the final layout as closely as possible.
* Use `loading.tsx` for route-level loading UI when the route is waiting on server data.
* Use inline skeleton components for client-fetched data.
* Avoid spinners for content-heavy surfaces unless the interaction is tiny or transient.
* The goal is to prevent layout shift and make the UI feel responsive.

## Recommended Folder Structure

Use the App Router and keep the project organized by route and feature. A clean default structure is:

```txt
src/
  app/
    (public)/
      page.tsx
      anime/
        [slug]/
          page.tsx
          loading.tsx
          not-found.tsx
      manga/
        [slug]/
          page.tsx
      top-anime/
        page.tsx
      season/
        [year]/
          [season]/
            page.tsx
    (auth)/
      login/
        page.tsx
      register/
        page.tsx
    (dashboard)/
      dashboard/
        page.tsx
      my-list/
        page.tsx
      favorites/
        page.tsx
    api/
      ...route.ts
    layout.tsx
    loading.tsx
    error.tsx
    not-found.tsx
  components/
    ui/
    shared/
    layout/
  features/
    anime/
    manga/
    user/
    search/
  hooks/
  lib/
  server/
  types/
  styles/
  public/
```

Rules:

* Use route groups like `(public)`, `(auth)`, and `(dashboard)` to organize the app without changing URLs.
* Keep route-specific components close to the route when it improves clarity.
* Keep reusable UI in `components/ui` and cross-feature components in `components/shared`.
* Keep business logic in `features` or `lib`, not inside page files.
* Keep API helpers and auth helpers separate from presentational components.
* Use `src/app` as the main application root when possible.
* Use nested `loading.tsx` files for route-level skeletons.
* Use `layout.tsx` to define shared shells only.
<!-- END:nextjs-agent-rules -->