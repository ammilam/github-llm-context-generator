# Context for: "AgentBuilderAssistant RemoteA2aAgent Agent class python"

## Summary

- **Total nodes**: 100
- **Files**: 15
- **Functions**: 0
- **Classes**: 0

## Files

- `test-repos/google/adk-python/.gemini/settings.json`
- `test-repos/google/adk-python/.github/ISSUE_TEMPLATE/bug_report.md`
- `test-repos/google/adk-python/.github/ISSUE_TEMPLATE/feature_request.md`
- `test-repos/google/adk-python/.github/release-please.yml`
- `test-repos/google/adk-python/.github/release-trigger.yml`
- `test-repos/google/adk-python/.github/workflows/check-file-contents.yml`
- `test-repos/google/adk-python/.github/workflows/discussion_answering.yml`
- `test-repos/google/adk-python/.github/workflows/isort.yml`
- `test-repos/google/adk-python/.github/workflows/pr-triage.yml`
- `test-repos/google/adk-python/.github/workflows/pyink.yml`

## Source Code

*Showing 15 relevant files*

### File: test-repos/google/adk-python/.gemini/settings.json

```json
{
  "contextFileName": "AGENTS.md"
}

```

### File: test-repos/google/adk-python/.github/ISSUE_TEMPLATE/bug_report.md

```markdown
---
name: Bug report
about: Create a report to help us improve
title: ''
labels: ''
assignees: ''

---

** Please make sure you read the contribution guide and file the issues in the right place. **
[Contribution guide.](https://google.github.io/adk-docs/contributing-guide/)

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Install '...'
2. Run '....'
3. Open '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Desktop (please complete the following information):**
 - OS: [e.g. iOS]
 - Python version(python -V):
 - ADK version(pip show google-adk):

 **Model Information:**
 For example, which model is being used.

**Additional context**
Add any other context about the problem here.

```

### File: test-repos/google/adk-python/.github/ISSUE_TEMPLATE/feature_request.md

```markdown
---
name: Feature request
about: Suggest an idea for this project
title: ''
labels: ''
assignees: ''

---

** Please make sure you read the contribution guide and file the issues in the right place. **
[Contribution guide.](https://google.github.io/adk-docs/contributing-guide/)

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.

```

### File: test-repos/google/adk-python/.github/release-please.yml

```yaml
releaseType: python
handleGHRelease: true
bumpMinorPreMajor: false
extraFiles:
  - src/google/adk/version.py
```

### File: test-repos/google/adk-python/.github/release-trigger.yml

```yaml
enabled: true
```

## Code Snippets

### test-repos/google/adk-python/AGENTS.md

```bash
# Run in open_source_workspace/
$ ./autoformat.sh

```

### test-repos/google/adk-python/AGENTS.md

```python
# DO
from ..agents.llm_agent import LlmAgent

# DON'T
from google.adk.agents.llm_agent import LlmAgent

```

### test-repos/google/adk-python/AGENTS.md

```python
# DO
from ..agents.llm_agent import LlmAgent

# DON'T
from ..agents  import LlmAgent # import from agents/__init__.py

```

### test-repos/google/adk-python/AGENTS.md

```python
# DO THIS, right after the open-source header.
from __future__ import annotations

```

## Key Relationships

| Source | Relationship | Target |
|--------|--------------|--------|
| adk-python | contains | test-repos/google/adk-python/.gemini/settings.json |
| adk-python | contains | test-repos/google/adk-python/.github/ISSUE_TEMPLATE/bug_report.md |
| adk-python | contains | test-repos/google/adk-python/.github/ISSUE_TEMPLATE/feature_request.md |
| adk-python | contains | test-repos/google/adk-python/.github/release-please.yml |
| adk-python | contains | test-repos/google/adk-python/.github/release-trigger.yml |
| adk-python | contains | test-repos/google/adk-python/.github/workflows/check-file-contents.yml |
| adk-python | contains | test-repos/google/adk-python/.github/workflows/discussion_answering.yml |
| adk-python | contains | test-repos/google/adk-python/.github/workflows/isort.yml |
| adk-python | contains | test-repos/google/adk-python/.github/workflows/pr-triage.yml |
| adk-python | contains | test-repos/google/adk-python/.github/workflows/pyink.yml |
| adk-python | contains | test-repos/google/adk-python/.github/workflows/python-unit-tests.yml |
| adk-python | contains | test-repos/google/adk-python/.github/workflows/triage.yml |
| adk-python | contains | test-repos/google/adk-python/.github/workflows/upload-adk-docs-to-vertex-ai-search.yml |
| adk-python | contains | test-repos/google/adk-python/AGENTS.md |
| adk-python | contains | test-repos/google/adk-python/CHANGELOG.md |
