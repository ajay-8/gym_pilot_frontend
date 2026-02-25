import nextConfig from "eslint-config-next";

export default [
  ...nextConfig,
  {
    rules: {
      // Enforce unused vars — args/vars prefixed with _ are exempt
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // Warn on any — do not block commits
      "@typescript-eslint/no-explicit-any": "warn",
      // React hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Apostrophes in JSX text are fine — too noisy to enforce
      "react/no-unescaped-entities": "off",
      // React Compiler strictness — disable setState-in-effect check (too many false positives for data-init patterns)
      "react-compiler/react-compiler": "off",
      // Derived-state-in-effect is a common acceptable pattern for open/close/filter state
      "react-hooks/set-state-in-effect": "off",
    },
  },
];
