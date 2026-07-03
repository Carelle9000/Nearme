// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      'react/no-unescaped-entities': 'off', // Not applicable to React Native (uses JS strings, not HTML)
      'react-hooks/refs': 'off', // Animated values from React Native require ref access during render
    },
  }
]);
