# Description

This codebase will contain a nodejs module that can be used to load in data from a collection of github repositories, repo paths, and file paths and then use that data to create a knowledge graph that can be queried using natural language and used as context for a large language model.

# Rules
1. The module must be written in JavaScript or TypeScript and be compatible with Node.js.
2. The module should be able to accept a list of GitHub repository URLs, specific paths
within those repositories, and individual file paths.
3. The module should clone or download the specified repositories and paths to a local
directory for processing.
4. The module should parse the files in the specified paths to extract relevant information,
such as code snippets, comments, and documentation.
5. The extracted information should be structured in a way that can be used to create a
knowledge graph, such as using nodes and edges to represent entities and their relationships.
6. The module should provide functionality to query the knowledge graph using natural
language queries.
7. The module should be able to integrate with a large language model (LLM) to
provide context for generating responses based on the knowledge graph.
8. The module should handle errors gracefully, such as invalid repository URLs, inaccessible paths, or parsing issues.
9. The module should include documentation on how to install, configure, and use it.
10. The module should include tests to verify its functionality and ensure reliability.
11. The module should be designed with scalability in mind, allowing for the addition of more repositories and paths without significant performance degradation.
12. The module should respect GitHub's API rate limits and usage policies when accessing repositories.
13. The module should provide options for caching or storing the knowledge graph for faster access in future queries.
