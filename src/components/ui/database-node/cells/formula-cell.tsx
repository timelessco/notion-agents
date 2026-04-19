import { useMemo } from "react";

import type { ColumnConfig, DatabaseColumn, DatabaseRow } from "../types";

const VAR = (name: string) =>
  name
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/^([0-9])/, "_$1") || "_";

type Token =
  | { kind: "num"; value: number }
  | { kind: "str"; value: string }
  | { kind: "id"; value: string }
  | { kind: "op"; value: string }
  | { kind: "lparen" | "rparen" | "comma" | "eof" };

const tokenize = (src: string): Token[] => {
  const tokens: Token[] = [];
  let i = 0;
  const multi = ["==", "!=", "<=", ">=", "&&", "||"];
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      tokens.push({ kind: "num", value: parseFloat(src.slice(i, j)) });
      i = j;
      continue;
    }
    if (c === '"' || c === "'") {
      const quote = c;
      let j = i + 1;
      let out = "";
      while (j < src.length && src[j] !== quote) {
        if (src[j] === "\\" && j + 1 < src.length) {
          out += src[j + 1];
          j += 2;
        } else {
          out += src[j];
          j++;
        }
      }
      tokens.push({ kind: "str", value: out });
      i = j + 1;
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let j = i;
      while (j < src.length && /[a-zA-Z0-9_]/.test(src[j])) j++;
      tokens.push({ kind: "id", value: src.slice(i, j) });
      i = j;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (multi.includes(two)) {
      tokens.push({ kind: "op", value: two });
      i += 2;
      continue;
    }
    if (c === "(") {
      tokens.push({ kind: "lparen" });
      i++;
      continue;
    }
    if (c === ")") {
      tokens.push({ kind: "rparen" });
      i++;
      continue;
    }
    if (c === ",") {
      tokens.push({ kind: "comma" });
      i++;
      continue;
    }
    if ("+-*/%<>!?:".includes(c)) {
      tokens.push({ kind: "op", value: c });
      i++;
      continue;
    }
    throw new Error(`Unexpected char: ${c}`);
  }
  tokens.push({ kind: "eof" });
  return tokens;
};

type Node =
  | { type: "num"; value: number }
  | { type: "str"; value: string }
  | { type: "id"; name: string }
  | { type: "unary"; op: string; arg: Node }
  | { type: "bin"; op: string; left: Node; right: Node }
  | { type: "ternary"; cond: Node; then: Node; else: Node }
  | { type: "call"; name: string; args: Node[] };

class Parser {
  constructor(
    private t: Token[],
    private p: number = 0,
  ) {}
  peek(): Token {
    return this.t[this.p];
  }
  eat(): Token {
    return this.t[this.p++];
  }
  expect(kind: Token["kind"]): Token {
    const tok = this.eat();
    if (tok.kind !== kind) throw new Error(`Expected ${kind}, got ${tok.kind}`);
    return tok;
  }
  parseExpr(): Node {
    return this.parseTernary();
  }
  parseTernary(): Node {
    const cond = this.parseOr();
    const t = this.peek();
    if (t.kind === "op" && t.value === "?") {
      this.eat();
      const then = this.parseExpr();
      const colon = this.eat();
      if (colon.kind !== "op" || colon.value !== ":")
        throw new Error("Expected : in ternary");
      const el = this.parseExpr();
      return { type: "ternary", cond, then, else: el };
    }
    return cond;
  }
  binary(next: () => Node, ops: string[]): Node {
    let left = next();
    while (true) {
      const t = this.peek();
      if (t.kind === "op" && ops.includes(t.value)) {
        this.eat();
        const right = next();
        left = { type: "bin", op: t.value, left, right };
      } else break;
    }
    return left;
  }
  parseOr(): Node {
    return this.binary(() => this.parseAnd(), ["||"]);
  }
  parseAnd(): Node {
    return this.binary(() => this.parseEq(), ["&&"]);
  }
  parseEq(): Node {
    return this.binary(() => this.parseCmp(), ["==", "!="]);
  }
  parseCmp(): Node {
    return this.binary(() => this.parseAdd(), ["<", ">", "<=", ">="]);
  }
  parseAdd(): Node {
    return this.binary(() => this.parseMul(), ["+", "-"]);
  }
  parseMul(): Node {
    return this.binary(() => this.parseUnary(), ["*", "/", "%"]);
  }
  parseUnary(): Node {
    const t = this.peek();
    if (t.kind === "op" && (t.value === "!" || t.value === "-")) {
      this.eat();
      return { type: "unary", op: t.value, arg: this.parseUnary() };
    }
    return this.parsePrimary();
  }
  parsePrimary(): Node {
    const t = this.eat();
    if (t.kind === "num") return { type: "num", value: t.value };
    if (t.kind === "str") return { type: "str", value: t.value };
    if (t.kind === "lparen") {
      const e = this.parseExpr();
      this.expect("rparen");
      return e;
    }
    if (t.kind === "id") {
      if (this.peek().kind === "lparen") {
        this.eat();
        const args: Node[] = [];
        if (this.peek().kind !== "rparen") {
          args.push(this.parseExpr());
          while (this.peek().kind === "comma") {
            this.eat();
            args.push(this.parseExpr());
          }
        }
        this.expect("rparen");
        return { type: "call", name: t.value, args };
      }
      return { type: "id", name: t.value };
    }
    throw new Error(`Unexpected token ${t.kind}`);
  }
}

