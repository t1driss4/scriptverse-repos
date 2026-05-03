/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["./index.js"],
  env: {
    node: true,
  },
  rules: {
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "off",
  },
};
