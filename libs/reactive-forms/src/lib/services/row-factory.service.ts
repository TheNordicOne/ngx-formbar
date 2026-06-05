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
  NGX_FW_DEFAULT_UPDATE_STRATEGY,
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
 * their own instances.
 */
@Injectable({ providedIn: 'root' })
export class RowFactoryService {
  private readonly resolver = inject(NGX_VALIDATOR_RESOLVER);
  private readonly defaultUpdateOn = inject(NGX_FW_DEFAULT_UPDATE_STRATEGY);

  /**
   * Builds a row instance from its `rowControl` config. The top node may not
   * use `hideStrategy: 'remove'` (a removed row top would shift FormArray
   * indices); that is rejected here as a fail-fast guard.
   */
  build(rowControl: NgxFbItem): AbstractControl {
    if ('hideStrategy' in rowControl && rowControl.hideStrategy === 'remove') {
      throw new Error(
        'A form array row top cannot use hideStrategy "remove"; rows are kept to preserve FormArray indices. Use "keep".',
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
        updateOn: config.updateOn ?? this.defaultUpdateOn,
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
      updateOn: config.updateOn ?? this.defaultUpdateOn,
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
      updateOn: config.updateOn ?? this.defaultUpdateOn,
      validators: resolveValidators(config.validators, this.resolver),
      asyncValidators: resolveAsyncValidators(
        config.asyncValidators,
        this.resolver,
      ),
    });
  }
}
