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

describe('ApiGenerator', () => {
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

  test('should initialize with collection and output directory', () => {
    const generator = new ApiGenerator(sampleCollectionPath, defaultConfig);
    expect(generator).toBeDefined();
    expect(fs.readFileSync).toHaveBeenCalledWith(sampleCollectionPath, 'utf-8');
  });

  test('should generate API client with correct types and functions', () => {
    const generator = new ApiGenerator(sampleCollectionPath, defaultConfig);
    generator.generate();

    // Check if output directory was created
    expect(fs.mkdirSync).toHaveBeenCalledWith(outputDir, { recursive: true });

    // Check if file was written
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('api-client.ts'),
      expect.any(String),
    );

    // Check if writeFileSync was called
    expect(fs.writeFileSync).toHaveBeenCalled();

    // Get the generated content
    const mockCalls = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(mockCalls.length).toBeGreaterThan(0);
    const generatedContent = mockCalls[0][1];

    // Check for type definitions
    expect(generatedContent).toContain('export interface');

    // Check for function definitions
    expect(generatedContent).toContain('export async function');

    // Check for specific endpoints
    expect(generatedContent).toContain('get_user');
    expect(generatedContent).toContain('create_user');
    expect(generatedContent).toContain('search_products');
  });

  test('should handle nested collections correctly', () => {
    const generator = new ApiGenerator(sampleCollectionPath, defaultConfig);
    generator.generate();

    // Check if writeFileSync was called
    expect(fs.writeFileSync).toHaveBeenCalled();

    // Get the generated content
    const mockCallsNested = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(mockCallsNested.length).toBeGreaterThan(0);
    const generatedContent = mockCallsNested[0][1];

    // Check if nested items are processed
    expect(generatedContent).toContain('Users');
    expect(generatedContent).toContain('Products');
  });

  test('should generate correct URL handling for query parameters', () => {
    const generator = new ApiGenerator(sampleCollectionPath, defaultConfig);
    generator.generate();

    // Check if writeFileSync was called
    expect(fs.writeFileSync).toHaveBeenCalled();

    // Get the generated content
    const mockCallsUrl = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(mockCallsUrl.length).toBeGreaterThan(0);
    const generatedContent = mockCallsUrl[0][1];

    // Check for URL parameter handling
    expect(generatedContent).toContain('url.searchParams.append');
    expect(generatedContent).toContain('category');
    expect(generatedContent).toContain('limit');
  });

  test('should handle request bodies correctly', () => {
    const generator = new ApiGenerator(sampleCollectionPath, defaultConfig);
    generator.generate();

    // Check if writeFileSync was called
    expect(fs.writeFileSync).toHaveBeenCalled();

    // Get the generated content
    const mockCallsBody = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(mockCallsBody.length).toBeGreaterThan(0);
    const generatedContent = mockCallsBody[0][1];

    // Check for body handling
    expect(generatedContent).toContain('body: JSON.stringify(body)');
    expect(generatedContent).toContain('name');
    expect(generatedContent).toContain('email');
    expect(generatedContent).toContain('age');
  });

  test('should handle errors gracefully', () => {
    // Mock fs.readFileSync to throw an error
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('File not found');
    });

    expect(() => {
      new ApiGenerator('non-existent-file.json', defaultConfig);
    }).toThrow('File not found');
  });

  test('should generate JavaScript files when specified', () => {
    const jsConfig: Required<PostchiConfig> = {
      ...defaultConfig,
      language: 'javascript',
    };

    const generator = new ApiGenerator(sampleCollectionPath, jsConfig);
    generator.generate();

    // Check if JS file was written
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('api-client.js'),
      expect.any(String),
    );

    // Check if writeFileSync was called
    expect(fs.writeFileSync).toHaveBeenCalled();

    // Get the generated content
    const mockCallsJs = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(mockCallsJs.length).toBeGreaterThan(0);
    const generatedContent = mockCallsJs[0][1];

    // Check for JSDoc comments
    expect(generatedContent).toContain('@typedef');
    expect(generatedContent).toContain('@property');
    expect(generatedContent).toContain('@param');
    expect(generatedContent).toContain('@returns');

    // Check that TypeScript interfaces are not included
    expect(generatedContent).not.toContain('export interface');
  });

  test('should generate axios code when specified', () => {
    const axiosConfig: Required<PostchiConfig> = {
      ...defaultConfig,
      requestHandler: 'axios',
    };

    const generator = new ApiGenerator(sampleCollectionPath, axiosConfig);
    generator.generate();

    // Check if writeFileSync was called
    expect(fs.writeFileSync).toHaveBeenCalled();

    // Get the generated content
    const mockCallsAxios = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(mockCallsAxios.length).toBeGreaterThan(0);
    const generatedContent = mockCallsAxios[0][1];

    // Check for axios import
    expect(generatedContent).toContain("import axios from 'axios'");

    // Check for axios call
    expect(generatedContent).toContain('return axios({');
    expect(generatedContent).toContain('method:');
    expect(generatedContent).toContain('url:');
    expect(generatedContent).toContain('headers:');
  });

  test('should generate multiple files when multi-file strategy is specified', () => {
    const multiFileConfig: Required<PostchiConfig> = {
      ...defaultConfig,
      strategy: 'multi-file',
    };

    const generator = new ApiGenerator(sampleCollectionPath, multiFileConfig);
    generator.generate();

    // Check if both files were written
    expect(fs.writeFileSync).toHaveBeenCalledTimes(2);

    // Get the generated content
    const mockCallsMulti = (fs.writeFileSync as jest.Mock).mock.calls;
    expect(mockCallsMulti.length).toBeGreaterThan(1);
    const typesContent = mockCallsMulti[0][1];
    const functionsContent = mockCallsMulti[1][1];

    // Check types file
    expect(typesContent).toContain('export interface');
    expect(typesContent).not.toContain('export async function');

    // Check functions file
    expect(functionsContent).toContain('export async function');
    expect(functionsContent).toContain('import {');
    expect(functionsContent).toContain("} from './api-types'");
  });
});
