---
name: angular-development
description: Expert guidance for developing Angular v20+ applications with TypeScript, standalone components, and signals. Use when writing, reviewing, or refactoring Angular components, services, directives, or templates.
license: MIT
compatibility: Requires Angular 20+ and TypeScript 5+
---

# Angular Development Skill

Expert guidance for developing Angular applications with TypeScript, focusing on standalone components, signals, and modern Angular patterns (Angular v20+).

## Core Principles

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## Angular Best Practices

### Component Architecture
- **Always use standalone components** over NgModules
- **Must NOT set `standalone: true`** inside Angular decorators. It's the default in Angular v20+
- Use signals for state management
- Implement lazy loading for feature routes

### Modern Angular Patterns
- **DO NOT use** `@HostBinding` and `@HostListener` decorators,
- Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images
  - Note: `NgOptimizedImage` does not work for inline base64 images

## Accessibility Requirements

**Critical:** All components must meet accessibility standards.

- It **MUST** pass all AXE checks
- It **MUST** follow all WCAG AA minimums, including:
  - Focus management
  - Color contrast
  - ARIA attributes

## Component Development

### Component Structure
- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones

### Selectors
- Use a consistent app-specific prefix for component selectors (e.g., `app-`)
- Use kebab-case for component selectors (e.g., `app-user-profile`)
- Use camelCase for directive attribute selectors (e.g., `[appTooltip]`)

### Class Member Ordering
1. Angular dependencies (`inject()` calls)
2. Inputs and outputs
3. View/content queries
4. Signals and computed properties
5. Other properties
6. Lifecycle hooks
7. Methods

### Member Visibility
- Use `protected` for members only accessed from the template
- Use `private` for internal members not used in the template
- Apply `readonly` to properties initialized by Angular (inputs, queries)

### Self-Closing Tags
- **Always use self-closing tags** for components and elements without content

```html
<!-- BAD -->
<app-icon></app-icon>
<input type="text"></input>

<!-- GOOD -->
<app-icon />
<input type="text" />
```

### Bindings
- **DO NOT use** `ngClass`, use `class` bindings instead
- **DO NOT use** `ngStyle`, use `style` bindings instead
- **DO NOT use property binding for static strings** — use `attribute="value"` instead of `[attribute]="'value'"` (e.g., `mode="pagination"` not `[mode]="'pagination'"`)
- When using external templates/styles, use paths relative to the component TS file

### Example Component

```typescript
@Component({
  selector: 'app-my-component',
  imports: [/* standalone imports */],
  template: `
    <div [class.active]="isActive()" [style.color]="textColor()">
      @if (isVisible()) {
        <span>{{ displayText() }}</span>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.disabled]': 'disabled()',
    '(click)': 'onToggle()'
  }
})
export class MyComponent {
  // Use input() function, not @Input decorator
  label = input<string>('');
  disabled = input<boolean>(false);
  
  // Use output() function, not @Output decorator
  changed = output<string>();
  
  // Use computed() for derived state
  displayText = computed(() => this.label().toUpperCase());
  
  // Use signal() for local state
  isActive = signal(false);
  isVisible = signal(true);
  textColor = computed(() => this.isActive() ? 'blue' : 'gray');
}
```

## State Management

### Signal Rules

**CRITICAL:** Follow these strict rules for signals and effects.

1. **Use signals for local component state**
2. **Use `computed()` for derived state**
3. **Keep state transformations pure and predictable**
4. **Use `update` or `set`** to modify signal values

### Effects - Critical Rules

**NEVER set a signal inside an effect** - This creates infinite loops and is forbidden.

```typescript
// ❌ WRONG - Setting signal in effect (FORBIDDEN!)
constructor() {
  effect(() => {
    const value = this.someInput();
    this.mySignal.set(value); // INFINITE LOOP!
  });
}

// ✅ CORRECT - Use computed instead
mySignal = computed(() => this.someInput());
```

**Effects are for side effects only:**
- Logging
- Event Emissions
- **NOT for state updates**

## Templates

### Event Handler Naming
- Name event handlers for the **action** they perform, not the triggering event
- Keep lifecycle hook methods simple; delegate complex logic to well-named helper methods
- Never start an event handler naming with "handle"

```typescript
// ❌ WRONG - Named after the event and starting with handle
protected handleClick() { ... }

// ✅ CORRECT - Named after the action
protected saveUserData() { ... }

// ✅ CORRECT - Named after a more generic action
protected onSave() { ... }
```

### Template Best Practices
- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like `new Date()` are available
- Do not write arrow functions in templates (they are not supported)

### Control Flow Examples

```html
<!-- Use native control flow -->
@if (isVisible()) {
  <div>Content</div>
}

@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}

@switch (status()) {
  @case ('active') { <span>Active</span> }
  @case ('inactive') { <span>Inactive</span> }
  @default { <span>Unknown</span> }
}
```

## Services

### Service Design
- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

### Example Service

```typescript
@Injectable({
  providedIn: 'root'
})
export class DataService {
  private http = inject(HttpClient);
  
  getData() {
    return this.http.get('/api/data');
  }
}
```

## Testing

### General Principles
- Use **Vitest** as the test runner (default since Angular 21)
- Use **Angular Testing Library** (`render`, `screen`, `userEvent`) for component tests
- Use **CDK Harnesses** as an escape hatch for overlays and complex widgets
- Test files live alongside the code they test, named `*.spec.ts`

### Component Testing
- **Always use a test host** — render the component via a host template, never instantiate directly with `TestBed.createComponent(CUT)`
- **Use semantic selectors** — prefer `getByRole`, `getByLabelText` over CSS selectors
- **Use `userEvent`** for interactions, not `fireEvent`
- See the [Component Tests](../component-tests/SKILL.md) skill for the full pattern

### Service Testing
- Use `TestBed.inject(ServiceName)` to get service instances
- Mock HTTP calls with `HttpTestingController`
- Provide stub implementations via `{ provide: RealService, useClass: StubService }`

### Async Testing
- Use `await fixture.whenStable()` to wait for async operations
- Use `waitFor` / `findBy*` queries for assertions on async updates
- Use `vi.useFakeTimers()` to control time-dependent behavior

## Quick Reference

### Do's ✅
- Use standalone components (default in v20+)
- Use `input()` and `output()` functions
- Use `computed()` for derived state
- Use `signal()` for local state
- Use native control flow (`@if`, `@for`, `@switch`)
- Use self-closing tags for elements without content
- Use `class` and `style` bindings
- Use `inject()` function for dependency injection
- Set `ChangeDetectionStrategy.OnPush`
- Put host bindings in `host` object
- Use `protected` for template-only members
- Name event handlers after the action, not the event
- Organize files by feature area

### Don'ts ❌
- Don't set `standalone: true` (default in v20+)
- Don't use `@Input` and `@Output` decorators
- Don't set signals inside effects
- Don't use `*ngIf`, `*ngFor`, `*ngSwitch`
- Don't use `ngClass` or `ngStyle`
- Don't use `@HostBinding` or `@HostListener`
- Don't use arrow functions in templates
- Don't name event handlers after events (e.g., `handleClick`)
- Don't put multiple concepts in one file

## Related Skills
- [TypeScript](../typescript/SKILL.md) - TypeScript code style and type safety rules
- [Component Tests](../component-tests/SKILL.md) - Test host pattern, semantic selectors, Angular Testing Library

