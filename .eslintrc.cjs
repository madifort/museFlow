module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  env: {
    browser: true,
    es2022: true,
    webextensions: true,
    node: false,
  },
  globals: {
    chrome: "readonly",
  },
  plugins: ["react", "@typescript-eslint", "react-hooks"],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "airbnb",
    "airbnb/hooks",
    "plugin:prettier/recommended",
  ],
  rules: {
    // --- Relaxed Chrome extension & competition build rules ---
    "no-console": "off",
    "no-alert": "off",
    "react/jsx-filename-extension": "off",
    "react/function-component-definition": "off",
    "max-len": ["warn", { code: 120 }],
    "no-unused-vars": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    "no-use-before-define": "off",
    "import/prefer-default-export": "off",
    "react/button-has-type": "off",
    "jsx-a11y/label-has-associated-control": "off",
    "jsx-a11y/no-static-element-interactions": "off",
    "jsx-a11y/click-events-have-key-events": "off",
  },
};
