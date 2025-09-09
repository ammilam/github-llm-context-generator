# GitHub Knowledge Graph Module

A Node.js module that loads data from GitHub repositories and creates a queryable knowledge graph for use as context with Large Language Models (LLMs).

## Features

- **Repository Loading**: Clone or download GitHub repositories, specific paths, and individual files
- **Intelligent Parsing**: Extract code structure, functions, classes, imports, and documentation
- **Knowledge Graph**: Build a connected graph of code entities and their relationships
- **Natural Language Queries**: Search the knowledge graph using natural language
- **LLM Integration**: Generate context for language models from the knowledge graph
- **Caching**: Built-in caching mechanism for improved performance
- **Rate Limiting**: Respects GitHub API rate limits

## Installation

```bash
npm install set-model-context-from-github
```

## Quick Start

```javascript
const GitHubKnowledgeGraphModule = require('set-model-context-from-github');

// Initialize the module
const kgModule = new GitHubKnowledgeGraphModule({
  cacheEnabled: true,
  cacheTTL: 3600000, // 1 hour
  rateLimitDelay: 1000, // 1 second between API calls
  localStoragePath: './repos'
});

// Load repositories
const repos = await kgModule.loadRepositories([
  'https://github.com/owner/repo',
  {
    url: 'https://github.com/another/repo',
    branch: 'develop',
    paths: ['src', 'lib']
  }
]);

// Query the knowledge graph
const results = await kgModule.query('find all React components');

// Get context for LLM
const context = await kgModule.getContext('authentication flow', {
  format: 'markdown',
  maxNodes: 20,
  includeCode: true
});
```

## API Reference

### Constructor

```javascript
new GitHubKnowledgeGraphModule(config)
```

**Config Options:**
- `cacheEnabled` (boolean): Enable caching (default: true)
- `cacheTTL` (number): Cache time-to-live in milliseconds (default: 3600000)
- `rateLimitDelay` (number): Delay between API calls in milliseconds (default: 1000)
- `localStoragePath` (string): Directory for cloned repositories (default: './repos')

### Methods

#### `loadRepositories(repositories)`
Load one or more GitHub repositories into the knowledge graph.

**Parameters:**
- `repositories` (Array): Array of repository URLs or configuration objects

**Returns:** Array of parsed repository data

```javascript
await kgModule.loadRepositories([
  'https://github.com/facebook/react',
  {
    url: 'https://github.com/vuejs/vue',
    branch: 'main',
    paths: ['src']
  }
]);
```

#### `loadPaths(paths)`
Load specific paths from repositories.

**Parameters:**
- `paths` (Array): Array of path configurations

**Returns:** Array of parsed path data

```javascript
await kgModule.loadPaths([
  {
    repository: 'https://github.com/owner/repo',
    path: 'src/components',
    useAPI: true // Use GitHub API instead of cloning
  }
]);
```

#### `loadFiles(filePaths)`
Load and parse local files.

**Parameters:**
- `filePaths` (Array): Array of file paths

**Returns:** Array of parsed file data

```javascript
await kgModule.loadFiles([
  './src/index.js',
  './lib/utils.js'
]);
```

#### `query(naturalLanguageQuery)`
Search the knowledge graph using natural language.

**Parameters:**
- `naturalLanguageQuery` (string): Natural language search query

**Returns:** Query results with ranked relevance

```javascript
const results = await kgModule.query('show me all authentication functions');
// Returns: { query, queryType, keywords, results, timestamp }
```

#### `getContext(query, options)`
Generate context for LLM from the knowledge graph.

**Parameters:**
- `query` (string): Query to generate context for
- `options` (Object): Context generation options
  - `maxNodes` (number): Maximum nodes to include (default: 20)
  - `includeCode` (boolean): Include code snippets (default: true)
  - `includeRelationships` (boolean): Include entity relationships (default: true)
  - `format` (string): Output format - 'structured', 'text', or 'markdown' (default: 'structured')

**Returns:** Generated context in specified format

```javascript
const context = await kgModule.getContext('database models', {
  format: 'markdown',
  maxNodes: 30,
  includeCode: true
});
```

#### `getKnowledgeGraph()`
Export the entire knowledge graph.

**Returns:** Object containing nodes, edges, and metadata

