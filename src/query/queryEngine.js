const natural = require('natural');

class QueryEngine {
  constructor(knowledgeGraph) {
    this.knowledgeGraph = knowledgeGraph;
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.tfidf = new natural.TfIdf();
    this.classifier = new natural.BayesClassifier();
    
    this.initializeClassifier();
  }

  initializeClassifier() {
    // Function searches
    this.classifier.addDocument('show me all functions', 'function_search');
    this.classifier.addDocument('find functions that', 'function_search');
    this.classifier.addDocument('list all methods', 'function_search');
    this.classifier.addDocument('what functions are in', 'function_search');
    this.classifier.addDocument('how to implement', 'function_search');
    this.classifier.addDocument('implementation of', 'function_search');
    
    // Class searches
    this.classifier.addDocument('show me all classes', 'class_search');
    this.classifier.addDocument('find classes that', 'class_search');
    this.classifier.addDocument('list all classes', 'class_search');
    this.classifier.addDocument('what classes are in', 'class_search');
    this.classifier.addDocument('class definition', 'class_search');
    
    // File searches
    this.classifier.addDocument('show me files', 'file_search');
    this.classifier.addDocument('find files containing', 'file_search');
    this.classifier.addDocument('list all files', 'file_search');
    this.classifier.addDocument('what files have', 'file_search');
    this.classifier.addDocument('where is', 'file_search');
    
    // Implementation pattern searches (for vibe coding)
    this.classifier.addDocument('how do I', 'pattern_search');
    this.classifier.addDocument('how to', 'pattern_search');
    this.classifier.addDocument('example of', 'pattern_search');
    this.classifier.addDocument('show me how', 'pattern_search');
    this.classifier.addDocument('code for', 'pattern_search');
    this.classifier.addDocument('pattern for', 'pattern_search');
    this.classifier.addDocument('best practice', 'pattern_search');
    
    // Relationship searches
    this.classifier.addDocument('how does X relate to Y', 'relationship_search');
    this.classifier.addDocument('what is the connection between', 'relationship_search');
    this.classifier.addDocument('show relationships', 'relationship_search');
    this.classifier.addDocument('what depends on', 'relationship_search');
    this.classifier.addDocument('uses of', 'relationship_search');
    
    // Documentation searches
    this.classifier.addDocument('show me the documentation', 'documentation_search');
    this.classifier.addDocument('find comments about', 'documentation_search');
    this.classifier.addDocument('what does this do', 'documentation_search');
    this.classifier.addDocument('explain', 'documentation_search');
    this.classifier.addDocument('documentation for', 'documentation_search');
    
    // Import/Export searches
    this.classifier.addDocument('import', 'import_search');
    this.classifier.addDocument('require', 'import_search');
    this.classifier.addDocument('dependencies', 'import_search');
    this.classifier.addDocument('what modules', 'import_search');
    this.classifier.addDocument('exports', 'import_search');
    this.classifier.addDocument('api', 'import_search');
    
    this.classifier.train();
  }

  async query(naturalLanguageQuery) {
    const queryType = this.classifyQuery(naturalLanguageQuery);
    const keywords = this.extractKeywords(naturalLanguageQuery);
    
    let results = [];
    
    switch (queryType) {
      case 'function_search':
        results = await this.searchFunctions(keywords);
        break;
      case 'class_search':
        results = await this.searchClasses(keywords);
        break;
      case 'file_search':
        results = await this.searchFiles(keywords);
        break;
      case 'pattern_search':
        results = await this.searchPatterns(naturalLanguageQuery, keywords);
        break;
      case 'relationship_search':
        results = await this.searchRelationships(keywords);
        break;
      case 'documentation_search':
        results = await this.searchDocumentation(keywords);
        break;
      case 'import_search':
        results = await this.searchImports(keywords);
        break;
      default:
        results = await this.generalSearch(keywords);
    }
    
    // Enhance results with code context for vibe coding
    results = await this.enhanceWithCodeContext(results);
    
    return {
      query: naturalLanguageQuery,
      queryType,
      keywords,
      results: this.rankResults(results, keywords),
      timestamp: new Date().toISOString()
    };
  }

  classifyQuery(query) {
    return this.classifier.classify(query.toLowerCase());
  }

