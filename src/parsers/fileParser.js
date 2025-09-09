const path = require('path');
const fs = require('fs').promises;

class FileParser {
  constructor() {
    this.parsers = {
      '.js': this.parseJavaScript.bind(this),
      '.jsx': this.parseJavaScript.bind(this),
      '.ts': this.parseJavaScript.bind(this),
      '.tsx': this.parseJavaScript.bind(this),
      '.py': this.parsePython.bind(this),
      '.java': this.parseJava.bind(this),
      '.md': this.parseMarkdown.bind(this),
      '.json': this.parseJSON.bind(this),
      '.yaml': this.parseYAML.bind(this),
      '.yml': this.parseYAML.bind(this)
    };
  }

  async parseRepository(repoData) {
    const parsedFiles = [];
    
    for (const file of repoData.files) {
      const parsed = await this.parseFile(file.fullPath || file.path, file.content);
      parsedFiles.push({
        ...parsed,
        repository: repoData.url,
        relativePath: file.path
      });
    }
    
    return {
      repository: repoData.url,
      owner: repoData.owner,
      repo: repoData.repo,
      branch: repoData.branch,
      files: parsedFiles,
      metadata: {
        totalFiles: parsedFiles.length,
        languages: this.detectLanguages(parsedFiles),
        timestamp: repoData.timestamp
      }
    };
  }

  async parsePath(pathData) {
    if (pathData.type === 'file') {
      return await this.parseFile(pathData.path, pathData.content);
    }
    
    const parsedFiles = [];
    for (const file of pathData.files) {
      const parsed = await this.parseFile(file.path, file.content);
      parsedFiles.push(parsed);
    }
    
    return {
      path: pathData.path,
      repository: pathData.repository,
      type: pathData.type,
      files: parsedFiles
    };
  }

  async parseFile(filePath, content = null) {
    try {
      if (!content) {
        content = await fs.readFile(filePath, 'utf-8');
      }
      
      const ext = path.extname(filePath).toLowerCase();
      const parser = this.parsers[ext] || this.parseGeneric.bind(this);
      
      const parsed = await parser(content, filePath);
      
      return {
        path: filePath,
        extension: ext,
        size: content.length,
        ...parsed,
        raw: content
      };
    } catch (error) {
      return {
        path: filePath,
        error: error.message,
        raw: content || ''
      };
    }
  }

