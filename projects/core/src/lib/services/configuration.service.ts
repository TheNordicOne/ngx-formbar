import { inject, Injectable } from '@angular/core';
import { TestIdBuilderFn } from '../types/functions.type';
import { NGX_FW_CONFIG_RESOLVED } from '../tokens/global-config';

@Injectable({
  providedIn: 'root',
})
export class NgxFwConfigurationService {
  private readonly _config = inject(NGX_FW_CONFIG_RESOLVED);

  get testIdBuilder(): TestIdBuilderFn | undefined {
    return this._config.testIdBuilderFn;
  }
}
