---
name: angular-service-tests
description: Angular service and HTTP testing patterns. Activate when writing or reviewing `*.spec.ts` files for Angular services — covers TestBed setup, HttpTestingController, and dependency mocking strategies.
license: MIT
compatibility: Requires Vitest, Angular TestBed
---

# Angular Service Tests

Test services through their public API. Follow the testing-principles skill for mocking philosophy.

## Service Setup

```ts
import { TestBed } from '@angular/core/testing';

const service = TestBed.inject(MyService);
```

## HTTP Testing

```ts
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  httpMock = TestBed.inject(HttpTestingController);
});

afterEach(() => {
  httpMock.verify(); // Ensure no unexpected requests
});
```

## Mocking Dependencies

- `{ provide: RealService, useClass: StubService }` — for full replacements
- `{ provide: RealService, useValue: { method: vi.fn() } }` — for minimal stubs
- Mock only what's necessary — prefer real implementations when practical

## Rules

- Test behavior, not implementation — call public methods, assert on returned values and side effects
- Verify HTTP requests match expected URLs, methods, and bodies
- Always call `httpMock.verify()` in `afterEach`
- Use `await fixture.whenStable()` for async operations
