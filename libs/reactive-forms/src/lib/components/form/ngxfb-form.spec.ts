import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NgxFbForm, staticComponent } from '@ngx-formbar/core';
import { provideFormbar } from '../../config/provide-formbar';
import { controlContainerViewProviders } from '../../helper/control-container-view-providers';
import { NGXFB_ARRAY_CONTROL } from '../../tokens/control-entries';
import { NgxFbFormComponent } from './ngxfb-form.component';

@Component({
  selector: 'ngxfb-test-text',
  imports: [ReactiveFormsModule],
  // eslint-disable-next-line @angular-eslint/component-max-inline-declarations
  template: `<span class="mounted">{{ name() }}</span>
    @if (!isHidden()) {
      <input [formControlName]="name()" />
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: controlContainerViewProviders,
})
class TextComponent {
  readonly name = input.required<string>();
  readonly isHidden = input(false);
}

@Component({
  selector: 'ngxfb-test-group',
  template: `<span class="title">{{ titleText() }}</span
    ><span class="hidden-state">{{ isHidden() }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: controlContainerViewProviders,
})
class GroupComponent {
  readonly titleText = input<string>();
  readonly isHidden = input(false);
}

@Component({
  selector: 'ngxfb-test-array',
  template: `<span class="label">{{ labelText() }}</span
    ><span class="hidden-state">{{ isHidden() }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ArrayComponent {
  readonly context = inject(NGXFB_ARRAY_CONTROL);
  readonly labelText = input<string>();
  readonly isHidden = input(false);
}

@Component({
  selector: 'ngxfb-test-host',
  imports: [ReactiveFormsModule, NgxFbFormComponent],
  template: `<form [formGroup]="form">
    <ngxfb-form [formConfig]="config()" />
  </form>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HostComponent {
  readonly form = new FormGroup<Record<string, FormControl>>({});
  readonly config = signal({ content: {} } as NgxFbForm);
}

const manual = {
  hiddenHandling: 'manual',
  disabledHandling: 'manual',
} as const;

async function render(
  content: object,
  prepare?: (form: FormGroup) => void,
): Promise<ComponentFixture<HostComponent>> {
  TestBed.configureTestingModule({
    providers: [
      provideFormbar({
        componentRegistrations: {
          text: staticComponent(TextComponent),
          group: staticComponent(GroupComponent),
          array: staticComponent(ArrayComponent),
          'manual-text': staticComponent(TextComponent, manual),
          'manual-group': staticComponent(GroupComponent, manual),
          'manual-array': staticComponent(ArrayComponent, manual),
        },
      } as never),
    ],
  });
  const fixture = TestBed.createComponent(HostComponent);
  prepare?.(fixture.componentInstance.form);
  fixture.componentInstance.config.set({ content } as NgxFbForm);
  await fixture.whenStable();
  return fixture;
}

function text(fixture: ComponentFixture<HostComponent>, selector: string) {
  return (fixture.nativeElement as HTMLElement).querySelector(selector)
    ?.textContent;
}

const list = {
  type: 'array',
  label: 'Tags',
  rowControl: { type: 'text', label: 'Tag' },
};

describe('NgxFbFormComponent', () => {
  describe('array context move', () => {
    async function rows() {
      const fixture = await render({ list });
      const { context } = fixture.debugElement.query(
        By.directive(ArrayComponent),
      ).componentInstance as ArrayComponent;
      const array = fixture.componentInstance.form.get('list') as FormArray;
      context.add();
      context.add();
      context.add();
      array.setValue(['a', 'b', 'c']);
      return { array, context };
    }

    it.each([
      [0, 0],
      [-1, 0],
      [3, 0],
      [0, -1],
      [0, 3],
    ])('ignores a move from %i to %i', async (from, to) => {
      const { array, context } = await rows();
      const before = [...array.controls];

      context.move(from, to);

      expect(array.controls).toEqual(before);
      expect(array.value).toEqual(['a', 'b', 'c']);
    });

    it.each([
      [0, 2, ['b', 'c', 'a']],
      [2, 0, ['c', 'a', 'b']],
      [0, 1, ['b', 'a', 'c']],
    ])('moves from %i to %i', async (from, to, value) => {
      const { array, context } = await rows();

      context.move(from, to);

      expect(array.value).toEqual(value);
    });
  });

  describe('static texts', () => {
    it('passes the label of an array', async () => {
      const fixture = await render({ list });

      expect(text(fixture, '.label')).toBe('Tags');
    });

    it('passes the title of a group', async () => {
      const fixture = await render({
        group: { type: 'group', title: 'Title', controls: {} },
      });

      expect(text(fixture, '.title')).toBe('Title');
    });
  });

  describe('manual handling', () => {
    it.each([
      ['manual-group', { title: 'Title', controls: {} }],
      ['manual-array', { rowControl: { type: 'text', label: 'Tag' } }],
    ])('leaves a hidden %s rendered', async (type, rest) => {
      const fixture = await render({ item: { type, hidden: true, ...rest } });

      expect(text(fixture, '.hidden-state')).toBe('true');
    });

    it('mounts a manual control that starts hidden', async () => {
      const fixture = await render({
        field: { type: 'manual-text', label: 'Field', hidden: true },
      });

      expect(text(fixture, '.mounted')).toBe('field');
    });

    it.each([
      ['group', { title: 'Title', controls: {} }],
      ['array', { rowControl: { type: 'text', label: 'Tag' } }],
    ])('removes a hidden %s', async (type, rest) => {
      const fixture = await render({ item: { type, hidden: true, ...rest } });

      expect(text(fixture, '.hidden-state')).toBeUndefined();
    });

    it('leaves a control enabled when it handles disabling itself', async () => {
      const fixture = await render({
        field: { type: 'manual-text', label: 'Field', disabled: true },
      });

      expect(fixture.componentInstance.form.get('field')?.disabled).toBe(false);
    });

    it('disables a control otherwise', async () => {
      const fixture = await render({
        field: { type: 'text', label: 'Field', disabled: true },
      });

      expect(fixture.componentInstance.form.get('field')?.disabled).toBe(true);
    });
  });

  describe('removal from the config', () => {
    it.each([
      ['field', { type: 'text', label: 'Field' }],
      ['group', { type: 'group', title: 'Title', controls: {} }],
      ['list', list],
    ])('drops %s from the form', async (name, config) => {
      const fixture = await render({ [name]: config });
      const { form, config: formConfig } = fixture.componentInstance;
      expect(form.get(name)).not.toBeNull();

      formConfig.set({ content: {} } as NgxFbForm);
      await fixture.whenStable();

      expect(form.get(name)).toBeNull();
    });

    it.each([
      ['field', { type: 'text', label: 'Field', hideStrategy: 'keep' }],
      [
        'group',
        { type: 'group', title: 'T', controls: {}, hideStrategy: 'keep' },
      ],
      ['list', { ...list, hideStrategy: 'keep' }],
    ])('keeps %s with the keep strategy', async (name, config) => {
      const fixture = await render({ [name]: config });
      const { form, config: formConfig } = fixture.componentInstance;

      formConfig.set({ content: {} } as NgxFbForm);
      await fixture.whenStable();

      expect(form.get(name)).not.toBeNull();
    });
  });

  describe('events', () => {
    it('does not emit when it disables a control', async () => {
      const fixture = await render({
        field: { type: 'text', label: 'Field', disabled: 'flag === true' },
        flag: { type: 'text', label: 'Flag' },
      });
      const { form } = fixture.componentInstance;
      const field = form.get('field') as FormControl;
      const emitted: unknown[] = [];
      field.valueChanges.subscribe((value) => emitted.push(value));

      form.get('flag')?.setValue(true);
      await fixture.whenStable();

      expect(field.disabled).toBe(true);
      expect(emitted).toEqual([]);
    });

    it('does not emit when a reset strategy clears a hidden control', async () => {
      const fixture = await render({
        field: {
          type: 'text',
          label: 'Field',
          hidden: 'flag === true',
          hideStrategy: 'keep',
          valueStrategy: 'reset',
        },
        flag: { type: 'text', label: 'Flag' },
      });
      const { form } = fixture.componentInstance;
      const field = form.get('field') as FormControl;
      field.setValue('typed');
      const emitted: unknown[] = [];
      field.valueChanges.subscribe((value) => emitted.push(value));

      form.get('flag')?.setValue(true);
      await fixture.whenStable();

      expect(field.value).toBeNull();
      expect(emitted).toEqual([]);
    });
  });

  it('replaces a control the form already holds', async () => {
    const existing = new FormControl('existing');

    const fixture = await render(
      { field: { type: 'text', label: 'Field' } },
      (form) => {
        form.addControl('field', existing);
      },
    );

    expect(fixture.componentInstance.form.get('field')).not.toBe(existing);
  });
});
