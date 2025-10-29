---
title: Custom Resolvers
keyword: CustomResolvers
sidebar:
  order: 5
---

# Custom Resolvers

While ngx-formwork provides built-in resolvers for components and validators, you may want to implement custom resolvers for specialized use cases. This guide explains how to create and use custom component and validator resolvers in your application.

## Understanding Resolvers

In ngx-formwork, resolvers are responsible for providing components and validators to the form system at runtime. The built-in resolvers use Angular's dependency injection to resolve these dependencies from the configured tokens.

There are two types of resolvers:

1. **Component Resolver**: Maps component type strings (like 'text', 'group') to actual component types
2. **Validator Resolver**: Maps validator name strings to validator functions

## Creating a Custom Component Resolver

To create a custom component resolver, implement the `ComponentResolver` interface:

```typescript
import { Signal, Type, computed, Injectable, signal } from '@angular/core';
import { ComponentResolver } from 'ngx-formwork';

@Injectable()
export class AppCustomComponentResolver implements ComponentResolver {
  // Create a signal with your component mapping
  private readonly _componentMap = signal(new Map<string, Type<unknown>>([
    ['custom-text', MyCustomTextComponent],
    ['special-group', MySpecialGroupComponent],
    // Add more components as needed
  ]));

  // Expose as readonly signal as required by the interface
  readonly registrations = this._componentMap.asReadonly();

  // Optional: Add methods to dynamically update components
  addComponent(key: string, component: Type<unknown>): void {
    const currentMap = new Map(this._componentMap());
    currentMap.set(key, component);
    this._componentMap.set(currentMap);
  }

  removeComponent(key: string): void {
    const currentMap = new Map(this._componentMap());
    currentMap.delete(key);
    this._componentMap.set(currentMap);
  }
}
```

### Advanced Component Resolver

For more complex scenarios, you might want to create a resolver that combines multiple sources:

```typescript
import { Signal, Type, computed, inject, Injectable } from '@angular/core';
import { ComponentResolver, NGX_FW_COMPONENT_REGISTRATIONS } from 'ngx-formwork';

@Injectable()
export class HybridComponentResolver implements ComponentResolver {
  // Inject the default registrations
  private readonly defaultRegistrations = inject(NGX_FW_COMPONENT_REGISTRATIONS);
  
  // Create your dynamic registrations
  private readonly dynamicRegistrations = signal(new Map<string, Type<unknown>>());
  
  // Combine them with computed
  readonly registrations: Signal<ReadonlyMap<string, Type<unknown>>> = computed(() => {
    const result = new Map<string, Type<unknown>>(this.defaultRegistrations);
    
    // Override with dynamic registrations
    for (const [key, component] of this.dynamicRegistrations()) {
      result.set(key, component);
    }
    
    return result;
  });

  // Methods to update dynamic registrations
  updateDynamicComponent(key: string, component: Type<unknown>): void {
    const current = new Map(this.dynamicRegistrations());
    current.set(key, component);
    this.dynamicRegistrations.set(current);
  }
}
```

## Creating a Custom Validator Resolver

Implementing a custom validator resolver follows a similar pattern but requires handling both synchronous and asynchronous validators:

```typescript
import { Signal, Injectable, signal } from '@angular/core';
import { AsyncValidatorFn, ValidatorFn, Validators } from '@angular/forms';
import { ValidatorResolver } from 'ngx-formwork';

@Injectable()
export class AppCustomValidatorResolver implements ValidatorResolver {
  // Create signals for both types of validators
  private readonly _validatorMap = signal(new Map<string, ValidatorFn[]>([
    ['customRequired', [Validators.required, myCustomRequiredValidator]],
    ['passwordStrength', [passwordStrengthValidator]],
    // Add more validators as needed
  ]));
  
  private readonly _asyncValidatorMap = signal(new Map<string, AsyncValidatorFn[]>([
    ['uniqueUsername', [uniqueUsernameValidator]],
    ['serverCheck', [serverCheckValidator]],
    // Add more async validators as needed
  ]));

  // Expose as readonly signals as required by the interface
  readonly registrations = this._validatorMap.asReadonly();
  readonly asyncRegistrations = this._asyncValidatorMap.asReadonly();

  // Optional: Add methods to dynamically update validators
  addValidator(key: string, validators: ValidatorFn[]): void {
    const currentMap = new Map(this._validatorMap());
    currentMap.set(key, validators);
    this._validatorMap.set(currentMap);
  }

  addAsyncValidator(key: string, validators: AsyncValidatorFn[]): void {
    const currentMap = new Map(this._asyncValidatorMap());
    currentMap.set(key, validators);
    this._asyncValidatorMap.set(currentMap);
  }
}
```

## Registering Custom Resolvers

To use your custom resolvers, you need to provide them in your application configuration:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideFormwork } from 'ngx-formwork';
import { NGX_FW_COMPONENT_RESOLVER, NGX_VALIDATOR_RESOLVER } from 'ngx-formwork';
import { AppCustomComponentResolver } from './app-custom-component-resolver';
import { AppCustomValidatorResolver } from './app-custom-validator-resolver';

export const appConfig: ApplicationConfig = {
  providers: [
    // Configure formwork
    provideFormwork(),
    
    // Provide your custom resolvers
    // These MUST come after provideFormwork()
    { 
      provide: NGX_FW_COMPONENT_RESOLVER, 
      useClass: AppCustomComponentResolver 
    },
    { 
      provide: NGX_VALIDATOR_RESOLVER, 
      useClass: AppCustomValidatorResolver 
    },
    // In case you need access to methods from your resolver add this
    // This ensures that you can inject your resolver, get the correct types for it, while still using the same instance that ngx-formwork uses
    {
      provide: AppCustomComponentResolver,
      useExisting: NGX_FW_COMPONENT_RESOLVER,
    },
  ]
};
```

## Use Cases for Custom Resolvers

Custom resolvers can be particularly valuable in the following scenarios:

1. **Dynamic Component Loading** - Load components on-demand based on user actions or application state
2. **Feature-Based Validators** - Switch between different validation rule sets based on application features or user roles
3. **Permission-Based Components** - Show or hide components based on user permissions
4. **Internationalized Validators** - Use different validation rules based on locale or region
5. **A/B Testing** - Swap components for different user groups to test UI variations
6. **Plugin Architecture** - Allow third-party modules to register their own components and validators
7. **Environment-Specific Components** - Use different implementations in development vs. production environments

## Best Practices

When implementing custom resolvers:

1. **Performance**: Use `signal()` efficiently and avoid unnecessary computations
2. **Immutability**: Always create new Maps when updating signals
3. **Error Handling**: Add proper error handling for missing components or validators
4. **Testing**: Create unit tests to verify your resolver's behavior
5. **Integration**: Ensure smooth integration with existing ngx-formwork configurations

## Debug Tips

If you encounter issues with your custom resolvers:

1. Verify that your resolver is properly registered in the DI container
2. Check that your resolver correctly implements the required interface
3. Ensure your resolver is provided at the correct level (root or module)
4. Verify that component and validator names match those used in your form configurations
