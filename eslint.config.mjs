import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      ".vercel/**",
      "build/**",
      "capacitor-www/**",
      "coverage/**",
      "ios/**",
      "next-env.d.ts",
      "node_modules/**",
      "public/**",
      "supabase/.temp/**",
      "tmp/**",
      "*.patch"
    ]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript")
];

export default eslintConfig;
