# CLAUDE.md

Operational guide for working in this repository with senior-engineer standards.

## Goal

Build a maintainable, secure, testable, and predictable application with:

* **Frontend**: Next.js 16
* **Backend**: Laravel 13
* **Architecture**: clear separation of concerns, stable contracts, and small, safe changes

## Working principles

1. **Prefer clarity over cleverness**. Code should be easy to read, review, and extend.
2. **Do not break existing contracts**. If an API, prop, or payload already exists, preserve compatibility unless explicitly requested otherwise.
3. **Make small, verifiable changes**. Prefer focused PRs/commits.
4. **Validate before assuming**. Check types, requests, responses, migrations, and actual runtime behavior before proposing changes.
5. **Avoid duplication**. Extract repeated logic into components, hooks, services, actions, jobs, or policies as appropriate.
6. **Security is non-negotiable**. Every input must be validated, sanitized, and authorized.
7. **UX must fail gracefully**. Handle loading, empty states, error states, and retries.

## Repository conventions

* Use expressive and consistent naming.
* Avoid premature abstraction.
* Do not introduce new dependencies without a real justification.
* If a task can be solved with native platform capabilities, prefer them before adding libraries.
* When behavior changes, update tests, validations, and relevant documentation.

## Next.js 16

### Base rules

* Use the **App Router** by default.
* Prefer **Server Components** by default.
* Use **Client Components** only when you need client-side interactivity, effects, DOM APIs, or browser-specific behavior.
* Keep client-side code minimal; push logic to the server when possible.
* Keep responsibilities separated clearly:

  * `app/` for routes, layouts, and pages
  * `components/` for reusable UI
  * `lib/` for utilities and data access
  * `server/` or equivalent for server-only logic if the project uses it

### Rendering and data

* Choose the correct rendering strategy for the use case: static, dynamic, streaming, or hybrid.
* Do not force `use client` on an entire route for convenience.
* Handle `loading.tsx`, `error.tsx`, and `not-found.tsx` explicitly when they add value.
* Avoid mixing too many responsibilities into a single page.
* Use server actions or route handlers only when they are the best fit for the flow.

### UI and states

* Every important view should account for:

  * loading
  * empty
  * error
  * unauthorized
  * success
* Reuse pure presentation components.
* Keep forms simple and robust; separate validation, submission, and feedback.

### Data access

* Centralize access to APIs or backend services.
* Normalize responses before exposing them to components.
* Do not call APIs directly from multiple components if you can avoid it.
* If caching or revalidation is involved, define the strategy deliberately.

### Technical quality

* Use TypeScript strictly.
* Type props, responses, parameters, and relevant errors.
* Avoid `any` except at well-justified boundaries.
* Do not ignore compiler or linter warnings.

## Laravel 13

### Structure and approach

* Keep domain logic in the right place: thin controllers, validated requests, and services or actions when they improve clarity.
* Define routes in the appropriate `routes/` files.
* Respect the request lifecycle, middleware, and authorization flow.
* Use `FormRequest` for complex or reusable validation.
* Use policies and gates for domain authorization.

### Routes and middleware

* Web routes belong in `routes/web.php`.
* API routes belong in `routes/api.php`.
* Middleware should be explicit and minimal; do not hide critical rules in hard-to-discover places.
* If a route requires session state, CSRF protection, or authentication, declare it clearly.

### Data and domain

* Validate all user input.
* Use Eloquent with discipline; avoid N+1 queries.
* Eager load relationships explicitly when needed.
* Use transactions for operations that must be atomic.
* Move complex business logic into dedicated classes, not controllers.

### API

* Return consistent response structures.
* Use Resources/transformers when the output contract justifies it.
* Do not expose internal columns, relationships, or metadata unintentionally.
* Errors should be predictable, traceable, and useful.

### Background work

* Use Jobs, Events, and Queues for heavy or decoupled work.
* Do not block the request lifecycle with work that belongs in the background.
* Design idempotent operations whenever possible.

## Authentication and authorization

* **Default auth strategy: Laravel Sanctum**.
* Prefer Sanctum for SPA authentication between Next.js and Laravel when the app uses cookie-based session auth.
* Use Sanctum's CSRF and session flow correctly for browser-based authentication.
* Keep auth state server-driven whenever possible.
* Never trust the client.
* Every sensitive action must be validated in the backend.
* Protect endpoints and actions with the appropriate middleware, policies, and guards.
* Do not mix authorization with presentation.

### Sanctum integration expectations

* Use Sanctum as the first-choice solution for:

  * Next.js SPA authentication against Laravel
  * session-based browser auth
  * authenticated API calls from the frontend
* Ensure the frontend handles:

  * CSRF bootstrap
  * session persistence
  * login/logout flows
  * authenticated fetches with credentials when needed
* Keep auth endpoints and session handling consistent across the application.
* Only use token-based flows when a non-browser client or a separate use case truly requires it.

## Security

* Validate, authorize, and escape everything.
* Do not store secrets in the repository.
* Do not log tokens, passwords, sensitive headers, or unnecessary PII.
* Review uploads, payload size, MIME types, and permissions.
* Minimize the attack surface of any public endpoint.

## Testing

### What to test

* Critical business logic
* Validation
* Authorization
* Data transformation
* Happy paths and error paths
* Important integration flows between frontend and backend

### Criteria

* If you change behavior, add or update tests.
* Prefer clear, high-value tests over brittle implementation-specific tests.
* Do not add unnecessary mocks when a simpler, closer-to-user test is sufficient.

## Implementation style

* Write code that another senior engineer can maintain without extra context.
* Avoid obvious comments; comment only non-trivial decisions.
* If multiple valid paths exist, choose the simplest one that preserves readability and scalability.
* Before refactoring, understand the current behavior.

## Before finishing a task

Check mentally or with tools:

* the change solves exactly the requested task
* it does not accidentally break compatibility
* validations remain correct
* error handling is coherent
* relevant tests exist or were updated
* the code follows project conventions

## Rules for agents

* Do not invent files, APIs, or modules that do not exist.
* If context is missing, inspect the code before concluding.
* If an architectural decision is uncertain, leave a reasoned and explicit recommendation.
* If you detect technical debt, separate it from the immediate task unless it is essential.

## Recommended preferences

* TypeScript for all frontend code.
* PHP 8.3+ for Laravel 13.
* Small, composable components.
* Services or actions for complex domain processes.
* Consistent and typed API responses.
* Tests that protect the most important behavior.

## Senior-level criterion

If something can be done in a simple, safe, and maintainable way, do it that way. If a solution is elegant but difficult to operate, debug, or extend, it is not the right solution.
