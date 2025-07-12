import { Injectable } from '@angular/core';
import { TestIdBuilderFn } from '../types/functions.type';
import { NgxFwGlobalConfiguration } from '../types/global-configuration.type';

@Injectable({
  providedIn: 'root',
})
export class NgxFwConfigurationService {
  private _testIdBuilderFn: TestIdBuilderFn | undefined;

  get testIdBuilder() {
    return this._testIdBuilderFn;
  }

  configure(config: NgxFwGlobalConfiguration | undefined) {
    this._testIdBuilderFn = config?.testIdBuilderFn;
  }
}
