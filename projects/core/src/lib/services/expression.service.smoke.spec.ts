import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ExpressionService } from './expression.service';
import { FormContext } from '../types/expression.type';

/**
 * Smoke test for ExpressionService to explore its limits and performance characteristics
 */
describe('ExpressionService Smoke Test', () => {
  let service: ExpressionService;
  let complexContext: FormContext;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExpressionService);

    complexContext = createComplexContext();

    vi.spyOn(console, 'log').mockImplementation((...args) => {
      console.info('SMOKE-TEST:', ...args);
    });

    vi.spyOn(console, 'error').mockImplementation((...args) => {
      console.warn('SMOKE-TEST ERROR:', ...args);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Creates a complex nested context with various data types for testing
   */
  function createComplexContext(): FormContext {
    const largeArray = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      value: `value-${i.toString()}`,
      active: i % 2 === 0,
      score: i * 1.5,
    }));

    const nestedObject = createNestedObject(10);

    return {
      // Basic primitives
      number: 42,
      string: 'test',
      boolean: true,
      null: null as unknown as undefined,
      undefined: undefined,

      // Arrays
      simpleArray: [1, 2, 3, 4, 5],
      largeArray,
      mixedArray: [1, 'string', true, { key: 'value' }, [1, 2, 3]],

      // Objects
      person: {
        firstName: 'John',
        lastName: 'Doe',
        age: 30,
        address: {
          street: '123 Main St',
          city: 'Boston',
          state: 'MA',
          zip: '02108',
          coordinates: {
            lat: 42.3601,
            lng: -71.0589,
          },
        },
        contacts: [
          { type: 'email', value: 'john@example.com' },
          { type: 'phone', value: '555-1234' },
        ],
        isActive: true,
      },

      // Deep objects
      nestedObject,

      // Functions (as strings to be evaluated)
      calculation: {
        simple: 'x => x * 2',
        complex: 'x => x.map(item => item.value * 2).filter(val => val > 100)',
      },
    };
  }

  /**
   * Creates a deeply nested object with specified depth
   * @param depth How many levels deep to nest the object
   * @param prefix Key prefix to use
   */
  function createNestedObject(
    depth: number,
    prefix = 'level',
  ): Record<string, unknown> {
    if (depth <= 0) {
      return { value: 'leaf node' };
    }

    return {
      id: `${prefix}-${depth.toString()}`,
      value: depth * 10,
      active: depth % 2 === 0,
      child: createNestedObject(depth - 1, `${prefix}-${depth.toString()}`),
    };
  }

  /**
   * Tests complex property path access with timing
   */
  it('should handle complex property path access', () => {
    const start = performance.now();

    const expressions = [
      'person.address.coordinates.lat',
      'person.contacts[0].value',
      'person.firstName + " " + person.lastName',
      'largeArray[500].value',
      'nestedObject.child.child.child.child.child.value',
      'nestedObject["child"]["child"]["child"]["id"]',
    ];

    const results = expressions.map((expr) => {
      const ast = service.parseExpressionToAst(expr);
      return service.evaluateExpression(ast, complexContext);
    });

    const end = performance.now();

    console.log(
      `Complex property access completed in ${(end - start).toString()}ms`,
    );
    console.log('Results:', results);

    expect(results[0]).toBe(42.3601);
    expect(results[1]).toBe('john@example.com');
    expect(results[2]).toBe('John Doe');
    expect(typeof results[3]).toBe('string');
    expect(typeof results[4]).toBe('number');
  });

  /**
   * Tests large expression parsing and evaluation performance
   */
  it('should handle large expressions', () => {
    let largeExpression = 'number';
    for (let i = 0; i < 100; i++) {
      largeExpression += ` + ${i.toString()}`;
    }

    const start = performance.now();

    const ast = service.parseExpressionToAst(largeExpression);
    const result = service.evaluateExpression(ast, complexContext);

    const end = performance.now();

    console.log(
      `Large expression (${largeExpression.length.toString()} chars) evaluated in ${(end - start).toString()}ms`,
    );
    console.log('Result:', result);

    const expectedSum = 42 + (99 * 100) / 2;
    expect(result).toBe(expectedSum);
  });

  /**
   * Tests deeply nested expressions
   */
  it('should handle deeply nested expressions', () => {
    let nestedExpression = 'number';
    for (let i = 0; i < 50; i++) {
      nestedExpression = `(${nestedExpression} + 1)`;
    }

    const start = performance.now();

    const ast = service.parseExpressionToAst(nestedExpression);
    const result = service.evaluateExpression(ast, complexContext);

    const end = performance.now();

    console.log(
      `Deeply nested expression (${nestedExpression.length.toString()} chars) evaluated in ${(end - start).toString()}ms`,
    );
    console.log('Result:', result);

    expect(result).toBe(92);
  });

  /**
   * Tests complex conditional expressions
   */
  it('should handle complex conditional expressions', () => {
    const expressions = [
      'person.age > 25 ? "Adult" : "Young"',
      'person.age > 25 && person.isActive ? person.firstName : "Inactive"',
      '(person.age > 25 ? person.address.city : "Unknown") + ", " + person.address.state',
      'largeArray.filter(item => item.active).length > 400 ? "Many active" : "Few active"',
      'person.age > 50 ? (person.isActive ? "Senior active" : "Senior inactive") : (person.isActive ? "Adult active" : "Adult inactive")',
    ];

    const results = expressions.map((expr) => {
      const ast = service.parseExpressionToAst(expr);
      return service.evaluateExpression(ast, complexContext);
    });

    console.log('Conditional results:', results);

    expect(results[0]).toBe('Adult');
    expect(results[1]).toBe('John');
    expect(results[2]).toBe('Boston, MA');
    expect(results[3]).toBe('Many active');
    expect(results[4]).toBe('Adult active');
  });

  /**
   * Tests array and string method calls
   */
  it('should handle complex method chains', () => {
    const expressions = [
      'simpleArray.map(x => x * 2).filter(x => x > 5).join("-")',
      'person.firstName.toUpperCase() + " " + person.lastName.toLowerCase()',
      'largeArray.filter(item => item.id > 900).map(item => item.value).join(", ")',
      'mixedArray.filter(item => typeof item === "number" || typeof item === "string").length',
      'largeArray.map(item => item.score).reduce((sum, score) => sum + score, 0)',
    ];

    const start = performance.now();

    const results = expressions.map((expr) => {
      const ast = service.parseExpressionToAst(expr);
      return service.evaluateExpression(ast, complexContext);
    });

    const end = performance.now();

    console.log(`Method chains completed in ${(end - start).toString()}ms`);
    console.log('Method chain results:', results);

    expect(results[0]).toBe('6-8-10');
    expect(results[1]).toBe('JOHN doe');
    expect(typeof results[2]).toBe('string');
    expect(results[3]).toBe(2); // number of items that are numbers or strings

    const expectedSum = largeArray.reduce((sum, _, i) => sum + i * 1.5, 0);
    expect(results[4]).toBe(expectedSum);
  });

  /**
   * Tests error handling
   */
  it('should handle errors gracefully', () => {
    const errorExpressions = [
      'nonExistentVariable', // Undefined variable
      'person.nonExistentProperty.subProperty', // Property access on undefined
      'null.property', // Property access on null
      'number.toString().toUpperCase()', // Invalid method on number string
      'person / 2', // Invalid operation
      'simpleArray[10].property', // Access of undefined array item
      '(x => x.value)()', // Invalid function call without arguments
      'largeArray.map(item => item.nonExistent).filter(x => x > 10)', // Access of non-existent property in arrow function
    ];

    for (const expr of errorExpressions) {
      const ast = service.parseExpressionToAst(expr);

      try {
        const result = service.evaluateExpression(ast, complexContext);
        console.log(`Unexpected success for "${expr}", got:`, result);
      } catch (error) {
        console.log(
          `Expected error for "${expr}": ${(error as Error).message}`,
        );
        expect(error).toBeDefined();
      }
    }
  });

  /**
   * Tests memory with large operations
   */
  it('should handle operations on large arrays', () => {
    const largeArrayExpr =
      'largeArray.map(item => item.id * item.score).filter(val => val > 1000).length';

    const start = performance.now();

    const ast = service.parseExpressionToAst(largeArrayExpr);
    const result = service.evaluateExpression(ast, complexContext);

    const end = performance.now();

    console.log(
      `Large array operation completed in ${(end - start).toString()}ms`,
    );
    console.log('Result:', result);

    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(0);
  });

  /**
   * Tests for potential stack overflow with deeply recursive structures
   */
  it('should handle deeply recursive structures without stack overflow', () => {
    type DeepContext = {
      value: number;
      next?: DeepContext;
    };
    const depthLimit = 200; // Adjust based on your system's capabilities
    const deepContext: { current: DeepContext } = { current: { value: 1 } };
    let currentObj = deepContext.current;

    for (let i = 0; i < depthLimit; i++) {
      currentObj.next = { value: i + 2 };
      currentObj = currentObj.next;
    }

    const halfwayDepth = Math.floor(depthLimit / 2);
    let deepExpression = 'current';
    for (let i = 0; i < halfwayDepth; i++) {
      deepExpression += '.next';
    }
    deepExpression += '.value';

    try {
      const ast = service.parseExpressionToAst(deepExpression);
      const result = service.evaluateExpression(ast, deepContext);

      console.log(`Deep structure navigation result:`, result);
      expect(result).toBe(halfwayDepth + 1);
    } catch (error) {
      console.error('Stack overflow or other error:', error);
      expect.fail('Should handle deep structures without error');
    }
  });

  /**
   * Tests for service stability by running many expressions sequentially
   */
  it('should maintain stability after processing many expressions', () => {
    const iterations = 1000;
    const expressionTemplates = [
      'number + {0}',
      'person.age > {0} ? "Yes" : "No"',
      'simpleArray[{0} % 5]',
      'string.charAt({0} % string.length)',
      'largeArray[{0}].value',
    ];

    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      const templateIndex = i % expressionTemplates.length;
      const expression = expressionTemplates[templateIndex].replace(
        '{0}',
        i.toString(),
      );

      try {
        const ast = service.parseExpressionToAst(expression);
        service.evaluateExpression(ast, complexContext);
      } catch (error) {
        console.error(`Error at iteration ${i.toString()}:`, error);
        expect.fail(
          `Service should remain stable (failed at iteration ${i.toString()})`,
        );
      }
    }

    const end = performance.now();

    const finalAst = service.parseExpressionToAst('number');
    const finalResult = service.evaluateExpression(finalAst, complexContext);

    console.log(
      `Processed ${iterations.toString()} expressions in ${(end - start).toString()}ms (avg: ${((end - start) / iterations).toString()}ms per expression)`,
    );
    expect(finalResult).toBe(42);
  });

  /**
   * Tests for AST caching performance
   */
  it('should benefit from AST caching for repeated expressions', () => {
    const expression =
      'person.address.coordinates.lat + person.address.coordinates.lng';

    const start1 = performance.now();
    const ast1 = service.parseExpressionToAst(expression);
    const result1 = service.evaluateExpression(ast1, complexContext);
    const end1 = performance.now();

    const start2 = performance.now();
    const ast2 = service.parseExpressionToAst(expression);
    const result2 = service.evaluateExpression(ast2, complexContext);
    const end2 = performance.now();

    console.log(`First evaluation: ${(end1 - start1).toString()}ms`);
    console.log(`Second evaluation: ${(end2 - start2).toString()}ms`);
    console.log(
      `Cache improvement: ${((end1 - start1) / Math.max(0.001, end2 - start2)).toString()}x faster`,
    );

    expect(result1).toBe(result2);
    expect(end2 - start2).toBeLessThanOrEqual(end1 - start1 + 1);
  });
});

/**
 * Mock of the largeArray to satisfy TypeScript in the test
 */
const largeArray = Array.from({ length: 1000 }, (_, i) => ({
  id: i,
  value: `value-${i.toString()}`,
  active: i % 2 === 0,
  score: i * 1.5,
}));
