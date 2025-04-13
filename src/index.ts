#!/usr/bin/env node

import path from 'path';
import { Command } from 'commander';
import pc from 'picocolors';
import { loadConfig } from './config-loader.js';
import { ApiGenerator } from './generator.js';
import { PostchiConfig } from './types/config.js';

// Export defineConfig for users to import
export { defineConfig } from './types/config.js';

const program = new Command();

export async function run(argv: string[] = process.argv) {
  program
    .name('postchi')
    .description('Convert Postman collections to type-safe fetch API calls')
    .version('1.0.0')
    .option('-i, --input <path>', 'Path to Postman collection JSON file')
    .option('-o, --output <directory>', 'Output directory for generated files')
    .option('-l, --language <language>', 'Programming language (typescript, javascript)')
    .option('-r, --request-handler <handler>', 'Request handler (fetch, axios)')
    .option('-s, --strategy <strategy>', 'File generation strategy (single-file, multi-file)')
    .action(async (options) => {
      try {
        // Convert CLI options to config format
        const cliConfig: Partial<PostchiConfig> = {};
        if (options.input) cliConfig.input = options.input;
        if (options.output) cliConfig.output = options.output;
        if (options.language) cliConfig.language = options.language;
        if (options.requestHandler) cliConfig.requestHandler = options.requestHandler;
        if (options.strategy) cliConfig.strategy = options.strategy;

        // Load and merge configuration
        const config = await loadConfig(cliConfig);

        // Resolve the input file path
        const inputPath = path.resolve(config.input);

        console.info(pc.blue('📂 Reading Postman collection from:'), pc.cyan(inputPath));
        console.info(pc.blue('📁 Generating API client in:'), pc.cyan(config.output));
        console.info(pc.blue('🔤 Using language:'), pc.yellow(config.language));
        console.info(pc.blue('🌐 Using request handler:'), pc.yellow(config.requestHandler));
        console.info(pc.blue('📄 Using file strategy:'), pc.yellow(config.strategy));

        const generator = new ApiGenerator(inputPath, config);
        generator.generate();

        console.info(pc.green('✅ API client generated successfully!'));
      } catch (error) {
        console.error(
          pc.red('❌ Error:'),
          error instanceof Error ? error.message : 'Unknown error occurred',
        );
        process.exit(1);
      }
    });

  await program.parseAsync(argv);
}

run();
