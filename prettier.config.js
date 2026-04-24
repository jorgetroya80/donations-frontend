export default {
  plugins: [
    'prettier-plugin-packagejson',

    // Tailwind plugin MUST be last in the list
    // https://github.com/tailwindlabs/prettier-plugin-tailwindcss#compatibility-with-other-prettier-plugins
    'prettier-plugin-tailwindcss',
  ],

  singleQuote: true,
  trailingComma: 'es5',

  // tailwind classname sorting
  tailwindFunctions: ['classNames', 'cn'],
}
