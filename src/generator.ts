import path from 'node:path';
import fs from 'fs-extra';
import pc from 'picocolors';
import type { PostchiConfig } from './types/config';
import type { PostmanCollection, PostmanItem, PostmanRequest } from './types/postman';

export class ApiGenerator {
  private collection: PostmanCollection;
  private config: Required<PostchiConfig>;

  constructor(collectionPath: string, config: Required<PostchiConfig>) {
    this.collection = JSON.parse(fs.readFileSync(collectionPath, 'utf-8'));
    this.config = config;
  }

  private generateTypeName(name: string): string {
    return name
      .split(/[^a-zA-Z0-9]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  private generateRequestType(request: PostmanRequest): string {
    const typeName = this.generateTypeName(request.url.raw);
    let typeDefinition = `export interface ${typeName}Request {\n`;

    // Add query parameters
    if (request.url.query) {
      for (const query of request.url.query) {
        typeDefinition += `  ${query.key}: string;\n`;
      }
    }

    // Add body type if present
    if (request.body?.raw) {
      try {
        const bodyType = JSON.parse(request.body.raw);
        typeDefinition += `  body: ${JSON.stringify(bodyType, null, 2)
          .split('\n')
          .map((line) => '  ' + line)
          .join('\n')};\n`;
      } catch {
        typeDefinition += `  body: any;\n`;
      }
    }

    typeDefinition += '}\n\n';
    return typeDefinition;
  }

  private generateJavaScriptRequestType(request: PostmanRequest): string {
    // For JavaScript, we'll generate JSDoc comments instead of TypeScript interfaces
    const typeName = this.generateTypeName(request.url.raw);
    let typeDefinition = `/**\n * @typedef {Object} ${typeName}Request\n`;

    // Add query parameters
    if (request.url.query) {
      for (const query of request.url.query) {
        typeDefinition += ` * @property {string} ${query.key}\n`;
      }
    }

    // Add body type if present
    if (request.body?.raw) {
      try {
        const bodyType = JSON.parse(request.body.raw);
        typeDefinition += ` * @property {Object} body\n`;

        for (const [key, value] of Object.entries(bodyType)) {
          const type = typeof value;
          typeDefinition += ` * @property {${type}} body.${key}\n`;
        }
      } catch {
        typeDefinition += ` * @property {*} body\n`;
      }
    }

    typeDefinition += ` */\n\n`;
    return typeDefinition;
  }

  private generateFetchFunction(request: PostmanRequest, name: string): string {
    const typeName = this.generateTypeName(request.url.raw);
    const functionName = name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');

    let functionDefinition = '';
    if (this.config.language === 'typescript') {
      functionDefinition = `export async function ${functionName}(`;

      // Add parameters
      const params: string[] = [];
      if (request.url.query) {
        params.push(`params: ${typeName}Request`);
      }
      if (request.body?.raw) {
        params.push(`body: ${typeName}Request['body']`);
      }
      functionDefinition += params.join(', ');
      functionDefinition += `): Promise<Response> {\n`;
    } else {
      functionDefinition = `/**\n`;
      if (request.url.query) {
        functionDefinition += ` * @param {${typeName}Request} params\n`;
      }
      if (request.body?.raw) {
        functionDefinition += ` * @param {Object} body\n`;
      }
      functionDefinition += ` * @returns {Promise<Response>}\n */\n`;
      functionDefinition += `export async function ${functionName}(`;
      const params: string[] = [];
      if (request.url.query) {
        params.push(`params`);
      }
      if (request.body?.raw) {
        params.push(`body`);
      }
      functionDefinition += params.join(', ');
      functionDefinition += `) {\n`;
    }

    // Build URL
    functionDefinition += `  const url = new URL('${request.url.raw}');\n`;
    if (request.url.query) {
      functionDefinition += `  Object.entries(params).forEach(([key, value]) => {\n`;
      functionDefinition += `    url.searchParams.append(key, value);\n`;
      functionDefinition += `  });\n`;
    }

    // Add headers
    functionDefinition += `  const headers = new Headers({\n`;

    for (const header of request.header) {
      functionDefinition += `    '${header.key}': '${header.value}',\n`;
    }

    functionDefinition += `  });\n`;

    // Add request implementation based on the selected handler
    if (this.config.requestHandler === 'fetch') {
      // Fetch implementation
      functionDefinition += `  return fetch(url.toString(), {\n`;
      functionDefinition += `    method: '${request.method}',\n`;
      functionDefinition += `    headers,\n`;
      if (request.body?.raw) {
        functionDefinition += `    body: JSON.stringify(body),\n`;
      }
      functionDefinition += `  });\n`;
    } else if (this.config.requestHandler === 'axios') {
      // Axios implementation
      functionDefinition += `  return axios({\n`;
      functionDefinition += `    method: '${request.method.toLowerCase()}',\n`;
      functionDefinition += `    url: url.toString(),\n`;
      functionDefinition += `    headers: Object.fromEntries(headers.entries()),\n`;
      if (request.body?.raw) {
        functionDefinition += `    data: body,\n`;
      }
      functionDefinition += `  });\n`;
    }

    functionDefinition += `}\n\n`;
    return functionDefinition;
  }

  private processItem(item: PostmanItem, types: string[], functions: string[]): void {
    if (item.request) {
      if (this.config.language === 'typescript') {
        types.push(this.generateRequestType(item.request));
      } else {
        types.push(this.generateJavaScriptRequestType(item.request));
      }
      functions.push(this.generateFetchFunction(item.request, item.name));
    }

    if (item.item) {
      for (const subItem of item.item) {
        this.processItem(subItem, types, functions);
      }
    }
  }

  public generate(): void {
    const types: string[] = [];
    const functions: string[] = [];

    console.info(
      pc.blue('🔍 Processing Postman collection:'),
      pc.cyan(this.collection.info?.name || 'Unnamed collection'),
    );

    for (const item of this.collection.item) {
      this.processItem(item, types, functions);
    }

    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.config.output)) {
      console.info(pc.blue('📁 Creating output directory:'), pc.cyan(this.config.output));
      fs.mkdirSync(this.config.output, { recursive: true });
    }

    if (this.config.strategy === 'single-file') {
      // Generate a single file with all types and functions
      const output = [
        '// Generated API client',
        '// Do not modify this file manually',
        '',
        // Add axios import if needed
        this.config.requestHandler === 'axios' ? "import axios from 'axios';\n" : '',
        ...types,
        ...functions,
      ].join('\n');

      const extension = this.config.language === 'typescript' ? 'ts' : 'js';
      const outputFilePath = path.join(this.config.output, `api-client.${extension}`);

      console.info(pc.blue('📝 Writing API client to:'), pc.cyan(outputFilePath));
      fs.writeFileSync(outputFilePath, output);
    } else if (this.config.strategy === 'multi-file') {
      // Generate separate files for types and functions
      const typesOutput = [
        '// Generated API types',
        '// Do not modify this file manually',
        '',
        ...types,
      ].join('\n');

      const functionsOutput = [
        '// Generated API functions',
        '// Do not modify this file manually',
        '',
        // Add axios import if needed
        this.config.requestHandler === 'axios' ? "import axios from 'axios';\n" : '',
        // Import types if using TypeScript
        this.config.language === 'typescript'
          ? 'import { ' +
            types
              .filter((type) => type.startsWith('export interface'))
              .map((type) => type.split(' ')[2].split('Request')[0] + 'Request')
              .join(', ') +
            " } from './api-types';\n"
          : '',
        ...functions,
      ].join('\n');

      const extension = this.config.language === 'typescript' ? 'ts' : 'js';
      const typesFilePath = path.join(this.config.output, `api-types.${extension}`);
      const functionsFilePath = path.join(this.config.output, `api-functions.${extension}`);

      console.info(pc.blue('📝 Writing API types to:'), pc.cyan(typesFilePath));
      fs.writeFileSync(typesFilePath, typesOutput);

      console.info(pc.blue('📝 Writing API functions to:'), pc.cyan(functionsFilePath));
      fs.writeFileSync(functionsFilePath, functionsOutput);
    }

    const endpointCount = functions.length;
    console.info(
      pc.green(
        `✨ Generated ${endpointCount} API ${endpointCount === 1 ? 'endpoint' : 'endpoints'} successfully!`,
      ),
    );
  }
}