  extractKeywords(query) {
    const tokens = this.tokenizer.tokenize(query.toLowerCase());
    
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'as', 'are', 'was',
      'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'must', 'can', 'could',
      'show', 'me', 'all', 'find', 'list', 'what', 'where', 'how', 'that',
      'in', 'to', 'for', 'of', 'with', 'from', 'about'
    ]);
    
    const keywords = tokens.filter(token => !stopWords.has(token));
    
    const stemmedKeywords = keywords.map(keyword => ({
      original: keyword,
      stemmed: this.stemmer.stem(keyword)
    }));
    
    return stemmedKeywords;
  }

  async searchFunctions(keywords) {
    const functionNodes = this.knowledgeGraph.findNodesByType('function');
    const results = [];
    
    for (const node of functionNodes) {
      const relevance = this.calculateRelevance(node, keywords);
      if (relevance > 0) {
        results.push({
          node,
          relevance,
          context: await this.getNodeContext(node.id)
        });
      }
    }
    
    return results;
  }

  async searchClasses(keywords) {
    const classNodes = this.knowledgeGraph.findNodesByType('class');
    const results = [];
    
    for (const node of classNodes) {
      const relevance = this.calculateRelevance(node, keywords);
      if (relevance > 0) {
        const context = await this.getNodeContext(node.id);
        
        const methods = this.knowledgeGraph.getNodeConnections(node.id, 'defines')
          .map(edge => this.knowledgeGraph.nodes.get(edge.target))
          .filter(n => n && n.type === 'function');
        
        results.push({
          node,
          relevance,
          context,
          methods
        });
      }
    }
    
    return results;
  }

  async searchFiles(keywords) {
    const fileNodes = this.knowledgeGraph.findNodesByType('file');
    const results = [];
    
    for (const node of fileNodes) {
      const relevance = this.calculateRelevance(node, keywords);
      if (relevance > 0) {
        const context = await this.getNodeContext(node.id);
        
        const contains = this.knowledgeGraph.getNodeConnections(node.id, 'defines')
          .map(edge => this.knowledgeGraph.nodes.get(edge.target))
          .filter(Boolean);
        
        results.push({
          node,
          relevance,
          context,
          contains
        });
      }
    }
    
    return results;
  }

  async searchRelationships(keywords) {
    const results = [];
    const allNodes = this.knowledgeGraph.searchNodes(keywords.map(k => k.original).join(' '));
    
    for (const node of allNodes.slice(0, 10)) {
      const connections = this.knowledgeGraph.getNodeConnections(node.id);
      
      for (const edge of connections) {
        const sourceNode = this.knowledgeGraph.nodes.get(edge.source);
        const targetNode = this.knowledgeGraph.nodes.get(edge.target);
        
        if (sourceNode && targetNode) {
          results.push({
            source: sourceNode,
            target: targetNode,
            relationship: edge.relationship,
            metadata: edge.metadata
          });
        }
      }
    }
    
    return results;
  }

  async searchDocumentation(keywords) {
    const docNodes = this.knowledgeGraph.findNodesByType('documentation');
    const headingNodes = this.knowledgeGraph.findNodesByType('heading');
    const results = [];
    
    for (const node of [...docNodes, ...headingNodes]) {
      const relevance = this.calculateRelevance(node, keywords);
      if (relevance > 0) {
        const context = await this.getNodeContext(node.id);
        results.push({
          node,
          relevance,
          context
        });
      }
    }
    
    return results;
  }

  async searchImports(keywords) {
    const importNodes = this.knowledgeGraph.findNodesByType('import');
    const exportNodes = this.knowledgeGraph.findNodesByType('export');
    const results = [];
    
    for (const node of [...importNodes, ...exportNodes]) {
      const relevance = this.calculateRelevance(node, keywords);
      if (relevance > 0) {
        const context = await this.getNodeContext(node.id);
        
        const references = this.knowledgeGraph.getNodeConnections(node.id, 'references')
          .map(edge => this.knowledgeGraph.nodes.get(edge.target))
          .filter(Boolean);
        
        results.push({
          node,
          relevance,
          context,
          references
        });
      }
    }
    
    return results;
  }

  async searchPatterns(query, keywords) {
    // Search for code patterns and implementation examples
    const results = [];
    
    // Look for functions that might implement the requested pattern
    const functionNodes = this.knowledgeGraph.findNodesByType('function');
    const classNodes = this.knowledgeGraph.findNodesByType('class');
    const fileNodes = this.knowledgeGraph.findNodesByType('file');
    
    // Score nodes based on pattern matching
    const allNodes = [...functionNodes, ...classNodes, ...fileNodes];
    
    for (const node of allNodes) {
      let relevance = this.calculatePatternRelevance(node, query, keywords);
      
      if (relevance > 0) {
        const context = await this.getNodeContext(node.id, 3); // Deeper context for patterns
        
        // Get the actual implementation code
        let codeSnippet = null;
        if (node.type === 'file' && node.data && node.data.raw) {
          codeSnippet = this.extractRelevantCodeSection(node.data, keywords);
        } else if (node.data && node.data.file) {
          const fileNode = this.knowledgeGraph.findNodesByProperty('path', node.data.file, 'file')[0];
          if (fileNode && fileNode.data && fileNode.data.raw) {
            codeSnippet = this.extractFunctionOrClassCode(fileNode.data, node);
          }
        }
        
        results.push({
          node,
          relevance,
          context,
          codeSnippet,
          patternType: this.identifyPatternType(node, query)
        });
      }
    }
    
    return results;
  }

  calculatePatternRelevance(node, query, keywords) {
    let relevance = this.calculateRelevance(node, keywords);
    
    // Boost relevance for common pattern indicators
    const patternIndicators = ['handler', 'listener', 'callback', 'async', 'promise', 
                               'fetch', 'api', 'request', 'response', 'middleware',
                               'component', 'hook', 'state', 'effect', 'render'];
    
    const nodeStr = JSON.stringify(node).toLowerCase();
    const queryLower = query.toLowerCase();
    
    for (const indicator of patternIndicators) {
      if (queryLower.includes(indicator) && nodeStr.includes(indicator)) {
        relevance += 3;
      }
    }
    
    return relevance;
  }

  extractRelevantCodeSection(fileData, keywords) {
    if (!fileData.raw) return null;
    
    const lines = fileData.raw.split('\n');
    const relevantSections = [];
    
    // Find lines containing keywords
    keywords.forEach(keyword => {
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes(keyword.original.toLowerCase())) {
          // Extract surrounding context (±10 lines)
          const start = Math.max(0, idx - 10);
          const end = Math.min(lines.length, idx + 10);
          relevantSections.push({
            start,
            end,
            matchLine: idx
          });
        }
      });
    });
    
    // Merge overlapping sections
    const merged = this.mergeSections(relevantSections);
    
    // Build the code snippet
    const snippets = merged.map(section => {
      return lines.slice(section.start, section.end).join('\n');
    });
    
    return snippets.join('\n\n// ...\n\n');
  }

  extractFunctionOrClassCode(fileData, targetNode) {
    if (!fileData.raw) return null;
    
    const lines = fileData.raw.split('\n');
    const startLine = (targetNode.data.line || 1) - 1;
    
    // Find the end of the function/class
    let endLine = startLine + 1;
    let braceCount = 0;
    let started = false;
    
    for (let i = startLine; i < lines.length && i < startLine + 100; i++) {
      const line = lines[i];
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          started = true;
        } else if (char === '}') {
          braceCount--;
          if (started && braceCount === 0) {
            endLine = i + 1;
            break;
          }
        }
      }
      if (started && braceCount === 0) break;
    }
    
    // For Python, use indentation
    if (fileData.type === 'python') {
      const baseIndent = lines[startLine].match(/^\s*/)[0].length;
      for (let i = startLine + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '') continue;
        const indent = line.match(/^\s*/)[0].length;
        if (indent <= baseIndent) {
          endLine = i;
          break;
        }
      }
    }
    
    return lines.slice(startLine, endLine).join('\n');
  }

  identifyPatternType(node, query) {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('api') || queryLower.includes('fetch') || queryLower.includes('request')) {
      return 'api_pattern';
    } else if (queryLower.includes('component') || queryLower.includes('render')) {
      return 'component_pattern';
    } else if (queryLower.includes('async') || queryLower.includes('promise')) {
      return 'async_pattern';
    } else if (queryLower.includes('event') || queryLower.includes('handler')) {
      return 'event_pattern';
    } else if (queryLower.includes('state') || queryLower.includes('hook')) {
      return 'state_pattern';
    }
    
    return 'general_pattern';
  }

  mergeSections(sections) {
    if (sections.length === 0) return [];
    
    sections.sort((a, b) => a.start - b.start);
    const merged = [sections[0]];
    
    for (let i = 1; i < sections.length; i++) {
      const last = merged[merged.length - 1];
      const current = sections[i];
      
      if (current.start <= last.end + 5) {
        last.end = Math.max(last.end, current.end);
      } else {
        merged.push(current);
      }
    }
    
    return merged;
  }

  async enhanceWithCodeContext(results) {
    // Add actual code snippets to results for better vibe coding context
    for (const result of results) {
      if (!result.codeSnippet && result.node) {
        // Try to get code for this result
        if (result.node.type === 'file' && result.node.data && result.node.data.raw) {
          result.codeSnippet = result.node.data.raw.substring(0, 2000);
        } else if (result.node.data && result.node.data.file) {
          const fileNode = this.knowledgeGraph.findNodesByProperty('path', result.node.data.file, 'file')[0];
          if (fileNode && fileNode.data && fileNode.data.raw) {
            result.codeSnippet = this.extractFunctionOrClassCode(fileNode.data, result.node);
          }
        }
      }
    }
    
    return results;
  }

  async generalSearch(keywords) {
    const queryString = keywords.map(k => k.original).join(' ');
    const searchResults = this.knowledgeGraph.searchNodes(queryString);
    
    const results = [];
    for (const node of searchResults.slice(0, 20)) {
      const context = await this.getNodeContext(node.id);
      results.push({
        node,
        relevance: this.calculateRelevance(node, keywords),
        context
      });
    }
    
    return results;
  }

  calculateRelevance(node, keywords) {
    let relevance = 0;
    const nodeStr = JSON.stringify(node).toLowerCase();
    
    for (const keyword of keywords) {
      if (nodeStr.includes(keyword.original)) {
        relevance += 2;
      }
      if (nodeStr.includes(keyword.stemmed)) {
        relevance += 1;
      }
      
      if (node.data && node.data.name) {
        const name = node.data.name.toLowerCase();
        if (name === keyword.original) {
          relevance += 5;
        } else if (name.includes(keyword.original)) {
          relevance += 3;
        }
      }
    }
    
    return relevance;
  }

  async getNodeContext(nodeId, depth = 2) {
    const traversed = this.knowledgeGraph.traverseGraph(nodeId, depth);
    
    const context = {
      primary: this.knowledgeGraph.nodes.get(nodeId),
      related: traversed.filter(n => n.id !== nodeId),
      connections: this.knowledgeGraph.getNodeConnections(nodeId)
    };
    
    return context;
  }

  rankResults(results, keywords) {
    results.sort((a, b) => {
      const scoreA = a.relevance || 0;
      const scoreB = b.relevance || 0;
      return scoreB - scoreA;
    });
    
    return results.slice(0, 50);
  }

  async semanticSearch(query, options = {}) {
    const { maxResults = 10, minRelevance = 0.5 } = options;
    
    this.tfidf.addDocument(query);
    
    const allNodes = Array.from(this.knowledgeGraph.nodes.values());
    const scores = [];
    
    for (const node of allNodes) {
      const nodeDoc = this.nodeToDocument(node);
      this.tfidf.addDocument(nodeDoc);
      
      const score = this.tfidf.tfidf(query, this.tfidf.documents.length - 1);
      
      if (score >= minRelevance) {
        scores.push({
          node,
          score,
          context: await this.getNodeContext(node.id)
        });
      }
    }
    
    scores.sort((a, b) => b.score - a.score);
    
    return scores.slice(0, maxResults);
  }

  nodeToDocument(node) {
    const parts = [node.type];
    
    if (node.data) {
      if (node.data.name) parts.push(node.data.name);
      if (node.data.path) parts.push(node.data.path);
      if (node.data.file) parts.push(node.data.file);
      if (node.data.text) parts.push(node.data.text);
      if (node.data.module) parts.push(node.data.module);
    }
    
    return parts.join(' ');
  }

  getSuggestions(partialQuery) {
    const allNodes = Array.from(this.knowledgeGraph.nodes.values());
    const suggestions = new Set();
    
    const queryLower = partialQuery.toLowerCase();
    
    for (const node of allNodes) {
      if (node.data) {
        if (node.data.name && node.data.name.toLowerCase().startsWith(queryLower)) {
          suggestions.add(node.data.name);
        }
        if (node.data.path && node.data.path.toLowerCase().includes(queryLower)) {
          suggestions.add(node.data.path);
        }
      }
    }
    
    return Array.from(suggestions).slice(0, 10);
  }
}

module.exports = QueryEngine;