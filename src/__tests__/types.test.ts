import fs from 'fs';
import path from 'path';
import { ApiGenerator } from '../generator';
import { PostchiConfig } from '../types/config';
import {
  PostmanBody,
  PostmanCollection,
  PostmanHeader,
  PostmanRequest,
  PostmanUrl,
} from '../types/postman';

// Mock fs module
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

describe('Type Generation', () => {
  const sampleCollectionPath = path.join(__dirname, 'fixtures', 'sample-collection.json');
  const outputDir = './test-output';
  const defaultConfig: Required<PostchiConfig> = {
    input: sampleCollectionPath,
    output: outputDir,
    language: 'typescript',
    requestHandler: 'fetch',
    strategy: 'single-file',
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock fs.readFileSync to return our sample collection
    (fs.readFileSync as jest.Mock).mockImplementation((filePath) => {
      if (filePath === sampleCollectionPath) {
        return JSON.stringify(require('./fixtures/sample-collection.json'));
      }
      return '';
    });

    // Mock fs.existsSync to return false (directory doesn't exist)
    (fs.existsSync as jest.Mock).mockReturnValue(false);
  });

  test('should generate correct interface names', () => {
    const generator = new ApiGenerator(sampleCollectionPath, defaultConfig);
    generator.generate();

    const generatedContent = (fs.writeFileSync as jest.Mock).mock.calls[0][1];

    // Check for properly formatted interface names
    expect(generatedContent).toContain('export interface HttpsApiExampleComUsersUserIdRequest');
    expect(generatedContent).toContain('export interface HttpsApiExampleComUsersRequest');
    expect(generatedContent).toContain(
      'export interface HttpsApiExampleComProductsCategoryElectronicsLimit10Request',
    );
  });

  test('should generate correct function names', () => {
    const generator = new ApiGenerator(sampleCollectionPath, defaultConfig);
    generator.generate();

    const generatedContent = (fs.writeFileSync as jest.Mock).mock.calls[0][1];

    // Check for properly formatted function names
    expect(generatedContent).toContain('export async function get_user');
    expect(generatedContent).toContain('export async function create_user');
    expect(generatedContent).toContain('export async function search_products');
  });

  test('should generate correct parameter types', () => {
    const generator = new ApiGenerator(sampleCollectionPath, defaultConfig);
    generator.generate();

    const generatedContent = (fs.writeFileSync as jest.Mock).mock.calls[0][1];

    // Check for query parameter types
    expect(generatedContent).toContain('category: string;');
    expect(generatedContent).toContain('limit: string;');

    // Check for body parameter types
    expect(generatedContent).toContain('"name": "John Doe"');
    expect(generatedContent).toContain('"email": "john@example.com"');
    expect(generatedContent).toContain('"age": 30');
  });

  test('should handle complex nested types', () => {
    // Create a complex nested type for testing
    const complexCollection: PostmanCollection = {
      info: {
        name: 'Complex API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Complex Request',
          request: {
            method: 'POST',
            header: [
              {
                key: 'Content-Type',
                value: 'application/json',
                type: 'text',
              },
            ],
            url: {
              raw: 'https://api.example.com/complex',
              protocol: 'https',
              host: ['api', 'example', 'com'],
              path: ['complex'],
            },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                user: {
                  name: 'John Doe',
                  address: {
                    street: '123 Main St',
                    city: 'Anytown',
                    country: 'USA',
                  },
                  preferences: {
                    theme: 'dark',
                    notifications: true,
                  },
                },
                items: [
                  {
                    id: 1,
                    name: 'Item 1',
                  },
                  {
                    id: 2,
                    name: 'Item 2',
                  },
                ],
              }),
              options: {
                raw: {
                  language: 'json',
                },
              },
            },
          },
        },
      ],
    };

    // Mock fs.readFileSync to return our complex collection
    (fs.readFileSync as jest.Mock).mockImplementation(() => JSON.stringify(complexCollection));

    const generator = new ApiGenerator(sampleCollectionPath, defaultConfig);
    generator.generate();

    const generatedContent = (fs.writeFileSync as jest.Mock).mock.calls[0][1];

    // Check for nested type definitions
    expect(generatedContent).toContain('"user": {');
    expect(generatedContent).toContain('"address": {');
    expect(generatedContent).toContain('"preferences": {');
    expect(generatedContent).toContain('"items": [');
  });

  test('should handle invalid JSON in request body', () => {
    // Create a collection with invalid JSON in the request body
    const invalidJsonCollection: PostmanCollection = {
      info: {
        name: 'Invalid JSON API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Invalid JSON Request',
          request: {
            method: 'POST',
            header: [
              {
                key: 'Content-Type',
                value: 'application/json',
                type: 'text',
              },
            ],
            url: {
              raw: 'https://api.example.com/invalid',
              protocol: 'https',
              host: ['api', 'example', 'com'],
              path: ['invalid'],
            },
            body: {
              mode: 'raw',
              raw: '{ invalid json }',
              options: {
                raw: {
                  language: 'json',
                },
              },
            },
          },
        },
      ],
    };

    // Mock fs.readFileSync to return our invalid JSON collection
    (fs.readFileSync as jest.Mock).mockImplementation(() => JSON.stringify(invalidJsonCollection));

    const generator = new ApiGenerator(sampleCollectionPath, defaultConfig);
    generator.generate();

    const generatedContent = (fs.writeFileSync as jest.Mock).mock.calls[0][1];

    // Check that it falls back to 'any' type for invalid JSON
    expect(generatedContent).toContain('body: any;');
  });
});
