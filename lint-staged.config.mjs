export default {
  "*.{js,jsx,ts,tsx,json,md,mdx,css,scss,yml,yaml}": [
    "biome check --write --files-ignore-unknown=true --no-errors-on-unmatched",
  ],
  "*.{js,jsx,ts,tsx}": ["oxlint --fix"],
  "*": () => "npm run typecheck",
};
