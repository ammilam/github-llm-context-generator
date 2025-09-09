const GitHubLoader = require('./loaders/githubLoader');
const FileParser = require('./parsers/fileParser');
const KnowledgeGraph = require('./graph/knowledgeGraph');
const QueryEngine = require('./query/queryEngine');
const LLMIntegration = require('./llm/llmIntegration');
const Cache = require('./utils/cache');

class GitHubKnowledgeGraphModule {
  constructor(config = {}) {
    this.config = {
      cacheEnabled: true,
      cacheTTL: 3600000, // 1 hour default
      rateLimitDelay: 1000, // 1 second between API calls
      localStoragePath: './repos',
      ...config
    };

    this.cache = new Cache(this.config.cacheTTL);
    this.githubLoader = new GitHubLoader(this.config);
    this.fileParser = new FileParser();
    this.knowledgeGraph = new KnowledgeGraph();
    this.queryEngine = new QueryEngine(this.knowledgeGraph);
    this.llmIntegration = new LLMIntegration(this.knowledgeGraph);
  }

  async loadRepositories(repositories) {
    const results = [];
    
    for (const repo of repositories) {
      try {
        if (this.config.cacheEnabled) {
          const cached = this.cache.get(repo.url || repo);
          if (cached) {
            results.push(cached);
            continue;
          }
        }

        const repoData = await this.githubLoader.loadRepository(repo);
        const parsedData = await this.fileParser.parseRepository(repoData);
        
        await this.knowledgeGraph.addRepository(parsedData);
        
        if (this.config.cacheEnabled) {
          this.cache.set(repo.url || repo, parsedData);
        }
        
        results.push(parsedData);
      } catch (error) {
        console.error(`Error loading repository ${repo.url || repo}:`, error.message);
        results.push({ error: error.message, repository: repo });
      }
    }
    
    return results;
  }

  async loadPaths(paths) {
    const results = [];
    
    for (const path of paths) {
      try {
        const pathData = await this.githubLoader.loadPath(path);
        const parsedData = await this.fileParser.parsePath(pathData);
        
        await this.knowledgeGraph.addPath(parsedData);
        
        results.push(parsedData);
      } catch (error) {
        console.error(`Error loading path ${path}:`, error.message);
        results.push({ error: error.message, path });
      }
    }
    
    return results;
  }

  async loadFiles(filePaths) {
    const results = [];
    
    for (const filePath of filePaths) {
      try {
        const fileData = await this.fileParser.parseFile(filePath);
        await this.knowledgeGraph.addFile(fileData);
        results.push(fileData);
      } catch (error) {
        console.error(`Error loading file ${filePath}:`, error.message);
        results.push({ error: error.message, filePath });
      }
    }
    
    return results;
  }

  async query(naturalLanguageQuery) {
    try {
      return await this.queryEngine.query(naturalLanguageQuery);
    } catch (error) {
      console.error('Query error:', error.message);
      throw error;
    }
  }

  async getContext(query, options = {}) {
    try {
      return await this.llmIntegration.getContext(query, options);
    } catch (error) {
      console.error('Context generation error:', error.message);
      throw error;
    }
  }

  getKnowledgeGraph() {
    return this.knowledgeGraph.export();
  }

  async saveKnowledgeGraph(filePath) {
    return await this.knowledgeGraph.save(filePath);
  }

  async loadKnowledgeGraph(filePath) {
    return await this.knowledgeGraph.load(filePath);
  }

  clearCache() {
    this.cache.clear();
  }

  getStats() {
    return {
      nodes: this.knowledgeGraph.getNodeCount(),
      edges: this.knowledgeGraph.getEdgeCount(),
      repositories: this.knowledgeGraph.getRepositoryCount(),
      cacheSize: this.cache.getSize()
    };
  }
}

module.exports = GitHubKnowledgeGraphModule;