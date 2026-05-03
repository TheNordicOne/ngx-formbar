import { Signal, Type, untracked } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { ComponentHost } from '@ngx-formbar/core';
import { hiddenEffects } from './hidden-effects';

/**
 * Wraps {@link hiddenEffects} with the standard onHidden/onVisible flow used
 * by formbar's reactive-forms directives:
 *
 * - On hide: clear the host (when the library handles visibility), apply the
 *   value strategy, and detach the form control from the parent group unless
 *   the value should be kept.
 * - On show: attach (or re-attach) the form control to the parent group and
 *   re-mount the component (when the library handles visibility).
 *
 * Returns the `setControl` and `removeControl` helpers so the directive can
 * also drive attachment from `ngOnDestroy`.
 *
 * @param options.component Signal of the resolved component class to mount.
 * @param options.isHidden Signal of the directive's resolved hidden state.
 * @param options.host `ComponentHost` used to mount/clear the dynamic
 *   component.
 * @param options.parentFormGroup Getter for the enclosing `FormGroup`.
 * @param options.controlName Signal of the entry name in the parent group.
 * @param options.instance Signal of the underlying `FormControl` /
 *   `FormGroup` to attach.
 * @param options.handleVisibility Signal indicating whether the library
 *   manages visibility (registration's `hiddenHandling === 'auto'`).
 * @param options.keepFormValue Signal indicating whether the form value
 *   should survive being hidden (resolved `hideStrategy === 'keep'`).
 * @param options.applyValueStrategy Per-directive hook that runs the
 *   configured `valueStrategy` against the form instance.
 * @param options.beforeDetach Optional hook invoked just before
 *   `removeControl` runs as part of an onHidden cycle. Used by control
 *   directives to save the last value for `valueStrategy: 'last'`.
 */
export function withHiddenLifecycle(options: {
  component: Signal<Type<unknown> | null>;
  isHidden: Signal<boolean>;
  host: ComponentHost;
  parentFormGroup: () => FormGroup | null;
  controlName: Signal<string>;
  instance: Signal<AbstractControl>;
  handleVisibility: Signal<boolean>;
  keepFormValue: Signal<boolean>;
  applyValueStrategy: () => void;
  beforeDetach?: () => void;
}) {
  const setControl = () => {
    const name = options.controlName();
    const instance = options.instance();
    const parent = options.parentFormGroup();
    if (parent?.get(name) === instance) {
      return;
    }
    parent?.setControl(name, instance);
  };

  const removeControl = () => {
    const name = options.controlName();
    const parent = options.parentFormGroup();
    if (!parent?.get(name)) {
      return;
    }
    parent.removeControl(name);
  };

  const onHidden = () => {
    if (options.handleVisibility()) {
      options.host.clear();
    }
    options.applyValueStrategy();
    if (options.keepFormValue()) {
      return;
    }
    options.beforeDetach?.();
    removeControl();
  };

  const onVisible = () => {
    setControl();
    const component = untracked(() => options.component());
    if (options.handleVisibility() && component) {
      options.host.mount(component);
    }
  };

  hiddenEffects({
    component: options.component,
    isHidden: options.isHidden,
    parentFormGroup: options.parentFormGroup,
    host: options.host,
    onHidden,
    onVisible,
  });

  return { setControl, removeControl };
}
