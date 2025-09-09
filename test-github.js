const GitHubKnowledgeGraphModule = require('./src/index');
require('dotenv').config(); // Load .env file if you have GitHub token

async function testWithGitHub() {
  console.log('Testing with Real GitHub Repository\n');
  
  const kg = new GitHubKnowledgeGraphModule({
    cacheEnabled: true,
    rateLimitDelay: 1000,
    localStoragePath: './test-repos'
  });

  try {
    // Test with a small repository
    console.log('Loading a small GitHub repository...');
    console.log('This will clone: https://github.com/google/adk-python');
    
    const repos = await kg.loadRepositories([
      'https://github.com/google/adk-python'  // Small, simple repo
    ]);
    
    // Check if the repository was loaded successfully
    if (repos[0].error) {
      throw new Error(`Failed to load repository: ${repos[0].error}`);
    }
    
    console.log('✅ Repository loaded successfully!');
    console.log(`Repository: ${repos[0].repository || repos[0].url || 'Unknown'}`);
    console.log(`Files loaded: ${repos[0].files ? repos[0].files.length : 0}\n`);
    
    // Query the loaded repository
    console.log('Searching for functions...');
    const functions = await kg.query('find all functions');
    console.log(`Found ${functions.results.length} functions\n`);
    
    // Generate context
    console.log('Generating markdown context...');
    const context = await kg.getContext('mcp', {
      format: 'markdown',
      maxNodes: 100
    });
    
    console.log('Context preview:');
    console.log(context);
    
    // Get statistics
    const stats = kg.getStats();
    console.log('Final Statistics:');
    console.log(`  - Nodes: ${stats.nodes}`);
    console.log(`  - Edges: ${stats.edges}`);
    console.log(`  - Repositories: ${stats.repositories}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nTip: Make sure you have git installed and internet connection');
  }
}

testWithGitHub().catch(console.error);