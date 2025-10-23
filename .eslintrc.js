module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    webextensions: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // Disable strict rules for now to focus on functionality
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    'no-unused-vars': 'warn',
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
    'no-param-reassign': 'off',
    'no-plusplus': 'off',
    'no-continue': 'off',
    'no-restricted-syntax': 'off',
    'no-await-in-loop': 'off',
    'no-promise-executor-return': 'off',
    'no-return-await': 'off',
    'no-shadow': 'off',
    'default-case': 'off',
    'class-methods-use-this': 'off',
    'no-nested-ternary': 'off',
    'max-len': 'off',
    'no-undef': 'off',
    'no-restricted-exports': 'off',
    'react/jsx-no-constructed-context-values': 'off',
    'react/no-array-index-key': 'off',
    'jsx-a11y/control-has-associated-label': 'off',
  },
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
  globals: {
    chrome: 'readonly',
    process: 'readonly',
  },
};
