# FireFront working rules

- Stack: JavaScript, Three.js, Vite/npm, HTML/CSS.
- Discuss changes with the user before adding React, switching game engines, using a runtime LLM API, or adding another major dependency.
- Read `docs/requirements.md` and `docs/progress.md` before implementation.
- Work on one bounded increment at a time: state acceptance criteria, implement, run relevant checks, and provide human validation steps.
- Explain important logic so the student can understand and present it.
- Keep simulation state and rules separate from Three.js rendering and UI.
- Do not silently expand or reduce agreed scope.
- Review Git status and diffs before commits; preserve unrelated work.
- Save clear Git checkpoints for completed increments. Distinguish automated checks from human validation; never claim the user tested something without confirmation.
- Use branches for substantial experiments. Do not discard work, rewrite history, or perform destructive Git operations without authorization.
- Update the progress log with changes, actual checks, unresolved issues, and the next task.
- Do not publish, push, or deploy until explicitly instructed.
