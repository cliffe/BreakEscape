#!/bin/bash
# Compile all .ink files in scenario ink directories to JSON
# Usage: ./scripts/compile-ink.sh [scenario_name]
# Examples:
#   ./scripts/compile-ink.sh                    # Compile all scenarios
#   ./scripts/compile-ink.sh m01_first_contact  # Compile only m01_first_contact

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Paths
SCENARIOS_DIR="$PROJECT_ROOT/scenarios"
INKLECATE="$PROJECT_ROOT/bin/inklecate"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if inklecate exists
if [ ! -f "$INKLECATE" ]; then
    echo -e "${RED}Error: inklecate not found at $INKLECATE${NC}"
    exit 1
fi

# Check if scenarios directory exists
if [ ! -d "$SCENARIOS_DIR" ]; then
    echo -e "${RED}Error: Scenarios directory not found at $SCENARIOS_DIR${NC}"
    exit 1
fi

# Check for optional scenario directory argument
if [ -n "$1" ]; then
    TARGET_DIR="$SCENARIOS_DIR/$1"
    if [ ! -d "$TARGET_DIR" ]; then
        echo -e "${RED}Error: Scenario directory not found: $TARGET_DIR${NC}"
        exit 1
    fi
    echo -e "${GREEN}Compiling ink files in $1${NC}"
    SEARCH_DIR="$TARGET_DIR"
else
    echo -e "${GREEN}Compiling ink files in all scenario directories${NC}"
    SEARCH_DIR="$SCENARIOS_DIR"
fi
echo "----------------------------------------"

# Counter for compiled files
compiled=0
failed=0
warnings=0

# Find all ink directories within scenario directories
ink_dirs=$(find "$SEARCH_DIR" -type d -name "ink")

if [ -z "$ink_dirs" ]; then
    echo -e "${YELLOW}No ink directories found in $SCENARIOS_DIR${NC}"
    exit 0
fi

for ink_dir in $ink_dirs; do
    echo -e "${CYAN}Found ink directory: $ink_dir${NC}"
    
    # Iterate through all .ink files in this directory
    for ink_file in "$ink_dir"/*.ink; do
        # Check if any .ink files exist
        [ -e "$ink_file" ] || continue

        # Get the filename without path
        filename=$(basename "$ink_file")

        # Get output JSON filename
        json_file="${ink_file%.ink}.json"

        echo -e "${YELLOW}Compiling: $filename${NC}"

        # Check for END tags (warning about hub return convention)
        if grep -qE '^\s*->?\s*END\s*$' "$ink_file"; then
            echo -e "${RED}⚠ Warning: END detected - doesn't follow BreakEscape hub return convention${NC}"
            echo "  File: $ink_file"
            # Show the lines with END
            grep -nE '^\s*->?\s*END\s*$' "$ink_file" | while read -r line; do
                echo -e "  ${RED}Line $line${NC}"
            done
            ((warnings++))
        fi

        # Compile the ink file
        if "$INKLECATE" -o "$json_file" "$ink_file"; then
            echo -e "${GREEN}✓ Success: $filename -> $(basename "$json_file")${NC}"
            ((compiled++))
        else
            echo -e "${RED}✗ Failed: $filename${NC}"
            ((failed++))
        fi

        echo ""
    done
done

# Summary
echo "----------------------------------------"
echo -e "${GREEN}Compilation complete!${NC}"
echo "  Compiled: $compiled files"
if [ $failed -gt 0 ]; then
    echo -e "  ${RED}Failed: $failed files${NC}"
else
    echo "  Failed: 0 files"
fi
if [ $warnings -gt 0 ]; then
    echo -e "  ${YELLOW}Warnings: $warnings files with END tags${NC}"
fi
