import { loadConfig } from '../config-loader';
import { ApiGenerator } from '../generator';
import { run } from '../index';

// Mock the ApiGenerator class
jest.mock('../generator');

// Mock the path module
jest.mock('path', () => ({
  resolve: jest.fn((...args) => args[0]),
}));

// Mock the config loader
jest.mock('../config-loader', () => ({
  loadConfig: jest.fn().mockImplementation(async (cliConfig) => {
    return {
      input: cliConfig.input || 'test-collection.json',
      output: cliConfig.output || './generated',
      language: cliConfig.language || 'typescript',
      requestHandler: cliConfig.requestHandler || 'fetch',
      strategy: cliConfig.strategy || 'single-file',
    };
  }),
}));

describe('CLI', () => {
  let mockGenerate: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup ApiGenerator mock
    mockGenerate = jest.fn();
    (ApiGenerator as jest.Mock).mockImplementation(() => ({
      generate: mockGenerate,
    }));
  });

  test('should parse command line arguments correctly', async () => {
    // Setup test arguments
    const argv = [
      'node',
      'postchi',
      '-i',
      'test-collection.json',
      '-o',
      'output-dir',
      '-l',
      'typescript',
      '-r',
      'fetch',
      '-s',
      'single-file',
    ];

    // Execute the CLI module
    await run(argv);

    // Check if loadConfig was called with correct arguments
    expect(loadConfig).toHaveBeenCalledWith({
      input: 'test-collection.json',
      output: 'output-dir',
      language: 'typescript',
      requestHandler: 'fetch',
      strategy: 'single-file',
    });

    // Check if ApiGenerator was called with correct arguments
    expect(ApiGenerator).toHaveBeenCalledWith(
      'test-collection.json',
      expect.objectContaining({
        input: 'test-collection.json',
        output: 'output-dir',
        language: 'typescript',
        requestHandler: 'fetch',
        strategy: 'single-file',
      }),
    );
    expect(mockGenerate).toHaveBeenCalled();
  });

  test('should use default config when not specified', async () => {
    // Setup test arguments with only input
    const argv = ['node', 'postchi', '-i', 'test-collection.json'];

    // Execute the CLI module
    await run(argv);

    // Check if loadConfig was called with correct arguments
    expect(loadConfig).toHaveBeenCalledWith({
      input: 'test-collection.json',
      output: 'output-dir',
      language: 'typescript',
      requestHandler: 'fetch',
      strategy: 'single-file',
    });

    // Check if ApiGenerator was called with default config
    expect(ApiGenerator).toHaveBeenCalledWith(
      'test-collection.json',
      expect.objectContaining({
        input: 'test-collection.json',
        output: 'output-dir',
        language: 'typescript',
        requestHandler: 'fetch',
        strategy: 'single-file',
      }),
    );
    expect(mockGenerate).toHaveBeenCalled();
  });


});
