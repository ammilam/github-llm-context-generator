/**
 * Basic Usage Example
 * Demonstrates how to load a repository and generate context for LLMs
 */

const GitHubContextGenerator = require('../src/index');

async function basicExample() {
  console.log('GitHub Context Generator - Basic Usage Example\n');
  
  // Initialize the generator
  const generator = new GitHubContextGenerator({
    cacheEnabled: true,
    rateLimitDelay: 1000,
    localStoragePath: './repos'
  });

  try {
    // Load a repository
    console.log('Loading repository...');
    const repos = await generator.loadRepositories([
      'https://github.com/expressjs/express'
    ]);
    
    if (repos[0].error) {
      throw new Error(`Failed to load repository: ${repos[0].error}`);
    }
    
    console.log('✅ Repository loaded successfully!');
    
    // Get statistics
    const stats = generator.getStats();
    console.log(`📊 Knowledge Graph: ${stats.nodes} nodes, ${stats.edges} edges\n`);
    
    // Query the knowledge graph
    console.log('Querying for middleware functions...');
    const queryResults = await generator.query('middleware functions');
    console.log(`Found ${queryResults.results.length} results\n`);
    
    // Generate context for LLM
    console.log('Generating context for LLM...');
    const context = await generator.getContext('routing and middleware', {
      format: 'markdown',
      maxFiles: 5,
      maxCodeLength: 10000,
      includeFullFiles: false
    });
    
    // Display context preview
    console.log('Context preview:');
    console.log('================');
    const lines = context.split('\n');
    console.log(lines.slice(0, 30).join('\n'));
    console.log(`... (${lines.length - 30} more lines)\n`);
    
    // Save context to file
    const fs = require('fs').promises;
    await fs.writeFile('express-context.md', context);
    console.log('✅ Context saved to express-context.md');
    
    // Example LLM prompt
    console.log('\n💡 Example LLM Prompt:');
    console.log('------------------------');
    console.log('Based on the provided Express.js context, create a middleware that:');
    console.log('1. Logs request method and URL');
    console.log('2. Measures request processing time');
    console.log('3. Adds custom headers to the response');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the example
if (require.main === module) {
  basicExample().catch(console.error);
}

module.exports = basicExample;