```javascript
const graph = kgModule.getKnowledgeGraph();
console.log(`Total nodes: ${graph.metadata.nodeCount}`);
console.log(`Total edges: ${graph.metadata.edgeCount}`);
```

#### `saveKnowledgeGraph(filePath)`
Save the knowledge graph to a file.

**Parameters:**
- `filePath` (string): Path to save the graph

**Returns:** File path where graph was saved

```javascript
await kgModule.saveKnowledgeGraph('./graph.json');
```

#### `loadKnowledgeGraph(filePath)`
Load a previously saved knowledge graph.

**Parameters:**
- `filePath` (string): Path to the saved graph file

**Returns:** Graph metadata

```javascript
const metadata = await kgModule.loadKnowledgeGraph('./graph.json');
console.log(`Loaded ${metadata.nodeCount} nodes`);
```

#### `getStats()`
Get statistics about the knowledge graph.

**Returns:** Object with node count, edge count, repository count, and cache size

```javascript
const stats = kgModule.getStats();
console.log(`Nodes: ${stats.nodes}, Edges: ${stats.edges}`);
```

#### `clearCache()`
Clear the cache.

```javascript
kgModule.clearCache();
```

## Knowledge Graph Structure

The module creates a graph with the following node types:

- **repository**: GitHub repository
- **file**: Source code file
- **function**: Function or method definition
- **class**: Class definition
- **import**: Import statement
- **export**: Export statement
- **documentation**: Comments and documentation
- **heading**: Markdown headings
- **codeblock**: Code blocks in markdown files

Relationships between nodes:
- `contains`: Parent-child relationship
- `defines`: File defines a function/class
- `imports`: File imports a module
- `exports`: File exports an entity
- `extends`: Class inheritance
- `references`: Import references a file
- `documents`: Documentation for code

## Query Types

The module supports various query types:

- **Function Search**: "find functions that handle authentication"
- **Class Search**: "show me all React components"
- **File Search**: "list files containing database logic"
- **Relationship Search**: "how does UserModel relate to AuthService"
- **Documentation Search**: "find documentation about API endpoints"
- **Import Search**: "what modules depend on axios"

## Environment Variables

- `GITHUB_TOKEN`: GitHub personal access token for API authentication (optional but recommended)
- `OPENAI_API_KEY`: OpenAI API key for LLM features (optional)

## Examples

### Basic Usage

```javascript
const GitHubKnowledgeGraphModule = require('set-model-context-from-github');

async function main() {
  const kgModule = new GitHubKnowledgeGraphModule();
  
  // Load a repository
  await kgModule.loadRepositories([
    'https://github.com/expressjs/express'
  ]);
  
  // Search for middleware functions
  const results = await kgModule.query('middleware functions');
  
  console.log(`Found ${results.results.length} results`);
  
  // Generate markdown context
  const context = await kgModule.getContext('routing', {
    format: 'markdown'
  });
  
  console.log(context);
}

main().catch(console.error);
```

### With LLM Integration

```javascript
const kgModule = new GitHubKnowledgeGraphModule();

// Initialize LLM integration
kgModule.llmIntegration.initialize({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-3.5-turbo'
});

// Load repository
await kgModule.loadRepositories(['https://github.com/owner/repo']);

// Get context and generate response
const context = await kgModule.getContext('how does authentication work');
const response = await kgModule.llmIntegration.generateResponse(
  'Explain the authentication flow',
  context
);

console.log(response);
```

### Caching and Performance

```javascript
const kgModule = new GitHubKnowledgeGraphModule({
  cacheEnabled: true,
  cacheTTL: 7200000 // 2 hours
});

// First load - fetches from GitHub
await kgModule.loadRepositories(['https://github.com/large/repo']);

// Second load - uses cache
await kgModule.loadRepositories(['https://github.com/large/repo']);

// Check cache statistics
const stats = kgModule.getStats();
console.log(`Cache size: ${stats.cacheSize}`);

// Clear cache when needed
kgModule.clearCache();
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Error Handling

The module handles errors gracefully:

- Invalid repository URLs return error objects
- Inaccessible files are skipped with warnings
- API rate limits are automatically handled
- Parsing errors are logged but don't stop processing

## Limitations

- Binary files are not processed
- Large repositories may take time to clone
- GitHub API rate limits apply (5000 requests/hour with token)
- Some language-specific parsing may be limited

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Support

For issues and questions, please use the GitHub issue tracker.