import { mount } from 'cypress/angular';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Chainable {
      mount: typeof mount;
      getByTestId: (id: string) => Chainable<JQuery>;
    }
  }
}

Cypress.Commands.add('mount', mount);

Cypress.Commands.add('getByTestId', (id: string) => {
  return cy.get(`[data-testId="${id}"]`);
});
