import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default {
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  semi: true,
  printWidth: 80,
  bracketSpacing: true,
};
