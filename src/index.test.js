const GitHubKnowledgeGraphModule = require('./index');
const path = require('path');
const fs = require('fs').promises;

describe('GitHubKnowledgeGraphModule', () => {
  let module;

  beforeEach(() => {
    module = new GitHubKnowledgeGraphModule({
      cacheEnabled: false,
      localStoragePath: './test-repos'
    });
  });

  afterEach(async () => {
    module.clearCache();
    try {
      await fs.rmdir('./test-repos', { recursive: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
  });

  describe('initialization', () => {
    test('should create module with default config', () => {
      const defaultModule = new GitHubKnowledgeGraphModule();
      expect(defaultModule.config.cacheEnabled).toBe(true);
      expect(defaultModule.config.cacheTTL).toBe(3600000);
      expect(defaultModule.config.rateLimitDelay).toBe(1000);
    });

    test('should override config with provided options', () => {
      const customModule = new GitHubKnowledgeGraphModule({
        cacheEnabled: false,
        cacheTTL: 7200000,
        rateLimitDelay: 2000
      });
      expect(customModule.config.cacheEnabled).toBe(false);
      expect(customModule.config.cacheTTL).toBe(7200000);
      expect(customModule.config.rateLimitDelay).toBe(2000);
    });
  });

  describe('loadFiles', () => {
    test('should load and parse local files', async () => {
      const testFile = path.join(__dirname, 'test.js');
      await fs.writeFile(testFile, 'function test() { return true; }');

      const results = await module.loadFiles([testFile]);
      
      expect(results).toHaveLength(1);
      expect(results[0].path).toBe(testFile);
      expect(results[0].functions).toBeDefined();
      expect(results[0].functions).toHaveLength(1);
      expect(results[0].functions[0].name).toBe('test');

      await fs.unlink(testFile);
    });

    test('should handle missing files gracefully', async () => {
      const results = await module.loadFiles(['/nonexistent/file.js']);
      
      expect(results).toHaveLength(1);
      expect(results[0].error).toBeDefined();
      expect(results[0].filePath).toBe('/nonexistent/file.js');
    });
  });

  describe('query', () => {
    beforeEach(async () => {
      const testFile = path.join(__dirname, 'sample.js');
      await fs.writeFile(testFile, `
        class TestClass {
          constructor() {
            this.value = 0;
          }
          
          increment() {
            this.value++;
          }
        }
        
        function helperFunction(param) {
          return param * 2;
        }
        
        module.exports = TestClass;
      `);

      await module.loadFiles([testFile]);
      await fs.unlink(testFile);
    });

    test('should find functions by query', async () => {
      const result = await module.query('find functions');
      
      expect(result.queryType).toBe('function_search');
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });

    test('should find classes by query', async () => {
      const result = await module.query('show me all classes');
      
      expect(result.queryType).toBe('class_search');
      expect(result.results).toBeDefined();
    });

    test('should return query metadata', async () => {
      const result = await module.query('test query');
      
      expect(result.query).toBe('test query');
      expect(result.keywords).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('getContext', () => {
    test('should generate context for query', async () => {
      const context = await module.getContext('test', {
        format: 'text',
        maxNodes: 5
      });
      
      expect(typeof context).toBe('string');
      expect(context).toContain('Context for query');
    });

    test('should generate markdown context', async () => {
      const context = await module.getContext('test', {
        format: 'markdown'
      });
      
      expect(typeof context).toBe('string');
      expect(context).toContain('#');
      expect(context).toContain('##');
    });

    test('should return structured context by default', async () => {
      const context = await module.getContext('test');
      
      expect(typeof context).toBe('object');
      expect(context.query).toBe('test');
      expect(context.nodes).toBeDefined();
      expect(context.summary).toBeDefined();
      expect(context.timestamp).toBeDefined();
    });
  });

  describe('knowledge graph operations', () => {
    test('should export knowledge graph', () => {
      const exported = module.getKnowledgeGraph();
      
      expect(exported.nodes).toBeDefined();
      expect(exported.edges).toBeDefined();
      expect(exported.repositories).toBeDefined();
      expect(exported.metadata).toBeDefined();
    });

    test('should save and load knowledge graph', async () => {
      const savePath = './test-graph.json';
      
      await module.saveKnowledgeGraph(savePath);
      
      const newModule = new GitHubKnowledgeGraphModule();
      const metadata = await newModule.loadKnowledgeGraph(savePath);
      
      expect(metadata).toBeDefined();
      expect(metadata.nodeCount).toBeDefined();
      expect(metadata.edgeCount).toBeDefined();
      
      await fs.unlink(savePath);
    });

    test('should get statistics', () => {
      const stats = module.getStats();
      
      expect(stats.nodes).toBeDefined();
      expect(stats.edges).toBeDefined();
      expect(stats.repositories).toBeDefined();
      expect(stats.cacheSize).toBeDefined();
    });
  });

  describe('cache operations', () => {
    test('should cache results when enabled', async () => {
      const cachedModule = new GitHubKnowledgeGraphModule({
        cacheEnabled: true
      });

      const testFile = path.join(__dirname, 'cache-test.js');
      await fs.writeFile(testFile, 'const x = 1;');

      await cachedModule.loadFiles([testFile]);
      const stats1 = cachedModule.getStats();
      
      await cachedModule.loadFiles([testFile]);
      const stats2 = cachedModule.getStats();
      
      expect(stats2.cacheSize).toBeGreaterThan(0);
      
      await fs.unlink(testFile);
    });

    test('should clear cache', () => {
      module.clearCache();
      const stats = module.getStats();
      expect(stats.cacheSize).toBe(0);
    });
  });
});