#!/usr/bin/env bash

# Deploy script – publishes the package to npm, pushes the example demo to GitHub Pages,
# then commits + pushes README updates.
# --------------------------------------------------
# PRE-REQUISITES:
# • You have npm credentials set up with publish access.
# • Remote "origin" points to the GitHub repo you want to publish under.
# • GH Pages is enabled in repo settings (branch: gh-pages, root).
# • Working tree is clean prior to running.
#
# USAGE:
#   bash ./deploy.sh <version>
# Example:
#   bash ./deploy.sh 1.0.1
# --------------------------------------------------
set -euo pipefail

NEW_VERSION="${1:-}"
if [[ -z "$NEW_VERSION" ]]; then
  echo "❌  Usage: ./deploy.sh <new-version>"
  exit 1
fi

if [[ $(git status --porcelain) ]]; then
  echo "❌  Working tree not clean. Commit or stash changes first."
  exit 1
fi

PACKAGE_NAME="$(jq -r .name package.json)"

# Update version in package.json
jq --arg v "$NEW_VERSION" '.version = $v' package.json > package.tmp && mv package.tmp package.json

git add package.json
git commit -m "chore: bump version to v$NEW_VERSION"

echo "🚀 Publishing $PACKAGE_NAME@$NEW_VERSION to npm …"
# --access public needed for scoped packages; safe for unscoped too.
npm publish --access public

echo "🌐 Deploying demo (example.html) to GitHub Pages …"
REPO_URL="$(git config --get remote.origin.url)"
TEMP_DIR="$(mktemp -d)"

cp example.html "$TEMP_DIR/index.html"
cp index.js "$TEMP_DIR/index.js"

pushd "$TEMP_DIR" > /dev/null
  git init -q
  git checkout -b gh-pages
  git add .
  git commit -m "docs: update demo site for v$NEW_VERSION" -q
  git remote add origin "$REPO_URL"
  git push -f origin gh-pages
popd > /dev/null
rm -rf "$TEMP_DIR"

echo "📖 Updating README with live demo link …"
# Build GitHub Pages URL
USER_REPO=$(echo "$REPO_URL" | sed -E 's|.*github.com[/:]([^/]+)/([^/.]+)(\.git)?|\1/\2|')
GHPAGES_URL="https://${USER_REPO%%/*}.github.io/${USER_REPO#*/}/"

# Insert or update the demo link section.
if grep -q "## 🔗 Live Demo" README.md; then
  # Replace the following line with updated URL on next line after header
  sed -i "0,/## 🔗 Live Demo/{n;s|.*|See it in action here 👉 ${GHPAGES_URL}|}" README.md
else
  # Append new section near top (after features)
  sed -i "/## ✨ Features/a \\
## 🔗 Live Demo\\nSee it in action here 👉 ${GHPAGES_URL}\n" README.md
fi

git add README.md
git commit -m "docs: add/update live demo link to ${GHPAGES_URL}"

echo "⬆️  Pushing changes back to origin …"
git push origin main

echo "✅ Deployment complete! Package v$NEW_VERSION published and demo live at ${GHPAGES_URL}" 