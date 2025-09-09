const GitHubKnowledgeGraphModule = require('./src/index');
const fs = require('fs').promises;

async function testTargetedPaths() {
  console.log('🎯 Targeted Path Loading Demo\n');
  console.log('This demonstrates loading specific paths from GitHub repos');
  console.log('for more focused context generation\n');
  
  const kg = new GitHubKnowledgeGraphModule({
    cacheEnabled: true,
    rateLimitDelay: 1000,
    localStoragePath: './test-repos'
  });

  try {
    // Example 1: Load only specific directories from a repo
    console.log('📁 Loading specific paths from repository...\n');
    
    // First, load the main repository with specific Python paths
    const repos = await kg.loadRepositories([{
      url: 'https://github.com/google/adk-samples',
      branch: 'main',
      paths: [
        'python/agents/data-science',        // Data science agent example
        'python/agents/RAG',                  // RAG agent example  
        'python/agents/software-bug-assistant', // Software bug assistant
        'python/README.md'                    // Python samples readme
      ]
    }]);
    
    console.log('✅ Targeted paths loaded!');
    
    // Example 2: Load specific files directly
    console.log('\n📄 Loading specific files...');
    
    const specificFiles = [
      'python/agents/data-science/agent.py',
      'python/agents/data-science/README.md',
      'python/agents/RAG/agent.py',
      'python/agents/software-bug-assistant/agent.py'
    ];
    
    // Load specific file paths
    for (const filePath of specificFiles) {
      const pathConfig = {
        repository: 'https://github.com/google/adk-samples',
        path: filePath,
        useAPI: false  // Use local clone
      };
      
      const pathData = await kg.loadPaths([pathConfig]);
      if (pathData[0] && !pathData[0].error) {
        console.log(`   ✓ Loaded: ${filePath}`);
      }
    }
    
    // Generate focused context from the targeted paths
    console.log('\n🎨 Generating focused context from targeted paths...');
    
    const focusedContext = await kg.getContext('agent assistant implementation', {
      format: 'markdown',
      maxNodes: 50,
      maxFiles: 10,
      maxCodeLength: 50000,
      includeFullFiles: true
    });
    
    await fs.mkdir('./context-output', { recursive: true });
    await fs.writeFile('./context-output/focused-agent-context.md', focusedContext);
    
    // Count what we got
    const pythonFiles = (focusedContext.match(/### File:.*\.py/g) || []).length;
    const markdownFiles = (focusedContext.match(/### File:.*\.md/g) || []).length;
    
    console.log(`   Python files: ${pythonFiles}`);
    console.log(`   Markdown docs: ${markdownFiles}`);
    console.log(`   Total size: ${Math.round(focusedContext.length / 1024)}KB`);
    
    // Example 3: Combine multiple repos with specific paths
    console.log('\n🔗 Combining multiple repositories with targeted paths...');
    
    const multiRepoConfig = [
      {
        url: 'https://github.com/google/adk-samples',
        branch: 'main',
        paths: ['python/agents/data-science', 'python/agents/RAG', 'python/README.md']
      },
      // You could add more repos here with their specific paths
      // {
      //   url: 'https://github.com/another/repo',
      //   paths: ['examples', 'docs/api.md']
      // }
    ];
    
    for (const repoConfig of multiRepoConfig) {
      const result = await kg.loadRepositories([repoConfig]);
      if (!result[0].error) {
        console.log(`   ✓ Loaded ${repoConfig.paths.length} paths from ${repoConfig.url}`);
      }
    }
    
    // Generate comprehensive context from all loaded paths
    const comprehensiveContext = await kg.getContext('', {
      format: 'markdown',
      maxNodes: 100,
      maxFiles: 20,
      maxCodeLength: 100000,
      includeFullFiles: false
    });
    
    await fs.writeFile('./context-output/multi-repo-context.md', comprehensiveContext);
    console.log(`   ✓ Multi-repo context saved (${Math.round(comprehensiveContext.length / 1024)}KB)`);
    
    // Example 4: Create a targeted context for a specific vibe coding task
    console.log('\n💡 Creating targeted context for specific coding task...');
    
    // For example: "I want to create a new agent with custom tools"
    const taskContext = await kg.getContext('class Agent tool LangchainTool', {
      format: 'markdown',
      maxNodes: 50,
      maxFiles: 5,
      maxCodeLength: 30000,
      includeFullFiles: true
    });
    
    await fs.writeFile('./context-output/agent-with-tools-context.md', taskContext);
    
    console.log('   ✓ Task-specific context created');
    
    console.log('\n✨ Benefits of Targeted Path Loading:');
    console.log('   • Faster loading (only get what you need)');
    console.log('   • More relevant context (less noise)');
    console.log('   • Better for specific tasks');
    console.log('   • Can combine examples from multiple repos');
    console.log('   • Perfect for vibe coding with focused context');
    
    console.log('\n📝 Usage Examples:');
    console.log('   1. Load only example directories:');
    console.log('      paths: ["examples", "samples", "demos"]');
    console.log('   2. Load specific implementation + its tests:');
    console.log('      paths: ["src/auth", "tests/auth"]');
    console.log('   3. Load documentation + related code:');
    console.log('      paths: ["README.md", "docs/", "src/api/"]');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testTargetedPaths().catch(console.error);