  parseJavaScript(content, filePath) {
    const result = {
      type: 'javascript',
      functions: [],
      classes: [],
      imports: [],
      exports: [],
      comments: []
    };

    const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=]*)?\s*=>)/g;
    const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?/g;
    const importRegex = /(?:import|require)\s*\(?\s*['"`]([^'"`]+)['"`]\s*\)?/g;
    const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)?\s*(\w+)?/g;
    const commentRegex = /\/\*[\s\S]*?\*\/|\/\/.*/g;

    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      const funcName = match[1] || match[2];
      if (funcName) {
        const startLine = content.substring(0, match.index).split('\n').length;
        result.functions.push({
          name: funcName,
          line: startLine,
          type: match[0].includes('=>') ? 'arrow' : 'regular'
        });
      }
    }

    while ((match = classRegex.exec(content)) !== null) {
      const startLine = content.substring(0, match.index).split('\n').length;
      result.classes.push({
        name: match[1],
        extends: match[2] || null,
        line: startLine
      });
    }

    while ((match = importRegex.exec(content)) !== null) {
      result.imports.push(match[1]);
    }

    while ((match = exportRegex.exec(content)) !== null) {
      if (match[1]) {
        result.exports.push(match[1]);
      }
    }

    while ((match = commentRegex.exec(content)) !== null) {
      const startLine = content.substring(0, match.index).split('\n').length;
      result.comments.push({
        text: match[0],
        line: startLine,
        type: match[0].startsWith('//') ? 'single' : 'multi'
      });
    }

    return result;
  }

  parsePython(content, filePath) {
    const result = {
      type: 'python',
      functions: [],
      classes: [],
      imports: [],
      comments: []
    };

    const functionRegex = /def\s+(\w+)\s*\([^)]*\)/g;
    const classRegex = /class\s+(\w+)(?:\s*\([^)]*\))?/g;
    const importRegex = /(?:from\s+(\S+)\s+)?import\s+([^#\n]+)/g;
    const commentRegex = /#.*/g;
    const docstringRegex = /"""[\s\S]*?"""|'''[\s\S]*?'''/g;

    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      const startLine = content.substring(0, match.index).split('\n').length;
      result.functions.push({
        name: match[1],
        line: startLine
      });
    }

    while ((match = classRegex.exec(content)) !== null) {
      const startLine = content.substring(0, match.index).split('\n').length;
      result.classes.push({
        name: match[1],
        line: startLine
      });
    }

    while ((match = importRegex.exec(content)) !== null) {
      if (match[1]) {
        result.imports.push(`${match[1]}.${match[2].trim()}`);
      } else {
        result.imports.push(match[2].trim());
      }
    }

    while ((match = commentRegex.exec(content)) !== null) {
      const startLine = content.substring(0, match.index).split('\n').length;
      result.comments.push({
        text: match[0],
        line: startLine,
        type: 'single'
      });
    }

    while ((match = docstringRegex.exec(content)) !== null) {
      const startLine = content.substring(0, match.index).split('\n').length;
      result.comments.push({
        text: match[0],
        line: startLine,
        type: 'docstring'
      });
    }

    return result;
  }

  parseJava(content, filePath) {
    const result = {
      type: 'java',
      package: null,
      classes: [],
      interfaces: [],
      methods: [],
      imports: [],
      comments: []
    };

    const packageRegex = /package\s+([\w.]+)/;
    const classRegex = /(?:public\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?/g;
    const interfaceRegex = /(?:public\s+)?interface\s+(\w+)/g;
    const methodRegex = /(?:public|private|protected)?\s*(?:static\s+)?(?:final\s+)?(\w+)\s+(\w+)\s*\([^)]*\)/g;
    const importRegex = /import\s+([\w.*]+);/g;

    const packageMatch = content.match(packageRegex);
    if (packageMatch) {
      result.package = packageMatch[1];
    }

    let match;

    while ((match = classRegex.exec(content)) !== null) {
      const startLine = content.substring(0, match.index).split('\n').length;
      result.classes.push({
        name: match[1],
        extends: match[2] || null,
        implements: match[3] ? match[3].split(',').map(s => s.trim()) : [],
        line: startLine
      });
    }

    while ((match = interfaceRegex.exec(content)) !== null) {
      const startLine = content.substring(0, match.index).split('\n').length;
      result.interfaces.push({
        name: match[1],
        line: startLine
      });
    }

    while ((match = methodRegex.exec(content)) !== null) {
      const startLine = content.substring(0, match.index).split('\n').length;
      result.methods.push({
        returnType: match[1],
        name: match[2],
        line: startLine
      });
    }

    while ((match = importRegex.exec(content)) !== null) {
      result.imports.push(match[1]);
    }

    return result;
  }

  parseMarkdown(content, filePath) {
    const result = {
      type: 'markdown',
      headings: [],
      codeBlocks: [],
      links: []
    };

    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const startLine = content.substring(0, match.index).split('\n').length;
      result.headings.push({
        level: match[1].length,
        text: match[2],
        line: startLine
      });
    }

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const startLine = content.substring(0, match.index).split('\n').length;
      result.codeBlocks.push({
        language: match[1] || 'plain',
        code: match[2],
        line: startLine
      });
    }

    while ((match = linkRegex.exec(content)) !== null) {
      result.links.push({
        text: match[1],
        url: match[2]
      });
    }

    return result;
  }

  parseJSON(content, filePath) {
    try {
      const parsed = JSON.parse(content);
      return {
        type: 'json',
        structure: this.analyzeJSONStructure(parsed),
        keys: Object.keys(parsed)
      };
    } catch (error) {
      return {
        type: 'json',
        error: 'Invalid JSON',
        message: error.message
      };
    }
  }

  parseYAML(content, filePath) {
    const result = {
      type: 'yaml',
      keys: [],
      structure: {}
    };

    const lines = content.split('\n');
    const keyRegex = /^(\s*)([^:#]+):\s*(.*)?$/;

    for (const line of lines) {
      const match = line.match(keyRegex);
      if (match) {
        const indent = match[1].length;
        const key = match[2].trim();
        result.keys.push({ key, indent });
      }
    }

    return result;
  }

  parseGeneric(content, filePath) {
    return {
      type: 'generic',
      lines: content.split('\n').length,
      characters: content.length,
      words: content.split(/\s+/).length
    };
  }

  analyzeJSONStructure(obj, depth = 0, maxDepth = 5) {
    if (depth > maxDepth) return 'max_depth_reached';

    if (Array.isArray(obj)) {
      return {
        type: 'array',
        length: obj.length,
        items: obj.length > 0 ? this.analyzeJSONStructure(obj[0], depth + 1, maxDepth) : null
      };
    } else if (obj !== null && typeof obj === 'object') {
      const structure = { type: 'object', properties: {} };
      for (const key in obj) {
        structure.properties[key] = this.analyzeJSONStructure(obj[key], depth + 1, maxDepth);
      }
      return structure;
    } else {
      return { type: typeof obj };
    }
  }

  detectLanguages(parsedFiles) {
    const languages = {};
    
    for (const file of parsedFiles) {
      if (file.type && file.type !== 'generic') {
        languages[file.type] = (languages[file.type] || 0) + 1;
      }
    }
    
    return languages;
  }
}

module.exports = FileParser;