const GitHubKnowledgeGraphModule = require('./src/index');
const path = require('path');

async function testModule() {
  console.log('🚀 Testing GitHub Knowledge Graph Module\n');
  
  // Initialize the module
  const kgModule = new GitHubKnowledgeGraphModule({
    cacheEnabled: true,
    cacheTTL: 3600000,
    rateLimitDelay: 500,
    localStoragePath: './test-repos'
  });

  try {
    // Test 1: Load local files
    console.log('📁 Test 1: Loading local files...');
    const localFiles = await kgModule.loadFiles([
      './src/index.js',
      './src/graph/knowledgeGraph.js',
      './src/query/queryEngine.js'
    ]);
    console.log(`✅ Loaded ${localFiles.length} local files\n`);

    // Test 2: Query for functions
    console.log('🔍 Test 2: Querying for functions...');
    const functionQuery = await kgModule.query('find all functions');
    console.log(`Found ${functionQuery.results.length} functions`);
    if (functionQuery.results.length > 0) {
      console.log('Sample functions found:');
      functionQuery.results.slice(0, 3).forEach(result => {
        if (result.node && result.node.data) {
          console.log(`  - ${result.node.data.name || 'unnamed'} (${result.node.data.file})`);
        }
      });
    }
    console.log();

    // Test 3: Query for classes
    console.log('🏗️ Test 3: Querying for classes...');
    const classQuery = await kgModule.query('show me all classes');
    console.log(`Found ${classQuery.results.length} classes`);
    if (classQuery.results.length > 0) {
      console.log('Classes found:');
      classQuery.results.forEach(result => {
        if (result.node && result.node.data) {
          console.log(`  - ${result.node.data.name} (${result.node.data.file})`);
        }
      });
    }
    console.log();

    // Test 4: Generate context for LLM
    console.log('📝 Test 4: Generating context for LLM...');
    const textContext = await kgModule.getContext('knowledge graph', {
      format: 'text',
      maxNodes: 10,
      includeCode: false
    });
    console.log('Text context preview:');
    console.log(textContext.substring(0, 300) + '...\n');

    // Test 5: Generate markdown context
    console.log('📄 Test 5: Generating markdown context...');
    const markdownContext = await kgModule.getContext('query engine', {
      format: 'markdown',
      maxNodes: 5,
      includeCode: true
    });
    console.log('Markdown context preview:');
    console.log(markdownContext.substring(0, 400) + '...\n');

    // Test 6: Get statistics
    console.log('📊 Test 6: Getting statistics...');
    const stats = kgModule.getStats();
    console.log('Knowledge Graph Statistics:');
    console.log(`  - Nodes: ${stats.nodes}`);
    console.log(`  - Edges: ${stats.edges}`);
    console.log(`  - Repositories: ${stats.repositories}`);
    console.log(`  - Cache Size: ${stats.cacheSize}\n`);

    // Test 7: Export knowledge graph
    console.log('💾 Test 7: Exporting knowledge graph...');
    const exportedGraph = kgModule.getKnowledgeGraph();
    console.log(`Exported graph with ${exportedGraph.nodes.length} nodes and ${exportedGraph.edges.length} edges`);
    console.log('Node types in graph:');
    const nodeTypes = {};
    exportedGraph.nodes.forEach(node => {
      nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
    });
    Object.entries(nodeTypes).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });
    console.log();

    // Test 8: Save and load graph
    console.log('💾 Test 8: Saving and loading graph...');
    const savePath = './test-graph.json';
    await kgModule.saveKnowledgeGraph(savePath);
    console.log(`✅ Graph saved to ${savePath}`);
    
    const newModule = new GitHubKnowledgeGraphModule();
    const metadata = await newModule.loadKnowledgeGraph(savePath);
    console.log(`✅ Graph loaded: ${metadata.nodeCount} nodes, ${metadata.edgeCount} edges\n`);

    // Test 9: Test with a small GitHub repository (optional)
    console.log('🌐 Test 9: Loading a GitHub repository (optional)...');
    console.log('To test with a real GitHub repo, uncomment the code below:');
    console.log('// const repos = await kgModule.loadRepositories([');
    console.log('//   "https://github.com/sindresorhus/is-odd"  // Small test repo');
    console.log('// ]);');
    console.log('// console.log(`Loaded repository: ${repos[0].repository}`);\n');
    
    // Uncomment to test with a real repo:
    // const repos = await kgModule.loadRepositories([
    //   'https://github.com/sindresorhus/is-odd'  // Small test repo
    // ]);
    // console.log(`✅ Loaded repository: ${repos[0].repository}`);
    // const repoStats = kgModule.getStats();
    // console.log(`  - Total nodes after loading: ${repoStats.nodes}`);
    // console.log(`  - Total edges after loading: ${repoStats.edges}\n`);

    console.log('✨ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the tests
testModule().catch(console.error);