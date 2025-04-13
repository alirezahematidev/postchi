import { defineConfig } from '../src/types/config';

export default defineConfig({
  // Required: Path to the Postman collection JSON file
  input: './my-collection.json',

  // Optional: Output directory for generated files (default: './generated')
  output: './src/api',

  // Optional: Programming language (default: 'typescript')
  // Options: 'typescript' | 'javascript'
  language: 'typescript',

  // Optional: Request handler (default: 'fetch')
  // Options: 'fetch' | 'axios'
  // Note: If using 'axios', you need to have axios installed in your project
  requestHandler: 'fetch',

  // Optional: File generation strategy (default: 'single-file')
  // Options: 'single-file' | 'multi-file'
  // - 'single-file': Generates a single file with all types and functions
  // - 'multi-file': Generates separate files for types and functions
  strategy: 'multi-file',
});
