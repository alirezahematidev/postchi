import { z } from 'zod';

/**
 * Available programming languages for code generation
 */
export type Language = 'javascript' | 'typescript';

/**
 * Available HTTP request handlers
 */
export type RequestHandler = 'fetch' | 'axios';

/**
 * Output file strategy
 */
export type Strategy = 'single-file' | 'multi-file';

/**
 * Configuration interface for Postchi
 */
export interface PostchiConfig {
  /**
   * Path to the Postman collection JSON file
   */
  input?: string;

  /**
   * Output directory for generated files
   */
  output?: string;

  /**
   * Programming language to generate
   * @default 'typescript'
   */
  language?: Language;

  /**
   * HTTP request handler to use
   * @default 'fetch'
   */
  requestHandler?: RequestHandler;

  /**
   * File generation strategy
   * @default 'single-file'
   */
  strategy?: Strategy;
}

/**
 * Default configuration
 */
export const defaultConfig: Required<PostchiConfig> = {
  input: '',
  output: './src/api',
  language: 'typescript',
  requestHandler: 'fetch',
  strategy: 'single-file',
};

export const ConfigSchema = z
  .object({
    input: z.string().optional(),
    output: z.string().optional().default('./src/api'),
    language: z.enum(['javascript', 'typescript']).optional().default('typescript'),
    requestHandler: z.enum(['fetch', 'axios']).optional(),
    strategy: z.enum(['single-file', 'multi-file']).optional(),
  })
  .strict()
  .refine(
    (data: Partial<PostchiConfig>) => data.input !== undefined || process.env.NODE_ENV === 'test',
    {
      message: 'Input file path is required. You must specify a Postman collection JSON file.',
      path: ['input'],
    },
  );
