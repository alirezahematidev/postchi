import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { ApiGenerator } from '../generator';
import { PostchiConfig } from '../types/config';

// Promisify exec
const execAsync = promisify(exec);

// Mock fs module
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

describe('API Client Serialization', () => {
  const sampleCollectionPath = path.join(__dirname, 'fixtures', 'sample-collection.json');
  const outputDir = './test-output';
  const outputFilePath = path.join(outputDir, 'api-client.ts');

  // Default configuration
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

  // Increase timeout to 15 seconds for this test
  test('should generate valid TypeScript code that can be compiled', async () => {
    // Generate the API client
    const generator = new ApiGenerator(sampleCollectionPath, defaultConfig);
    generator.generate();

    // Check if writeFileSync was called
    expect(fs.writeFileSync).toHaveBeenCalled();

    // Get the generated content
    const mockCalls = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(mockCalls.length).toBeGreaterThan(0);
    const generatedContent = mockCalls[0][1];

    // Check that the generated content is a string
    expect(typeof generatedContent).toBe('string');

    // Create a temporary file with the generated content
    // Mock fs.writeFileSync implementation to save content to a real file
    const realFs = jest.requireActual('fs');
    const tempDir = path.join(__dirname, 'temp');
    const tempFilePath = path.join(tempDir, 'api-client.ts');

    // Create the temp directory if it doesn't exist
    if (!realFs.existsSync(tempDir)) {
      realFs.mkdirSync(tempDir, { recursive: true });
    }

    // Write the generated content to the temp file
    realFs.writeFileSync(tempFilePath, generatedContent);

    try {
      // Try to compile the generated code with tsc
      // This will throw an error if the code is not valid TypeScript
      await execAsync(`npx tsc --noEmit --target ES2020 --module commonjs "${tempFilePath}"`);

      // If we reach this point, the compilation was successful
      expect(true).toBe(true);
    } catch (error) {
      // If compilation fails, the test should fail
      console.error('Compilation error:', error);
      expect(error).toBeNull();
    } finally {
      // Clean up the temp file
      if (realFs.existsSync(tempFilePath)) {
        realFs.unlinkSync(tempFilePath);
      }

      // Clean up the temp directory if empty
      if (realFs.existsSync(tempDir) && realFs.readdirSync(tempDir).length === 0) {
        realFs.rmdirSync(tempDir);
      }
    }
  }, 15000); // Set timeout to 15 seconds

  test('should generate code that correctly handles query parameters', () => {
    // Create a collection with query parameters
    const queryParamsCollection = {
      info: {
        name: 'Query Params API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Search',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: 'https://api.example.com/search?q=test&page=1&limit=10',
              protocol: 'https',
              host: ['api', 'example', 'com'],
              path: ['search'],
              query: [
                {
                  key: 'q',
                  value: 'test',
                },
                {
                  key: 'page',
                  value: '1',
                },
                {
                  key: 'limit',
                  value: '10',
                },
              ],
            },
          },
        },
      ],
    };

    // Mock fs.readFileSync to return our query params collection
    (fs.readFileSync as jest.Mock).mockImplementation(() => JSON.stringify(queryParamsCollection));

    // Generate the API client
    const generator = new ApiGenerator(sampleCollectionPath, defaultConfig);
    generator.generate();

    // Check if writeFileSync was called
    expect(fs.writeFileSync).toHaveBeenCalled();

    // Get the generated content
    const mockCallsQuery = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(mockCallsQuery.length).toBeGreaterThan(0);
    const generatedContent = mockCallsQuery[0][1];

    // Check that the generated code contains the correct URL handling
    expect(generatedContent).toContain('url.searchParams.append');
    expect(generatedContent).toContain('q: string');
    expect(generatedContent).toContain('page: string');
    expect(generatedContent).toContain('limit: string');
  });

  test('should generate code that correctly handles request bodies', () => {
    // Create a collection with request bodies
    const requestBodyCollection = {
      info: {
        name: 'Request Body API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Create User',
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
              raw: 'https://api.example.com/users',
              protocol: 'https',
              host: ['api', 'example', 'com'],
              path: ['users'],
            },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                name: 'John Doe',
                email: 'john@example.com',
                age: 30,
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

    // Mock fs.readFileSync to return our request body collection
    (fs.readFileSync as jest.Mock).mockImplementation(() => JSON.stringify(requestBodyCollection));

    // Generate the API client
    const generator = new ApiGenerator(sampleCollectionPath, defaultConfig);
    generator.generate();

    // Check if writeFileSync was called
    expect(fs.writeFileSync).toHaveBeenCalled();

    // Get the generated content
    const mockCallsBody = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(mockCallsBody.length).toBeGreaterThan(0);
    const generatedContent = mockCallsBody[0][1];

    // Check that the generated code contains the correct body handling
    expect(generatedContent).toContain('body: JSON.stringify(body)');
    expect(generatedContent).toContain('name');
    expect(generatedContent).toContain('email');
    expect(generatedContent).toContain('age');
  });

  test('should handle nested JSON properties correctly', () => {
    // Create a collection with nested JSON properties
    const nestedJsonCollection = {
      info: {
        name: 'Nested JSON API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Update Profile',
          request: {
            method: 'PUT',
            header: [
              {
                key: 'Content-Type',
                value: 'application/json',
                type: 'text',
              },
            ],
            url: {
              raw: 'https://api.example.com/profile',
              protocol: 'https',
              host: ['api', 'example', 'com'],
              path: ['profile'],
            },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                user: {
                  name: 'John Doe',
                  contact: {
                    email: 'john@example.com',
                    phone: '123-456-7890',
                  },
                },
                preferences: {
                  theme: 'dark',
                  notifications: {
                    email: true,
                    push: false,
                  },
                },
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

    // Mock fs.readFileSync to return our nested JSON collection
    (fs.readFileSync as jest.Mock).mockImplementation(() => JSON.stringify(nestedJsonCollection));

    // Generate the API client
    const generator = new ApiGenerator(sampleCollectionPath, defaultConfig);
    generator.generate();

    // Check if writeFileSync was called
    expect(fs.writeFileSync).toHaveBeenCalled();

    // Get the generated content
    const mockCallsNested = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(mockCallsNested.length).toBeGreaterThan(0);
    const generatedContent = mockCallsNested[0][1];

    // Check that the generated code contains nested properties
    expect(generatedContent).toContain('user');
    expect(generatedContent).toContain('contact');
    expect(generatedContent).toContain('preferences');
  });

  test('should generate valid JavaScript code when specified', async () => {
    // JavaScript configuration
    const jsConfig: Required<PostchiConfig> = {
      ...defaultConfig,
      language: 'javascript',
    };

    // Generate the API client
    const generator = new ApiGenerator(sampleCollectionPath, jsConfig);
    generator.generate();

    // Get the generated content
    const generatedContent = (fs.writeFileSync as jest.Mock).mock.calls[0][1];

    // Check that the generated content is a string
    expect(typeof generatedContent).toBe('string');

    // Create a temporary file with the generated content
    const realFs = jest.requireActual('fs');
    const tempDir = path.join(__dirname, 'temp');
    const tempFilePath = path.join(tempDir, 'api-client.js');

    // Create the temp directory if it doesn't exist
    if (!realFs.existsSync(tempDir)) {
      realFs.mkdirSync(tempDir, { recursive: true });
    }

    // Write the generated content to the temp file
    realFs.writeFileSync(tempFilePath, generatedContent);

    try {
      // Try to validate the JavaScript with Node.js
      await execAsync(`node --check "${tempFilePath}"`);

      // If we reach this point, the validation was successful
      expect(true).toBe(true);
    } catch (error) {
      // If validation fails, the test should fail
      console.error('JavaScript validation error:', error);
      expect(error).toBeNull();
    } finally {
      // Clean up the temp file
      if (realFs.existsSync(tempFilePath)) {
        realFs.unlinkSync(tempFilePath);
      }

      // Clean up the temp directory if empty
      if (realFs.existsSync(tempDir) && realFs.readdirSync(tempDir).length === 0) {
        realFs.rmdirSync(tempDir);
      }
    }
  }, 15000); // Set timeout to 15 seconds
});
