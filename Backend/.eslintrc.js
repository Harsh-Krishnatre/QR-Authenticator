module.exports = {
    env: {
        browser: false,
        es2021: true,
        node: true,
        jest: true,
    },
    extends: [
        'airbnb-base',
    ],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module',
    },
    rules: {
        indent: ['error', 4],

        'max-len': 'off',
        'no-console': 'off',
        'consistent-return': 'off',
        'func-names': 'off',
        'object-shorthand': 'off',
        'no-process-exit': 'off',
        'no-param-reassign': 'off',
        'no-return-await': 'off',
        'no-underscore-dangle': 'off',
        'class-methods-use-this': 'off',
    },
};
