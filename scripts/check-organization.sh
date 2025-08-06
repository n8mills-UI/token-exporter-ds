#!/usr/bin/env sh

# Lean pre-commit hook for repository organization
# Only checks staged files and exits early when possible

set -e

# Check if any relevant files are staged
STAGED_FILES=$(git diff --cached --name-only --diff-filter=A | head -20)

if [ -z "$STAGED_FILES" ]; then
    exit 0  # No staged files to check
fi

# Single pass to find all problematic files
MISPLACED=""
echo "$STAGED_FILES" | while IFS= read -r file; do
    case "$file" in
        # Analysis/diagnostic files in root
        *[Aa][Nn][Aa][Ll][Yy][Ss][Ii][Ss]*.md|\
        *[Dd][Ii][Aa][Gg][Nn][Oo][Ss][Tt][Ii][Cc]*.md|\
        *[Rr][Ee][Pp][Oo][Rr][Tt]*.md|\
        *[Aa][Uu][Dd][Ii][Tt]*.md|\
        *[Rr][Ee][Ss][Ee][Aa][Rr][Cc][Hh]*.md)
            if [ "$(dirname "$file")" = "." ]; then
                MISPLACED="$MISPLACED$file (should be in .dev/analysis/)\n"
            fi
            ;;
        # Temp HTML files in root
        *[Mm][Oo][Cc][Kk][Uu][Pp]*.html|\
        *[Tt][Ee][Ss][Tt]*.html|\
        *[Dd][Ee][Mm][Oo]*.html|\
        *[Tt][Ee][Mm][Pp]*.html)
            if [ "$(dirname "$file")" = "." ]; then
                MISPLACED="$MISPLACED$file (should be in .dev/temp/)\n"
            fi
            ;;
    esac
done

if [ -n "$MISPLACED" ]; then
    printf "\n❌ Files need to be organized:\n\n%b\n" "$MISPLACED"
    printf "Organize with: mkdir -p .dev/{analysis,temp} && git add .\n\n"
    exit 1
fi

exit 0