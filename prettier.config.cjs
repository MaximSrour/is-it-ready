module.exports = {
  printWidth: 80,
  tabWidth: 2,
  trailingComma: "es5",
  semi: true,
  plugins: ["@trivago/prettier-plugin-sort-imports"],
  importOrder: ["^node:", "<THIRD_PARTY_MODULES>", "^[./]"],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};
