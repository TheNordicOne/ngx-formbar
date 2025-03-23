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
      12345, // 12345 | 8 = 12345
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

  describe('Unary Operators', () => {
    // Tests for arithmetic unary operators
    evaluateExpression('-person.age', -42, 'Unary negation operator (-)');

    evaluateExpression(
      '+address.houseNumber',
      69,
      'Unary plus operator with string-to-number conversion (+)',
    );

    evaluateExpression('+person.age', 42, 'Unary plus operator with number');

    evaluateExpressionExpectingError(
      '+person.firstName',
      'Unary plus operator with non-numeric string should throw',
    );

    // Tests for logical operators
    evaluateExpression(
      '!account.isOverdrawn',
      true,
      'Logical NOT operator (!) with falsy value',
    );

    evaluateExpression(
      '!person.isActive',
      false,
      'Logical NOT operator (!) with truthy value',
    );

    evaluateExpression(
      '!!person.isActive',
      true,
      'Double logical NOT operator (!!) to convert to boolean',
    );

    // Tests for bitwise operators
    evaluateExpression('~address.floor', -3, 'Bitwise NOT operator (~)');

    evaluateExpression('~0', -1, 'Bitwise NOT operator (~) with zero');

    evaluateExpressionExpectingError(
      '~"string"',
      'Bitwise NOT operator (~) with non-number should throw',
    );

    // Tests for type operators
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

    evaluateExpression(
      'typeof undefinedValue',
      'undefined',
      'typeof operator with undefined value',
    );

    evaluateExpression(
      'typeof address',
      'object',
      'typeof operator with object value',
    );

    // Tests for void operator
    evaluateExpression(
      'void 0',
      undefined,
      'void operator returns undefined regardless of operand',
    );

    evaluateExpression(
      'void person.age',
      undefined,
      'void operator with variable reference',
    );

    evaluateExpression(
      'void (person.age + 10)',
      undefined,
      'void operator with complex expression',
    );

    // Tests for delete operator
    evaluateExpressionExpectingError(
      'delete person.age',
      'delete operator should not be supported for safety',
    );

    // Tests for more complex combinations
    evaluateExpression('-(-person.age)', 42, 'Double negation');

    evaluateExpression('~(~address.floor)', 2, 'Double bitwise NOT');

    evaluateExpression(
      'typeof !person.isActive',
      'boolean',
      'typeof with logical NOT',
    );

    evaluateExpression(
      'typeof typeof person.age',
      'string',
      'typeof operator applied to result of typeof',
    );

    evaluateExpression(
      '!(person.age > 50)',
      true,
      'Logical NOT with comparison expression',
    );
  });

  // Additional tests to improve coverage for ExpressionService

  describe('Error Handling for Division and Modulo', () => {
    evaluateExpressionExpectingError(
      'person.age / 0',
      'Division by zero should throw an error',
    );

    evaluateExpressionExpectingError(
      'person.age % 0',
      'Modulo by zero should throw an error',
    );
  });

  describe('In Operator', () => {
    evaluateExpression(
      '"street" in address',
      true,
      'In operator with existing property',
    );

    evaluateExpression(
      '"nonExistentProperty" in address',
      false,
      'In operator with non-existent property',
    );

    // The 'in' operator might not be fully implemented for arrays in the service
    // Instead, let's check for strings in objects which is the primary use case
    evaluateExpression(
      '"0" in address.notes',
      true,
      'In operator with array index as string',
    );

    evaluateExpressionExpectingError(
      '123 in address',
      'In operator with non-string left operand should throw',
    );

    evaluateExpressionExpectingError(
      '"property" in person.age',
      'In operator with non-object right operand should throw',
    );
  });

  describe('Parenthesized Expressions', () => {
    evaluateExpression(
      '(person.age + 5) * 2',
      94,
      'Parenthesized addition then multiplication',
    );

    evaluateExpression(
      'person.age + (5 * 2)',
      52,
      'Addition with parenthesized multiplication',
    );

    evaluateExpression(
      '(person.age > 40) === (address.floor < 3)',
      true,
      'Comparing results of parenthesized comparisons',
    );

    evaluateExpression('(((person.age)))', 42, 'Nested parentheses');
  });

  describe('Type Error Conditions', () => {
    evaluateExpressionExpectingError(
      'person.firstName - 5',
      'String subtraction should throw type error',
    );

    evaluateExpressionExpectingError(
      'person.firstName * 5',
      'String multiplication should throw type error',
    );

    evaluateExpressionExpectingError(
      'person.firstName / 5',
      'String division should throw type error',
    );

    evaluateExpressionExpectingError(
      'person.firstName % 5',
      'String modulo should throw type error',
    );

    evaluateExpressionExpectingError(
      'person.firstName ** 5',
      'String exponentiation should throw type error',
    );

    evaluateExpressionExpectingError(
      'person.firstName & 5',
      'String bitwise AND should throw type error',
    );

    evaluateExpressionExpectingError(
      'person.firstName | 5',
      'String bitwise OR should throw type error',
    );

    evaluateExpressionExpectingError(
      'person.firstName ^ 5',
      'String bitwise XOR should throw type error',
    );

    evaluateExpressionExpectingError(
      'person.firstName << 5',
      'String left shift should throw type error',
    );

    evaluateExpressionExpectingError(
      'person.firstName >> 5',
      'String right shift should throw type error',
    );

    evaluateExpressionExpectingError(
      'person.firstName >>> 5',
      'String unsigned right shift should throw type error',
    );
  });

  describe('Null and Undefined Property Access', () => {
    evaluateExpressionExpectingError(
      'nullValue.property',
      'Property access on null should throw',
    );

    evaluateExpressionExpectingError(
      'undefinedValue.property',
      'Property access on undefined should throw',
    );

    evaluateExpressionExpectingError(
      'nullValue[0]',
      'Array access on null should throw',
    );

    evaluateExpressionExpectingError(
      'undefinedValue[0]',
      'Array access on undefined should throw',
    );

    evaluateExpressionExpectingError(
      'nullValue["property"]',
      'Object property access on null should throw',
    );

    evaluateExpressionExpectingError(
      'undefinedValue["property"]',
      'Object property access on undefined should throw',
    );
  });

  describe('Non-existent Property Access', () => {
    evaluateExpression(
      'person.nonExistentProperty',
      undefined,
      'Access to non-existent property should return undefined',
    );

    evaluateExpression(
      'address.notes[10]',
      undefined,
      'Access to non-existent array index should return undefined',
    );
  });

  describe('Invalid Property Access', () => {
    // Accessing properties on primitives might not throw in the current implementation
    // Let's modify these tests to match the actual behavior

    // With our improved implementation, this should throw an error
    evaluateExpressionExpectingError(
      'person.age.nonExistentProperty',
      'Property access on a number should throw an error',
    );

    evaluateExpressionExpectingError(
      'person.firstName[0].something',
      'Property access on a string character should throw an error',
    );

    evaluateExpressionExpectingError(
      'person.isActive.toString',
      'Property access on a boolean should throw an error',
    );
  });

  describe('Complex Array Operations', () => {
    evaluateExpression(
      'address.notes.length',
      2,
      'Array length property access',
    );

    evaluateExpression(
      '[...address.notes, ...address.notes].length',
      4,
      'Concatenated arrays with spread operator',
    );

    evaluateExpression(
      '[1, 2, 3][1]',
      2,
      'Direct array literal with index access',
    );
  });

  describe('Complex Type Coercion Cases', () => {
    evaluateExpression(
      'address.zipCode == "12345"',
      true,
      'Number to string comparison with ==',
    );

    evaluateExpression(
      '"" == 0',
      true,
      'Empty string equals zero with abstract equality',
    );

    evaluateExpression(
      '"" === 0',
      false,
      'Empty string not strictly equal to zero',
    );

    // Function calls aren't supported, so we should use a direct boolean expression instead
    evaluateExpression(
      '!!person.age && !!address.floor',
      true,
      'Double negation for boolean conversion',
    );

    evaluateExpression(
      'person.isActive && address.isVerified && true',
      true,
      'Multiple boolean ANDs',
    );

    evaluateExpression(
      '!!address.notes',
      true,
      'Double negation of an array returns true',
    );

    evaluateExpression(
      '!!emptyString',
      false,
      'Double negation of empty string returns false',
    );

    evaluateExpression(
      '!!zero',
      false,
      'Double negation of zero returns false',
    );
  });

  describe('Multi-Level Property Access', () => {
    evaluateExpression(
      'account.lastTransaction.amount',
      42.5,
      'Multi-level nested property access',
    );

    evaluateExpression(
      'subscription.features[0]',
      'priority_support',
      'Array element inside nested property',
    );

    evaluateExpression(
      'address.notes[address.floor - 1]',
      'Second door on the right',
      'Dynamic array access with expression as index',
    );
  });
});
