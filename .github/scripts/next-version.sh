#!/usr/bin/env bash
# Prints the next version for a merged pull request, or nothing when it shouldn't be released.
# Usage: next-version.sh "<pull request title>" "<current version, e.g. 0.1.0>"
# The title follows Conventional Commits: feat bumps minor, fix and perf bump patch,
# a "!" after the type (feat!: ...) or "BREAKING CHANGE" bumps major, anything else is skipped.
set -euo pipefail

title="${1:-}"
current="${2:-0.0.0}"

if [[ ! "$current" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
  echo "Current version '$current' is not MAJOR.MINOR.PATCH" >&2
  exit 1
fi
major="${BASH_REMATCH[1]}"
minor="${BASH_REMATCH[2]}"
patch="${BASH_REMATCH[3]}"

pattern='^([a-z]+)(\([^)]*\))?(!)?: '
if [[ ! "$title" =~ $pattern ]]; then
  exit 0
fi
type="${BASH_REMATCH[1]}"
breaking="${BASH_REMATCH[3]}"

if [[ -n "$breaking" || "$title" == *"BREAKING CHANGE"* ]]; then
  echo "$((major + 1)).0.0"
elif [[ "$type" == "feat" ]]; then
  echo "$major.$((minor + 1)).0"
elif [[ "$type" == "fix" || "$type" == "perf" ]]; then
  echo "$major.$minor.$((patch + 1))"
fi