type Scope = Record<string, unknown>;

const FUNCTIONS: Record<string, (...a: unknown[]) => unknown> = {
  if: (c, a, b) => (c ? a : b),
  sum: (...xs) => xs.reduce<number>((s, x) => s + Number(x ?? 0), 0),
  min: (...xs) => Math.min(...(xs.map(Number) as number[])),
  max: (...xs) => Math.max(...(xs.map(Number) as number[])),
  round: (x) => Math.round(Number(x)),
  floor: (x) => Math.floor(Number(x)),
  ceil: (x) => Math.ceil(Number(x)),
  abs: (x) => Math.abs(Number(x)),
  concat: (...xs) => xs.map((x) => String(x ?? "")).join(""),
  length: (x) => (typeof x === "string" ? x.length : Array.isArray(x) ? x.length : 0),
  now: () => Date.now(),
  empty: (x) => x == null || x === "" || (Array.isArray(x) && x.length === 0),
};

const evalNode = (node: Node, scope: Scope): unknown => {
  switch (node.type) {
    case "num":
      return node.value;
    case "str":
      return node.value;
    case "id":
      return scope[node.name];
    case "unary": {
      const v = evalNode(node.arg, scope);
      if (node.op === "-") return -Number(v);
      if (node.op === "!") return !v;
      return null;
    }
    case "bin": {
      const l = evalNode(node.left, scope);
      const r = evalNode(node.right, scope);
      switch (node.op) {
        case "+":
          return typeof l === "string" || typeof r === "string"
            ? String(l ?? "") + String(r ?? "")
            : Number(l ?? 0) + Number(r ?? 0);
        case "-":
          return Number(l ?? 0) - Number(r ?? 0);
        case "*":
          return Number(l ?? 0) * Number(r ?? 0);
        case "/":
          return Number(l ?? 0) / Number(r ?? 0);
        case "%":
          return Number(l ?? 0) % Number(r ?? 0);
        case "==":
          return l === r;
        case "!=":
          return l !== r;
        case "<":
          return Number(l) < Number(r);
        case ">":
          return Number(l) > Number(r);
        case "<=":
          return Number(l) <= Number(r);
        case ">=":
          return Number(l) >= Number(r);
        case "&&":
          return l && r;
        case "||":
          return l || r;
      }
      return null;
    }
    case "ternary":
      return evalNode(node.cond, scope) ? evalNode(node.then, scope) : evalNode(node.else, scope);
    case "call": {
      const fn = FUNCTIONS[node.name];
      if (!fn) throw new Error(`Unknown function: ${node.name}`);
      return fn(...node.args.map((a) => evalNode(a, scope)));
    }
  }
};

const safeEval = (expression: string, scope: Scope): unknown => {
  if (!expression.trim()) return "";
  try {
    const tokens = tokenize(expression);
    const ast = new Parser(tokens).parseExpr();
    return evalNode(ast, scope);
  } catch {
    return "#ERR";
  }
};

const buildScope = (row: DatabaseRow, columns: DatabaseColumn[]): Scope => {
  const out: Scope = {};
  for (const col of columns) {
    if (col.type === "formula" || col.type === "rollup") continue;
    const v = row.cells[col.id];
    if (col.type === "select") {
      const opt = (col.options ?? []).find((o) => o.id === v);
      out[VAR(col.name)] = opt ? opt.label : "";
    } else if (col.type === "multi-select" || col.type === "relation") {
      out[VAR(col.name)] = Array.isArray(v) ? v : [];
    } else if (
      col.type === "number" ||
      col.type === "currency" ||
      col.type === "rating" ||
      col.type === "linear-scale"
    ) {
      out[VAR(col.name)] = typeof v === "number" ? v : 0;
    } else if (col.type === "checkbox") {
      out[VAR(col.name)] = Boolean(v);
    } else if (col.type === "created-time" || col.type === "last-edited-time") {
      const ts = col.type === "created-time" ? row.createdAt : row.updatedAt;
      out[VAR(col.name)] = ts ?? 0;
    } else {
      out[VAR(col.name)] = v ?? "";
    }
  }
  return out;
};

export const FormulaCell = ({
  row,
  columns,
  config,
}: {
  row: DatabaseRow;
  columns: DatabaseColumn[];
  config?: ColumnConfig;
}) => {
  const expression = config?.kind === "formula" ? config.expression : "";
  const value = useMemo(
    () => (expression ? safeEval(expression, buildScope(row, columns)) : ""),
    [expression, row, columns],
  );

  const display =
    value === "" || value == null
      ? "Empty"
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);

  return (
    <span
      className="block w-full truncate text-left text-[13px] text-muted-foreground"
      title={String(display)}
    >
      {display}
    </span>
  );
};
