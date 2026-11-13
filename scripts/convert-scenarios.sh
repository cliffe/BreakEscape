#!/bin/bash
# Convert all scenario JSON files to ERB structure

echo "Converting scenario files to ERB templates..."

# Get all scenario JSON files
scenarios=$(ls scenarios/*.json 2>/dev/null | xargs -n1 basename | sed 's/\.json$//')

# Process all scenarios
echo ""
echo "=== Processing Scenarios ==="
for scenario in $scenarios; do
  if [ -f "scenarios/${scenario}.json" ]; then
    echo "Processing: $scenario"

    # Create directory
    mkdir -p "app/assets/scenarios/${scenario}"

    # Move and rename (just rename to .erb, don't modify content yet)
    mv "scenarios/${scenario}.json" "app/assets/scenarios/${scenario}/scenario.json.erb"

    echo "  ✓ Moved to app/assets/scenarios/${scenario}/scenario.json.erb"
  else
    echo "  ⚠ File not found: scenarios/${scenario}.json (skipping)"
  fi
done

echo ""
echo "=== Summary ==="
echo "Converted files:"
find app/assets/scenarios -name "scenario.json.erb" | wc -l
echo ""
echo "Directory structure:"
ls -d app/assets/scenarios/*/
echo ""
echo "✓ Conversion complete!"
echo ""
echo "IMPORTANT:"
echo "- Files have been renamed to .erb but content is still JSON"
echo "- ERB randomization (random_password, etc.) will be added in Phase 4"
echo "- For now, scenarios work as-is with static passwords"
