import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default [
  { ignores: ["node_modules/", "dist/", "coverage/"] },

  js.configs.recommended,

  // Browser code (everything the user's browser loads)
  {
    files: ["client/**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.browser },
    },
  },

  // Server code and root config files (Node)
  {
    files: ["server/**/*.js", "*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.node },
    },
  },

  // Project-wide rules: kept gentle so beginners aren't blocked
  {
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off", // allowed during prototyping; tighten later
      eqeqeq: ["warn", "always"],
      "prefer-const": "warn",
      "no-var": "error",
    },
  },

  // Must be last: turns off rules that conflict with Prettier
  prettier,
];
