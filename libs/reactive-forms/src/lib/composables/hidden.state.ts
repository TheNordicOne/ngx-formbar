import {
  afterRenderEffect,
  computed,
  effect,
  inject,
  Signal,
  Type,
  untracked,
} from '@angular/core';
import {
  ComponentHost,
  NgxFbBaseContent,
  NgxFbFormGroup,
  resolveHiddenAttribute,
  resolveHiddenState,
} from '@ngx-formbar/core';
import { FormService } from '../services/form.service';
import { FormGroup } from '@angular/forms';
import { NgxFbGroupDirective } from '../directives/ngx-fb-group.directive';

export function withHiddenState(content: Signal<NgxFbBaseContent>) {
  const formService = inject(FormService);

  const option = computed(() => content().hidden);

  const parentGroupDirective: NgxFbGroupDirective<NgxFbFormGroup> | null =
    inject(NgxFbGroupDirective<NgxFbFormGroup>, {
      optional: true,
      skipSelf: true,
    });

  const parentGroupIsHidden: Signal<boolean> = computed<boolean>(() => {
    const parentGroup = parentGroupDirective;
    if (!parentGroup) {
      return false;
    }

    return parentGroup.isHidden();
  });

  return resolveHiddenState(option, formService.formValue, parentGroupIsHidden);
}

/**
 * Computes the value of the host `hidden` attribute by delegating to
 * `resolveHiddenAttribute`. Returns `true` (attribute present) when the
 * library handles visibility and the element is hidden, otherwise `null`
 * (attribute absent).
 *
 * @param options.hiddenSignal Signal of the resolved hidden state.
 * @param options.handleVisibility Signal indicating whether the library
 *   manages visibility. When `false`, the attribute is always omitted so the
 *   component controls its own DOM presence.
 * @returns A signal that produces `true` or `null`, suitable for binding to
 *   the `hidden` host attribute.
 */
export function withHiddenAttribute(options: {
  hiddenSignal: Signal<boolean>;
  handleVisibility: Signal<boolean>;
}) {
  return resolveHiddenAttribute(options);
}

/**
 * Drives the mount lifecycle from the resolved component and the hidden
 * state. On initial setup, mounts the component into the host once the
 * parent form group is available and the directive is not hidden. Calls
 * `onHidden` or `onVisible` on every subsequent change to `isHidden` so each
 * directive applies its own form-attachment policy. The composable owns the
 * orchestration; the per-directive logic (`setControl`/`removeControl`,
 * value strategy, etc.) lives behind the hooks.
 *
 * @param options.component Signal of the resolved component class to mount,
 *   or `null` while no component has been resolved yet.
 * @param options.isHidden Signal of the directive's hidden state.
 * @param options.parentFormGroup Getter for the enclosing `FormGroup`. The
 *   initial mount is deferred until this returns a non-null group.
 * @param options.host `ComponentHost` used to mount and clear the dynamic
 *   component.
 * @param options.onHidden Callback invoked when `isHidden` becomes `true`.
 * @param options.onVisible Callback invoked when `isHidden` becomes `false`.
 */
export function hiddenEffects(options: {
  component: Signal<Type<unknown> | null>;
  isHidden: Signal<boolean>;
  parentFormGroup: () => FormGroup | null;
  host: ComponentHost;
  onHidden: () => void;
  onVisible: () => void;
}) {
  afterRenderEffect(() => {
    const component = options.component();

    options.host.clear();

    if (!component || !options.parentFormGroup()) {
      return;
    }

    if (untracked(() => options.isHidden())) {
      return;
    }

    options.host.mount(component);
  });

  effect(() => {
    const isHidden = options.isHidden();

    if (isHidden) {
      options.onHidden();
      return;
    }

    options.onVisible();
  });
}
