const simpleGit = require('simple-git');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
// Simple rate limiter without external dependency
class RateLimiter {
  constructor() {
    this.lastCall = 0;
  }
  
  async limit(fn, delay) {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;
    if (timeSinceLastCall < delay) {
      await new Promise(resolve => setTimeout(resolve, delay - timeSinceLastCall));
    }
    this.lastCall = Date.now();
    return fn();
  }
}

class GitHubLoader {
  constructor(config) {
    this.config = config;
    this.git = simpleGit();
    this.rateLimiter = new RateLimiter();
    this.apiBase = 'https://api.github.com';
    this.token = process.env.GITHUB_TOKEN;
  }

  async loadRepository(repoConfig) {
    const repoInfo = this.parseRepoConfig(repoConfig);
    
    await this.enforceRateLimit();
    
    const localPath = path.join(
      this.config.localStoragePath,
      repoInfo.owner,
      repoInfo.repo
    );

    try {
      await fs.mkdir(path.dirname(localPath), { recursive: true });
      
      const exists = await this.repoExists(localPath);
      
      if (exists) {
        console.log(`Updating existing repository: ${repoInfo.url}`);
        await this.git.cwd(localPath).pull();
      } else {
        console.log(`Cloning repository: ${repoInfo.url}`);
        await this.git.clone(repoInfo.url, localPath, {
          '--depth': 1,
          '--single-branch': true,
          '--branch': repoInfo.branch || 'main'
        });
      }

      const files = await this.getRepositoryFiles(localPath, repoInfo.paths);
      
      return {
        ...repoInfo,
        localPath,
        files,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error.message.includes('not found') && repoInfo.branch === 'main') {
        repoInfo.branch = 'master';
        return this.loadRepository(repoInfo);
      }
      throw new Error(`Failed to load repository ${repoInfo.url}: ${error.message}`);
    }
  }

  async loadPath(pathConfig) {
    const { repository, path: repoPath } = this.parsePathConfig(pathConfig);
    
    await this.enforceRateLimit();
    
    if (pathConfig.useAPI) {
      return await this.loadPathViaAPI(repository, repoPath);
    }
    
    const repoData = await this.loadRepository(repository);
    const targetPath = path.join(repoData.localPath, repoPath);
    
    const stats = await fs.stat(targetPath);
    
    if (stats.isDirectory()) {
      const files = await this.getDirectoryFiles(targetPath);
      return {
        repository,
        path: repoPath,
        files,
        type: 'directory'
      };
    } else {
      const content = await fs.readFile(targetPath, 'utf-8');
      return {
        repository,
        path: repoPath,
        content,
        type: 'file'
      };
    }
  }

