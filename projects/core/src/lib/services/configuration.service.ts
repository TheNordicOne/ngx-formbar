import { Injectable } from '@angular/core';
import { TestIdBuilderFn } from '../types/functions.type';
import { NgxFwGlobalConfiguration } from '../types/global-configuration.type';

@Injectable({
  providedIn: 'root',
})
export class NgxFwConfigurationService {
  private readonly _testIdBuilderFn: TestIdBuilderFn | undefined;

  get testIdBuilder() {
    return this._testIdBuilderFn;
  }

  constructor(config: NgxFwGlobalConfiguration) {
    this._testIdBuilderFn = config.testIdBuilderFn;
  }
}
