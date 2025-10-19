/* eslint-disable */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { vol } from 'memfs';
import * as fs from 'fs';
import { findComponents } from './component-discovery';
import { FormworkComponentType } from './models/component-info.model';

describe('Component Discovery: findComponents', () => {
  beforeEach(() => {
    vol.reset();
  });

  const write = (files: Record<string, string | null>) => {
    vol.fromJSON(files, '/project');
  };

  it('discovers components: array/object/identifier hostDirectives & extracts inputs', () => {
    write({
      // Array + object literal with identifier + inputs
      './src/app/component-one.ts': `
        import { Component } from '@angular/core';
        import { NgxfwBlockDirective } from '@ngx-formwork/core';
        @Component({
          selector: 'app-one',
          template: '',
          hostDirectives: [{
            directive: NgxfwBlockDirective,
            inputs: ['content', 'name']
          }]
        })
        export class ComponentOne {}
      `,
      // hostDirectives as identifier; default inputs
      './src/app/component-two.ts': `
        import { Component } from '@angular/core';
        import { ngxfwControlHostDirectives } from '@ngx-formwork/core';
        @Component({
          selector: 'app-two',
          template: '',
          hostDirectives: ngxfwControlHostDirectives
        })
        export class ComponentTwo {}
      `,
      // hostDirectives as identifier (group)
      './src/app/component-three.ts': `
        import { Component } from '@angular/core';
        import { ngxfwGroupHostDirectives } from '@ngx-formwork/core';
        @Component({
          selector: 'app-three',
          template: '',
          hostDirectives: ngxfwGroupHostDirectives
        })
        export class ComponentThree {}
      `,
      // No hostDirectives -> should not be included
      './src/app/component-four.ts': `
        import { Component } from '@angular/core';
        @Component({ selector: 'app-four', template: '' })
        export class ComponentFour {}
      `,
      // Object literal form (not in array) + property access (Module.NgxfwControlDirective)
      './src/app/component-five.ts': `
        import { Component } from '@angular/core';
        import * as FW from '@ngx-formwork/core';
        @Component({
          selector: 'app-five',
          template: '',
          hostDirectives: {
            directive: FW.NgxfwControlDirective,
            inputs: ['content']
          }
        })
        export class ComponentFive {}
      `,
    });

    const result = findComponents('/project');

    // Expect 4 candidates minus the one without hostDirectives = 3 from first block + 1 from component-five = 4
    expect(result).toHaveLength(4);

    expect(result).toEqual(
      expect.arrayContaining([
        {
          type: FormworkComponentType.Block,
          filePath: expect.stringContaining('component-one.ts'),
          className: 'ComponentOne',
          selector: 'app-one',
          directiveInputs: ['content', 'name'],
        },
        {
          type: FormworkComponentType.Control,
          filePath: expect.stringContaining('component-two.ts'),
          className: 'ComponentTwo',
          selector: 'app-two',
          directiveInputs: ['content', 'name'],
        },
        {
          type: FormworkComponentType.Group,
          filePath: expect.stringContaining('component-three.ts'),
          className: 'ComponentThree',
          selector: 'app-three',
          directiveInputs: ['content', 'name'],
        },
        {
          type: FormworkComponentType.Control,
          filePath: expect.stringContaining('component-five.ts'),
          className: 'ComponentFive',
          selector: 'app-five',
          directiveInputs: ['content'],
        },
      ]),
    );

    expect(result.find((c) => c.selector === 'app-four')).toBeUndefined();
  });

  it('respects exclude patterns (no spying on glob)', () => {
    write({
      'src/app/kept/a.ts': `
        import { Component } from '@angular/core';
        import { ngxfwControlHostDirectives } from '@ngx-formwork/core';
        @Component({
          selector: 'ok-a',
          template: '',
          hostDirectives: ngxfwControlHostDirectives
        })
        export class A {}
      `,
      'src/app/excluded/b.ts': `
        import { Component } from '@angular/core';
        import { ngxfwGroupHostDirectives } from '@ngx-formwork/core';
        @Component({
          selector: 'skip-b',
          template: '',
          hostDirectives: ngxfwGroupHostDirectives
        })
        export class B {}
      `,
    });

    const res = findComponents('/project', ['**/*.ts'], ['**/excluded/**']);
    expect(res.map((c) => c.selector)).toEqual(['ok-a']);
  });

  it('deduplicates overlapping include globs', () => {
    write({
      'src/feature/dup.ts': `
        import { Component } from '@angular/core';
        import { NgxfwBlockDirective } from '@ngx-formwork/core';
        @Component({
          selector: 'dup-ok',
          template: '',
          hostDirectives: [{ directive: NgxfwBlockDirective, inputs: ['name'] }]
        })
        export class Dup {}
      `,
    });

    const res = findComponents('/project', ['**/*.ts', 'src/**/*.ts']);
    const hits = res.filter((c) => c.selector === 'dup-ok');
    expect(hits).toHaveLength(1);
  });

  it('handles file read errors gracefully (read error scenario)', () => {
    write({
      // A file that would otherwise match our globs
      'src/app/error.ts': `
        import { Component } from '@angular/core';
        @Component({ selector: 'err', template: '', hostDirectives: [] })
        export class ErrorCmp {}
      `,
    });

    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const readSpy = vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('mock read error');
    });

    const res = findComponents('/project');

    expect(res).toHaveLength(0);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('Error processing file'),
      expect.any(Error),
    );

    readSpy.mockRestore();
    consoleError.mockRestore();
  });
});
