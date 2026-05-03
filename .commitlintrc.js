/** @type {import("@commitlint/types").UserConfig} */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",     // Nouvelle fonctionnalité
        "fix",      // Correction de bug
        "docs",     // Documentation uniquement
        "style",    // Formatage (pas de changement logique)
        "refactor", // Refactoring (ni feat ni fix)
        "perf",     // Amélioration des performances
        "test",     // Ajout ou modification de tests
        "chore",    // Tâches de maintenance (build, CI, config)
        "ci",       // Changements CI/CD
        "revert",   // Annulation d'un commit précédent
        "auto",     // Commits automatiques (bots)
      ],
    ],
    "scope-case": [2, "always", "lower-case"],
    "subject-case": [2, "never", ["sentence-case", "start-case", "pascal-case", "upper-case"]],
    "body-max-line-length": [1, "always", 100],
  },
};