  async loadPathViaAPI(repository, repoPath) {
    const { owner, repo, branch } = this.parseRepoConfig(repository);
    
    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };
    
    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }
    
    try {
      const response = await axios.get(
        `${this.apiBase}/repos/${owner}/${repo}/contents/${repoPath}`,
        {
          headers,
          params: { ref: branch || 'main' }
        }
      );
      
      if (Array.isArray(response.data)) {
        const files = await Promise.all(
          response.data
            .filter(item => item.type === 'file')
            .map(async item => {
              const fileResponse = await axios.get(item.download_url);
              return {
                path: item.path,
                content: fileResponse.data,
                size: item.size
              };
            })
        );
        
        return {
          repository,
          path: repoPath,
          files,
          type: 'directory'
        };
      } else {
        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        return {
          repository,
          path: repoPath,
          content,
          type: 'file'
        };
      }
    } catch (error) {
      throw new Error(`Failed to load path via API: ${error.message}`);
    }
  }

  parseRepoConfig(config) {
    if (typeof config === 'string') {
      // Handle URLs with /tree/branch or /blob/branch patterns
      let cleanUrl = config;
      let branch = 'main';
      
      // Extract branch if specified in URL
      const branchMatch = config.match(/\/(?:tree|blob)\/([^/]+)/);
      if (branchMatch) {
        branch = branchMatch[1];
        // Remove the /tree/branch or /blob/branch part from the URL
        cleanUrl = config.replace(/\/(?:tree|blob)\/[^/]+.*$/, '');
      }
      
      // Extract owner and repo from the cleaned URL
      const match = cleanUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
      if (match) {
        // Create the proper git clone URL
        const gitUrl = `https://github.com/${match[1]}/${match[2]}.git`;
        return {
          url: gitUrl,
          owner: match[1],
          repo: match[2],
          branch: branch,
          paths: []
        };
      }
      throw new Error(`Invalid repository URL: ${config}`);
    }
    
    return {
      url: config.url,
      owner: config.owner || this.extractOwnerFromUrl(config.url),
      repo: config.repo || this.extractRepoFromUrl(config.url),
      branch: config.branch || 'main',
      paths: config.paths || []
    };
  }

  parsePathConfig(config) {
    if (typeof config === 'string') {
      const parts = config.split(':');
      return {
        repository: parts[0],
        path: parts[1] || '',
        useAPI: false
      };
    }
    
    return {
      repository: config.repository,
      path: config.path,
      useAPI: config.useAPI || false
    };
  }

  extractOwnerFromUrl(url) {
    const match = url.match(/github\.com[/:]([^/]+)\//);
    return match ? match[1] : null;
  }

  extractRepoFromUrl(url) {
    const match = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    return match ? match[2] : null;
  }

  async repoExists(localPath) {
    try {
      await fs.access(path.join(localPath, '.git'));
      return true;
    } catch {
      return false;
    }
  }

  async getRepositoryFiles(repoPath, specificPaths = []) {
    const files = [];
    
    const pathsToProcess = specificPaths.length > 0 
      ? specificPaths.map(p => path.join(repoPath, p))
      : [repoPath];
    
    for (const targetPath of pathsToProcess) {
      try {
        const stats = await fs.stat(targetPath);
        if (stats.isDirectory()) {
          const pathFiles = await this.getDirectoryFiles(targetPath);
          files.push(...pathFiles);
        } else if (stats.isFile()) {
          // If it's a specific file, load just that file
          const content = await fs.readFile(targetPath, 'utf-8');
          files.push({
            path: path.relative(repoPath, targetPath),
            fullPath: targetPath,
            content,
            size: stats.size
          });
        }
      } catch (error) {
        console.warn(`Warning: Could not access path ${targetPath}: ${error.message}`);
      }
    }
    
    return files;
  }

  async getDirectoryFiles(dirPath, baseDir = dirPath) {
    const files = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        if (!this.shouldSkipDirectory(entry.name)) {
          const subFiles = await this.getDirectoryFiles(fullPath, baseDir);
          files.push(...subFiles);
        }
      } else if (entry.isFile()) {
        if (this.shouldIncludeFile(entry.name)) {
          const content = await fs.readFile(fullPath, 'utf-8');
          files.push({
            path: path.relative(baseDir, fullPath),
            fullPath,
            content,
            size: (await fs.stat(fullPath)).size
          });
        }
      }
    }
    
    return files;
  }

  shouldSkipDirectory(dirName) {
    const skipDirs = [
      'node_modules',
      '.git',
      'dist',
      'build',
      'coverage',
      '.vscode',
      '.idea',
      '__pycache__',
      '.pytest_cache'
    ];
    return skipDirs.includes(dirName);
  }

  shouldIncludeFile(fileName) {
    const includeExtensions = [
      '.js', '.jsx', '.ts', '.tsx',
      '.py', '.java', '.cpp', '.c', '.h',
      '.go', '.rs', '.rb', '.php',
      '.md', '.txt', '.json', '.yaml', '.yml',
      '.html', '.css', '.scss', '.sass'
    ];
    
    const excludePatterns = [
      '.min.js',
      '.map',
      '.lock',
      '.log'
    ];
    
    const ext = path.extname(fileName).toLowerCase();
    const isExcluded = excludePatterns.some(pattern => fileName.includes(pattern));
    
    return includeExtensions.includes(ext) && !isExcluded;
  }

  async enforceRateLimit() {
    await new Promise(resolve => 
      setTimeout(resolve, this.config.rateLimitDelay)
    );
  }
}

module.exports = GitHubLoader;