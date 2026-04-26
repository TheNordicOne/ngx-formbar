import {
  ExtendedBlockInputs,
  NgxFbBlock,
  NgxFbControl,
  NgxFbFormGroup,
  SignalInput,
  ToSignalInputs,
} from '@ngx-formbar/core';

/** Common signal inputs shared by all formbar component types. */
export interface ReactiveFormbarAbstractControl {
  readonly name: SignalInput<string>;
  readonly isDisabled?: SignalInput<boolean>;
  readonly isReadonly?: SignalInput<boolean>;
  readonly isHidden?: SignalInput<boolean>;
  readonly testId?: SignalInput<string>;
}

/**
 * Implement this on components registered as form controls.
 *
 * Custom properties on `T` beyond `NgxFbControl` become additional signal inputs.
 *
 * @example
 * ```ts
 * interface TextControl extends NgxFbControl {
 *   placeholder?: Expression<string>;
 * }
 *
 * @Component({ ... })
 * export class TextComponent implements ReactiveFormbarControl<TextControl> {
 *   readonly name = input.required<string>();
 *   readonly labelText = input<string>();
 *   readonly placeholder = input<string>();
 * }
 * ```
 */
export type ReactiveFormbarControl<T extends NgxFbControl = NgxFbControl> =
  ReactiveFormbarAbstractControl &
    ToSignalInputs<Omit<T, keyof NgxFbControl>> & {
      readonly labelText?: SignalInput<string>;
      readonly dynamicLabel?: SignalInput<string | undefined>;
    };

/**
 * Implement this on components registered as form groups.
 *
 * Place `<ngxfb-control-outlet />` in the template where child
 * controls should appear. The outlet picks up child entries
 * automatically via injection.
 * Custom properties on `T` beyond `NgxFbFormGroup` become additional signal inputs.
 *
 * @example
 * ```ts
 * @Component({
 *   imports: [NgxfbControlOutlet],
 *   template: `
 *     <ngxfb-control-outlet />
 *     <ng-content />
 *   `,
 * })
 * export class GroupComponent implements ReactiveFormbarGroup {
 *   readonly name = input.required<string>();
 *   readonly titleText = input<string>();
 * }
 * ```
 */
export type ReactiveFormbarGroup<T extends NgxFbFormGroup = NgxFbFormGroup> =
  ReactiveFormbarAbstractControl &
    ToSignalInputs<Omit<T, keyof NgxFbFormGroup>> & {
      readonly titleText?: SignalInput<string>;
      readonly dynamicTitle?: SignalInput<string | undefined>;
    };

/**
 * Implement this on components registered as blocks (non-control elements like
 * notes or separators).
 *
 * Blocks have no `FormControl` and are never disabled or readonly.
 * Custom properties on `T` beyond `NgxFbBlock` become additional signal inputs.
 *
 * @example
 * ```ts
 * interface NoteBlock extends NgxFbBlock {
 *   text: Expression<string>;
 * }
 *
 * @Component({ ... })
 * export class NoteComponent implements FormbarBlock<NoteBlock> {
 *   readonly text = input.required<string>();
 * }
 * ```
 */
export type FormbarBlock<T extends NgxFbBlock = NgxFbBlock> = ToSignalInputs<
  ExtendedBlockInputs<T>
> & {
  readonly isHidden?: SignalInput<boolean>;
  readonly testId?: SignalInput<string>;
};

export type FormConfigEntry<T> = { name: string; config: T };
