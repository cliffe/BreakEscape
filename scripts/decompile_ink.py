#!/usr/bin/env python3
"""
Decompile inkVersion 21 runtime JSON back into readable .ink source.

This is a pragmatic decompiler for Break Escape's dialogue files. It reconstructs
high-level ink (knots, stitches, choices, conditionals, var ops, tags, external
calls, diverts) rather than the low-level runtime container form, so the output
can be edited by hand and recompiled by inklecate.

IMPORTANT: the output must be verified by round-trip (recompile + semantic trace
diff) before it is trusted to replace a working compiled .json. See
scripts/verify_ink_roundtrip.py.
"""
import json, sys, re

# ---- Expression (RPN) reconstruction -------------------------------------

BINOPS = {"+","-","*","/","%","==","!=",">=","<=",">","<","&&","||","MOD","?","has","hasnt"}
OP_TEXT = {"&&":"&&","||":"||","MOD":"%"}

def render_expr(tokens):
    """Reconstruct an infix expression from a postfix ev..[/ev] token list.
    Returns (list_of_outputs, list_of_assignments) where outputs are 'out' values.
    """
    stack = []
    outputs = []
    assigns = []
    i = 0
    while i < len(tokens):
        t = tokens[i]
        if isinstance(t, (int, float, bool)):
            stack.append(json.dumps(t) if isinstance(t,bool) else str(t))
        elif isinstance(t, dict):
            if "VAR?" in t:
                stack.append(t["VAR?"])
            elif "x()" in t:
                # external function call; arity unknown — assume 0 or take preceding strings.
                stack.append(f'{t["x()"]}()')
            elif "VAR=" in t:
                name = t["VAR="]
                val = stack.pop() if stack else ""
                assigns.append((name, val, t.get("re", False)))
            elif "temp=" in t:
                name = t["temp="]
                val = stack.pop() if stack else ""
                assigns.append((name, val, t.get("re", False)))
            elif "^->" in t or "->t->" in t:
                stack.append("<<divert-target>>")
            else:
                stack.append(f"/*{t}*/")
        elif isinstance(t, str):
            if t == "str":
                # collect until /str
                j = i + 1
                buf = []
                while j < len(tokens) and tokens[j] != "/str":
                    if isinstance(tokens[j], str) and tokens[j].startswith("^"):
                        buf.append(tokens[j][1:])
                    j += 1
                stack.append('"' + "".join(buf) + '"')
                i = j
            elif t == "out":
                if stack:
                    outputs.append(stack.pop())
            elif t == "!":
                a = strip_paren(stack.pop() if stack else "")
                if re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", a):
                    stack.append(f"not {a}")
                else:
                    stack.append(f"not ({a})")
            elif t in BINOPS:
                b = stack.pop() if stack else ""
                a = stack.pop() if stack else ""
                op = OP_TEXT.get(t, t)
                stack.append(f"({a} {op} {b})")
            elif t == "nop":
                pass
            else:
                # bare string literal token
                stack.append(t)
        i += 1
    return outputs, assigns, stack

def strip_paren(s):
    if s.startswith("(") and s.endswith(")"):
        depth = 0
        for idx, ch in enumerate(s):
            if ch == "(":
                depth += 1
            elif ch == ")":
                depth -= 1
                if depth == 0 and idx != len(s)-1:
                    return s
        return s[1:-1]
    return s

# ---- Container walking ----------------------------------------------------

