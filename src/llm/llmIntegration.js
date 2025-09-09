// Optional LLM integration - requires separate installation
// const { ChatOpenAI } = require('@langchain/openai');
// const { HumanMessage, SystemMessage } = require('@langchain/core/messages');

class LLMIntegration {
  constructor(knowledgeGraph) {
    this.knowledgeGraph = knowledgeGraph;
    this.model = null;
    this.initialized = false;
  }

  initialize(config = {}) {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('No OpenAI API key provided. LLM features will be limited.');
      return false;
    }

    try {
      // To enable LLM features, install: npm install @langchain/openai
      // Then uncomment the imports at the top and this code:
      /*
      const { ChatOpenAI } = require('@langchain/openai');
      this.model = new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: config.model || 'gpt-3.5-turbo',
        temperature: config.temperature || 0.7,
        maxTokens: config.maxTokens || 2000
      });
      */
      this.initialized = false;
      console.log('LLM integration requires @langchain/openai package');
      return false;
    } catch (error) {
      console.error('Failed to initialize LLM:', error.message);
      return false;
    }
  }

  async getContext(query, options = {}) {
    const {
      maxNodes = 50,
      includeCode = true,
      includeRelationships = true,
      format = 'structured',
      maxFiles = 10,
      maxCodeLength = 5000,  // Increased for full context
      includeFullFiles = true  // New option to include complete files
    } = options;

    // If query is empty or generic, provide overview of the repository
    let relevantNodes;
    if (!query || query.toLowerCase().includes('overview') || query.toLowerCase().includes('module')) {
      relevantNodes = await this.getRepositoryOverview(maxNodes);
    } else {
      relevantNodes = await this.findRelevantNodes(query, maxNodes);
    }
    
    // Always include actual file content for context
    const filesWithContent = await this.getFilesWithContent(relevantNodes, maxFiles, maxCodeLength, includeFullFiles);
    
    const context = {
      query,
      nodes: relevantNodes,
      summary: this.generateSummary(relevantNodes),
      filesWithContent,
      timestamp: new Date().toISOString()
    };

    if (includeRelationships) {
      context.relationships = this.extractRelationships(relevantNodes);
    }

    if (includeCode) {
      context.codeSnippets = this.extractCodeSnippets(relevantNodes);
    }

    if (format === 'text') {
      return this.formatContextAsText(context);
    } else if (format === 'markdown') {
      return this.formatContextAsMarkdown(context);
    }

    return context;
  }

  async findRelevantNodes(query, maxNodes) {
    const searchResults = this.knowledgeGraph.searchNodes(query);
    const relevantNodes = [];
    const addedIds = new Set();

    // If search returns no results, get some sample nodes
    const nodesToProcess = searchResults.length > 0 ? searchResults : this.getSampleNodes(maxNodes);

    for (const node of nodesToProcess.slice(0, maxNodes)) {
      if (!addedIds.has(node.id)) {
        relevantNodes.push(node);
        addedIds.add(node.id);

        const connected = this.knowledgeGraph.traverseGraph(node.id, 2);
        for (const connectedNode of connected.slice(0, 5)) {
          if (!addedIds.has(connectedNode.id) && relevantNodes.length < maxNodes) {
            relevantNodes.push(connectedNode);
            addedIds.add(connectedNode.id);
          }
        }
      }
    }

    return relevantNodes;
  }

  async getRepositoryOverview(maxNodes) {
    const nodes = [];
    const addedIds = new Set();
    
    // Get files
    const files = this.knowledgeGraph.findNodesByType('file').slice(0, Math.floor(maxNodes / 3));
    for (const file of files) {
      if (!addedIds.has(file.id)) {
        nodes.push(file);
        addedIds.add(file.id);
      }
    }
    
    // Get functions
    const functions = this.knowledgeGraph.findNodesByType('function').slice(0, Math.floor(maxNodes / 3));
    for (const func of functions) {
      if (!addedIds.has(func.id)) {
        nodes.push(func);
        addedIds.add(func.id);
      }
    }
    
    // Get classes
    const classes = this.knowledgeGraph.findNodesByType('class').slice(0, Math.floor(maxNodes / 3));
    for (const cls of classes) {
      if (!addedIds.has(cls.id)) {
        nodes.push(cls);
        addedIds.add(cls.id);
      }
    }
    
    // Get exports
    const exports = this.knowledgeGraph.findNodesByType('export');
    for (const exp of exports) {
      if (!addedIds.has(exp.id) && nodes.length < maxNodes) {
        nodes.push(exp);
        addedIds.add(exp.id);
      }
    }
    
    return nodes;
  }

  getSampleNodes(count) {
    const allNodes = Array.from(this.knowledgeGraph.nodes.values());
    return allNodes.slice(0, count);
  }

  async getFilesWithContent(nodes, maxFiles, maxCodeLength, includeFullFiles) {
    const filesWithContent = [];
    const processedPaths = new Set();
    
    // First, prioritize files that directly match the query context
    const prioritizedNodes = this.prioritizeNodesByRelevance(nodes);
    
    // Extract file nodes and related file paths
    for (const node of prioritizedNodes) {
      if (node.type === 'file' && node.data && node.data.path && !processedPaths.has(node.data.path)) {
        processedPaths.add(node.data.path);
        
        // Find the file node with raw content
        const fileNode = this.knowledgeGraph.findNodesByProperty('path', node.data.path, 'file')[0];
        if (fileNode && fileNode.data && fileNode.data.raw) {
          const fileContent = {
            path: node.data.path,
            content: includeFullFiles ? fileNode.data.raw : fileNode.data.raw.substring(0, maxCodeLength),
            fullLength: fileNode.data.raw.length,
            type: fileNode.data.type || 'unknown',
            functions: fileNode.data.functions || [],
            classes: fileNode.data.classes || [],
            exports: fileNode.data.exports || [],
            imports: fileNode.data.imports || [],
            relevanceScore: node.relevanceScore || 0
          };
          
          // If file is truncated, try to include complete functions/classes
          if (!includeFullFiles && fileNode.data.raw.length > maxCodeLength) {
            fileContent.content = this.extractRelevantSections(fileNode.data, maxCodeLength);
          }
          
          filesWithContent.push(fileContent);
        }
        
        if (filesWithContent.length >= maxFiles) break;
      } else if (node.data && node.data.file && !processedPaths.has(node.data.file)) {
        // This node references a file
        const fileNodes = this.knowledgeGraph.findNodesByProperty('path', node.data.file, 'file');
        if (fileNodes.length > 0 && fileNodes[0].data && fileNodes[0].data.raw) {
          processedPaths.add(node.data.file);
          const fileContent = {
            path: node.data.file,
            content: includeFullFiles ? fileNodes[0].data.raw : fileNodes[0].data.raw.substring(0, maxCodeLength),
            fullLength: fileNodes[0].data.raw.length,
            type: fileNodes[0].data.type || 'unknown',
            functions: fileNodes[0].data.functions || [],
            classes: fileNodes[0].data.classes || [],
            exports: fileNodes[0].data.exports || [],
            imports: fileNodes[0].data.imports || [],
            relevanceScore: node.relevanceScore || 0
          };
          
          // If file is truncated, try to include complete functions/classes
          if (!includeFullFiles && fileNodes[0].data.raw.length > maxCodeLength) {
            fileContent.content = this.extractRelevantSections(fileNodes[0].data, maxCodeLength);
          }
          
          filesWithContent.push(fileContent);
        }
        
        if (filesWithContent.length >= maxFiles) break;
      }
    }
    
    // Sort by relevance score
    filesWithContent.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    
    return filesWithContent;
  }

  prioritizeNodesByRelevance(nodes) {
    // Prioritize files, then functions/classes, then other nodes
    const files = nodes.filter(n => n.type === 'file');
    const functionsAndClasses = nodes.filter(n => n.type === 'function' || n.type === 'class');
    const exports = nodes.filter(n => n.type === 'export');
    const others = nodes.filter(n => !['file', 'function', 'class', 'export'].includes(n.type));
    
    return [...files, ...functionsAndClasses, ...exports, ...others];
  }

  extractRelevantSections(fileData, maxLength) {
    // Extract the most relevant sections of code
    const sections = [];
    let currentLength = 0;
    
    // Include important imports/exports first
    if (fileData.raw) {
      const lines = fileData.raw.split('\n');
      const importExportLines = [];
      const functionLines = new Map();
      const classLines = new Map();
      
      // Find import/export sections
      lines.forEach((line, idx) => {
        if (line.match(/^(import|export|from|require)/)) {
          importExportLines.push(idx);
        }
      });
      
      // Find function boundaries
      if (fileData.functions) {
        fileData.functions.forEach(func => {
          const startLine = func.line - 1;
          const endLine = this.findFunctionEnd(lines, startLine);
          functionLines.set(func.name, { start: startLine, end: endLine });
        });
      }
      
      // Find class boundaries
      if (fileData.classes) {
        fileData.classes.forEach(cls => {
          const startLine = cls.line - 1;
          const endLine = this.findClassEnd(lines, startLine);
          classLines.set(cls.name, { start: startLine, end: endLine });
        });
      }
      
      // Build the content with complete sections
      const includedRanges = [];
      
      // Include imports
      if (importExportLines.length > 0) {
        const importEnd = Math.max(...importExportLines.filter(i => i < 50));
        if (importEnd >= 0) {
          includedRanges.push({ start: 0, end: importEnd + 1 });
        }
      }
      
      // Include complete functions
      functionLines.forEach((range, name) => {
        includedRanges.push(range);
      });
      
      // Include complete classes
      classLines.forEach((range, name) => {
        includedRanges.push(range);
      });
      
      // Merge overlapping ranges and build content
      includedRanges.sort((a, b) => a.start - b.start);
      const mergedRanges = this.mergeRanges(includedRanges);
      
      const contentParts = [];
      for (const range of mergedRanges) {
        const section = lines.slice(range.start, range.end).join('\n');
        if (currentLength + section.length > maxLength && contentParts.length > 0) {
          break;
        }
        contentParts.push(section);
        currentLength += section.length;
      }
      
      return contentParts.join('\n\n// ...\n\n');
    }
    
    return fileData.raw ? fileData.raw.substring(0, maxLength) : '';
  }

  findFunctionEnd(lines, startLine) {
    // Simple heuristic: find the next function or end of file
    let braceCount = 0;
    let inFunction = false;
    
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      
      // Count braces to find function end
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          inFunction = true;
        } else if (char === '}') {
          braceCount--;
          if (inFunction && braceCount === 0) {
            return i + 1;
          }
        }
      }
      
      // For Python, look for dedentation
      if (fileData.type === 'python' && i > startLine) {
        const currentIndent = line.match(/^\s*/)[0].length;
        const startIndent = lines[startLine].match(/^\s*/)[0].length;
        if (currentIndent <= startIndent && line.trim() !== '') {
          return i;
        }
      }
    }
    
    return Math.min(startLine + 50, lines.length);
  }

  findClassEnd(lines, startLine) {
    // Similar to findFunctionEnd but for classes
    return this.findFunctionEnd(lines, startLine);
  }

  mergeRanges(ranges) {
    if (ranges.length === 0) return [];
    
    const merged = [ranges[0]];
    
    for (let i = 1; i < ranges.length; i++) {
      const last = merged[merged.length - 1];
      const current = ranges[i];
      
      if (current.start <= last.end + 1) {
        last.end = Math.max(last.end, current.end);
      } else {
        merged.push(current);
      }
    }
    
    return merged;
  }

  generateSummary(nodes) {
    const summary = {
      totalNodes: nodes.length,
      nodeTypes: {},
      files: new Set(),
      functions: [],
      classes: []
    };

    for (const node of nodes) {
      summary.nodeTypes[node.type] = (summary.nodeTypes[node.type] || 0) + 1;

      if (node.type === 'file' && node.data.path) {
        summary.files.add(node.data.path);
      } else if (node.type === 'function' && node.data.name) {
        summary.functions.push({
          name: node.data.name,
          file: node.data.file,
          line: node.data.line
        });
      } else if (node.type === 'class' && node.data.name) {
        summary.classes.push({
          name: node.data.name,
          file: node.data.file,
          line: node.data.line
        });
      }
    }

    summary.files = Array.from(summary.files);
    return summary;
  }

  extractRelationships(nodes) {
    const relationships = [];
    const nodeIds = new Set(nodes.map(n => n.id));

    for (const node of nodes) {
      const connections = this.knowledgeGraph.getNodeConnections(node.id);
      
      for (const edge of connections) {
        if (nodeIds.has(edge.target) || nodeIds.has(edge.source)) {
          const sourceNode = this.knowledgeGraph.nodes.get(edge.source);
          const targetNode = this.knowledgeGraph.nodes.get(edge.target);
          
          if (sourceNode && targetNode) {
            relationships.push({
              source: this.getNodeLabel(sourceNode),
              target: this.getNodeLabel(targetNode),
              relationship: edge.relationship
            });
          }
        }
      }
    }

    return relationships;
  }

  extractCodeSnippets(nodes) {
    const snippets = [];
    const processedFiles = new Set();

    for (const node of nodes) {
      if (node.type === 'file' && node.data.path && !processedFiles.has(node.data.path)) {
        processedFiles.add(node.data.path);
        
        const fileNodes = nodes.filter(n => 
          n.data && n.data.file === node.data.path
        );

        if (fileNodes.length > 0) {
          snippets.push({
            file: node.data.path,
            elements: fileNodes.map(n => ({
              type: n.type,
              name: n.data.name || n.data.text || 'unnamed',
              line: n.data.line
            }))
          });
        }
      } else if (node.type === 'codeblock' && node.data.code) {
        snippets.push({
          language: node.data.language,
          code: node.data.code,
          file: node.data.file,
          line: node.data.line
        });
      }
    }

    return snippets;
  }

  getNodeLabel(node) {
    if (node.data) {
      return node.data.name || node.data.path || node.data.text || node.type;
    }
    return node.type;
  }

  formatContextAsText(context) {
    let text = `Context for query: "${context.query}"\n\n`;
    
    text += `Summary:\n`;
    text += `- Total nodes: ${context.summary.totalNodes}\n`;
    text += `- Files: ${context.summary.files.length}\n`;
    text += `- Functions: ${context.summary.functions.length}\n`;
    text += `- Classes: ${context.summary.classes.length}\n\n`;

    if (context.summary.files.length > 0) {
      text += `Files:\n`;
      for (const file of context.summary.files.slice(0, 10)) {
        text += `  - ${file}\n`;
      }
      text += '\n';
    }

    if (context.summary.functions.length > 0) {
      text += `Functions:\n`;
      for (const func of context.summary.functions.slice(0, 10)) {
        text += `  - ${func.name} (${func.file}:${func.line})\n`;
      }
      text += '\n';
    }

    if (context.summary.classes.length > 0) {
      text += `Classes:\n`;
      for (const cls of context.summary.classes.slice(0, 10)) {
        text += `  - ${cls.name} (${cls.file}:${cls.line})\n`;
      }
      text += '\n';
    }

    if (context.relationships && context.relationships.length > 0) {
      text += `Key Relationships:\n`;
      for (const rel of context.relationships.slice(0, 10)) {
        text += `  - ${rel.source} ${rel.relationship} ${rel.target}\n`;
      }
    }

    return text;
  }

  formatContextAsMarkdown(context) {
    let markdown = `# Context for: "${context.query}"\n\n`;
    
    markdown += `## Summary\n\n`;
    markdown += `- **Total nodes**: ${context.summary.totalNodes}\n`;
    markdown += `- **Files**: ${context.summary.files.length}\n`;
    markdown += `- **Functions**: ${context.summary.functions.length}\n`;
    markdown += `- **Classes**: ${context.summary.classes.length}\n\n`;

    if (context.summary.files.length > 0) {
      markdown += `## Files\n\n`;
      for (const file of context.summary.files.slice(0, 10)) {
        markdown += `- \`${file}\`\n`;
      }
      markdown += '\n';
    }

    if (context.summary.functions.length > 0) {
      markdown += `## Functions\n\n`;
      for (const func of context.summary.functions.slice(0, 10)) {
        markdown += `- **${func.name}** - \`${func.file}:${func.line}\`\n`;
      }
      markdown += '\n';
    }

    if (context.summary.classes.length > 0) {
      markdown += `## Classes\n\n`;
      for (const cls of context.summary.classes.slice(0, 10)) {
        markdown += `- **${cls.name}** - \`${cls.file}:${cls.line}\`\n`;
      }
      markdown += '\n';
    }

    // Add actual file content for LLM context
    if (context.filesWithContent && context.filesWithContent.length > 0) {
      markdown += `## Source Code\n\n`;
      markdown += `*Showing ${context.filesWithContent.length} relevant files*\n\n`;
      
      for (const file of context.filesWithContent.slice(0, 5)) {
        markdown += `### File: ${file.path}\n\n`;
        
        // Add metadata about the file
        if (file.exports && file.exports.length > 0) {
          markdown += `**Exports:** ${file.exports.join(', ')}\n\n`;
        }
        if (file.functions && file.functions.length > 0) {
          markdown += `**Functions:** ${file.functions.map(f => f.name).join(', ')}\n\n`;
        }
        if (file.classes && file.classes.length > 0) {
          markdown += `**Classes:** ${file.classes.map(c => c.name).join(', ')}\n\n`;
        }
        
        markdown += `\`\`\`${file.type === 'javascript' ? 'js' : file.type === 'python' ? 'py' : file.type}\n`;
        // Include complete file content or relevant sections
        markdown += file.content;
        if (file.fullLength && file.fullLength > file.content.length) {
          markdown += `\n\n// ... (${file.fullLength - file.content.length} more characters in original file)`;
        }
        markdown += `\n\`\`\`\n\n`;
      }
    }

    if (context.codeSnippets && context.codeSnippets.length > 0) {
      markdown += `## Code Snippets\n\n`;
      for (const snippet of context.codeSnippets.slice(0, 5)) {
        if (snippet.code) {
          markdown += `### ${snippet.file || 'Code Block'}\n\n`;
          markdown += `\`\`\`${snippet.language || ''}\n`;
          markdown += snippet.code.substring(0, 500);
          if (snippet.code.length > 500) {
            markdown += '\n... (truncated)';
          }
          markdown += `\n\`\`\`\n\n`;
        }
      }
    }

    if (context.relationships && context.relationships.length > 0) {
      markdown += `## Key Relationships\n\n`;
      markdown += '| Source | Relationship | Target |\n';
      markdown += '|--------|--------------|--------|\n';
      for (const rel of context.relationships.slice(0, 15)) {
        markdown += `| ${rel.source} | ${rel.relationship} | ${rel.target} |\n`;
      }
    }

    return markdown;
  }

  async generateResponse(query, context) {
    if (!this.initialized) {
      return 'LLM not initialized. Install @langchain/openai and provide an API key to enable this feature.';
    }

    try {
      // This would work if @langchain/openai is installed:
      /*
      const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
      const systemPrompt = `You are a helpful assistant that answers questions about code repositories based on a knowledge graph context. 
      Use the provided context to answer questions accurately and concisely.`;

      const contextText = typeof context === 'string' 
        ? context 
        : this.formatContextAsText(context);

      const userPrompt = `Context:\n${contextText}\n\nQuestion: ${query}`;

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt)
      ];

      const response = await this.model.call(messages);
      return response.content;
      */
      return 'LLM features require additional setup';
    } catch (error) {
      console.error('Error generating LLM response:', error.message);
      return `Error: ${error.message}`;
    }
  }

  async explainCode(nodeId) {
    const node = this.knowledgeGraph.nodes.get(nodeId);
    if (!node) {
      return 'Node not found';
    }

    const context = this.knowledgeGraph.traverseGraph(nodeId, 2);
    const contextText = this.formatNodeContext(node, context);

    if (!this.initialized) {
      return contextText;
    }

    try {
      // Would work with @langchain/openai installed
      return contextText;
    } catch (error) {
      return contextText;
    }
  }

  formatNodeContext(node, relatedNodes) {
    let context = `Type: ${node.type}\n`;
    
    if (node.data) {
      for (const [key, value] of Object.entries(node.data)) {
        if (key !== 'raw' && value !== null && value !== undefined) {
          if (typeof value === 'object') {
            context += `${key}: ${JSON.stringify(value, null, 2)}\n`;
          } else {
            context += `${key}: ${value}\n`;
          }
        }
      }
    }

    if (relatedNodes.length > 1) {
      context += '\nRelated elements:\n';
      for (const related of relatedNodes.slice(1, 6)) {
        if (related.id !== node.id) {
          context += `- ${related.type}: ${this.getNodeLabel(related)}\n`;
        }
      }
    }

    return context;
  }

  async suggestImprovements(nodeId) {
    const node = this.knowledgeGraph.nodes.get(nodeId);
    if (!node || !this.initialized) {
      return [];
    }

    try {
      // Would work with @langchain/openai installed
      return [];
    } catch (error) {
      return [];
    }
  }
}

module.exports = LLMIntegration;