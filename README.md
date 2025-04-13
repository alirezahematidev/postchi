# Postchi

[![CI](https://github.com/username/postchi/actions/workflows/ci.yml/badge.svg)](https://github.com/username/postchi/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/postchi.svg)](https://www.npmjs.com/package/postchi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Convert Postman collections to type-safe fetch API calls.

## Features

- Convert Postman collections to TypeScript/JavaScript code
- Generate type definitions for requests and responses
- Support for fetch and axios request handlers
- Support for single-file or multi-file output
- ES Module support

## Installation

```bash
# Install globally
npm install -g postchi

# Or install locally
npm install --save-dev postchi
```

## Usage

### Command Line

```bash
# Using global installation
postchi --input ./my-collection.json --output ./generated

# Using local installation
npx postchi --input ./my-collection.json --output ./generated
```

### Options

- `-i, --input <path>` - Path to Postman collection JSON file (required)
- `-o, --output <directory>` - Output directory for generated files (default: `./generated`)
- `-l, --language <language>` - Programming language (typescript, javascript) (default: `typescript`)
- `-r, --request-handler <handler>` - Request handler (fetch, axios) (default: `fetch`)
- `-s, --strategy <strategy>` - File generation strategy (single-file, multi-file) (default: `single-file`)

### Configuration File

You can also create a `postchi.config.js` file in your project root:

```js
import { defineConfig } from "postchi";

export default defineConfig({
  input: "./my-collection.json",
  output: "./src/api",
  language: "typescript",
  requestHandler: "axios",
  strategy: "multi-file",
});
```

Or add a configuration section to your `package.json`:

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "postchi": {
    "input": "./my-collection.json",
    "output": "./src/api",
    "language": "typescript",
    "requestHandler": "axios",
    "strategy": "multi-file"
  }
}
```

## Development

### Building the project

The project uses [tsup](https://github.com/egoist/tsup) for building:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Watch mode for development
npm run dev
```

### Testing

```bash
# Run tests
npm test
```

## Releasing and Versioning

This project uses [release-it](https://github.com/release-it/release-it) for versioning and releasing. It automates the release process, including versioning, changelog generation, git commits, tags, and GitHub releases.

### Automated Publishing

We use GitHub Actions for automated CI/CD:

- **CI Workflow**: Automatically runs tests and linting on pull requests and commits to main
- **Publish Workflow**: Automatically publishes the package to npm when a new GitHub release is created

To set up automated publishing:

1. Create an npm access token with publish permissions
2. Add the token as a secret in your GitHub repository settings with the name `NPM_TOKEN`

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) format for commit messages. This enables automatic versioning and changelog generation.

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types include:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semi colons, etc)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or correcting tests
- `build`: Changes to the build system or dependencies
- `ci`: CI configuration changes
- `chore`: Other changes that don't modify src or test files

### Making a Release

To create a new release:

```bash
# Patch release (0.0.x) - Bug fixes
npm run release:patch

# Minor release (0.x.0) - New features
npm run release:minor

# Major release (x.0.0) - Breaking changes
npm run release:major

# Custom version
npm run release -- 1.2.3

# Dry run (no changes)
npm run release:dry-run
```

### Automatic Changelog Generation

The changelog is automatically generated and updated in CHANGELOG.md based on commit messages and release notes. Make sure to follow the conventional commit format for your commits so they are properly categorized in the changelog.

## License

MIT

```

```