class Decompiler:
    def __init__(self, root):
        self.root = root
        self.lines = []
        self.global_decl = {}

    def emit(self, s=""):
        self.lines.append(s)

    def named_children(self, container):
        """The last element of a runtime container array is a dict of named sub-containers + metadata."""
        if not isinstance(container, list):
            return {}
        if container and isinstance(container[-1], dict):
            return {k: v for k, v in container[-1].items() if not k.startswith("#")}
        return {}

    def body(self, container):
        if isinstance(container, list):
            if container and isinstance(container[-1], (dict, type(None))):
                return container[:-1]
            return container
        return [container]

    def divert_target(self, tgt):
        # Clean internal auto-generated continuation targets like 'start.8' or '.^.c-0'
        return tgt

    def collect_externals(self):
        ext = set()
        def walk(x):
            if isinstance(x, list):
                for i in x: walk(i)
            elif isinstance(x, dict):
                if "x()" in x: ext.add(x["x()"])
                for v in x.values(): walk(v)
        walk(self.root)
        return sorted(ext)

    def run(self):
        # root: [ <body...>, <named: knots> ]  but root body itself is content (often 'done')
        named = self.named_children(self.root)
        # global decl knot holds VAR declarations
        if "global decl" in named:
            self.parse_global_decl(named["global decl"])
        # Emit EXTERNAL function declarations
        externals = self.collect_externals()
        for e in externals:
            self.emit(f"EXTERNAL {e}()")
        if externals:
            self.emit("")
        # Emit VAR declarations
        for name, val in self.global_decl.items():
            self.emit(f"VAR {name} = {val}")
        if self.global_decl:
            self.emit("")
        # Emit each knot (skip global decl)
        for name, cont in named.items():
            if name == "global decl":
                continue
            self.emit(f"=== {name} ===")
            self.walk_container(cont, indent=0, knot=name)
            self.emit("")
        return "\n".join(self.lines)

    def parse_global_decl(self, cont):
        body = self.body(cont)
        # Find the ev .. /ev block; inside it, literals are pushed and {VAR=:name} pops them.
        try:
            start = body.index("ev")
            end = body.index("/ev")
        except ValueError:
            return
        toks = body[start+1:end]
        stack = []
        for t in toks:
            if isinstance(t, dict) and "VAR=" in t:
                name = t["VAR="]
                val = stack.pop() if stack else "false"
                self.global_decl[name] = val
            elif isinstance(t, bool):
                stack.append("true" if t else "false")
            elif isinstance(t, (int, float)):
                stack.append(str(t))
            elif isinstance(t, str) and t == "str":
                pass
            elif isinstance(t, str) and t.startswith("^"):
                stack.append('"' + t[1:] + '"')
            elif isinstance(t, str) and t == "/str":
                pass
            else:
                stack.append(str(t))

    def walk_container(self, cont, indent, knot, stitch=None):
        body = self.body(cont)
        named = self.named_children(cont)
        pad = "    " * indent
        i = 0
        cur = [""]  # mutable line buffer
        pending_choices = []  # (text, branch_name, sticky)

        def flush():
            if cur[0].strip() != "" or cur[0] != "":
                if cur[0] != "":
                    self.emit(pad + cur[0])
            cur[0] = ""

        while i < len(body):
            el = body[i]
            if isinstance(el, str):
                if el == "\n":
                    flush()
                    i += 1; continue
                if el == "done":
                    flush(); self.emit(pad + "-> DONE"); i += 1; continue
                if el == "end":
                    flush(); self.emit(pad + "-> END"); i += 1; continue
                if el.startswith("^"):
                    cur[0] += el[1:]
                    i += 1; continue
                if el == "#":
                    flush()
                    j = i + 1; buf = []
                    while j < len(body) and body[j] != "/#":
                        if isinstance(body[j], str) and body[j].startswith("^"):
                            buf.append(body[j][1:])
                        j += 1
                    self.emit(pad + "#" + "".join(buf))
                    i = j + 1; continue
                if el == "ev":
                    j = i + 1; toks = []
                    while j < len(body) and body[j] != "/ev":
                        toks.append(body[j]); j += 1
                    after = body[j+1] if j+1 < len(body) else None
                    # choice
                    if isinstance(after, dict) and "*" in after:
                        flush()
                        text, cond = self.split_choice(toks)
                        flg = after.get("flg", 0)
                        sticky = not (flg & 0x10)
                        pending_choices.append((text, after["*"], sticky, cond))
                        i = j + 2; continue
                    # conditional
                    if isinstance(after, list) and self.is_cond_block(after):
                        flush()
                        _, _, cond_stack = render_expr(toks)
                        cond = strip_paren(cond_stack[-1]) if cond_stack else "true"
                        self.emit(pad + "{ " + cond + ":")
                        self.emit_cond_branches(after, indent+1, knot)
                        self.emit(pad + "}")
                        i = j + 2
                        if i < len(body) and body[i] == "nop":
                            i += 1
                        continue
                    # assignment that lives AFTER /ev (value computed by ev block)
                    if isinstance(after, dict) and ("VAR=" in after or "temp=" in after):
                        outs, assigns, stack = render_expr(toks)
                        for o in outs:
                            cur[0] += "{" + o + "}"
                        name = after.get("VAR=", after.get("temp="))
                        val = stack[-1] if stack else "true"
                        flush()
                        self.emit(pad + f"~ {name} = {strip_paren(val)}")
                        i = j + 2; continue
                    # plain expr: interpolated outputs and/or batched assignments
                    outs, assigns, stack = render_expr(toks)
                    for o in outs:
                        cur[0] += "{" + o + "}"
                    if assigns:
                        flush()
                        for name, val, re_ in assigns:
                            self.emit(pad + f"~ {name} = {strip_paren(val)}")
                    i = j + 1; continue
            if isinstance(el, dict) and "->" in el and "c" not in el:
                tgt = el["->"]
                if self.is_internal_divert(tgt):
                    i += 1; continue
                flush()
                self.emit(pad + "-> " + self.clean_divert(tgt))
                i += 1; continue
            if isinstance(el, list):
                flush()
                self.walk_container(el, indent, knot)
                i += 1; continue
            i += 1
        flush()
        # Emit choices (text + their branch content)
        for text, target, sticky, cond in pending_choices:
            marker = "+" if sticky else "*"
            bn = target.split(".")[-1]
            condstr = (" {" + cond + "}") if cond else ""
            self.emit(pad + f"{marker}{condstr} [{text}]")
            if bn in named:
                self.walk_container(named[bn], indent+1, knot)
        # Emit leftover named sub-stitches (real stitches, not choice/gather/branch)
        for name, sub in named.items():
            if re.fullmatch(r"c-\d+", name) or re.fullmatch(r"g-\d+", name) or name == "b":
                continue
            self.emit(pad + f"= {name}")
            self.walk_container(sub, indent, knot, stitch=name)
        # Emit gather content if present (post-choice convergence)
        for name in ("g-0","g-1","g-2","g-3","g-4","g-5","g-6"):
            if name in named:
                gbody = self.body(named[name])
                if gbody and not (len(gbody)==1 and gbody[0]=="done"):
                    self.emit(pad + "-")
                    self.walk_container(named[name], indent, knot)

    def split_choice(self, toks):
        """Split choice tokens into (choice_text, condition_or_None).
        Conditional choices encode as: str ^text /str <condition-expr-tokens>."""
        text = ""
        cond_toks = []
        i = 0
        while i < len(toks):
            if toks[i] == "str":
                j = i + 1; buf = []
                while j < len(toks) and toks[j] != "/str":
                    if isinstance(toks[j], str) and toks[j].startswith("^"):
                        buf.append(toks[j][1:])
                    j += 1
                text = "".join(buf); i = j + 1; continue
            cond_toks.append(toks[i]); i += 1
        cond = None
        if cond_toks:
            _, _, stack = render_expr(cond_toks)
            if stack:
                cond = strip_paren(stack[-1])
        return text, cond

    def expr_string(self, toks):
        _, _, stack = render_expr(toks)
        s = stack[-1] if stack else ""
        if s.startswith('"') and s.endswith('"'):
            return s[1:-1]
        return s

    def is_cond_block(self, lst):
        if not isinstance(lst, list) or not lst:
            return False
        first = lst[0]
        return isinstance(first, dict) and first.get("c") is True and first.get("->","").endswith(".b")

    def emit_cond_branches(self, lst, indent, knot):
        # lst: [ {"->":".^.b","c":true}, {"b":[...]}, (optional) {"->":".^.c"}, {"c":[...]} ]
        for el in lst:
            if isinstance(el, dict) and "b" in el:
                self.walk_container(el["b"], indent, knot)
            if isinstance(el, dict) and "c" in el and isinstance(el["c"], list):
                self.emit(("    "*(indent-1)) + "- else:")
                self.walk_container(el["c"], indent, knot)

    def is_internal_divert(self, tgt):
        # auto-generated continuation diverts like 'start.8', '.^.b', '.^.23'
        if tgt.startswith("."):
            return True
        if re.search(r"\.\d+$", tgt):
            return True
        return False

    def clean_divert(self, tgt):
        if tgt == "DONE": return "DONE"
        if tgt == "END": return "END"
        return tgt

def main():
    src = sys.argv[1]
    d = json.load(open(src))
    dec = Decompiler(d["root"])
    out = dec.run()
    sys.stdout.write(out)

if __name__ == "__main__":
    main()
