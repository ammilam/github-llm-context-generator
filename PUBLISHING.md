# Publishing Guide

This guide explains how to publish this package to npm and set it up as a GitHub repository.

## Step 1: Set Up GitHub Repository

1. **Create a new repository on GitHub:**
   ```bash
   # Go to https://github.com/new
   # Name: github-context-generator
   # Description: Generate LLM-ready context from GitHub repositories
   # Make it public
   # Don't initialize with README (we already have one)
   ```

2. **Initialize and push your code:**
   ```bash
   # In your local project directory
   git init
   git add .
   git commit -m "Initial commit: GitHub Context Generator"
   git branch -M main
   git remote add origin https://github.com/yourusername/github-context-generator.git
   git push -u origin main
   ```

## Step 2: Update Package Configuration

1. **Update package.json with your information:**
   - Replace `yourusername` with your GitHub username
   - Replace `Your Name <your.email@example.com>` with your details
   
   ```bash
   # Edit package.json
   npm init --scope=@yourusername  # Optional: for scoped package
   ```

## Step 3: Set Up NPM Account

1. **Create an npm account** (if you don't have one):
   - Go to https://www.npmjs.com/signup

2. **Login to npm from terminal:**
   ```bash
   npm login
   # Enter your username, password, and email
   ```

## Step 4: Publish to NPM

### First Time Publishing

```bash
# Run tests to ensure everything works
npm test

# Check what will be published
npm pack --dry-run

# Publish to npm
npm publish
```

### Publishing Updates

1. **Update version in package.json:**
   ```bash
   # For patch release (bug fixes)
   npm version patch
   
   # For minor release (new features, backward compatible)
   npm version minor
   
   # For major release (breaking changes)
   npm version major
   ```

2. **Publish the update:**
   ```bash
   npm publish
   ```

## Step 5: Set Up GitHub Secrets for CI/CD

1. **Get your NPM token:**
   - Go to https://www.npmjs.com/
   - Click your profile → Access Tokens
   - Generate New Token → Classic Token
   - Select "Publish"
   - Copy the token

2. **Add to GitHub Secrets:**
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - New repository secret
   - Name: `NPM_TOKEN`
   - Value: [paste your npm token]

## Step 6: Create a Release

1. **Tag your release:**
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

2. **Create GitHub Release:**
   - Go to your repository on GitHub
   - Click "Releases" → "Create a new release"
   - Choose your tag
   - Add release notes
   - Publish release

   This will automatically trigger the npm publish workflow!

## Optional: Publish as Scoped Package

If you want to publish under your username scope:

1. **Update package.json:**
   ```json
   {
     "name": "@yourusername/github-context-generator",
     ...
   }
   ```

2. **Publish with public access:**
   ```bash
   npm publish --access public
   ```

## Maintenance

### Updating Dependencies
```bash
npm update
npm audit fix
```

### Checking Package Size
```bash
npm pack --dry-run
```

### Testing Installation
```bash
# In a different directory
npm install github-context-generator
# or for local testing
npm link /path/to/github-context-generator
```

## Troubleshooting

- **E403 Forbidden:** Make sure you're logged in: `npm login`
- **E409 Conflict:** Package name already exists, choose a different name
- **Files too large:** Check `.npmignore` to exclude unnecessary files
- **GitHub Actions failing:** Check your NPM_TOKEN secret is set correctly

## Success!

Once published, your package will be available at:
- npm: https://www.npmjs.com/package/github-context-generator
- GitHub: https://github.com/yourusername/github-context-generator

Users can install it with:
```bash
npm install github-context-generator
```