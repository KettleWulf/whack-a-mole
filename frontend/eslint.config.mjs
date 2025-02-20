import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
	// ✅ Ignore all TypeScript files starting with `_` in any subdirectory
	{
		ignores: ["**/_*.ts", "dist"],
	},
	// TypeScript and ESLint recommended settings
	...tseslint.config(
		eslint.configs.recommended,
		tseslint.configs.recommended,
		{
			rules: {
				...tseslint.configs.recommended.rules,
			},
		}
	),
];
