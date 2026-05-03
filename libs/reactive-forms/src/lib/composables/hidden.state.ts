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
  NgxFbBaseContent,
  NgxFbFormGroup,
  resolveHiddenAttribute,
  resolveHiddenState,
} from '@ngx-formbar/core';
import { FormService } from '../services/form.service';
import { FormGroup } from '@angular/forms';
import { NgxFbGroupDirective } from '../directives/ngx-fb-group.directive';
import { ComponentHost } from './component-host';

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
 * Creates an effect that manages control registration and value strategy for the `keep` hide strategy.
 *
 * For `keep` strategy:
 * 1. Attaches the control to the form when not yet registered
 * 2. Applies the value strategy when the control becomes hidden
 *
 * For `remove` strategy, this effect is a no-op. The directive's hidden
 * lifecycle owns component teardown and recreation, and registration plus
 * value restoration is handled by `ngOnDestroy` and `controlInstance`.
 */
export function withHiddenAttribute(options: {
  hiddenSignal: Signal<boolean>;
  handleVisibility: Signal<boolean>;
}) {
  return resolveHiddenAttribute(options);
}

/**
 * Drives the directive's mount lifecycle from the resolved component and the
 * hidden state signal:
 *
 * - On the initial render, mounts the component into the host once the
 *   parent form group is available and the directive is not hidden.
 * - On every subsequent change to `isHidden`, invokes the matching hook so
 *   each directive applies its own form-attachment policy.
 *
 * The composable owns the orchestration; the per-directive logic
 * (setControl/removeControl, value-strategy, etc.) lives behind the hooks.
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
