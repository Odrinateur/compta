/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
    semi: true,
    singleQuote: false,
    tabWidth: 4,
    useTabs: false,
    trailingComma: "es5",
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: "always",
    // printWidth: 100,
    endOfLine: "lf",
    jsxSingleQuote: false,
    plugins: ["prettier-plugin-tailwindcss"],
    tailwindFunctions: ["cn", "clsx", "cva"],
};

export default config;
