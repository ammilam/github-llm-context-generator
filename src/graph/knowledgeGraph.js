const fs = require('fs').promises;

class KnowledgeGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.repositories = new Map();
    this.nodeIdCounter = 0;
    this.edgeIdCounter = 0;
  }

  generateNodeId() {
    return `node_${++this.nodeIdCounter}`;
  }

  generateEdgeId() {
    return `edge_${++this.edgeIdCounter}`;
  }

  addNode(type, data) {
    const id = data.id || this.generateNodeId();
    const node = {
      id,
      type,
      data,
      timestamp: new Date().toISOString()
    };
    
    this.nodes.set(id, node);
    return id;
  }

  addEdge(sourceId, targetId, relationship, metadata = {}) {
    const id = this.generateEdgeId();
    const edge = {
      id,
      source: sourceId,
      target: targetId,
      relationship,
      metadata,
      timestamp: new Date().toISOString()
    };
    
    this.edges.set(id, edge);
    
    if (!this.edges.has(sourceId)) {
      this.edges.set(sourceId, []);
    }
    this.edges.get(sourceId).push(edge);
    
    return id;
  }

  async addRepository(parsedRepo) {
    const repoId = this.addNode('repository', {
      url: parsedRepo.repository,
      owner: parsedRepo.owner,
      name: parsedRepo.repo,
      branch: parsedRepo.branch,
      metadata: parsedRepo.metadata
    });
    
    this.repositories.set(parsedRepo.repository, repoId);
    
    for (const file of parsedRepo.files) {
      await this.addFileToGraph(file, repoId);
    }
    
    return repoId;
  }

  async addPath(parsedPath) {
    const pathId = this.addNode('path', {
      path: parsedPath.path,
      repository: parsedPath.repository,
      type: parsedPath.type
    });
    
    if (parsedPath.files) {
      for (const file of parsedPath.files) {
        await this.addFileToGraph(file, pathId);
      }
    }
    
    return pathId;
  }

  async addFile(parsedFile) {
    return await this.addFileToGraph(parsedFile, null);
  }

  async addFileToGraph(file, parentId) {
    const fileId = this.addNode('file', {
      path: file.path,
      extension: file.extension,
      size: file.size,
      type: file.type,
      raw: file.raw,
      functions: file.functions,
      classes: file.classes,
      imports: file.imports,
      exports: file.exports,
      comments: file.comments
    });
    
    if (parentId) {
      this.addEdge(parentId, fileId, 'contains');
    }
    
    if (file.functions) {
      for (const func of file.functions) {
        const funcId = this.addNode('function', {
          name: func.name,
          file: file.path,
          line: func.line,
          type: func.type
        });
        this.addEdge(fileId, funcId, 'defines');
      }
    }
    
    if (file.classes) {
      for (const cls of file.classes) {
        const classId = this.addNode('class', {
          name: cls.name,
          file: file.path,
          line: cls.line,
          extends: cls.extends,
          implements: cls.implements
        });
        this.addEdge(fileId, classId, 'defines');
        
        if (cls.extends) {
          const parentClassNodes = this.findNodesByProperty('name', cls.extends, 'class');
          for (const parentNode of parentClassNodes) {
            this.addEdge(classId, parentNode.id, 'extends');
          }
        }
      }
    }
    
    if (file.imports) {
      for (const imp of file.imports) {
        const importId = this.addNode('import', {
          module: imp,
          file: file.path
        });
        this.addEdge(fileId, importId, 'imports');
        
        const moduleFiles = this.findNodesByProperty('path', imp, 'file');
        for (const moduleFile of moduleFiles) {
          this.addEdge(importId, moduleFile.id, 'references');
        }
      }
    }
    
    if (file.exports) {
      for (const exp of file.exports) {
        const exportId = this.addNode('export', {
          name: exp,
          file: file.path
        });
        this.addEdge(fileId, exportId, 'exports');
      }
    }
    
    if (file.comments && file.comments.length > 0) {
      const docId = this.addNode('documentation', {
        file: file.path,
        comments: file.comments
      });
      this.addEdge(fileId, docId, 'documents');
    }
    
    if (file.headings) {
      for (const heading of file.headings) {
        const headingId = this.addNode('heading', {
          text: heading.text,
          level: heading.level,
          file: file.path,
          line: heading.line
        });
        this.addEdge(fileId, headingId, 'contains');
      }
    }
    
    if (file.codeBlocks) {
      for (const block of file.codeBlocks) {
        const blockId = this.addNode('codeblock', {
          language: block.language,
          file: file.path,
          line: block.line,
          code: block.code
        });
        this.addEdge(fileId, blockId, 'contains');
      }
    }
    
    return fileId;
  }

  findNodesByType(type) {
    const results = [];
    for (const [id, node] of this.nodes) {
      if (node.type === type) {
        results.push(node);
      }
    }
    return results;
  }

  findNodesByProperty(property, value, type = null) {
    const results = [];
    for (const [id, node] of this.nodes) {
      if (type && node.type !== type) continue;
      
      if (node.data && node.data[property] === value) {
        results.push(node);
      }
    }
    return results;
  }

  getNodeConnections(nodeId, relationship = null) {
    const connections = [];
    
    for (const [id, edge] of this.edges) {
      if (typeof edge === 'object' && !Array.isArray(edge)) {
        if (edge.source === nodeId || edge.target === nodeId) {
          if (!relationship || edge.relationship === relationship) {
            connections.push(edge);
          }
        }
      }
    }
    
    return connections;
  }

  traverseGraph(startNodeId, maxDepth = 3, visited = new Set()) {
    if (visited.has(startNodeId) || maxDepth === 0) {
      return [];
    }
    
    visited.add(startNodeId);
    const node = this.nodes.get(startNodeId);
    
    if (!node) return [];
    
    const result = [node];
    const connections = this.getNodeConnections(startNodeId);
    
    for (const edge of connections) {
      const nextNodeId = edge.source === startNodeId ? edge.target : edge.source;
      const subResults = this.traverseGraph(nextNodeId, maxDepth - 1, visited);
      result.push(...subResults);
    }
    
    return result;
  }

  searchNodes(query) {
    const results = [];
    const queryLower = query.toLowerCase();
    
    for (const [id, node] of this.nodes) {
      let relevance = 0;
      
      if (node.type.includes(queryLower)) relevance += 2;
      
      if (node.data) {
        const dataStr = JSON.stringify(node.data).toLowerCase();
        if (dataStr.includes(queryLower)) {
          relevance += 1;
          
          const exactMatches = (dataStr.match(new RegExp(`\\b${queryLower}\\b`, 'g')) || []).length;
          relevance += exactMatches * 3;
        }
      }
      
      if (relevance > 0) {
        results.push({ node, relevance });
      }
    }
    
    results.sort((a, b) => b.relevance - a.relevance);
    return results.map(r => r.node);
  }

  getNodeCount() {
    return this.nodes.size;
  }

  getEdgeCount() {
    let count = 0;
    for (const [id, edge] of this.edges) {
      if (typeof edge === 'object' && !Array.isArray(edge)) {
        count++;
      }
    }
    return count;
  }

  getRepositoryCount() {
    return this.repositories.size;
  }

  export() {
    return {
      nodes: Array.from(this.nodes.entries()).map(([id, node]) => ({ id, ...node })),
      edges: Array.from(this.edges.entries())
        .filter(([id, edge]) => typeof edge === 'object' && !Array.isArray(edge))
        .map(([id, edge]) => edge),
      repositories: Array.from(this.repositories.entries()),
      metadata: {
        nodeCount: this.nodes.size,
        edgeCount: this.getEdgeCount(),
        repositoryCount: this.repositories.size,
        timestamp: new Date().toISOString()
      }
    };
  }

  import(data) {
    this.clear();
    
    if (data.nodes) {
      for (const node of data.nodes) {
        this.nodes.set(node.id, node);
        this.nodeIdCounter = Math.max(
          this.nodeIdCounter,
          parseInt(node.id.replace('node_', '')) || 0
        );
      }
    }
    
    if (data.edges) {
      for (const edge of data.edges) {
        this.edges.set(edge.id, edge);
        this.edgeIdCounter = Math.max(
          this.edgeIdCounter,
          parseInt(edge.id.replace('edge_', '')) || 0
        );
      }
    }
    
    if (data.repositories) {
      for (const [url, id] of data.repositories) {
        this.repositories.set(url, id);
      }
    }
  }

  async save(filePath) {
    const data = this.export();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return filePath;
  }

  async load(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    this.import(data);
    return data.metadata;
  }

  clear() {
    this.nodes.clear();
    this.edges.clear();
    this.repositories.clear();
    this.nodeIdCounter = 0;
    this.edgeIdCounter = 0;
  }

  getStatistics() {
    const stats = {
      totalNodes: this.nodes.size,
      totalEdges: this.getEdgeCount(),
      nodeTypes: {},
      relationshipTypes: {},
      repositories: this.repositories.size
    };
    
    for (const [id, node] of this.nodes) {
      stats.nodeTypes[node.type] = (stats.nodeTypes[node.type] || 0) + 1;
    }
    
    for (const [id, edge] of this.edges) {
      if (typeof edge === 'object' && !Array.isArray(edge)) {
        stats.relationshipTypes[edge.relationship] = 
          (stats.relationshipTypes[edge.relationship] || 0) + 1;
      }
    }
    
    return stats;
  }
}

module.exports = KnowledgeGraph;