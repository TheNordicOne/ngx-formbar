import { NgxFbForm, TestIdBuilderFn, UpdateStrategy } from '@ngx-formbar/core';
import { FormIntegrationHostComponent } from '../integration/form/integration-host/form-integration-host.component';
import { formbarProviders } from '../integration/shared/provide-formbar';
import { TestContent } from '../types/content.type';

export type { TestContent };
/**
 * Base setup function for mounting the form component
 */
export function setupForm(
  form: NgxFbForm<TestContent>,
  options?: {
    defaultUpdateOnStrategy?: UpdateStrategy;
    autoUpdate?: boolean;
    testIdBuilderFn?: TestIdBuilderFn;
  },
) {
  cy.mount(FormIntegrationHostComponent, {
    providers: [
      formbarProviders(
        options?.defaultUpdateOnStrategy,
        options?.testIdBuilderFn,
      ),
    ],
    componentProperties: {
      formConfig: form as NgxFbForm,
      autoUpdate: options?.autoUpdate,
    },
  });
}
