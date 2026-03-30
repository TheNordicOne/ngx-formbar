import { definePreview } from '@storybook/angular';
import addonDocs from '@storybook/addon-docs';
import { applicationConfig } from '@storybook/angular';
import { provideReactiveFormsExamples } from '@ngx-formbar/examples/reactive-forms';

export default definePreview({
  addons: [addonDocs()],
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [provideReactiveFormsExamples()],
    }),
  ],
});
