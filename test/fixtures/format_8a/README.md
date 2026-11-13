# Format 8a old-render fixtures

Each `<scenario>.old.json` is the rendered scenario data for one of the four scenarios that
format-hardening step 8a rewrites, captured from the pre-8a template (the outage fields in their old
shape: networks and resources carry `downIf`, objects carry `affordance.offWhen`).

These let `test/unit/format_8a_corpus_test.rb` and `test/js/format-8a-reader-parity.test.mjs` check
that the step 8a transform turns the old shape into the current template and that the old and new
outage readers agree, without reading anything through git. That keeps the equivalence meaningful
after 8a lands on main (where a merge base would otherwise point at the new code) and lets the tests
run in a gitless checkout.

## How they were made

Captured from the merge base `8b6cf6a0d` (the main commit 8a was based on). For each scenario the
base template `scenarios/<scenario>/scenario.json.erb` was rendered (`srand(1)` then ERB; the four
carry no ERB tags, so this is a plain parse) and written as pretty JSON. To regenerate after a
deliberate corpus change, render each base template the same way and overwrite the file.
