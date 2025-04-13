import path from 'node:path';
import { bundleRequire } from 'bundle-require';
import fs from 'fs-extra';
import JoyCon from 'joycon';
import pc from 'picocolors';
import { type PostchiConfig, defaultConfig } from './types/config';

const CONFIG_FILE_NAMES = [
  'postchi.config.ts',
  'postchi.config.js',
  'postchi.config.mts',
  'postchi.config.mjs',
  'postchi.config.cjs',
];

const joycon = new JoyCon();

export async function loadConfig(
  cliConfig: Partial<PostchiConfig>,
): Promise<Required<PostchiConfig>> {
  let config = { ...defaultConfig };

  const filepath = await joycon.resolve({
    files: CONFIG_FILE_NAMES,
  });

  if (filepath) {
    try {
      const bundleDeps = await bundleRequire({ filepath });

      const userConfig = bundleDeps.mod.default as Partial<PostchiConfig>;

      config = { ...config, ...userConfig } satisfies Required<PostchiConfig>;

      console.info(pc.blue('📝 Using configuration from'), pc.cyan(filepath));
    } catch (error: unknown) {
      console.warn(
        pc.yellow('⚠️ Could not load config from'),
        pc.cyan(filepath),
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
