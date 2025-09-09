# GitHub Context Generator

[![npm version](https://badge.fury.io/js/github-context-generator.svg)](https://badge.fury.io/js/github-context-generator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Generate LLM-ready context from GitHub repositories for AI-assisted coding. Extract code patterns, implementations, and documentation to provide rich context for Large Language Models like Gemini, GPT-4, and Claude.

## Features

- 🔍 **Smart Code Extraction** - Parse JavaScript, TypeScript, Python, Java, and more
- 🎯 **Targeted Path Loading** - Load specific directories or files from repositories
- 📊 **Knowledge Graph Generation** - Build a queryable graph of code relationships
- 🤖 **LLM-Optimized Output** - Generate markdown context perfect for AI consumption
- 🚀 **Pattern Recognition** - Find implementation patterns and code examples
- 💾 **Intelligent Caching** - Cache repository data for faster subsequent queries
- 🔗 **Multi-Repository Support** - Combine context from multiple sources

## Installation

```bash
npm install github-context-generator
```

## Quick Start

```javascript
const GitHubContextGenerator = require('github-context-generator');

// Initialize the generator
const generator = new GitHubContextGenerator({
  cacheEnabled: true,
  localStoragePath: './repos'
});

// Load a repository
const repos = await generator.loadRepositories([
  'https://github.com/user/repo'
]);

// Generate context for your LLM
const context = await generator.getContext('authentication implementation', {
  format: 'markdown',
  maxFiles: 10,
  includeFullFiles: true
});

console.log(context); // Markdown-formatted context ready for LLM
```

## Advanced Usage

### Loading Specific Paths

Target specific directories or files within repositories:

```javascript
// Load only specific paths from a repository
const repos = await generator.loadRepositories([{
  url: 'https://github.com/google/adk-samples',
  branch: 'main',
  paths: [
    'python/agents/data-science',
    'python/agents/RAG',
    'README.md'
  ]
}]);
```

### Natural Language Queries

Find relevant code using natural language:

```javascript
// Query for specific patterns
const results = await generator.query('how to implement async API calls');

// Get context for a specific coding task
const context = await generator.getContext('websocket event handling', {
  format: 'markdown',
  maxNodes: 100,
  maxFiles: 20,
  maxCodeLength: 50000
});
```

### Vibe Coding Support

Perfect for "vibe coding" - giving LLMs the context they need to generate code that matches your codebase style:

```javascript
// Get comprehensive context about your codebase patterns
const vibeContext = await generator.getContext('', {
  format: 'markdown',
  maxNodes: 200,
  maxFiles: 30,
  includeFullFiles: false // Smart extraction of relevant sections
});

// Save context for LLM consumption
const fs = require('fs').promises;
await fs.writeFile('context.md', vibeContext);
```

## API Reference

### Constructor Options

```javascript
new GitHubContextGenerator({
  cacheEnabled: true,        // Enable caching (default: true)
  cacheTTL: 3600000,         // Cache TTL in ms (default: 1 hour)
  rateLimitDelay: 1000,      // Delay between API calls in ms
  localStoragePath: './repos' // Where to clone repositories
})
```

### Main Methods

#### `loadRepositories(repositories)`
Load one or more repositories into the knowledge graph.

```javascript
// Simple format
await generator.loadRepositories(['https://github.com/user/repo']);

// Advanced format with specific paths
await generator.loadRepositories([{
  url: 'https://github.com/user/repo',
  branch: 'main',
  paths: ['src', 'docs/api.md']
}]);
```

#### `query(naturalLanguageQuery)`
Search the knowledge graph using natural language.

```javascript
const results = await generator.query('find all React components');
```

#### `getContext(query, options)`
Generate LLM-ready context based on a query.

Options:
- `format`: 'markdown' | 'text' | 'structured' (default: 'structured')
- `maxNodes`: Maximum number of graph nodes to include (default: 20)
- `maxFiles`: Maximum number of files to include (default: 10)
- `maxCodeLength`: Maximum characters of code per file (default: 5000)
- `includeFullFiles`: Whether to include complete file contents (default: true)

```javascript
const context = await generator.getContext('authentication', {
  format: 'markdown',
  maxFiles: 15,
  includeFullFiles: true
});
```

#### `getStats()`
Get statistics about the loaded knowledge graph.

```javascript
const stats = generator.getStats();
console.log(`Nodes: ${stats.nodes}, Edges: ${stats.edges}`);
```

## Examples

### Example 1: Finding Implementation Patterns

```javascript
const generator = new GitHubContextGenerator();

// Load a repository
await generator.loadRepositories(['https://github.com/expressjs/express']);

// Find middleware patterns
const middlewareContext = await generator.getContext('middleware implementation', {
  format: 'markdown',
  maxFiles: 10
});

// Use with your LLM
const prompt = `Based on this context:\n${middlewareContext}\n\nCreate a new middleware that logs request duration.`;
```

### Example 2: Multi-Repository Context

```javascript
// Load examples from multiple repositories
await generator.loadRepositories([
  {
    url: 'https://github.com/vercel/next.js',
    paths: ['examples/with-typescript', 'docs']
  },
  {
    url: 'https://github.com/facebook/react',
    paths: ['packages/react/src']
  }
]);

// Generate comprehensive context
const context = await generator.getContext('component lifecycle hooks', {
  format: 'markdown',
  maxFiles: 20
});
```

### Example 3: Targeted Documentation Context

```javascript
// Load only documentation and examples
await generator.loadRepositories([{
  url: 'https://github.com/user/project',
  paths: ['README.md', 'docs/', 'examples/']
}]);

// Get documentation-focused context
const docsContext = await generator.getContext('API usage examples', {
  format: 'markdown',
  includeFullFiles: true
});
```

## Use Cases

- **AI-Assisted Development**: Provide context to LLMs for generating compatible code
- **Code Analysis**: Understand patterns and implementations across repositories
- **Documentation Generation**: Extract and organize code documentation
- **Learning**: Study how specific features are implemented in real projects
- **Migration**: Understand existing code patterns when migrating or refactoring
- **Code Review**: Generate context for understanding large pull requests

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [simple-git](https://github.com/steveukx/git-js) for repository management
- Uses [natural](https://github.com/NaturalNode/natural) for NLP processing
- Inspired by the need for better LLM context in "vibe coding"

## Support

- 🐛 [Report bugs](https://github.com/yourusername/github-context-generator/issues)
- 💡 [Request features](https://github.com/yourusername/github-context-generator/issues)
- 📖 [Read the docs](https://github.com/yourusername/github-context-generator#readme)

---

Made with ❤️ for the AI-assisted development community