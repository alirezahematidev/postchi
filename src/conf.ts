import { z } from 'zod';
import { ConfigSchema, type PostchiConfig } from './types/config';

export function defineConfig(config: PostchiConfig): PostchiConfig {
  try {
    const validatedConfig = ConfigSchema.parse(config);
    return validatedConfig;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors
        .map((err: z.ZodIssue) => {
          const path = err.path.join('.');
          return `  - ${path ? path + ': ' : ''}${err.message}`;
        })
        .join('\n');

      throw new Error(`Invalid configuration:\n${formattedErrors}`);
    }
    throw error;
  }
}
