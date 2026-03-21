import { applicationConfig, type Preview } from '@storybook/angular';
import { provideReactiveFormsExamples } from '@ngx-formbar/examples/reactive-forms';

const preview: Preview = {
  decorators: [
    applicationConfig({
      providers: [provideReactiveFormsExamples()],
    }),
  ],
};

export default preview;
