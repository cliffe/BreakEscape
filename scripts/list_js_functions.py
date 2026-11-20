#!/usr/bin/env python3
"""
List all JavaScript functions in a file.

Usage:
    python3 list_js_functions.py [--file path/to/file.js] [--format table|list|csv]

Example:
    python3 list_js_functions.py --file js/minigames/lockpicking/lockpicking-game-phaser.js --format table
"""

import argparse
import re
from pathlib import Path
from typing import List, Tuple


class JSFunctionLister:
    """Extract and list all functions from a JavaScript file."""
    
    def __init__(self, input_file: str):
        """Initialize with input file path."""
        self.input_file = Path(input_file)
        self.content = self.input_file.read_text(encoding='utf-8')
        self.lines = self.content.split('\n')
    
    def find_all_functions(self) -> List[Tuple[str, int, int]]:
        """
        Find all function definitions in the file.
        
        Returns:
            List of tuples: (function_name, start_line, end_line)
        """
        functions = []
        
        # Pattern for method definitions (class methods)
        method_pattern = r'^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\('
        
        i = 0
        while i < len(self.lines):
            line = self.lines[i]
            
            # Match method definition
            match = re.match(method_pattern, line)
            if match:
                method_name = match.group(1)
                start_line = i
                
                # Find the end of the method by counting braces
                brace_count = 0
                found_opening = False
                end_line = None
                
                for j in range(i, len(self.lines)):
                    current_line = self.lines[j]
                    
                    for char in current_line:
                        if char == '{':
                            brace_count += 1
                            found_opening = True
                        elif char == '}':
                            if found_opening:
                                brace_count -= 1
                                if brace_count == 0:
                                    end_line = j
                                    break
                    
                    if end_line is not None:
                        break
                
                if end_line is not None:
                    functions.append((method_name, start_line + 1, end_line + 1))  # +1 for 1-based indexing
                    i = end_line + 1
                else:
                    i += 1
            else:
                i += 1
        
        return functions
    
    def format_table(self, functions: List[Tuple[str, int, int]]) -> str:
        """Format functions as a table."""
        if not functions:
            return "No functions found"
        
        # Calculate column widths
        max_name_len = max(len(name) for name, _, _ in functions)
        max_name_len = max(max_name_len, len("Function Name"))
        
        # Header
        lines = []
        lines.append("┌─" + "─" * max_name_len + "─┬──────────┬──────────┐")
        lines.append(f"│ {'Function Name':<{max_name_len}} │ Start    │ End      │")
        lines.append("├─" + "─" * max_name_len + "─┼──────────┼──────────┤")
        
        # Rows
        for name, start, end in functions:
            lines.append(f"│ {name:<{max_name_len}} │ {start:>8} │ {end:>8} │")
        
        lines.append("└─" + "─" * max_name_len + "─┴──────────┴──────────┘")
        
        return "\n".join(lines)
    
    def format_list(self, functions: List[Tuple[str, int, int]]) -> str:
        """Format functions as a simple list."""
        if not functions:
            return "No functions found"
        
        lines = []
        for i, (name, start, end) in enumerate(functions, 1):
            lines.append(f"{i:2}. {name:40} (lines {start:5}-{end:5})")
        
        return "\n".join(lines)
    
    def format_csv(self, functions: List[Tuple[str, int, int]]) -> str:
        """Format functions as CSV."""
        if not functions:
            return "No functions found"
        
        lines = ["Function Name,Start Line,End Line"]
        for name, start, end in functions:
            lines.append(f'"{name}",{start},{end}')
        
        return "\n".join(lines)
    
    def format_copy_paste(self, functions: List[Tuple[str, int, int]]) -> str:
        """Format as comma-separated list for copy-pasting to command line."""
        if not functions:
            return "No functions found"
        
        names = [name for name, _, _ in functions]
        return ",".join(names)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='List all JavaScript functions in a file',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # List functions from lockpicking file
  python3 list_js_functions.py --file js/minigames/lockpicking/lockpicking-game-phaser.js
  
  # Show as table
  python3 list_js_functions.py --file lockpicking-game-phaser.js --format table
  
  # Show as CSV
  python3 list_js_functions.py --file lockpicking-game-phaser.js --format csv
  
  # Get copy-paste friendly list
  python3 list_js_functions.py --file lockpicking-game-phaser.js --format copy-paste
        """
    )
    
    parser.add_argument(
        '--file',
        default='js/minigames/lockpicking/lockpicking-game-phaser.js',
        help='Path to input JavaScript file (default: %(default)s)'
    )
    
    parser.add_argument(
        '--format',
        choices=['table', 'list', 'csv', 'copy-paste'],
        default='table',
        help='Output format (default: %(default)s)'
    )
    
    parser.add_argument(
        '--grep',
        help='Filter functions by name (case-insensitive)'
    )
    
    parser.add_argument(
        '--count',
        action='store_true',
        help='Show only count of functions'
    )
    
    args = parser.parse_args()
    
    try:
        # List functions
        print(f"📂 Reading: {args.file}")
        lister = JSFunctionLister(args.file)
        
        print(f"\n🔍 Extracting functions...")
        functions = lister.find_all_functions()
        
        # Filter if grep specified
        if args.grep:
            grep_lower = args.grep.lower()
            functions = [(n, s, e) for n, s, e in functions if grep_lower in n.lower()]
            print(f"📋 Filtered to functions matching '{args.grep}':")
        
        # Show count
        print(f"✅ Found {len(functions)} functions\n")
        
        if args.count:
            print(f"Total: {len(functions)}")
        else:
            # Format and display
            if args.format == 'table':
                print(lister.format_table(functions))
            elif args.format == 'list':
                print(lister.format_list(functions))
            elif args.format == 'csv':
                print(lister.format_csv(functions))
            elif args.format == 'copy-paste':
                print("\n📋 Copy-paste this list of function names:\n")
                print(lister.format_copy_paste(functions))
        
    except FileNotFoundError as e:
        print(f"❌ File not found: {e}")
        exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)


if __name__ == '__main__':
    main()
