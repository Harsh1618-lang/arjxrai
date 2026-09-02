import { Fragment, type ReactNode } from "react";
import { cn, safeUrl } from "@/lib/utils";

/**
 * A tiny, dependency-free, XSS-safe Markdown renderer.
 * Renders React elements directly (never uses dangerouslySetInnerHTML).
 * Supports: headings (#, ##, ###), paragraphs, bullet & numbered lists,
 * blockquotes, fenced code blocks, horizontal rules, bold, italic, inline code and links.
 */

type Block =
  | { kind: "heading"; level: 1 | 2 | 3; text: string }
  | { kind: "paragraph"; lines: string[] }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "quote"; lines: string[] }
  | { kind: "code"; code: string }
  | { kind: "hr" };

export function parseBlocks(src: string): Block[] {
  const lines = (src || "").replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) buf.push(lines[i++]);
      i++;
      blocks.push({ kind: "code", code: buf.join("\n") });
      continue;
    }
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      blocks.push({ kind: "heading", level: h[1].length as 1 | 2 | 3, text: h[2] });
      i++;
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      blocks.push({ kind: "hr" });
      i++;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ""));
      blocks.push({ kind: "ul", items });
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ""));
      blocks.push({ kind: "ol", items });
      continue;
    }
    if (line.startsWith(">")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) buf.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push({ kind: "quote", lines: buf });
      continue;
    }
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i]) &&
      !lines[i].startsWith(">") &&
      !lines[i].startsWith("```")
    ) {
      buf.push(lines[i++]);
    }
    blocks.push({ kind: "paragraph", lines: buf });
  }
  return blocks;
}

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

export function renderInline(text: string): ReactNode {
  const parts = text.split(INLINE);
  return parts.map((part, idx) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={idx}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={idx}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={idx}>{part.slice(1, -1)}</code>;
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      const href = safeUrl(link[2]);
      const external = /^https?:\/\//i.test(href);
      return (
        <a key={idx} href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
          {link[1]}
        </a>
      );
    }
    return <Fragment key={idx}>{part}</Fragment>;
  });
}

function renderLines(lines: string[]): ReactNode {
  return lines.map((l, i) => (
    <Fragment key={i}>
      {renderInline(l)}
      {i < lines.length - 1 && <br />}
    </Fragment>
  ));
}

export function Markdown({ content, className }: { content: string; className?: string }) {
  const blocks = parseBlocks(content);
  return (
    <div className={cn("prose-srd", className)}>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "heading": {
            const Tag = `h${b.level}` as "h1" | "h2" | "h3";
            return <Tag key={i}>{renderInline(b.text)}</Tag>;
          }
          case "paragraph":
            return <p key={i}>{renderLines(b.lines)}</p>;
          case "ul":
            return (
              <ul key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it)}</li>
                ))}
              </ol>
            );
          case "quote":
            return <blockquote key={i}>{renderLines(b.lines)}</blockquote>;
          case "code":
            return (
              <pre key={i}>
                <code>{b.code}</code>
              </pre>
            );
          case "hr":
            return <hr key={i} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

/** Splits FAQ markdown ("## Question" followed by the answer) into items. */
export function parseFaq(content: string): { question: string; answer: string }[] {
  const items: { question: string; answer: string }[] = [];
  const lines = (content || "").replace(/\r\n?/g, "\n").split("\n");
  let current: { question: string; answer: string[] } | null = null;
  for (const line of lines) {
    const m = line.match(/^##\s+(.*)$/);
    if (m) {
      if (current) items.push({ question: current.question, answer: current.answer.join("\n").trim() });
      current = { question: m[1].trim(), answer: [] };
    } else if (current) {
      current.answer.push(line);
    }
  }
  if (current) items.push({ question: current.question, answer: current.answer.join("\n").trim() });
  return items;
}
