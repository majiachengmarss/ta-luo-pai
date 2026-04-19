# Project Rules - zhanbu

## Git Workflow
- **Mandatory Confirmation**: After any modification to the codebase (including but not limited to `replace`, `write_file`, and `run_shell_command` that affects source files), the agent MUST ask the user: "Would you like to stage and commit these changes to Git now?"
- **No Automatic Commits**: Never perform `git add`, `git commit`, or `git push` without explicit user confirmation following a change.
- **Git Protocol**: When the user confirms, follow the standard git workflow as defined in the system prompt (status, diff, log, draft commit message).
