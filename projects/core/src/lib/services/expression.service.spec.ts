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

  const expressions: {
    expression: string;
    expected?: unknown;
    description?: string;
    expectError?: boolean;
  }[] = [
    // Equality operators
    {
      expression: 'address.street === "Some Street"',
      expected: true,
      description: 'Strict equality operator (===)',
    },
    {
      expression: 'address.street !== "Some Street"',
      expected: false,
      description: 'Strict inequality operator (!==)',
    },
    {
      expression: 'address.floor == 2',
      expected: true,
      description: 'Abstract equality operator (==)',
    },
    {
      expression: 'address.floor == "2"',
      expected: true,
      description: 'Abstract equality operator with type coercion (==)',
    },
    {
      expression: 'address.floor != 3',
      expected: true,
      description: 'Abstract inequality operator (!=)',
    },

    // Comparison operators
    {
      expression: 'address.floor > 1',
      expected: true,
      description: 'Greater than operator (>)',
    },
    {
      expression: 'address.floor >= 1',
      expected: true,
      description: 'Greater than or equal operator (>=)',
    },
    {
      expression: 'address.floor >= 2',
      expected: true,
      description: 'Greater than or equal operator with equal values (>=)',
    },
    {
      expression: 'address.floor >= 3',
      expected: false,
      description:
        'Greater than or equal operator with larger right value (>=)',
    },
    {
      expression: 'address.floor < 1',
      expected: false,
      description: 'Less than operator (<)',
    },
    {
      expression: 'address.floor <= 1',
      expected: false,
      description: 'Less than or equal operator (<=)',
    },
    {
      expression: 'address.floor <= 2',
      expected: true,
      description: 'Less than or equal operator with equal values (<=)',
    },
    {
      expression: 'address.floor <= 3',
      expected: true,
      description: 'Less than or equal operator with larger right value (<=)',
    },

    // Array and property access
    {
      expression: 'address.notes[1]',
      expected: 'Second door on the right',
      description: 'Array access with index',
    },
    {
      expression: 'address["street"]',
      expected: 'Some Street',
      description: 'Object property access with bracket notation',
    },
    {
      expression: 'account.lastTransaction.type',
      expected: 'withdrawal',
      description: 'Nested object property access with dot notation',
    },

    // Arithmetic operators
    {
      expression: 'person.age + 8',
      expected: 50,
      description: 'Addition operator (+)',
    },
    {
      expression: 'person.age - 2',
      expected: 40,
      description: 'Subtraction operator (-)',
    },
    {
      expression: 'person.age * 2',
      expected: 84,
      description: 'Multiplication operator (*)',
    },
    {
      expression: 'person.age / 2',
      expected: 21,
      description: 'Division operator (/)',
    },
    {
      expression: 'person.age % 5',
      expected: 2,
      description: 'Remainder/modulo operator (%)',
    },
    {
      expression: 'person.age ** 2',
      expected: 1764,
      description: 'Exponentiation operator (**)',
    },
    {
      expression: '-person.age',
      expected: -42,
      description: 'Unary negation operator (-)',
    },
    {
      expression: '+address.houseNumber',
      expected: 69,
      description: 'Unary plus operator with type conversion (+)',
    },

    // Bitwise operators
    {
      expression: 'inventory.totalItems & 255',
      expected: 71, // 583 & 255 = 71
      description: 'Bitwise AND operator (&)',
    },
    {
      expression: 'address.zipCode | 8',
      expected: 12349, // 12345 | 8 = 12349
      description: 'Bitwise OR operator (|)',
    },
    {
      expression: 'address.floor ^ 3',
      expected: 1, // 2 ^ 3 = 1
      description: 'Bitwise XOR operator (^)',
    },
    {
      expression: '~address.floor',
      expected: -3, // ~2 = -3
      description: 'Bitwise NOT operator (~)',
    },
    {
      expression: 'address.floor << 3',
      expected: 16, // 2 << 3 = 16
      description: 'Left shift operator (<<)',
    },
    {
      expression: 'inventory.totalItems >> 3',
      expected: 72, // 583 >> 3 = 72
      description: 'Right shift operator (>>)',
    },
    {
      expression: 'account.balance >>> 4',
      expected: 78, // Integer part of 1250.75 >>> 4 = 78
      description: 'Unsigned right shift operator (>>>)',
    },

    // Logical operators
    {
      expression: 'person.isActive && address.isVerified',
      expected: true,
      description: 'Logical AND operator (&&) with two truthy values',
    },
    {
      expression: 'person.isActive && account.isOverdrawn',
      expected: false,
      description: 'Logical AND operator (&&) with one falsy value',
    },
    {
      expression: 'person.isActive || account.isOverdrawn',
      expected: true,
      description: 'Logical OR operator (||) with one truthy value',
    },
    {
      expression: '!person.isActive || subscription.isAutoRenewal',
      expected: true,
      description: 'Logical OR operator (||) with negated first value',
    },
    {
      expression: '!account.isOverdrawn',
      expected: true,
      description: 'Logical NOT operator (!) with falsy value',
    },
    {
      expression: 'nullValue ?? "No value provided"',
      expected: 'No value provided',
      description: 'Nullish coalescing operator (??) with null left value',
    },
    {
      expression: 'undefinedValue ?? "No value provided"',
      expected: 'No value provided',
      description: 'Nullish coalescing operator (??) with undefined left value',
    },
    {
      expression: 'zero ?? "No value provided"',
      expected: 0,
      description: 'Nullish coalescing operator (??) with zero left value',
    },
    {
      expression: 'emptyString ?? "No value provided"',
      expected: '',
      description:
        'Nullish coalescing operator (??) with empty string left value',
    },

    // Conditional (ternary) operator
    {
      expression: 'person.age > 40 ? "Option A" : "Option B"',
      expected: 'Option A',
      description: 'Conditional/ternary operator (? :) with true condition',
    },
    {
      expression: 'person.age < 30 ? "Option A" : "Option B"',
      expected: 'Option B',
      description: 'Conditional/ternary operator (? :) with false condition',
    },

    // Type operators
    {
      expression: 'typeof person.age',
      expected: 'number',
      description: 'typeof operator with numeric value',
    },
    {
      expression: 'typeof person.firstName',
      expected: 'string',
      description: 'typeof operator with string value',
    },
    {
      expression: 'typeof person.isActive',
      expected: 'boolean',
      description: 'typeof operator with boolean value',
    },
    {
      expression: 'typeof nullValue',
      expected: 'object',
      description: 'typeof operator with null value',
    },

    // String operators
    {
      expression: 'person.firstName + " " + person.lastName',
      expected: 'Hans Mueller',
      description: 'String concatenation with plus operator (+)',
    },
    {
      expression:
        '"Prefix: " + address.street + " " + address.houseNumber + ", " + address.zipCode + " " + address.city',
      expected: 'Prefix: Some Street 69, 12345 Berlin',
      description: 'Multiple string concatenation with variables and literals',
    },

    // Complex expressions
    {
      expression:
        'person.age > 40 && address.floor > 0 && subscription.plan === "premium"',
      expected: true,
      description: 'Multiple logical AND operators with comparison expressions',
    },
    {
      expression: '(person.age > 50 || address.floor > 1) && person.isActive',
      expected: true,
      description:
        'Combination of logical operators with parenthesized expression',
    },
    {
      expression:
        'address.notes.length > 0 ? address.notes[0] : "Alternative text"',
      expected: 'Key under Doormat',
      description: 'Ternary operator with array length property access',
    },
    {
      expression: '(person.age + address.floor) * 2',
      expected: 88,
      description:
        'Arithmetic expression with parentheses for precedence control',
    },
    {
      expression:
        'subscription.plan === "premium" ? subscription.monthlyFee - (subscription.monthlyFee * subscription.discount / 100) : subscription.monthlyFee',
      expected: 25.4915,
      description: 'Ternary operator with complex arithmetic calculation',
    },
    {
      expression:
        'account.balance > account.savingsGoal ? "Message A" : "Message B"',
      expected: 'Message B',
      description: 'Ternary operator with numeric comparison',
    },
    {
      expression:
        'inventory.totalItems < inventory.reorderThreshold ? "Message A" : "Message B"',
      expected: 'Message B',
      description: 'Comparison of numeric values in object properties',
    },

    // Unsupported feature tests
    {
      expression: 'this.person',
      expectError: true,
      description: 'ThisExpression is not supported',
    },
    {
      expression: 'class Example {  }',
      expectError: true,
      description: 'Class is not supported',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExpressionService);
  });

  expressions.forEach((testCase) => {
    if (testCase.expectError) {
      evaluateExpressionExpectingError(
        testCase.expression,
        testCase.description,
      );
    } else {
      evaluateExpression(
        testCase.expression,
        testCase.expected,
        testCase.description,
      );
    }
  });

  function evaluateExpressionExpectingError(
    input: string,
    description?: string,
  ) {
    const testTitle = description
      ? `should throw an error when evaluating ${input} (${description})`
      : `should throw an error when evaluating ${input}`;

    it(testTitle, function () {
      const ast = service.buildExpressionAst(input);
      expect(() => service.evaluate(ast, context)).toThrow();
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
      const ast = service.buildExpressionAst(input);
      expect(service.evaluate(ast, context)).toEqual(output);
    });
  }
});
