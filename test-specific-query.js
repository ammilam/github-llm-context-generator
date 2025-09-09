const GitHubKnowledgeGraphModule = require('./src/index');

async function testSpecificQuery() {
  const kg = new GitHubKnowledgeGraphModule({
    cacheEnabled: true,
    rateLimitDelay: 1000,
    localStoragePath: './test-repos'
  });

  try {
    console.log('Loading repository...');
    const repos = await kg.loadRepositories([
      'https://github.com/google/adk-python'
    ]);
    
    if (repos[0].error) {
      throw new Error(`Failed to load repository: ${repos[0].error}`);
    }
    
    console.log('Repository loaded successfully!');
    
    // Search for Agent class implementations
    console.log('\nSearching for Agent class implementations...');
    const agentContext = await kg.getContext('AgentBuilderAssistant RemoteA2aAgent Agent class python', {
      format: 'markdown',
      maxNodes: 100,
      maxFiles: 15,
      maxCodeLength: 30000,
      includeFullFiles: true
    });
    
    // Save the full context
    const fs = require('fs').promises;
    await fs.writeFile('./agent-context.md', agentContext);
    console.log('Full context saved to agent-context.md');
    
    // Show statistics about what was found
    const codeBlocks = agentContext.match(/```/g);
    const fileHeaders = agentContext.match(/### File:/g);
    const classes = agentContext.match(/class \w+/g);
    const functions = agentContext.match(/def \w+/g);
    
    console.log('\nContext statistics:');
    console.log(`  Files included: ${fileHeaders ? fileHeaders.length : 0}`);
    console.log(`  Code blocks: ${codeBlocks ? codeBlocks.length / 2 : 0}`);
    console.log(`  Python classes found: ${classes ? classes.length : 0}`);
    console.log(`  Python functions found: ${functions ? functions.length : 0}`);
    console.log(`  Total size: ${agentContext.length} characters`);
    
    // Show first Python file with actual code
    const pythonFileMatch = agentContext.match(/### File: (.*\.py)[\s\S]*?```python([\s\S]*?)```/);
    if (pythonFileMatch) {
      console.log(`\nFirst Python file found: ${pythonFileMatch[1]}`);
      console.log('First 50 lines of code:');
      const lines = pythonFileMatch[2].split('\n').slice(0, 50);
      console.log(lines.join('\n'));
    } else {
      console.log('\nNo Python files with code found in context');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSpecificQuery().catch(console.error);