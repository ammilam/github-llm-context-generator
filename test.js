const GitHubKnowledgeGraphModule = require('./src/index');

async function generatePrompt() {
	const kg = new GitHubKnowledgeGraphModule({
		cacheEnabled: true,
		rateLimitDelay: 1000,
		localStoragePath: './test-repos'
	});

	try {
		const s = await kg.loadRepositories([
			'https://github.com/google/adk-samples',
		]);

	 const context = await kg.getContext('root_agent', {
      format: 'markdown',
      maxNodes: 100,
      maxFiles: 10,
      maxCodeLength: 10000,
      includeFullFiles: true
    });

		const prompt = `Context: ${context}\n\n Prompt: How do I make an ADK Agent?`;
		console.log(prompt);

	} catch (error) {
		console.error('Error:', error.message);
	}
}

generatePrompt();