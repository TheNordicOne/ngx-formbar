import type { Meta, StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { DirectFormHostComponent } from './direct-form-host.component';

const meta: Meta<DirectFormHostComponent> = {
  title: 'Direct Usage',
  component: DirectFormHostComponent,
};

export default meta;
type Story = StoryObj<DirectFormHostComponent>;

// ---------------------------------------------------------------------------
// AllControls
// ---------------------------------------------------------------------------

export const AllControls: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Proves that all example components work as plain Angular reactive form controls without formbar.',
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    // --- Text control ---
    const firstNameInput = await canvas.findByRole('textbox', {
      name: 'First Name',
    });
    await expect(firstNameInput).toBeInTheDocument();
    await userEvent.type(firstNameInput, 'John');
    await expect(firstNameInput).toHaveValue('John');

    // --- Number control ---
    const ageInput = await canvas.findByRole('spinbutton', { name: 'Age' });
    await expect(ageInput).toBeInTheDocument();
    await userEvent.type(ageInput, '25');
    await expect(ageInput).toHaveValue(25);

    // --- Checkbox control ---
    const agreeCheckbox = await canvas.findByRole('checkbox', {
      name: 'I agree to the terms',
    });
    await expect(agreeCheckbox).toBeInTheDocument();
    await expect(agreeCheckbox).not.toBeChecked();
    await userEvent.click(agreeCheckbox);
    await expect(agreeCheckbox).toBeChecked();

    // --- Radio control ---
    const greenRadio = await canvas.findByRole('radio', { name: 'Green' });
    await expect(greenRadio).toBeInTheDocument();
    await expect(greenRadio).not.toBeChecked();
    await userEvent.click(greenRadio);
    await expect(greenRadio).toBeChecked();

    // --- Dropdown control ---
    const countrySelect = await canvas.findByRole('combobox', {
      name: 'Country',
    });
    await expect(countrySelect).toBeInTheDocument();
    await userEvent.selectOptions(countrySelect, 'de');

    // --- Textarea control ---
    const bioTextarea = await canvas.findByRole('textbox', {
      name: 'Biography',
    });
    await expect(bioTextarea).toBeInTheDocument();
    await expect(bioTextarea).toHaveAttribute('rows', '4');
    await expect(bioTextarea).toHaveAttribute('maxlength', '500');
    await userEvent.type(bioTextarea, 'Software engineer');
    await expect(bioTextarea).toHaveValue('Software engineer');

    // --- Date control ---
    const dateInput = await canvas.findByTestId('birthDate-input');
    await expect(dateInput).toBeInTheDocument();

    // --- File control ---
    const fileInput = await canvas.findByTestId('attachment-input');
    await expect(fileInput).toBeInTheDocument();

    // --- Group with child controls ---
    const addressGroup = await canvas.findByTestId('address');
    await expect(addressGroup).toBeInTheDocument();

    const streetInput = await canvas.findByRole('textbox', { name: 'Street' });
    await expect(streetInput).toBeInTheDocument();
    await userEvent.type(streetInput, '123 Main St');
    await expect(streetInput).toHaveValue('123 Main St');

    const cityInput = await canvas.findByRole('textbox', { name: 'City' });
    await expect(cityInput).toBeInTheDocument();
    await userEvent.type(cityInput, 'Springfield');
    await expect(cityInput).toHaveValue('Springfield');

    // --- Array control (simple strings) ---
    const tagsLabel = await canvas.findByTestId('tags-label');
    await expect(tagsLabel).toHaveTextContent('Tags');

    const tagsAdd = await canvas.findByTestId('tags-add');
    await userEvent.click(tagsAdd);
    await userEvent.click(tagsAdd);
    await userEvent.click(tagsAdd);

    await userEvent.type(await canvas.findByTestId('tags-0-input'), 'angular');
    await userEvent.type(
      await canvas.findByTestId('tags-1-input'),
      'remove-me',
    );
    await userEvent.type(await canvas.findByTestId('tags-2-input'), 'signals');

    await userEvent.click(await canvas.findByTestId('tags-1-remove'));

    await expect(canvas.queryByTestId('tags-2-input')).not.toBeInTheDocument();
    await expect(await canvas.findByTestId('tags-0-input')).toHaveValue(
      'angular',
    );
    await expect(await canvas.findByTestId('tags-1-input')).toHaveValue(
      'signals',
    );

    // --- Array control (complex objects) ---
    const contactsLabel = await canvas.findByTestId('contacts-label');
    await expect(contactsLabel).toHaveTextContent('Contacts');

    const contactsAdd = await canvas.findByTestId('contacts-add');
    await userEvent.click(contactsAdd);
    await userEvent.click(contactsAdd);
    await userEvent.click(contactsAdd);

    await userEvent.type(
      await canvas.findByTestId('contacts-0-name'),
      'Alice',
    );
    await userEvent.type(
      await canvas.findByTestId('contacts-0-email'),
      'alice@example.com',
    );
    await userEvent.type(
      await canvas.findByTestId('contacts-1-name'),
      'Charlie',
    );
    await userEvent.type(
      await canvas.findByTestId('contacts-1-email'),
      'charlie@example.com',
    );
    await userEvent.type(await canvas.findByTestId('contacts-2-name'), 'Bob');
    await userEvent.type(
      await canvas.findByTestId('contacts-2-email'),
      'bob@example.com',
    );

    await userEvent.click(await canvas.findByTestId('contacts-1-remove'));

    await expect(
      canvas.queryByTestId('contacts-2-name'),
    ).not.toBeInTheDocument();
    await expect(await canvas.findByTestId('contacts-0-name')).toHaveValue(
      'Alice',
    );
    await expect(await canvas.findByTestId('contacts-1-name')).toHaveValue(
      'Bob',
    );
    await expect(await canvas.findByTestId('contacts-1-email')).toHaveValue(
      'bob@example.com',
    );

    // --- Note block ---
    await expect(
      await canvas.findByText(
        'All fields above are used directly without formbar.',
      ),
    ).toBeInTheDocument();

    // --- Submit and verify values ---
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );

    await expect(
      await canvas.findByTestId('firstName-value'),
    ).toHaveTextContent('John');
    await expect(await canvas.findByTestId('age-value')).toHaveTextContent(
      '25',
    );
    await expect(await canvas.findByTestId('agree-value')).toHaveTextContent(
      'true',
    );
    await expect(
      await canvas.findByTestId('favoriteColor-value'),
    ).toHaveTextContent('green');
    await expect(
      await canvas.findByTestId('country-value'),
    ).toHaveTextContent('de');
    await expect(await canvas.findByTestId('bio-value')).toHaveTextContent(
      'Software engineer',
    );
    await expect(
      await canvas.findByTestId('address.street-value'),
    ).toHaveTextContent('123 Main St');
    await expect(
      await canvas.findByTestId('address.city-value'),
    ).toHaveTextContent('Springfield');
    await expect(await canvas.findByTestId('tags-value')).toHaveTextContent(
      'angular,signals',
    );
  },
};
