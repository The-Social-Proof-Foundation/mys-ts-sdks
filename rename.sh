#!/bin/bash

# Rename directories
find . -type d -name "*sui*" -exec sh -c '
  new_name=$(echo "$1" | sed "s/sui/mys/g")
  mv "$1" "$new_name"
' sh {} \;

# Rename files
find . -type f -name "*sui*" -exec sh -c '
  new_name=$(echo "$1" | sed "s/sui/mys/g")
  mv "$1" "$new_name"
' sh {} \;

# Replace content in files
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.md" \) -exec sed -i '' \
  -e 's/@mysten\/sui/@mysocial\/mys/g' \
  -e 's/Sui/Mys/g' \
  -e 's/sui/mys/g' \
  -e 's/SUI/MYS/g' {} \;

# Special cases for package names
find . -name "package.json" -exec sed -i '' \
  -e 's/"name": "@mysocial\/sui"/"name": "@mysocial\/mys"/g' \
  -e 's/"name": "@mysocial\/ts-sdks"/"name": "@mysocial\/ts-sdks"/g' \
  -e 's/@mysten\/ledgerjs-hw-app-sui/@mysocial\/ledgerjs-hw-app-mys/g' {} \;
