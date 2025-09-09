/**
 * Targeted Paths Example
 * Demonstrates loading specific paths from repositories for focused context
 */

const GitHubContextGenerator = require('../src/index');
const fs = require('fs').promises;

async function targetedPathsExample() {
  console.log('🎯 Targeted Path Loading Example\n');
  console.log('Load specific directories and files for focused context\n');
  
  const generator = new GitHubContextGenerator({
    cacheEnabled: true,
    rateLimitDelay: 1000,
    localStoragePath: './repos'
  });

  try {
    // Example 1: Load specific directories
    console.log('📁 Loading specific directories from a repository...');
    const repos = await generator.loadRepositories([{
      url: 'https://github.com/vercel/next.js',
      branch: 'canary',
      paths: [
        'examples/with-typescript',
        'examples/api-routes',
        'docs/getting-started.md'
      ]
    }]);
    
    console.log('✅ Specific paths loaded!\n');
    
    // Example 2: Combine multiple repositories
    console.log('🔗 Combining examples from multiple repositories...');
    await generator.loadRepositories([
      {
        url: 'https://github.com/facebook/react',
        paths: ['packages/react/src/React.js', 'README.md']
      },
      {
        url: 'https://github.com/vuejs/core',
        paths: ['packages/runtime-core/src', 'README.md']
      }
    ]);
    
    console.log('✅ Multiple repositories loaded!\n');
    
    // Generate focused context
    console.log('🎨 Generating focused context...');
    const context = await generator.getContext('component lifecycle hooks state management', {
      format: 'markdown',
      maxNodes: 100,
      maxFiles: 15,
      maxCodeLength: 40000
    });
    
    await fs.mkdir('./context', { recursive: true });
    await fs.writeFile('./context/framework-comparison.md', context);
    
    // Show what was included
    const fileCount = (context.match(/### File:/g) || []).length;
    const codeBlocks = (context.match(/```/g) || []).length / 2;
    
    console.log('\n📊 Context Summary:');
    console.log(`   Files included: ${fileCount}`);
    console.log(`   Code blocks: ${codeBlocks}`);
    console.log(`   Total size: ${Math.round(context.length / 1024)}KB`);
    
    console.log('\n✨ Benefits of targeted loading:');
    console.log('   • Faster processing (only load what you need)');
    console.log('   • More relevant context (less noise)');
    console.log('   • Combine best examples from multiple sources');
    console.log('   • Perfect for learning specific patterns');
    
    console.log('\n💡 Use Case Examples:');
    console.log('   1. Learning: Load tutorial/example directories');
    console.log('   2. Migration: Load similar features from different frameworks');
    console.log('   3. Best Practices: Load well-documented modules');
    console.log('   4. Testing: Load test directories to understand testing patterns');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the example
if (require.main === module) {
  targetedPathsExample().catch(console.error);
}

module.exports = targetedPathsExample;