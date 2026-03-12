#!/bin/bash

echo "========================================="
echo "   🚀  GitHub Publisher Helper"
echo "========================================="
echo ""
echo "I need your help with one small step:"
echo ""
echo "1. Go to this link in your browser: https://github.com/new"
echo "2. Type a name for your repository (e.g., 'local-ai-web')."
echo "3. Click 'Create repository' (Keep it Public or Private, your choice)."
echo "4. DO NOT check 'Add a README file'."
echo "5. Copy the HTTPS URL provided (it looks like https://github.com/Start/local-ai-web.git)."
echo ""
echo "========================================="
read -p "Paste the URL here and press Enter: " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ Error: You didn't enter a URL!"
    exit 1
fi

echo ""
echo "📦 Configuring Git..."

# Remove strict host checking for first time users if needed, 
# but mostly we just need to add the remote.
# Remove existing origin if it exists to avoid errors on re-run
git remote remove origin 2>/dev/null

git remote add origin "$REPO_URL"

if [ $? -ne 0 ]; then
    echo "❌ Error adding remote. Is the URL correct?"
    exit 1
fi

echo "⬆️  Pushing code to GitHub..."
echo "   (You may be asked to sign in locally)"

git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Your project is now online."
    echo "   Link: $REPO_URL"
    echo "   Your friend can now follow the instructions in README.md!"
else
    echo ""
    echo "❌ formatting error: The push failed."
    echo "   Make sure you are logged in to GitHub on this machine."
fi
