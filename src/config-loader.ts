import fs from 'fs';
import path from 'path';
import pc from 'picocolors';
import { PostchiConfig, defaultConfig } from './types/config.js';

/**
 * Possible configuration file names
 */
const CONFIG_FILE_NAMES = [
  'postchi.config.ts',
  'postchi.config.js',
  'postchi.config.mts',
  'postchi.config.mjs',
  'postchi.config.cjs',
];

/**
 * Find the configuration file in the current directory
 * @returns Path to the configuration file or null if not found
 */
export function findConfigFile(directory: string = process.cwd()): string | null {
  for (const fileName of CONFIG_FILE_NAMES) {
    const filePath = path.join(directory, fileName);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

/**
 * Load the configuration from a file
 * @param configFilePath Path to the configuration file
 * @returns Loaded configuration
 */
export async function loadConfigFromFile(configFilePath: string): Promise<PostchiConfig> {
  try {
    // For TypeScript files, we need to use ts-node to require them
    if (configFilePath.endsWith('.ts') || configFilePath.endsWith('.mts')) {
      // Use dynamic import for ESM compatibility
      const { register } = await import('ts-node');
      register({
        transpileOnly: true,
        compilerOptions: {
          module: 'commonjs',
        },
      });
    }

    // Try to import the configuration file
    const configModule = await import(configFilePath);
    const config = configModule.default || {};

    return config;
  } catch (error) {
    console.error(`Error loading configuration from ${configFilePath}:`, error);
    return {};
  }
}

/**
 * Load configuration from postchi.config.js or package.json
 * and merge with CLI options
 *
 * @param cliConfig Configuration from CLI arguments
 * @returns Merged configuration
 */
export async function loadConfig(
  cliConfig: Partial<PostchiConfig>,
): Promise<Required<PostchiConfig>> {
  // Start with default config
  let config = { ...defaultConfig };

  // Try to load config from postchi.config.js
  const configPath = path.resolve(process.cwd(), 'postchi.config.js');

  if (fs.existsSync(configPath)) {
    try {
      const fileUrl = new URL(`file://${configPath}`);
      const userConfig = (await import(fileUrl.href)).default;
      config = { ...config, ...userConfig };
      console.info(pc.blue('📝 Using configuration from'), pc.cyan('postchi.config.js'));
    } catch (error: unknown) {
      console.warn(
        pc.yellow('⚠️ Could not load config from'),
        pc.cyan(configPath),
        pc.yellow(':'),
        error instanceof Error ? error.message : String(error),
      );
    }
  } else {
    // Try to load config from package.json
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

        if (packageJson.postchi) {
          config = { ...config, ...packageJson.postchi };
          console.info(pc.blue('📝 Using configuration from'), pc.cyan('package.json'));
        }
      } catch (error: unknown) {
        console.warn(
          pc.yellow('⚠️ Could not load config from'),
          pc.cyan('package.json'),
          pc.yellow(':'),
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }

  // Override with CLI options
  if (Object.keys(cliConfig).length > 0) {
    console.info(pc.blue('📝 Applying command line options'));
    config = { ...config, ...cliConfig };
  }

  // Validate required fields
  if (!config.input) {
    throw new Error(
      'Input file path is required. Specify it via CLI argument or configuration file.',
    );
  }

  return config as Required<PostchiConfig>;
}
