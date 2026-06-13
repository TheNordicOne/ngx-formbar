import { inject, Injectable } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
} from '@angular/forms';
import {
  isFormbarArray,
  isFormbarBlock,
  isFormbarGroup,
  NgxFbArray,
  NgxFbControl,
  NgxFbFormGroup,
  NgxFbItem,
} from '@ngx-formbar/core';
import { NGX_VALIDATOR_RESOLVER } from '../tokens/validator-resolver';
import {
  resolveAsyncValidators,
  resolveValidators,
} from '../composables/validators';

/**
 * Builds the full `AbstractControl` subtree for a single array row from its
 * `rowControl` config, synchronously and outside any render pass. The live
 * `FormArray` stays the source of truth; this service is how new rows are
 * constructed for `add`/`insertAt` and for loading data before a patch.
 *
 * Validators are resolved from their registration keys and baked into the
 * instance at build time, mirroring how the rendering directives construct
 * their own instances. `updateOn` is intentionally left unset when a node does
 * not configure it, so the built control inherits the enclosing `FormArray`'s
 * `updateOn` through Angular's native parent chain, matching how controls
 * behave outside arrays.
 */
@Injectable({ providedIn: 'root' })
export class RowFactoryService {
  private readonly resolver = inject(NGX_VALIDATOR_RESOLVER);

  /**
   * Builds a row instance from its `rowControl` config. A row top may not use
   * `hideStrategy: 'remove'`: the array renders from its FormArray membership,
   * so a removed row top has nothing left to evaluate its hidden expression and
   * could never be restored. This is the one intentional divergence from a
   * non-array control, and it fails loud rather than silently behaving as
   * `'keep'`.
   */
  build(rowControl: NgxFbItem): AbstractControl {
    if ('hideStrategy' in rowControl && rowControl.hideStrategy === 'remove') {
      throw new Error(
        'A form array row top cannot use hideStrategy "remove": a removed row top cannot be restored. Use "keep".',
      );
    }
    return this.buildNode(rowControl);
  }

  private buildNode(node: NgxFbItem): AbstractControl {
    if (isFormbarGroup(node)) {
      return this.buildGroup(node);
    }
    if (isFormbarArray(node)) {
      return this.buildArray(node);
    }
    if (isFormbarBlock(node)) {
      throw new Error(
        `A block ("${node.type}") cannot stand alone as a form array row: a block carries no form control, so the row has nothing to add, remove, or reorder. Nest the block inside a group row instead.`,
      );
    }
    return this.buildControl(node);
  }

  private buildGroup(config: NgxFbFormGroup): FormGroup {
    const group = new FormGroup(
      {},
      {
        updateOn: config.updateOn,
        validators: resolveValidators(config.validators, this.resolver),
        asyncValidators: resolveAsyncValidators(
          config.asyncValidators,
          this.resolver,
        ),
      },
    );
    for (const [name, child] of Object.entries(config.controls)) {
      if (isFormbarBlock(child)) {
        continue;
      }
      group.addControl(name, this.buildNode(child));
    }
    return group;
  }

  private buildArray(config: NgxFbArray): FormArray {
    return new FormArray<AbstractControl>([], {
      updateOn: config.updateOn,
      validators: resolveValidators(config.validators, this.resolver),
      asyncValidators: resolveAsyncValidators(
        config.asyncValidators,
        this.resolver,
      ),
    });
  }

  private buildControl(config: NgxFbControl): FormControl {
    return new FormControl(config.defaultValue, {
      nonNullable: config.nonNullable,
      updateOn: config.updateOn,
      validators: resolveValidators(config.validators, this.resolver),
      asyncValidators: resolveAsyncValidators(
        config.asyncValidators,
        this.resolver,
      ),
    });
  }
}
