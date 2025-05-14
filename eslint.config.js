import { fixupPluginRules } from "@eslint/compat";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettierConfig from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import path from "path";

/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/build/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/.eslintrc.cjs",
      "**/.prettierrc.cjs",
      "**/prettier.config.js",
      "**/vite.config.ts",
      "**/storybook-static/**",
      "**/*.config.js",
      "**/*.config.ts",
      "**/out/**",
      "**/.vercel/**",
      "**/public/**",
      "**/generated/**",
      "**/__generated__/**",
      "**/test-results/**",
      "**/playwright-report/**",
      "**/.sst/**",
      "**/.open-next/**",
      "**/cdk.out/**",
      "**/tsup.config.ts",
      "**/vitest.config.ts",
      "**/tailwind.config.ts",
      "**/postcss.config.js",
      "**/sst-env.d.ts",
    ],
  },
  prettierConfig,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@typescript-eslint": tsPlugin,
      import: fixupPluginRules(importPlugin),
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        process: "readonly",
      },
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: path.resolve("./tsconfig.json"),
        },
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
    },
    rules: {
      ...(tsPlugin.configs?.["recommended"]?.rules ?? {}),
      ...(tsPlugin.configs?.["stylistic"]?.rules ?? {}),
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-empty-function": ["warn", { allow: ["arrowFunctions"] }],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-floating-promises": ["error", { ignoreIIFE: true, ignoreVoid: true }],
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": "off",
      "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      ...(importPlugin.configs.recommended.rules ?? {}),
      "import/no-unresolved": "off",
    },
  },
];

export default config;
