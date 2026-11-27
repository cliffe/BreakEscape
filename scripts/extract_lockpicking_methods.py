#!/usr/bin/env python3
"""
Extract methods from lockpicking-game-phaser.js into separate modules.

Usage:
    python3 extract_lockpicking_methods.py --methods "method1,method2,method3" --output-file "output.js" [--class-name "ClassName"]

Example:
    python3 extract_lockpicking_methods.py \\
        --methods "createLockBackground,createTensionWrench,createHookPick" \\
        --output-file "lock-graphics.js" \\
        --class-name "LockGraphics"
"""

import argparse
import re
import sys
from pathlib import Path
from typing import List, Dict, Tuple, Optional, Set


class MethodExtractor:
    """Extract methods from JavaScript class files."""
    
    def __init__(self, input_file: str):
        """Initialize with input file path."""
        self.input_file = Path(input_file)
        self.content = self.input_file.read_text(encoding='utf-8')
        self.lines = self.content.split('\n')
    
    def replace_this_with_parent(self, code: str, use_parent_keyword: bool = True) -> str:
        """
        Replace 'this' references with 'this.parent' for extracted modules.
        
        This allows extracted methods to access the parent instance state properly.
        Uses 'this.parent' so it works within instance methods.
        
        Args:
            code: Method code containing 'this' references
            use_parent_keyword: If True, replace 'this' with 'this.parent'; if False, leave as-is
        
        Returns:
            Modified code with replacements
        """
        if not use_parent_keyword:
            return code
        
        lines = code.split('\n')
        modified_lines = []
        
        for line in lines:
            # Skip comment lines
            if line.strip().startswith('//'):
                modified_lines.append(line)
                continue
            
            modified_line = line
            
            # Replace 'this.' with 'this.parent.' for method bodies
            # This allows instance methods to access parent state via this.parent
            modified_line = re.sub(r'\bthis\.', 'this.parent.', modified_line)
            
            modified_lines.append(modified_line)
        
        return '\n'.join(modified_lines)
        
    def find_method(self, method_name: str) -> Optional[Tuple[int, int]]:
        """
        Find method definition and return start/end line numbers (0-indexed).
        
        Returns:
            Tuple of (start_line, end_line) or None if not found
        """
        # Pattern: optional whitespace, method name, optional whitespace, parentheses
        method_pattern = rf'^\s*{re.escape(method_name)}\s*\('
        
        start_line = None
        for i, line in enumerate(self.lines):
            if re.match(method_pattern, line):
                start_line = i
                break
        
        if start_line is None:
            return None
        
        # Find the opening brace
        brace_line = start_line
        for i in range(start_line, len(self.lines)):
            if '{' in self.lines[i]:
                brace_line = i
                break
        
        # Count braces to find the matching closing brace
        brace_count = 0
        found_opening = False
        end_line = None
        
        for i in range(brace_line, len(self.lines)):
            line = self.lines[i]
            
            for char in line:
                if char == '{':
                    brace_count += 1
                    found_opening = True
                elif char == '}':
                    if found_opening:
                        brace_count -= 1
                        if brace_count == 0:
                            end_line = i
                            break
            
            if end_line is not None:
                break
        
        if end_line is None:
            return None
        
        return (start_line, end_line)
    
    def extract_method(self, method_name: str, replace_this: bool = False) -> Optional[str]:
        """
        Extract a single method as a string.
        
        Args:
            method_name: Name of method to extract
            replace_this: If True, replace 'this' with 'parent' for module usage
        
        Returns:
            Method code as string, or None if not found
        """
        result = self.find_method(method_name)
        if result is None:
            print(f"❌ Method '{method_name}' not found", file=sys.stderr)
            return None
        
        start_line, end_line = result
        # Extract lines as-is from the source
        method_lines = self.lines[start_line:end_line+1]
        
        # Strip the leading 4-space class indentation from all non-empty lines,
        # since the module template will apply the correct indentation level
        dedented_lines = []
        for line in method_lines:
            if line.startswith('    ') and line.strip():  # Has 4-space indent and not empty
                dedented_lines.append(line[4:])  # Remove the 4-space class indent
            else:
                dedented_lines.append(line)  # Keep as-is (empty or already correct)
        
        method_code = '\n'.join(dedented_lines)
        
        if replace_this:
            method_code = self.replace_this_with_parent(method_code, use_parent_keyword=True)
        
        return method_code
    
    def extract_methods(self, method_names: List[str], replace_this: bool = False) -> Dict[str, str]:
        """
        Extract multiple methods.
        
        Args:
            method_names: List of method names to extract
            replace_this: If True, replace 'this' with 'parent' in extracted code
        
        Returns:
            Dict mapping method_name -> method_code
        """
        extracted = {}
        for method_name in method_names:
            code = self.extract_method(method_name, replace_this=replace_this)
            if code:
                extracted[method_name] = code
                print(f"✓ Extracted: {method_name}")
            else:
                print(f"✗ Failed to extract: {method_name}")
        
        return extracted
    
    def find_dependencies(self, methods: Dict[str, str]) -> Set[str]:
        """
        Find method dependencies (methods called by extracted methods).
        
        Returns:
            Set of method names that are called but not in the extraction list
        """
        # Pattern for method calls: this.methodName( or other_object.methodName(
        method_call_pattern = r'(?:this\.|[\w]+\.)?(\w+)\s*\('
        
        dependencies = set()
        all_method_names = set(methods.keys())
        
        for method_code in methods.values():
            matches = re.finditer(method_call_pattern, method_code)
            for match in matches:
                called_method = match.group(1)
                # Skip standard JS functions and common names
                if not self._is_builtin_or_common(called_method):
                    if called_method not in all_method_names:
                        dependencies.add(called_method)
        
        return dependencies
    
    @staticmethod
    def _is_builtin_or_common(name: str) -> bool:
        """Check if name is a builtin or common function."""
        builtins = {
            'console', 'Math', 'Object', 'Array', 'String', 'Number',
            'parseInt', 'parseFloat', 'isNaN', 'JSON', 'Date', 'RegExp',
            'Error', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
            'document', 'window', 'localStorage', 'addEventListener',
            'removeEventListener', 'querySelector', 'getElementById', 'createElement',
            'appendChild', 'removeChild', 'insertBefore', 'textContent', 'innerHTML',
            'setAttribute', 'getAttribute', 'classList', 'add', 'remove', 'contains',
            'push', 'pop', 'shift', 'unshift', 'splice', 'slice', 'concat', 'join',
            'split', 'map', 'filter', 'reduce', 'forEach', 'find', 'findIndex',
            'includes', 'indexOf', 'length', 'keys', 'values', 'entries',
            'Object', 'assign', 'create', 'defineProperty', 'defineProperties',
            'getOwnPropertyNames', 'getOwnPropertyDescriptor', 'seal', 'freeze',
            'prototype', 'constructor', 'instanceof', 'typeof', 'in', 'of',
            'delete', 'new', 'super', 'this', 'return', 'if', 'else', 'for',
            'while', 'do', 'switch', 'case', 'break', 'continue', 'try',
            'catch', 'finally', 'throw', 'async', 'await', 'yield', 'static',
            'class', 'extends', 'import', 'export', 'default', 'from', 'as',
            'let', 'const', 'var', 'true', 'false', 'null', 'undefined',
            'add', 'set', 'get', 'on', 'once', 'off', 'emit', 'listen',
            'startX', 'startY', 'endX', 'endY', 'width', 'height', 'x', 'y',
            'fill', 'stroke', 'draw', 'render', 'create', 'update', 'init',
            'tweens', 'time', 'scene', 'add', 'graphics', 'text', 'container',
            'setAngle', 'setDepth', 'setOrigin', 'setVisible', 'setTint', 'setPosition',
            'destroy', 'setScale', 'setAlpha', 'setInteractive', 'on', 'once',
            'rotationCenterX', 'rotationCenterY', 'targetPin', 'lastTargetedPin',
            'log', 'warn', 'error', 'debug', 'info', 'assert', 'time', 'timeEnd',
        }
        return name in builtins


