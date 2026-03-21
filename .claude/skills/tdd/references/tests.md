# TDD Test Examples

For general test philosophy (black box, selectors, forbidden patterns), see the `testing-principles` skill.

These examples illustrate the TDD-specific concern: **tests as specifications**.

## Tests Should Read Like Specifications

A test name describes a capability, not an implementation step:

```typescript
// GOOD: Describes a capability
test('user can checkout with valid cart', async () => {
  const cart = createCart();
  cart.add(product);
  const result = await checkout(cart, paymentMethod);
  expect(result.status).toBe('confirmed');
});

// BAD: Describes an implementation step
test('checkout calls paymentService.process', async () => {
  const mockPayment = jest.mock(paymentService);
  await checkout(cart, payment);
  expect(mockPayment.process).toHaveBeenCalledWith(cart.total);
});
```

## Verify Through the Interface, Not Around It

```typescript
// BAD: Bypasses the interface
test('createUser saves to database', async () => {
  await createUser({ name: 'Alice' });
  const row = await db.query('SELECT * FROM users WHERE name = ?', ['Alice']);
  expect(row).toBeDefined();
});

// GOOD: Verifies through the interface
test('createUser makes user retrievable', async () => {
  const user = await createUser({ name: 'Alice' });
  const retrieved = await getUser(user.id);
  expect(retrieved.name).toBe('Alice');
});
```
