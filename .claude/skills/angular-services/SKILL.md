---
name: angular-services
description: Angular service design, dependency injection, and providedIn strategy. Activate when editing `.service.ts` files or any `@Injectable()` class — covers DI patterns and singleton evaluation.
license: MIT
compatibility: Requires Angular 20+
---

# Angular Services

## Service Design

- Single responsibility per service
- Use `inject()` function — never constructor injection
- Implement lazy loading for feature routes

## `providedIn` Strategy

**Do NOT default to `providedIn: 'root'`.** For every service, ask: _"Can this truly be a singleton?"_

- **`providedIn: 'root'`** — only for genuine singletons (app-wide state, HTTP clients, auth)
- **Component-level** — when the service is tied to a component's lifecycle
- **Route-level** — when the service should exist only within a feature route
- **No `providedIn`** — when the service needs explicit provisioning by a parent

If in doubt, start without `providedIn` and provide it at the narrowest scope that works.
