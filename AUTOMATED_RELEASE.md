# Automated Release & Publishing

This repository is configured for automated releases and npm publishing!

## 🚀 How It Works

### Automatic Version Bumping & Publishing

When you merge a PR or push to `main`/`master`, the system will:

1. **Analyze your commit messages** to determine version bump
2. **Create a new version tag** automatically
3. **Generate release notes** from commits
4. **Publish to npm** automatically

## 📝 Commit Message Format

Use conventional commits to control versioning:

### Patch Release (0.0.X)
Default for regular commits:
```bash
git commit -m "fix: correct parsing error"
git commit -m "docs: update README"
git commit -m "chore: update dependencies"
```

### Minor Release (0.X.0)
For new features (backward compatible):
```bash
git commit -m "feat: add support for GitLab repositories"
git commit -m "feat: implement caching for API calls"
```

### Major Release (X.0.0)
For breaking changes:
```bash
git commit -m "feat!: change API interface

BREAKING CHANGE: loadRepository now requires options object"
```

## 🔄 Workflow Options

### Option 1: Release Please (Recommended)
**File:** `.github/workflows/release-please.yml`

- Creates PR with version bumps
- Generates CHANGELOG.md
- Creates GitHub releases
- Publishes to npm

**How to use:**
1. Merge PRs to main with conventional commits
2. Release Please creates a "Release PR"
3. Merge the Release PR
4. Package is automatically published to npm

### Option 2: Simple Auto-Release
**File:** `.github/workflows/release.yml`

- Triggers on every merge to main
- Auto-bumps version based on commit messages
- Creates tag and GitHub release
- Publishes to npm

**Version bump rules:**
- Contains `[patch]` or `fix:` → Patch version
- Contains `[minor]` or `feat:` → Minor version
- Contains `[major]` or `BREAKING CHANGE:` → Major version

### Option 3: Manual Release
**File:** `.github/workflows/npm-publish.yml`

- Trigger by creating a GitHub release manually
- Or use workflow_dispatch for manual trigger

## 🛠️ Setup Required

1. **NPM_TOKEN** must be set in GitHub Secrets ✅ (You've done this!)

2. **Choose your workflow:**
   - Keep `release-please.yml` for PR-based releases (recommended)
   - OR keep `release.yml` for automatic releases on merge
   - Keep `npm-publish.yml` as backup for manual releases

3. **Delete unused workflows** to avoid confusion

## 📋 Examples

### Example: Releasing a bug fix
```bash
git add .
git commit -m "fix: resolve context generation for empty queries"
git push origin main
# Version automatically bumps from 0.1.0 → 0.1.1
```

### Example: Releasing a new feature
```bash
git add .
git commit -m "feat: add support for Bitbucket repositories"
git push origin main
# Version automatically bumps from 0.1.1 → 0.2.0
```

### Example: Releasing breaking changes
```bash
git add .
git commit -m "feat!: redesign API for better performance

BREAKING CHANGE: getContext() now returns Promise<Context> instead of Context"
git push origin main
# Version automatically bumps from 0.2.0 → 1.0.0
```

## 🎯 First Release

For your first release, you can:

1. **Manual approach:**
```bash
git tag v0.1.0
git push origin v0.1.0
# Then create release on GitHub
```

2. **Or let automation handle it:**
```bash
git commit -m "feat: initial release of GitHub LLM Context Generator"
git push origin main
# Automation creates v0.1.0 and publishes
```

## 📦 Published Package

Once released, your package will be available at:
- npm: https://www.npmjs.com/package/github-llm-context-generator
- GitHub: https://github.com/yourusername/github-llm-context-generator

Users can install with:
```bash
npm install github-llm-context-generator
```