const GitHubKnowledgeGraphModule = require('./src/index');
require('dotenv').config(); // Load .env file if you have GitHub token

async function testVibeCoding() {
  console.log('🎨 Testing Vibe Coding Context Generation\n');
  console.log('This demo shows how to find relevant code patterns and documentation');
  console.log('for LLM-assisted coding (vibe coding)\n');
  
  const kg = new GitHubKnowledgeGraphModule({
    cacheEnabled: true,
    rateLimitDelay: 1000,
    localStoragePath: './test-repos'
  });

  try {
    // Load repository
    console.log('📦 Loading repository...');
    const repos = await kg.loadRepositories([
      'https://github.com/google/adk-samples/tree/main/python'
    ]);
    
    if (repos[0].error) {
      throw new Error(`Failed to load repository: ${repos[0].error}`);
    }
    
    console.log('✅ Repository loaded successfully!');
    console.log(`   Files: ${repos[0].files.length}`);
    const stats = kg.getStats();
    console.log(`   Knowledge Graph: ${stats.nodes} nodes, ${stats.edges} edges\n`);
    
    // Example 1: Find how to implement authentication
    console.log('🔍 Query 1: "How to implement authentication"');
    const authQuery = await kg.query('how to implement authentication auth login');
    console.log(`   Found ${authQuery.results.length} relevant results`);
    
    const authContext = await kg.getContext('agent root_agent mcp', {
      format: 'markdown',
      maxNodes: 100,
      maxFiles: 5,
      maxCodeLength: 10000,
      includeFullFiles: false
    });
    
    // Show a preview of the auth context
    console.log('\n📝 Context Preview for Authentication:');
    const authLines = authContext.split('\n');
    const authPreview = authLines.slice(0, 50).join('\n');
    console.log(authPreview);
    console.log(`... (${authLines.length - 50} more lines)\n`);
    
    // Example 2: Find API request patterns
    console.log('🔍 Query 2: "How to make API requests"');
    const apiQuery = await kg.query('how to make api request fetch http');
    console.log(`   Found ${apiQuery.results.length} relevant results`);
    
    const apiContext = await kg.getContext('api request http fetch client', {
      format: 'markdown',
      maxNodes: 100,
      maxFiles: 5,
      maxCodeLength: 10000,
      includeFullFiles: false
    });
    
    // Show files with API code
    console.log('\n📂 Files containing API patterns:');
    const apiFiles = apiContext.match(/### File: ([^\n]+)/g);
    if (apiFiles) {
      apiFiles.slice(0, 5).forEach(file => {
        console.log(`   ${file.replace('### File: ', '• ')}`);
      });
    }
    
    // Example 3: Find class implementations
    console.log('\n🔍 Query 3: "Show me agent class implementations"');
    const classQuery = await kg.query('class agent implementation');
    console.log(`   Found ${classQuery.results.length} relevant results`);
    
    const classContext = await kg.getContext('class agent assistant', {
      format: 'markdown',
      maxNodes: 100,
      maxFiles: 10,
      maxCodeLength: 15000,
      includeFullFiles: false
    });
    
    // Extract class names from context
    console.log('\n🏗️ Classes found:');
    const classMatches = classContext.match(/\*\*Classes:\*\* ([^\n]+)/g);
    if (classMatches) {
      classMatches.slice(0, 5).forEach(match => {
        console.log(`   ${match.replace('**Classes:** ', '• ')}`);
      });
    }
    
    // Example 4: Find specific implementation patterns
    console.log('\n🔍 Query 4: "How to use async/await patterns"');
    const asyncQuery = await kg.query('async await promise asynchronous');
    console.log(`   Found ${asyncQuery.results.length} relevant results`);
    
    // Example 5: Find module exports and APIs
    console.log('\n🔍 Query 5: "What APIs and exports are available"');
    const exportQuery = await kg.query('export module api public interface');
    console.log(`   Found ${exportQuery.results.length} relevant results`);
    
    const exportContext = await kg.getContext('exports api module', {
      format: 'markdown',
      maxNodes: 50,
      maxFiles: 5,
      maxCodeLength: 8000,
      includeFullFiles: false
    });
    
    // Show exports found
    console.log('\n📤 Module exports found:');
    const exportMatches = exportContext.match(/\*\*Exports:\*\* ([^\n]+)/g);
    if (exportMatches) {
      exportMatches.slice(0, 5).forEach(match => {
        console.log(`   ${match.replace('**Exports:** ', '• ')}`);
      });
    }
    
    // Save full context for LLM consumption
    console.log('\n💾 Saving full context files for LLM usage...');
    
    const fs = require('fs').promises;
    await fs.mkdir('./context-output', { recursive: true });
    
    // Save different contexts
    await fs.writeFile('./context-output/auth-context.md', authContext);
    await fs.writeFile('./context-output/api-context.md', apiContext);
    await fs.writeFile('./context-output/class-context.md', classContext);
    await fs.writeFile('./context-output/export-context.md', exportContext);
    
    console.log('   ✅ Context files saved to ./context-output/');
    
    // Example of creating a comprehensive context for a vibe coding task
    console.log('\n🎯 Creating comprehensive context for vibe coding task...');
    const comprehensiveContext = await kg.getContext('', {
      format: 'markdown',
      maxNodes: 200,
      maxFiles: 20,
      maxCodeLength: 20000,
      includeFullFiles: false
    });
    
    await fs.writeFile('./context-output/full-context.md', comprehensiveContext);
    console.log('   ✅ Full context saved (ready for LLM consumption)');
    
    // Show summary
    console.log('\n📊 Summary:');
    console.log('   This tool can now provide rich context for LLMs including:');
    console.log('   • Complete function and class implementations');
    console.log('   • API patterns and usage examples');
    console.log('   • Module exports and interfaces');
    console.log('   • Related code sections with full context');
    console.log('   • Documentation and comments');
    console.log('\n   Perfect for "vibe coding" where the LLM understands');
    console.log('   the codebase patterns and can generate compatible code!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nTip: Make sure you have git installed and internet connection');
  }
}

// Run the test
testVibeCoding().catch(console.error);