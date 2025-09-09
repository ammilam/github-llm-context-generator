const GitHubKnowledgeGraphModule = require('./src/index');
const fs = require('fs').promises;

async function demonstrateVibeCoding() {
  console.log('🎨 Vibe Coding Context Generator - Final Demo\n');
  
  const kg = new GitHubKnowledgeGraphModule({
    cacheEnabled: true,
    rateLimitDelay: 1000,
    localStoragePath: './test-repos'
  });

  try {
    // Load repository
    console.log('📦 Loading repository...');
    const repos = await kg.loadRepositories([
      'https://github.com/google/adk-python'
    ]);
    
    if (repos[0].error) {
      throw new Error(`Failed to load repository: ${repos[0].error}`);
    }
    
    console.log('✅ Repository loaded!\n');
    
    // Demonstrate different vibe coding queries
    
    // 1. Finding specific implementations
    console.log('🔍 Example 1: "How to implement an agent with tools"');
    const agentQuery = await kg.query('agent class tools implementation python');
    console.log(`   Found ${agentQuery.results.length} results`);
    
    // Get full context with actual code
    const agentContext = await kg.getContext('agent tools llm python file:.py', {
      format: 'markdown',
      maxNodes: 100,
      maxFiles: 10,
      maxCodeLength: 50000, // Large enough for full files
      includeFullFiles: true
    });
    
    // Count actual Python files in context
    const pythonFiles = (agentContext.match(/### File:.*\.py/g) || []).length;
    console.log(`   Python files included: ${pythonFiles}`);
    
    // Save for LLM consumption
    await fs.writeFile('./context-output/agent-implementation.md', agentContext);
    
    // Show a sample of an actual Agent class
    const agentClassMatch = agentContext.match(/class\s+\w*Agent[^\n]*[\s\S]{0,500}/);
    if (agentClassMatch) {
      console.log('\n   Sample Agent class found:');
      console.log('   ' + agentClassMatch[0].split('\n').slice(0, 10).join('\n   '));
    }
    
    // 2. Finding API patterns
    console.log('\n🔍 Example 2: "How to make API calls and handle responses"');
    const apiContext = await kg.getContext('request response api call fetch async', {
      format: 'markdown',
      maxNodes: 100,
      maxFiles: 10,
      maxCodeLength: 50000,
      includeFullFiles: true
    });
    
    await fs.writeFile('./context-output/api-patterns.md', apiContext);
    
    // 3. Finding configuration patterns
    console.log('\n🔍 Example 3: "How to configure and initialize modules"');
    const configContext = await kg.getContext('config init setup initialize constructor', {
      format: 'markdown',
      maxNodes: 100,
      maxFiles: 10,
      maxCodeLength: 50000,
      includeFullFiles: true
    });
    
    await fs.writeFile('./context-output/config-patterns.md', configContext);
    
    // 4. Finding test patterns
    console.log('\n🔍 Example 4: "How to write tests"');
    const testContext = await kg.getContext('test pytest unittest mock assert', {
      format: 'markdown',
      maxNodes: 100,
      maxFiles: 10,
      maxCodeLength: 50000,
      includeFullFiles: true
    });
    
    await fs.writeFile('./context-output/test-patterns.md', testContext);
    
    // 5. Create a comprehensive overview for general vibe coding
    console.log('\n🔍 Example 5: Creating comprehensive codebase overview');
    
    // Get all Python files with classes and functions
    const overviewContext = await kg.getContext('class def function method async await', {
      format: 'markdown',
      maxNodes: 200,
      maxFiles: 20,
      maxCodeLength: 100000,
      includeFullFiles: false // Use smart extraction for overview
    });
    
    await fs.writeFile('./context-output/codebase-overview.md', overviewContext);
    
    // Show summary statistics
    console.log('\n📊 Context Generation Summary:');
    console.log('   ✅ agent-implementation.md - ' + Math.round((await fs.stat('./context-output/agent-implementation.md')).size / 1024) + 'KB');
    console.log('   ✅ api-patterns.md - ' + Math.round((await fs.stat('./context-output/api-patterns.md')).size / 1024) + 'KB');
    console.log('   ✅ config-patterns.md - ' + Math.round((await fs.stat('./context-output/config-patterns.md')).size / 1024) + 'KB');
    console.log('   ✅ test-patterns.md - ' + Math.round((await fs.stat('./context-output/test-patterns.md')).size / 1024) + 'KB');
    console.log('   ✅ codebase-overview.md - ' + Math.round((await fs.stat('./context-output/codebase-overview.md')).size / 1024) + 'KB');
    
    console.log('\n💡 Usage with LLMs:');
    console.log('   These context files can be provided to LLMs (like Gemini) to:');
    console.log('   • Generate code that matches the repository style');
    console.log('   • Understand implementation patterns and best practices');
    console.log('   • Create compatible extensions and features');
    console.log('   • Debug and fix issues with full context');
    console.log('   • Answer questions about the codebase architecture');
    
    console.log('\n🎯 Example LLM Prompt:');
    console.log('   "Based on the provided context from agent-implementation.md,');
    console.log('    create a new agent that can interact with a REST API');
    console.log('    following the same patterns and conventions."');
    
    // Demonstrate specific file lookup
    console.log('\n🔍 Bonus: Direct file content retrieval');
    const kgExport = kg.getKnowledgeGraph();
    const agentBuilderFile = kgExport.nodes.find(n => 
      n.data && n.data.path && n.data.path.includes('agent_builder_assistant.py')
    );
    
    if (agentBuilderFile && agentBuilderFile.data.raw) {
      console.log(`   Found: ${agentBuilderFile.data.path}`);
      console.log(`   Size: ${agentBuilderFile.data.raw.length} characters`);
      console.log(`   Functions: ${agentBuilderFile.data.functions ? agentBuilderFile.data.functions.length : 0}`);
      console.log(`   Classes: ${agentBuilderFile.data.classes ? agentBuilderFile.data.classes.length : 0}`);
      
      // Save the specific file
      await fs.writeFile('./context-output/agent_builder_assistant.py', agentBuilderFile.data.raw);
      console.log('   ✅ Full file saved to context-output/agent_builder_assistant.py');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nTip: Make sure you have git installed and internet connection');
  }
}

demonstrateVibeCoding().catch(console.error);