describe('Binary Nixie Watch UI', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
  });

  it('displays the startup screen and hides it after 2 seconds', () => {
    cy.get('#startup').should('be.visible');
    cy.wait(2500);
    cy.get('#startup').should('not.be.visible');
  });

  it('renders all clock sections', () => {
    cy.get('#hoursSvg').should('exist');
    cy.get('#minutesSvg').should('exist');
    cy.get('#secondsSvg').should('exist');
  });

  it('displays current time in HH:MM:SS format', () => {
    cy.get('#timeDisplay')
      .invoke('text')
      .should('match', /^\d{2}:\d{2}:\d{2}$/);
  });

  it('enables sound when the toggle button is clicked', () => {
    cy.get('#soundToggle').click();
    cy.get('#soundToggle').should('have.class', 'active');
    cy.get('.sound-icon')
      .invoke('text')
      .should('match', /🔊|🚫/); // matches updated icon
  });
});