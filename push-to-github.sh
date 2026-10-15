#!/usr/bin/env bash
set -euo pipefail

REPO_NAME="${1:-sandeep-opportunity-os}"
GITHUB_USER="${2:-SandeepProjects}"

echo "Initializing Git repository for ${GITHUB_USER}/${REPO_NAME}..."
git init -b main
git add .
git commit -m "feat: initial release of Sandeep Opportunity OS (4-pipeline engine, Supabase RLS schema, Sheets v4 sync, 8/8 tests)"

if command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI detected — creating repository and pushing to ${GITHUB_USER}/${REPO_NAME}..."
  gh repo create "${GITHUB_USER}/${REPO_NAME}" --public --source=. --remote=origin --push
else
  git remote remove origin 2>/dev/null || true
  git remote add origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
  echo "Pushing to https://github.com/${GITHUB_USER}/${REPO_NAME}.git ..."
  git push -u origin main
fi

echo "Done! Connect ${GITHUB_USER}/${REPO_NAME} in Hostinger hPanel -> Websites -> Connect to GitHub."
