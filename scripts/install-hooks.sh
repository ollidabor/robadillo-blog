#!/usr/bin/env bash
#
# Points git at the version-controlled hooks in .githooks/ instead of the
# untracked .git/hooks/, so the whole team (of one) gets the same checks.

set -euo pipefail

git config core.hooksPath .githooks
chmod +x .githooks/*

echo "✓ git hooks installed from .githooks/"
echo "  Undo with: git config --unset core.hooksPath"