class MainFileUpdater:
    """Update the main lockpicking file to use extracted modules."""
    
    def __init__(self, main_file: str):
        """Initialize with main file path."""
        self.main_file = Path(main_file)
        self.content = self.main_file.read_text(encoding='utf-8')
        self.lines = self.content.split('\n')
    
    def remove_methods(self, method_names: List[str]) -> str:
        """
        Remove method definitions from the main file.
        
        Args:
            method_names: List of method names to remove
        
        Returns:
            Updated file content
        """
        updated_lines = self.lines.copy()
        
        for method_name in method_names:
            # Find the method
            start_idx = None
            for i, line in enumerate(updated_lines):
                if re.match(rf'^\s*{re.escape(method_name)}\s*\(', line):
                    start_idx = i
                    break
            
            if start_idx is None:
                print(f"⚠️  Method '{method_name}' not found in main file")
                continue
            
            # Find opening brace
            brace_idx = start_idx
            for i in range(start_idx, len(updated_lines)):
                if '{' in updated_lines[i]:
                    brace_idx = i
                    break
            
            # Count braces to find matching closing brace
            brace_count = 0
            found_opening = False
            end_idx = None
            
            for i in range(brace_idx, len(updated_lines)):
                line = updated_lines[i]
                
                for char in line:
                    if char == '{':
                        brace_count += 1
                        found_opening = True
                    elif char == '}':
                        if found_opening:
                            brace_count -= 1
                            if brace_count == 0:
                                end_idx = i
                                break
                
                if end_idx is not None:
                    break
            
            if end_idx is not None:
                # Remove the method and surrounding whitespace
                del updated_lines[start_idx:end_idx+1]
                # Remove empty lines that follow
                while updated_lines and updated_lines[start_idx].strip() == '':
                    del updated_lines[start_idx]
                
                print(f"✓ Removed method: {method_name}")
        
        # Update both self.lines and self.content
        self.lines = updated_lines
        self.content = '\n'.join(updated_lines)
        return self.content
    
    def add_import(self, class_name: str, module_path: str) -> str:
        """
        Add import statement at the top of the file.
        
        Args:
            class_name: Name of class/object being imported
            module_path: Relative path to module (e.g., './lock-configuration.js')
        
        Returns:
            Updated content with import added
        """
        lines = self.content.split('\n')
        
        # Check if this import already exists
        import_stmt = f"import {{ {class_name} }} from '{module_path}';"
        for line in lines:
            if import_stmt in line:
                # Import already exists, no need to add
                return self.content
        
        # Find where to insert import (after existing imports, before class definition)
        insert_idx = 0
        for i, line in enumerate(lines):
            if line.startswith('import '):
                insert_idx = i + 1
            elif line.startswith('export class'):
                break
        
        # Insert the new import statement
        lines.insert(insert_idx, import_stmt)
        
        # Update content for next operations
        self.content = '\n'.join(lines)
        self.lines = lines
        return self.content
    
    def add_module_initialization(self, instance_name: str, class_name: str) -> str:
        """
        Add module initialization in constructor.
        
        Args:
            instance_name: Name for the instance (e.g., 'lockConfig')
            class_name: Class name (e.g., 'LockConfiguration')
        
        Returns:
            Updated content with initialization added
        """
        # Check if initialization already exists to prevent duplicates
        init_pattern = f'this.{instance_name} = new {class_name}(this)'
        if init_pattern in self.content:
            print(f"ℹ️  Initialization for {instance_name} already exists, skipping")
            return self.content
        
        lines = self.content.split('\n')
        
        # Find constructor and its opening brace
        constructor_idx = None
        for i, line in enumerate(lines):
            if 'constructor(' in line:
                constructor_idx = i
                break
        
        if constructor_idx is None:
            print("⚠️  Constructor not found")
            return self.content
        
        # Find the end of super() call or end of constructor body setup
        init_idx = constructor_idx + 1
        for i in range(constructor_idx, min(constructor_idx + 50, len(lines))):
            line = lines[i]
            # Look for lines that initialize properties (this.xxx = ...)
            # We want to add after all the initialization lines
            if line.strip() and not line.strip().startswith('//') and '=' in line:
                init_idx = i + 1
            # Stop at closing brace of constructor
            elif line.strip() == '}':
                break
        
        # Add initialization before the closing brace
        # Go back to find the right spot (before closing brace)
        for i in range(init_idx, min(init_idx + 10, len(lines))):
            if lines[i].strip() == '}':
                init_idx = i
                break
        
        # Create the initialization line with proper indentation
        init_stmt = f"        \n        // Initialize {class_name} module"
        init_stmt += f"\n        this.{instance_name} = new {class_name}(this);"
        lines.insert(init_idx, init_stmt)
        
        # Update content and lines for next operations
        self.lines = lines
        self.content = '\n'.join(lines)
        return self.content
    
    def replace_method_calls(self, method_names: List[str], module_instance: str) -> str:
        """
        Replace method calls in the main file.
        
        Args:
            method_names: Methods that were extracted
            module_instance: Name of the module instance (e.g., 'lockConfig')
        
        Returns:
            Updated content with method calls replaced
        """
        updated = self.content
        
        for method_name in method_names:
            # Pattern 1: this.methodName( -> this.moduleInstance.methodName(
            pattern_this = rf'this\.{method_name}\('
            replacement_this = f'this.{module_instance}.{method_name}('
            updated = re.sub(pattern_this, replacement_this, updated)
            
            # Pattern 2: self.methodName( -> self.moduleInstance.methodName(
            # (common pattern in Phaser where scenes save const self = this)
            pattern_self = rf'self\.{method_name}\('
            replacement_self = f'self.{module_instance}.{method_name}('
            updated = re.sub(pattern_self, replacement_self, updated)
        
        # Update content for next operations
        self.content = updated
        return updated


