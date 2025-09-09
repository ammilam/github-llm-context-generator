/**
 * Vibe Coding Example
 * Demonstrates how to generate comprehensive context for AI-assisted coding
 */

const GitHubContextGenerator = require('../src/index');
const fs = require('fs').promises;

async function vibeCodingExample() {
  console.log('🎨 Vibe Coding Context Generation Example\n');
  console.log('This example shows how to generate rich context for LLMs\n');
  
  const generator = new GitHubContextGenerator({
    cacheEnabled: true,
    rateLimitDelay: 1000,
    localStoragePath: './repos'
  });

  try {
    // Load a repository with specific paths
    console.log('📦 Loading repository with targeted paths...');
    const repos = await generator.loadRepositories([{
      url: 'https://github.com/google/adk-samples',
      branch: 'main',
      paths: [
        'python/agents/data-science',
        'python/agents/RAG',
        'python/README.md'
      ]
    }]);
    
    console.log('✅ Repository loaded!\n');
    
    // Example 1: Find implementation patterns
    console.log('🔍 Finding agent implementation patterns...');
    const agentContext = await generator.getContext('agent class implementation tools', {
      format: 'markdown',
      maxNodes: 100,
      maxFiles: 10,
      maxCodeLength: 30000,
      includeFullFiles: true
    });
    
    await fs.mkdir('./context', { recursive: true });
    await fs.writeFile('./context/agent-patterns.md', agentContext);
    console.log('   ✓ Agent patterns saved to context/agent-patterns.md');
    
    // Example 2: Get API usage examples
    console.log('\n🔍 Finding API usage patterns...');
    const apiContext = await generator.getContext('api request response async', {
      format: 'markdown',
      maxNodes: 50,
      maxFiles: 5,
      includeFullFiles: false // Smart extraction
    });
    
    await fs.writeFile('./context/api-patterns.md', apiContext);
    console.log('   ✓ API patterns saved to context/api-patterns.md');
    
    // Example 3: Generate comprehensive overview
    console.log('\n🔍 Creating comprehensive codebase overview...');
    const overviewContext = await generator.getContext('', {
      format: 'markdown',
      maxNodes: 200,
      maxFiles: 20,
      maxCodeLength: 50000,
      includeFullFiles: false
    });
    
    await fs.writeFile('./context/codebase-overview.md', overviewContext);
    console.log('   ✓ Overview saved to context/codebase-overview.md');
    
    // Show statistics
    const stats = generator.getStats();
    console.log('\n📊 Statistics:');
    console.log(`   Nodes: ${stats.nodes}`);
    console.log(`   Edges: ${stats.edges}`);
    console.log(`   Repositories: ${stats.repositories}`);
    
    // Example prompts for LLMs
    console.log('\n💡 Example LLM Prompts:');
    console.log('1. "Based on agent-patterns.md, create a new agent that interacts with a database"');
    console.log('2. "Using the API patterns from api-patterns.md, implement error handling"');
    console.log('3. "Following the codebase style in overview.md, add a new feature"');
    
    console.log('\n✨ Context files are ready for your LLM!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the example
if (require.main === module) {
  vibeCodingExample().catch(console.error);
}

module.exports = vibeCodingExample;