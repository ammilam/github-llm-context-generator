const GitHubKnowledgeGraphModule = require('./src/index');

async function testCustom() {
  const kg = new GitHubKnowledgeGraphModule();
  
  // Load your own project files
  console.log('Loading local project files...\n');
  await kg.loadFiles([
    // Add your own file paths here
    './src/index.js',
    './src/graph/knowledgeGraph.js',
    './src/query/queryEngine.js',
    './src/parsers/fileParser.js'
  ]);
  
  // Interactive queries
  const queries = [
    'show me all classes',
    'find parsing functions',
    'what imports axios',
    'find cache related code',
    'show documentation'
  ];
  
  for (const q of queries) {
    console.log(`\nQuery: "${q}"`);
    const result = await kg.query(q);
    console.log(`  Query Type: ${result.queryType}`);
    console.log(`  Results: ${result.results.length} items found`);
    
    // Show first 3 results
    result.results.slice(0, 3).forEach((r, i) => {
      if (r.node && r.node.data) {
        const label = r.node.data.name || r.node.data.path || r.node.type;
        console.log(`    ${i + 1}. ${label} (relevance: ${r.relevance || 0})`);
      }
    });
  }
  
  // Save the graph
  console.log('\nSaving knowledge graph...');
  await kg.saveKnowledgeGraph('./my-project-graph.json');
  console.log('✅ Graph saved to my-project-graph.json');
  
  // Show final stats
  const stats = kg.getStats();
  console.log('\nKnowledge Graph Statistics:');
  console.log(`  Total Nodes: ${stats.nodes}`);
  console.log(`  Total Edges: ${stats.edges}`);
}

testCustom().catch(console.error);