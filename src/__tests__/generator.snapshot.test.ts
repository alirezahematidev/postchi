import fs from 'fs';
import path from 'path';
import { ApiGenerator } from '../generator';
import { PostchiConfig } from '../types/config';

// Mock fs module
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

describe('ApiGenerator Snapshots', () => {
  const sampleCollectionPath = path.join(__dirname, 'fixtures', 'sample-collection.json');
  const complexCollectionPath = path.join(__dirname, 'fixtures', 'complex-collection.json');
  const outputDir = './test-output';

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

    // Mock fs.existsSync to return false (directory doesn't exist)
    (fs.existsSync as jest.Mock).mockReturnValue(false);
  });

  test('should generate expected API client for sample collection', () => {
    // Mock fs.readFileSync to return our sample collection
    (fs.readFileSync as jest.Mock).mockImplementation((filePath) => {
      if (filePath === sampleCollectionPath) {
        return JSON.stringify(require('./fixtures/sample-collection.json'));
      }
      return '';
    });

    const generator = new ApiGenerator(sampleCollectionPath, defaultConfig);
    generator.generate();

    // Check if writeFileSync was called
    expect(fs.writeFileSync).toHaveBeenCalled();

    // Get the generated content
    const mockCalls = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(mockCalls.length).toBeGreaterThan(0);
    const generatedContent = mockCalls[0][1];

    // Match against snapshot
    expect(generatedContent).toMatchSnapshot('sample-collection-api-client');
  });

  test('should generate expected API client for complex collection', () => {
    // Create a complex collection
    const complexCollection = {
      info: {
        name: 'Complex API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Authentication',
          item: [
            {
              name: 'Login',
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
                  raw: 'https://api.example.com/auth/login',
                  protocol: 'https',
                  host: ['api', 'example', 'com'],
                  path: ['auth', 'login'],
                },
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({
                    email: 'user@example.com',
                    password: 'password123',
                    rememberMe: true,
                  }),
                  options: {
                    raw: {
                      language: 'json',
                    },
                  },
                },
              },
            },
            {
              name: 'Refresh Token',
              request: {
                method: 'POST',
                header: [
                  {
                    key: 'Content-Type',
                    value: 'application/json',
                    type: 'text',
                  },
                  {
                    key: 'Authorization',
                    value: 'Bearer {{refreshToken}}',
                    type: 'text',
                  },
                ],
                url: {
                  raw: 'https://api.example.com/auth/refresh',
                  protocol: 'https',
                  host: ['api', 'example', 'com'],
                  path: ['auth', 'refresh'],
                },
              },
            },
          ],
        },
      ],
    };

    // Mock fs.readFileSync to return our complex collection
    (fs.readFileSync as jest.Mock).mockImplementation(() => JSON.stringify(complexCollection));

    const generator = new ApiGenerator(complexCollectionPath, defaultConfig);
    generator.generate();

    // Check if writeFileSync was called
    expect(fs.writeFileSync).toHaveBeenCalled();

    // Get the generated content
    const mockCalls = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(mockCalls.length).toBeGreaterThan(0);
    const generatedContent = mockCalls[0][1];

    // Match against snapshot
    expect(generatedContent).toMatchSnapshot('complex-collection-api-client');
  });

  test('should generate expected API client for collection with query parameters', () => {
    // Create a collection with query parameters
    const queryParamsCollection = {
      info: {
        name: 'Query Params API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'List Users',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: 'https://api.example.com/users?page=1&limit=10&sort=name&order=asc',
              protocol: 'https',
              host: ['api', 'example', 'com'],
              path: ['users'],
              query: [
                {
                  key: 'page',
                  value: '1',
                },
                {
                  key: 'limit',
                  value: '10',
                },
                {
                  key: 'sort',
                  value: 'name',
                },
                {
                  key: 'order',
                  value: 'asc',
                },
              ],
            },
          },
        },
      ],
    };

    // Mock fs.readFileSync to return our query params collection
    (fs.readFileSync as jest.Mock).mockImplementation(() => JSON.stringify(queryParamsCollection));

    const generator = new ApiGenerator(sampleCollectionPath, defaultConfig);
    generator.generate();

    // Check if writeFileSync was called
    expect(fs.writeFileSync).toHaveBeenCalled();

    // Get the generated content
    const mockCalls = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(mockCalls.length).toBeGreaterThan(0);
    const generatedContent = mockCalls[0][1];

    // Match against snapshot
    expect(generatedContent).toMatchSnapshot('query-params-api-client');
  });

  test('should generate expected API client for different HTTP methods', () => {
    // Create a collection with different HTTP methods
    const httpMethodsCollection = {
      info: {
        name: 'HTTP Methods API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'GET Request',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: 'https://api.example.com/resources/123',
              protocol: 'https',
              host: ['api', 'example', 'com'],
              path: ['resources', '123'],
            },
          },
        },
        {
          name: 'POST Request',
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
              raw: 'https://api.example.com/resources',
              protocol: 'https',
              host: ['api', 'example', 'com'],
              path: ['resources'],
            },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                name: 'New Resource',
                description: 'This is a new resource',
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

    // Mock fs.readFileSync to return our HTTP methods collection
    (fs.readFileSync as jest.Mock).mockImplementation(() => JSON.stringify(httpMethodsCollection));

    const generator = new ApiGenerator(sampleCollectionPath, defaultConfig);
    generator.generate();

    // Check if writeFileSync was called
    expect(fs.writeFileSync).toHaveBeenCalled();

    // Get the generated content
    const mockCalls = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(mockCalls.length).toBeGreaterThan(0);
    const generatedContent = mockCalls[0][1];

    // Match against snapshot
    expect(generatedContent).toMatchSnapshot('http-methods-api-client');
  });

  test('should generate different output based on configuration', () => {
    // Mock fs.readFileSync to return our sample collection
    (fs.readFileSync as jest.Mock).mockImplementation((filePath) => {
      if (filePath === sampleCollectionPath) {
        return JSON.stringify(require('./fixtures/sample-collection.json'));
      }
      return '';
    });

    // Test JavaScript output
    const jsConfig: Required<PostchiConfig> = {
      ...defaultConfig,
      language: 'javascript',
    };

    const generator = new ApiGenerator(sampleCollectionPath, jsConfig);
    generator.generate();

    // Check if writeFileSync was called
    expect(fs.writeFileSync).toHaveBeenCalled();

    // Get the generated content
    const mockCalls = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(mockCalls.length).toBeGreaterThan(0);
    const generatedContent = mockCalls[0][1];

    // Match against snapshot
    expect(generatedContent).toMatchSnapshot('javascript-api-client');

    // Reset mocks
    jest.clearAllMocks();

    // Test axios output
    const axiosConfig: Required<PostchiConfig> = {
      ...defaultConfig,
      requestHandler: 'axios',
    };

    const axiosGenerator = new ApiGenerator(sampleCollectionPath, axiosConfig);
    axiosGenerator.generate();

    // Check if writeFileSync was called
    expect(fs.writeFileSync).toHaveBeenCalled();

    // Get the generated content
    const mockCallsAxios = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(mockCallsAxios.length).toBeGreaterThan(0);
    const generatedContentAxios = mockCallsAxios[0][1];

    // Match against snapshot
    expect(generatedContentAxios).toMatchSnapshot('axios-api-client');

    // Reset mocks
    jest.clearAllMocks();

    // Test multi-file strategy
    const multiFileConfig: Required<PostchiConfig> = {
      ...defaultConfig,
      strategy: 'multi-file',
    };

    const multiFileGenerator = new ApiGenerator(sampleCollectionPath, multiFileConfig);
    multiFileGenerator.generate();

    // Check if writeFileSync was called
    expect(fs.writeFileSync).toHaveBeenCalledTimes(2);

    // Get the generated content for types file
    const mockCallsTypes = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(mockCallsTypes.length).toBeGreaterThan(0);
    const typesContent = mockCallsTypes[0][1];

    // Get the generated content for functions file
    const functionsContent = mockCallsTypes[1][1];

    // Match against snapshots
    expect(typesContent).toMatchSnapshot('multi-file-api-types');
    expect(functionsContent).toMatchSnapshot('multi-file-api-functions');
  });
});
