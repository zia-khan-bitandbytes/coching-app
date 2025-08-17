#!/bin/bash

# Selective Merge Script for CompleteCoachSide_Dashbaord-UI-Fixes
# This script merges UI improvements while excluding dashboard-related code

set -e  # Exit on any error

echo "🚀 Starting selective merge of CompleteCoachSide_Dashbaord-UI-Fixes branch"
echo "📋 Excluding dashboard-related code..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
print_status "Current branch: $CURRENT_BRANCH"

# Step 1: Create backup branch
print_status "Creating backup branch..."
git checkout staging
git checkout -b backup-staging-before-ui-merge-$(date +%Y%m%d-%H%M%S)
git push origin HEAD
print_success "Backup branch created"

# Step 2: Create selective merge branch
print_status "Creating selective merge branch..."
git checkout staging
git checkout -b selective-ui-merge-$(date +%Y%m%d-%H%M%S)
print_success "Selective merge branch created"

# Step 3: Check if the UI fixes branch exists
if ! git show-ref --verify --quiet refs/heads/CompleteCoachSide_Dashbaord-UI-Fixes; then
    print_error "Branch CompleteCoachSide_Dashbaord-UI-Fixes not found"
    print_status "Available branches:"
    git branch -a | grep -E "(CompleteCoachSide|UI-Fixes)" || echo "No matching branches found"
    exit 1
fi

print_success "Found CompleteCoachSide_Dashbaord-UI-Fixes branch"

# Step 4: Get list of files changed in the UI fixes branch
print_status "Analyzing changes in CompleteCoachSide_Dashbaord-UI-Fixes branch..."
CHANGED_FILES=$(git diff --name-only staging..CompleteCoachSide_Dashbaord-UI-Fixes)

# Filter out dashboard-related files
NON_DASHBOARD_FILES=""
DASHBOARD_FILES=""

for file in $CHANGED_FILES; do
    if [[ $file == *"dashboard"* ]] || [[ $file == *"Dashboard"* ]]; then
        DASHBOARD_FILES="$DASHBOARD_FILES $file"
    else
        NON_DASHBOARD_FILES="$NON_DASHBOARD_FILES $file"
    fi
done

print_status "Files to exclude (dashboard-related):"
for file in $DASHBOARD_FILES; do
    echo "  - $file"
done

print_status "Files to include (non-dashboard):"
for file in $NON_DASHBOARD_FILES; do
    echo "  - $file"
done

# Step 5: Copy non-dashboard files
print_status "Copying non-dashboard files from UI fixes branch..."
for file in $NON_DASHBOARD_FILES; do
    if [ -f "$file" ]; then
        print_status "Copying: $file"
        git checkout CompleteCoachSide_Dashbaord-UI-Fixes -- "$file"
    else
        print_warning "File not found: $file"
    fi
done

# Step 6: Check for any new files that need to be added
print_status "Checking for new files..."
NEW_FILES=$(git status --porcelain | grep "^??" | awk '{print $2}')
if [ ! -z "$NEW_FILES" ]; then
    print_status "New files found:"
    echo "$NEW_FILES"
    git add $NEW_FILES
fi

# Step 7: Check for modified files
MODIFIED_FILES=$(git status --porcelain | grep "^ M" | awk '{print $2}')
if [ ! -z "$MODIFIED_FILES" ]; then
    print_status "Modified files:"
    echo "$MODIFIED_FILES"
    git add $MODIFIED_FILES
fi

# Step 8: Check if there are any changes to commit
if git diff --cached --quiet; then
    print_warning "No changes to commit. All files might be dashboard-related or already up to date."
else
    print_status "Committing changes..."
    git commit -m "feat: merge UI improvements from CompleteCoachSide_Dashbaord-UI-Fixes (excluding dashboard code)

- Excluded dashboard-related files
- Included UI component improvements
- Updated styling and theming
- Enhanced form components and interactions"
    print_success "Changes committed successfully"
fi

# Step 9: Test the build
print_status "Testing build process..."
if npm run build; then
    print_success "Build successful!"
else
    print_error "Build failed! Please check for issues."
    exit 1
fi

# Step 10: Summary
print_success "Selective merge completed successfully!"
echo ""
echo "📊 Summary:"
echo "  - Backup branch created"
echo "  - Selective merge branch created"
echo "  - Non-dashboard files merged"
echo "  - Build tested successfully"
echo ""
echo "🔧 Next steps:"
echo "  1. Test the application manually"
echo "  2. If everything looks good, merge to staging:"
echo "     git checkout staging"
echo "     git merge selective-ui-merge-$(date +%Y%m%d-%H%M%S)"
echo "     git push origin staging"
echo ""
echo "⚠️  If issues are found, you can revert using the backup branch"

print_success "Script completed successfully!" 