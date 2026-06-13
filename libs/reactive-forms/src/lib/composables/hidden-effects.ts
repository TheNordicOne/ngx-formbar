import {
  afterRenderEffect,
  effect,
  Signal,
  Type,
  untracked,
} from '@angular/core';
import { ComponentHost } from '@ngx-formbar/core';
import { AbstractControl } from '@angular/forms';

/**
 * Drives the mount lifecycle from the resolved component and the hidden
 * state. On initial setup, mounts the component into the host once the
 * parent container is available and the directive is not hidden. Calls
 * `onHidden` or `onVisible` on every subsequent change to `isHidden` so each
 * directive applies its own form-attachment policy. The composable owns the
 * orchestration; the per-directive logic (`setControl`/`removeControl`,
 * value strategy, etc.) lives behind the hooks.
 *
 * @param options.component Signal of the resolved component class to mount,
 *   or `null` while no component has been resolved yet.
 * @param options.isHidden Signal of the directive's hidden state.
 * @param options.parentControl Getter for the enclosing container (a
 *   `FormGroup`, or a `FormArray` for array rows). The initial mount is
 *   deferred until this returns a non-null control.
 * @param options.host `ComponentHost` used to mount and clear the dynamic
 *   component.
 * @param options.onHidden Callback invoked when `isHidden` becomes `true`.
 * @param options.onVisible Callback invoked when `isHidden` becomes `false`.
 */
export function hiddenEffects(options: {
  component: Signal<Type<unknown> | null>;
  isHidden: Signal<boolean>;
  parentControl: () => AbstractControl | null;
  host: ComponentHost;
  onHidden: () => void;
  onVisible: () => void;
}): void {
  afterRenderEffect(() => {
    const component = options.component();

    options.host.clear();

    if (!component || !options.parentControl()) {
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
