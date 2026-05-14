import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Supabase Edge Functions rodam em Deno — ambiente diferente do browser
  { ignores: ["dist", "supabase/functions/**"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // Projeto usa noImplicitAny: false no tsconfig — explicit any é intencional
      // para interagir com tabelas Supabase ainda sem tipos gerados
      "@typescript-eslint/no-explicit-any": "off",
      // tailwind.config.ts usa require() (padrão CommonJS em configs Node)
      "@typescript-eslint/no-require-imports": "off",
      // shadcn/ui gera interfaces vazias como pattern intencional de extensão
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
);
