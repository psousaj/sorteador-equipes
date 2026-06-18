# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues in **psousaj/sorteador-equipes**. Use the `gh` CLI or GitHub MCP tools for all operations.

## Conventions

- **Create an issue**: `mcp_github_issue_write` with `method: "create"`, `owner: "psousaj"`, `repo: "sorteador-equipes"`, filtering by available labels
- **Read an issue**: `mcp_github_issue_read` with `method: "get"`, `issue_number: N`
- **List issues**: `mcp_github_list_issues` with `owner: "psousaj"`, `repo: "sorteador-equipes"`, `state: "OPEN"`, filtering by labels
- **Comment**: `mcp_github_add_issue_comment` with `issue_number: N`, `body: "..."`
- **Close**: `mcp_github_issue_write` with `method: "update"`, `state: "closed"`
- **Apply labels**: include `labels: [...]` when creating or updating the issue

Infer the repo from `git remote -v`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue via MCP.

## When a skill says "fetch the relevant ticket"

Use `mcp_github_issue_read` with `method: "get"` and optionally `get_comments`.
