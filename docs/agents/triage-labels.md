# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker (GitHub Issues).

These labels should be created in the repository if they don't already exist. Use `mcp_github_issue_write` with `method: "update"` and `labels: ["label-name"]`.

| Role (mattpocock/skills) | Label string | Meaning |
|--------------------------|-------------|---------|
| `needs-triage` | `needs-triage` | Maintainer needs to evaluate this issue |
| `needs-info` | `needs-info` | Waiting on reporter for more information |
| `ready-for-agent` | `ready-for-agent` | Fully specified, ready for an AFK agent |
| `ready-for-human` | `ready-for-human` | Requires human implementation |
| `wontfix` | `wontfix` | Will not be actioned |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), apply the corresponding label string from this table.
