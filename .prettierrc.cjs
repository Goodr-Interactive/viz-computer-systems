/** @type {import("prettier").Config} */
const config = {
    endOfLine: "lf",
    printWidth: 100,
    tabWidth: 2,
    trailingComma: "es5",
    plugins: ["prettier-plugin-tailwindcss"],
    semi: true,
    singleQuote: false,
    useTabs: false,
    arrowParens: "always",
    bracketSpacing: true,
    embeddedLanguageFormatting: "auto",
    htmlWhitespaceSensitivity: "css",
    jsxSingleQuote: false,
    bracketSameLine: false,
    proseWrap: "preserve",
    quoteProps: "as-needed",
    overrides: [
      {
        files: "*.{ts,tsx}",
        options: {
          parser: "typescript",
        },
      },
      {
        files: "*.{json,json5}",
        options: {
          parser: "json",
        },
      },
      {
        files: "*.{yaml,yml}",
        options: {
          parser: "yaml",
        },
      },
      {
        files: "*.md",
        options: {
          parser: "markdown",
        },
      },
    ],
  };
  
  module.exports = config;
