const GitHubKnowledgeGraphModule = require('./src/index');

async function quickTest() {
  console.log('Quick Test - GitHub Knowledge Graph Module\n');
  
  // Create instance
  const kg = new GitHubKnowledgeGraphModule();
  
  // Load the module's own source files
  console.log('1. Loading source files...');
  await kg.loadFiles([
    './src/index.js',
    './src/graph/knowledgeGraph.js'
  ]);
  
  // Query for classes
  console.log('\n2. Finding classes...');
  const classes = await kg.query('show me all classes');
  console.log(`Found ${classes.results.length} classes:`);
  classes.results.forEach(r => {
    if (r.node && r.node.data) {
      console.log(`   - ${r.node.data.name}`);
    }
  });
  
  // Generate context
  console.log('\n3. Generating context for "knowledge graph"...');
  const context = await kg.getContext('knowledge graph', {
    format: 'text',
    maxNodes: 5
  });
  console.log(context.substring(0, 200) + '...');
  
  // Get stats
  console.log('\n4. Statistics:');
  const stats = kg.getStats();
  console.log(`   - Nodes: ${stats.nodes}`);
  console.log(`   - Edges: ${stats.edges}`);
  
  console.log('\n✅ Quick test completed!');
}

quickTest().catch(console.error);