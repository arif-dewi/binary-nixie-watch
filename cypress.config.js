const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: '2tbt8y',
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
