"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------- Tokenizer inline ---------------- */

function InlineText({ text }: { text: string }) {
  const tokens = text.split(
    /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]\n]+\]\([^)\n]+\))/g
  );
  return (
    <>
      {tokens.map((token, index) => {
        if (token.startsWith("**") && token.endsWith("**") && token.length > 4) {
          return (
            <strong key={index}>
              <InlineText text={token.slice(2, -2)} />
            </strong>
          );
        }
        if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
          return (
            <em key={index}>
              <InlineText text={token.slice(1, -1)} />
            </em>
          );
        }
        if (token.startsWith("`") && token.endsWith("`") && token.length > 1) {
          return (
            <code
              key={index}
              className="bg-muted text-primary rounded px-1 py-0.5 font-mono text-[0.85em]"
            >
              {token.slice(1, -1)}
            </code>
          );
        }
        const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          return (
            <a
              key={index}
              href={link[2]}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {link[1]}
            </a>
          );
        }
        return <React.Fragment key={index}>{token}</React.Fragment>;
      })}
    </>
  );
}

/* ---------------- Blok kode ---------------- */

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // abaikan
    }
  }

  return (
    <div className="bg-muted/60 group relative my-1.5 overflow-hidden rounded-lg border">
      <div className="bg-muted/80 flex items-center justify-between border-b px-3 py-1">
        <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
          Kode
        </span>
        <button
          type="button"
          onClick={() => void copyCode()}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[10px]"
          aria-label="Salin kode"
        >
          {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
          {copied ? "Tersalin" : "Salin"}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 py-2.5 font-mono text-xs leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

/* ---------------- Parser blok level ---------------- */

interface Block {
  type: "heading" | "code" | "list" | "paragraph";
  level?: number;
  items?: string[];
  text?: string;
}

function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];

  const pushParagraph = (buf: string[]) => {
    if (buf.length === 0) return;
    blocks.push({ type: "paragraph", text: buf.join("\n") });
    buf.length = 0;
  };

  const buf: string[] = [];
  let inCode = false;
  let codeBuf: string[] = [];
  let listBuf: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = () => {
    if (listBuf.length === 0) return;
    blocks.push({ type: "list", items: [...listBuf] });
    listBuf = [];
    listType = null;
  };

  for (const line of lines) {
    if (inCode) {
      if (line.trim().startsWith("```")) {
        blocks.push({ type: "code", text: codeBuf.join("\n") });
        codeBuf = [];
        inCode = false;
      } else {
        codeBuf.push(line);
      }
      continue;
    }

    if (line.trim().startsWith("```")) {
      pushParagraph(buf);
      flushList();
      inCode = true;
      codeBuf = [];
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      pushParagraph(buf);
      flushList();
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      continue;
    }

    const ulItem = line.match(/^\s*[-*]\s+(.*)$/);
    const olItem = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ulItem || olItem) {
      pushParagraph(buf);
      const type = olItem ? "ol" : "ul";
      if (listType && listType !== type) {
        flushList();
      }
      listType = type;
      listBuf.push((olItem ? olItem[1] : ulItem![1]).trim());
      continue;
    }

    if (listBuf.length > 0) {
      flushList();
    }

    if (line.trim() === "") {
      pushParagraph(buf);
      continue;
    }

    buf.push(line);
  }

  if (inCode && codeBuf.length > 0) {
    blocks.push({ type: "code", text: codeBuf.join("\n") });
  }
  pushParagraph(buf);
  flushList();

  return blocks;
}

/* ---------------- Komponen utama ---------------- */

export function Markdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const blocks = React.useMemo(() => parseBlocks(content), [content]);

  return (
    <div className={cn("space-y-1.5", className)}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            if (block.level === 1) {
              return (
                <p key={index} className="text-base font-bold leading-snug">
                  <InlineText text={block.text ?? ""} />
                </p>
              );
            }
            if (block.level === 2) {
              return (
                <p key={index} className="text-[15px] font-bold leading-snug">
                  <InlineText text={block.text ?? ""} />
                </p>
              );
            }
            return (
              <p key={index} className="text-sm font-semibold leading-snug">
                <InlineText text={block.text ?? ""} />
              </p>
            );
          case "code":
            return <CodeBlock key={index} code={block.text ?? ""} />;
          case "list":
            return (
              <ul key={index} className="space-y-0.5 pl-1">
                {(block.items ?? []).map((item, itemIndex) => (
                  <li key={itemIndex} className="flex gap-1.5 leading-snug">
                    <span className="select-none">{block.level === 1 ? "•" : "•"}</span>
                    <span className="min-w-0 flex-1">
                      <InlineText text={item} />
                    </span>
                  </li>
                ))}
              </ul>
            );
          case "paragraph":
          default:
            return (
              <p key={index} className="leading-snug">
                {(block.text ?? "").split("\n").map((line, lineIndex, arr) => (
                  <React.Fragment key={lineIndex}>
                    <InlineText text={line} />
                    {lineIndex < arr.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
