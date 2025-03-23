import { TestBed } from '@angular/core/testing';

import { ExpressionService } from './expression.service';

describe('ExpressionService', () => {
  let service: ExpressionService;

  const context = {
    person: {
      firstName: 'Hans',
      lastName: 'Mueller',
      age: 42,
      isActive: true,
    },
    address: {
      street: 'Some Street',
      houseNumber: '69',
      notes: ['Key under Doormat', 'Second door on the right'],
      floor: 2,
      zipCode: 12345,
      city: 'Berlin',
      country: 'Germany',
      isVerified: true,
    },
    subscription: {
      plan: 'premium',
      startDate: '2023-01-15',
      endDate: '2024-01-15',
      paymentMethod: 'credit_card',
      monthlyFee: 29.99,
      isAutoRenewal: true,
      discount: 15,
      features: ['priority_support', 'no_ads', 'premium_content'],
    },
    account: {
      balance: 1250.75,
      currency: 'EUR',
      isOverdrawn: false,
      lastTransaction: {
        amount: 42.5,
        date: '2025-03-15',
        type: 'withdrawal',
      },
      savingsGoal: 5000,
      investmentRisk: 'moderate',
    },
    inventory: {
      totalItems: 583,
      categories: ['electronics', 'clothing', 'books'],
      mostSold: 'smartphones',
      inStock: true,
      reorderThreshold: 50,
      highestPrice: 999.99,
      lowestPrice: 5.99,
    },
    nullValue: null,
    undefinedValue: undefined,
    zero: 0,
    emptyString: '',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExpressionService);
  });

  // Helper functions for test execution
  function evaluateExpressionExpectingError(
    input: string,
    description?: string,
  ) {
    const testTitle = description
      ? `should throw an error when evaluating ${input} (${description})`
      : `should throw an error when evaluating ${input}`;

    it(testTitle, function () {
      const ast = service.parseExpressionToAst(input);
      expect(() => service.evaluateExpression(ast, context)).toThrow();
    });
  }

  function evaluateExpression(
    input: string,
    output: unknown,
    description?: string,
  ) {
    // Convert the output to string safely, handling different types
    const outputStr =
      output === null
        ? 'null'
        : output === undefined
          ? 'undefined'
          : // eslint-disable-next-line @typescript-eslint/no-base-to-string
            String(output);

    const testTitle = description
      ? `should evaluate ${input} to ${outputStr} (${description})`
      : `should evaluate ${input} to ${outputStr}`;

    it(testTitle, function () {
      const ast = service.parseExpressionToAst(input);
      expect(service.evaluateExpression(ast, context)).toEqual(output);
    });
  }

  describe('Equality Operators', () => {
    evaluateExpression(
      'address.street === "Some Street"',
      true,
      'Strict equality operator (===)',
    );

    evaluateExpression(
      'address.street !== "Some Street"',
      false,
      'Strict inequality operator (!==)',
    );

    evaluateExpression(
      'address.floor == 2',
      true,
      'Abstract equality operator (==)',
    );

    evaluateExpression(
      'address.floor == "2"',
      true,
      'Abstract equality operator with type coercion (==)',
    );

    evaluateExpression(
      'address.floor != 3',
      true,
      'Abstract inequality operator (!=)',
    );
  });

  describe('Comparison Operators', () => {
    evaluateExpression('address.floor > 1', true, 'Greater than operator (>)');

    evaluateExpression(
      'address.floor >= 1',
      true,
      'Greater than or equal operator (>=)',
    );

    evaluateExpression(
      'address.floor >= 2',
      true,
      'Greater than or equal operator with equal values (>=)',
    );

    evaluateExpression(
      'address.floor >= 3',
      false,
      'Greater than or equal operator with larger right value (>=)',
    );

    evaluateExpression('address.floor < 1', false, 'Less than operator (<)');

    evaluateExpression(
      'address.floor <= 1',
      false,
      'Less than or equal operator (<=)',
    );

    evaluateExpression(
      'address.floor <= 2',
      true,
      'Less than or equal operator with equal values (<=)',
    );

    evaluateExpression(
      'address.floor <= 3',
      true,
      'Less than or equal operator with larger right value (<=)',
    );
  });

  describe('Array and Property Access', () => {
    evaluateExpression(
      'address.notes[1]',
      'Second door on the right',
      'Array access with index',
    );

    evaluateExpression(
      'address["street"]',
      'Some Street',
      'Object property access with bracket notation',
    );

    evaluateExpression(
      'account.lastTransaction.type',
      'withdrawal',
      'Nested object property access with dot notation',
    );
  });

  describe('Arithmetic Operators', () => {
    evaluateExpression('person.age + 8', 50, 'Addition operator (+)');

    evaluateExpression('person.age - 2', 40, 'Subtraction operator (-)');

    evaluateExpression('person.age * 2', 84, 'Multiplication operator (*)');

    evaluateExpression('person.age / 2', 21, 'Division operator (/)');

    evaluateExpression('person.age % 5', 2, 'Remainder/modulo operator (%)');

    evaluateExpression('person.age ** 2', 1764, 'Exponentiation operator (**)');

    evaluateExpression('-person.age', -42, 'Unary negation operator (-)');

    evaluateExpression(
      '+address.houseNumber',
      69,
      'Unary plus operator with type conversion (+)',
    );
  });

  describe('Bitwise Operators', () => {
    evaluateExpression(
      'inventory.totalItems & 255',
      71, // 583 & 255 = 71
      'Bitwise AND operator (&)',
    );

    evaluateExpression(
      'address.zipCode | 8',
      12349, // 12345 | 8 = 12349
      'Bitwise OR operator (|)',
    );

    evaluateExpression(
      'address.floor ^ 3',
      1, // 2 ^ 3 = 1
      'Bitwise XOR operator (^)',
    );

    evaluateExpression(
      '~address.floor',
      -3, // ~2 = -3
      'Bitwise NOT operator (~)',
    );

    evaluateExpression(
      'address.floor << 3',
      16, // 2 << 3 = 16
      'Left shift operator (<<)',
    );

    evaluateExpression(
      'inventory.totalItems >> 3',
      72, // 583 >> 3 = 72
      'Right shift operator (>>)',
    );

    evaluateExpression(
      'account.balance >>> 4',
      78, // Integer part of 1250.75 >>> 4 = 78
      'Unsigned right shift operator (>>>)',
    );
  });

  describe('Logical Operators', () => {
    evaluateExpression(
      'person.isActive && address.isVerified',
      true,
      'Logical AND operator (&&) with two truthy values',
    );

    evaluateExpression(
      'person.isActive && account.isOverdrawn',
      false,
      'Logical AND operator (&&) with one falsy value',
    );

    evaluateExpression(
      'person.isActive || account.isOverdrawn',
      true,
      'Logical OR operator (||) with one truthy value',
    );

    evaluateExpression(
      '!person.isActive || subscription.isAutoRenewal',
      true,
      'Logical OR operator (||) with negated first value',
    );

    evaluateExpression(
      '!account.isOverdrawn',
      true,
      'Logical NOT operator (!) with falsy value',
    );

    evaluateExpression(
      'nullValue ?? "No value provided"',
      'No value provided',
      'Nullish coalescing operator (??) with null left value',
    );

    evaluateExpression(
      'undefinedValue ?? "No value provided"',
      'No value provided',
      'Nullish coalescing operator (??) with undefined left value',
    );

    evaluateExpression(
      'zero ?? "No value provided"',
      0,
      'Nullish coalescing operator (??) with zero left value',
    );

    evaluateExpression(
      'emptyString ?? "No value provided"',
      '',
      'Nullish coalescing operator (??) with empty string left value',
    );
  });

  describe('Conditional (Ternary) Operator', () => {
    evaluateExpression(
      'person.age > 40 ? "Option A" : "Option B"',
      'Option A',
      'Conditional/ternary operator (? :) with true condition',
    );

    evaluateExpression(
      'person.age < 30 ? "Option A" : "Option B"',
      'Option B',
      'Conditional/ternary operator (? :) with false condition',
    );
  });

  describe('Type Operators', () => {
    evaluateExpression(
      'typeof person.age',
      'number',
      'typeof operator with numeric value',
    );

    evaluateExpression(
      'typeof person.firstName',
      'string',
      'typeof operator with string value',
    );

    evaluateExpression(
      'typeof person.isActive',
      'boolean',
      'typeof operator with boolean value',
    );

    evaluateExpression(
      'typeof nullValue',
      'object',
      'typeof operator with null value',
    );
  });

  describe('String Operators', () => {
    evaluateExpression(
      'person.firstName + " " + person.lastName',
      'Hans Mueller',
      'String concatenation with plus operator (+)',
    );

    evaluateExpression(
      '"Prefix: " + address.street + " " + address.houseNumber + ", " + address.zipCode + " " + address.city',
      'Prefix: Some Street 69, 12345 Berlin',
      'Multiple string concatenation with variables and literals',
    );
  });

  describe('Array Expressions', () => {
    evaluateExpression('[1, 2, 3]', [1, 2, 3], 'Simple array literal');

    evaluateExpression(
      '[person.age, address.floor, subscription.monthlyFee]',
      [42, 2, 29.99],
      'Array literal with property references',
    );

    evaluateExpression(
      '[1, , 3]',
      [1, undefined, 3],
      'Sparse array with holes',
    );

    evaluateExpression(
      '[...address.notes]',
      ['Key under Doormat', 'Second door on the right'],
      'Array literal with spread element',
    );

    evaluateExpression(
      '[1, 2, ...address.notes, 3, 4]',
      [1, 2, 'Key under Doormat', 'Second door on the right', 3, 4],
      'Array literal with spread element in the middle',
    );

    evaluateExpression(
      '[[1, 2], [3, 4]]',
      [
        [1, 2],
        [3, 4],
      ],
      'Nested array literals',
    );

    evaluateExpression(
      '[...inventory.categories, ...subscription.features]',
      [
        'electronics',
        'clothing',
        'books',
        'priority_support',
        'no_ads',
        'premium_content',
      ],
      'Multiple spread elements in array literal',
    );

    evaluateExpression(
      '[...address.notes, address.notes]',
      [
        'Key under Doormat',
        'Second door on the right',
        ['Key under Doormat', 'Second door on the right'],
      ],
      'Spread followed by the original array',
    );
  });

  describe('Complex Expressions', () => {
    evaluateExpression(
      'person.age > 40 && address.floor > 0 && subscription.plan === "premium"',
      true,
      'Multiple logical AND operators with comparison expressions',
    );

    evaluateExpression(
      '(person.age > 50 || address.floor > 1) && person.isActive',
      true,
      'Combination of logical operators with parenthesized expression',
    );

    evaluateExpression(
      'address.notes.length > 0 ? address.notes[0] : "Alternative text"',
      'Key under Doormat',
      'Ternary operator with array length property access',
    );

    evaluateExpression(
      '(person.age + address.floor) * 2',
      88,
      'Arithmetic expression with parentheses for precedence control',
    );

    evaluateExpression(
      'subscription.plan === "premium" ? subscription.monthlyFee - (subscription.monthlyFee * subscription.discount / 100) : subscription.monthlyFee',
      25.4915,
      'Ternary operator with complex arithmetic calculation',
    );

    evaluateExpression(
      'account.balance > account.savingsGoal ? "Message A" : "Message B"',
      'Message B',
      'Ternary operator with numeric comparison',
    );

    evaluateExpression(
      'inventory.totalItems < inventory.reorderThreshold ? "Message A" : "Message B"',
      'Message B',
      'Comparison of numeric values in object properties',
    );
  });

  describe('Unsupported Features', () => {
    evaluateExpressionExpectingError(
      'this.person',
      'ThisExpression is not supported',
    );

    evaluateExpressionExpectingError(
      'class Example {  }',
      'Class is not supported',
    );

    evaluateExpressionExpectingError(
      'class Example { #privateField = 1; method() { return this.#privateField; } }',
      'PrivateIdentifier is not supported',
    );

    evaluateExpressionExpectingError(
      'class Child extends Parent { method() { return super.parentMethod(); } }',
      'Super is not supported',
    );
  });
});