class ModuleGenerator:
    """Generate JavaScript module files."""
    
    def __init__(self, import_statements: Optional[str] = None):
        """Initialize with optional import statements."""
        self.import_statements = import_statements or ""
    
    def generate_module(
        self,
        methods: Dict[str, str],
        class_name: str,
        export_as_class: bool = True,
        extends: Optional[str] = None,
        additional_imports: Optional[List[str]] = None,
        use_parent_instance: bool = True
    ) -> str:
        """
        Generate a complete JavaScript module.
        
        Args:
            methods: Dict of method_name -> method_code
            class_name: Name of the exported class/object
            export_as_class: If True, export as class; if False, as object
            extends: Class to extend (e.g., "MinigameScene")
            additional_imports: List of import statements
            use_parent_instance: If True, generate with parent instance pattern
        
        Returns:
            Complete module code as string
        """
        # Build imports
        imports = []
        if additional_imports:
            imports.extend(additional_imports)
        
        imports_section = '\n'.join(imports) + '\n' if imports else ''
        
        # Build class or object
        if export_as_class:
            code = self._generate_class(methods, class_name, extends, imports_section, use_parent_instance)
        else:
            code = self._generate_object(methods, class_name, imports_section, use_parent_instance)
        
        return code
    
    @staticmethod
    def _generate_class(
        methods: Dict[str, str],
        class_name: str,
        extends: Optional[str],
        imports_section: str,
        use_parent_instance: bool = True
    ) -> str:
        """Generate a class module."""
        extends_str = f" extends {extends}" if extends else ""

        # Join all methods without adding additional indentation. Extracted
        # methods already contain their original leading whitespace, so we
        # preserve them exactly by joining with blank lines only.
        methods_code = '\n\n'.join(methods.values())
        
        # Add 4-space indentation to every line of methods_code to indent at class level
        indented_methods = '\n'.join('    ' + line if line.strip() else line 
                                     for line in methods_code.split('\n'))

        # Add constructor if using parent instance pattern. Constructor
        # should use the same 4-space method indentation level.
        if use_parent_instance:
            constructor = """    constructor(parent) {
        this.parent = parent;
    }"""
            indented_methods = constructor + '\n\n' + indented_methods
        
        code = f"""{imports_section}
/**
 * {class_name}
 * 
 * Extracted from lockpicking-game-phaser.js
 * Instantiate with: new {class_name}(this)
 * 
 * All 'this' references replaced with 'this.parent' to access parent instance state:
 * - this.parent.pins (array of pin objects)
 * - this.parent.scene (Phaser scene)
 * - this.parent.lockId (lock identifier)
 * - this.parent.lockState (lock state object)
 * etc.
 */
export class {class_name}{extends_str} {{
    
{indented_methods}
    
}}
"""
        return code
    
    @staticmethod
    def _generate_object(
        methods: Dict[str, str],
        object_name: str,
        imports_section: str,
        use_parent_instance: bool = True
    ) -> str:
        """Generate an object/namespace module."""
        # Convert methods to object methods. Preserve original leading
        # whitespace from extracted methods by joining with blank lines only.
        methods_code = '\n\n'.join(methods.values())
        
        # Add 4-space indentation to every line of methods_code to indent at object level
        indented_methods = '\n'.join('    ' + line if line.strip() else line 
                                     for line in methods_code.split('\n'))

        # Add init function if using parent instance pattern. Use 4-space
        # indentation for the init function to match method indentation.
        if use_parent_instance:
            init_func = """    init(parent) {
        return {
            parent: parent
        };
    }"""
            indented_methods = init_func + '\n\n' + indented_methods
        
        code = f"""{imports_section}
/**
 * {object_name}
 * 
 * Extracted from lockpicking-game-phaser.js
 * Usage: {object_name}.methodName(parent, ...args)
 * 
 * All 'this' references replaced with 'parent' to access parent instance state:
 * - parent.pins (array of pin objects)
 * - parent.scene (Phaser scene)
 * - parent.lockId (lock identifier)
 * - parent.lockState (lock state object)
 * etc.
 */
export const {object_name} = {{
    
{indented_methods}
    
}};
"""
        return code


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Extract methods from lockpicking-game-phaser.js',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Extract lock graphics methods
  python3 extract_lockpicking_methods.py \\
    --methods "createLockBackground,createTensionWrench,createHookPick" \\
    --output-file "lock-graphics.js" \\
    --class-name "LockGraphics" \\
    --extends "LockpickingComponent"
  
  # Extract lock configuration methods as object
  python3 extract_lockpicking_methods.py \\
    --methods "saveLockConfiguration,loadLockConfiguration,clearLockConfiguration" \\
    --output-file "lock-configuration.js" \\
    --object-mode
        """
    )
    
    parser.add_argument(
        '--input-file',
        default='js/minigames/lockpicking/lockpicking-game-phaser.js',
        help='Path to input JavaScript file (default: %(default)s)'
    )
    
    parser.add_argument(
        '--methods',
        required=True,
        help='Comma-separated list of method names to extract'
    )
    
    parser.add_argument(
        '--output-file',
        required=True,
        help='Path to output JavaScript file'
    )
    
    parser.add_argument(
        '--class-name',
        help='Name for exported class (default: auto-generated from filename)'
    )
    
    parser.add_argument(
        '--extends',
        help='Parent class to extend'
    )
    
    parser.add_argument(
        '--object-mode',
        action='store_true',
        help='Export as object instead of class'
    )
    
    parser.add_argument(
        '--show-dependencies',
        action='store_true',
        help='Show method dependencies before extraction'
    )
    
    parser.add_argument(
        '--imports',
        help='Comma-separated list of import statements to add'
    )
    
    parser.add_argument(
        '--replace-this',
        action='store_true',
        help='Replace "this" with "parent" in extracted methods for state sharing'
    )
    
    parser.add_argument(
        '--update-main-file',
        help='Path to main file to update with imports and method calls'
    )
    
    parser.add_argument(
        '--module-instance-name',
        help='Name for module instance in main file (e.g., "lockConfig")'
    )
    
    parser.add_argument(
        '--auto-integrate',
        action='store_true',
        help='Automatically remove methods from main file and add imports (requires --update-main-file)'
    )
    
    args = parser.parse_args()
    
    # Parse method names
    method_names = [m.strip() for m in args.methods.split(',')]
    
    # Parse imports if provided
    additional_imports = []
    if args.imports:
        additional_imports = [i.strip() for i in args.imports.split(',')]
    
    # Generate class name from output file if not provided
    class_name = args.class_name
    if not class_name:
        # Convert filename to PascalCase class name
        filename = Path(args.output_file).stem
        parts = filename.split('-')
        class_name = ''.join(word.capitalize() for word in parts)
    
    try:
        # Extract methods
        print(f"📂 Reading: {args.input_file}")
        extractor = MethodExtractor(args.input_file)
        
        print(f"\n📋 Extracting {len(method_names)} methods...")
        methods = extractor.extract_methods(method_names, replace_this=args.replace_this)
        
        if not methods:
            print("❌ No methods extracted!", file=sys.stderr)
            sys.exit(1)
        
        # Show dependencies if requested
        if args.show_dependencies:
            deps = extractor.find_dependencies(methods)
            if deps:
                print(f"\n⚠️  Dependencies (methods called but not extracted):")
                for dep in sorted(deps):
                    print(f"   - {dep}")
            else:
                print(f"\n✓ No external dependencies found")
        
        # Generate module
        print(f"\n🔨 Generating module: {class_name}")
        generator = ModuleGenerator()
        
        module_code = generator.generate_module(
            methods=methods,
            class_name=class_name,
            export_as_class=not args.object_mode,
            extends=args.extends,
            additional_imports=additional_imports,
            use_parent_instance=args.replace_this
        )
        
        # Write output
        output_path = Path(args.output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(module_code, encoding='utf-8')
        
        print(f"\n✅ Success! Created: {args.output_file}")
        print(f"   Lines of code: {len(module_code.split(chr(10)))}")
        
        # Update main file if requested
        if args.update_main_file:
            print(f"\n📝 Updating main file: {args.update_main_file}")
            
            main_updater = MainFileUpdater(args.update_main_file)
            module_instance_name = args.module_instance_name or class_name[0].lower() + class_name[1:]  # camelCase
            
            if args.auto_integrate:
                print(f"\n   🔧 Auto-integrating...")
                
                # 1. Add import statement
                import_path = Path(args.output_file).name
                main_updater.add_import(class_name, f'./{import_path}')
                print(f"   ✓ Added import statement")
                
                # 2. Add module initialization in constructor
                main_updater.add_module_initialization(module_instance_name, class_name)
                print(f"   ✓ Added module initialization in constructor")
                
                # 3. Remove old methods from main file
                try:
                    main_updater.remove_methods(method_names)
                    print(f"   ✓ Removed {len(method_names)} methods from main file")
                except Exception as e:
                    print(f"   ⚠️  Error removing methods: {e}")
                
                # 4. Replace method calls to use module instance
                try:
                    main_updater.replace_method_calls(method_names, module_instance_name)
                    print(f"   ✓ Updated method calls to use this.{module_instance_name}")
                except Exception as e:
                    print(f"   ⚠️  Error updating calls: {e}")
            
            # Write updated main file
            try:
                main_path = Path(args.update_main_file)
                main_path.write_text(main_updater.content, encoding='utf-8')
                print(f"\n✅ Updated: {args.update_main_file}")
                print(f"   Instance name: this.{module_instance_name}")
                print(f"   Usage: new {class_name}(this) in constructor")
            except Exception as e:
                print(f"❌ Error writing main file: {e}", file=sys.stderr)
        
    except FileNotFoundError as e:
        print(f"❌ File not found: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
