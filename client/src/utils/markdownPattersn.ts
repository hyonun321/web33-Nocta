import { MarkdownElement, MarkdownPattern } from "../types/markdown";

const MARKDOWN_PATTERNS: Record<string, MarkdownPattern> = {
  h1: {
    regex: /^#$/,
    length: 1,
    createElement: () => ({ type: "h1" }),
  },
  h2: {
    regex: /^##$/,
    length: 2,
    createElement: () => ({ type: "h2" }),
  },
  h3: {
    regex: /^###$/,
    length: 3,
    createElement: () => ({ type: "h3" }),
  },
  ul: {
    regex: /^-$/,
    length: 1,
    createElement: () => ({ type: "ul" }),
  },
  ol: {
    regex: /^\d\.$/,
    length: 2,
    createElement: () => ({ type: "ol" }),
  },
  blockquote: {
    regex: /^>$/,
    length: 1,
    createElement: () => ({ type: "blockquote" }),
  },
  checkbox: {
    regex: /^>$/,
    length: 1,
    createElement: () => ({ type: "input" }),
  },
};

export const checkMarkdownPattern = (text: string): MarkdownElement | null => {
  if (!text) return null;

  for (const pattern of Object.values(MARKDOWN_PATTERNS)) {
    if (pattern.regex.test(text)) {
      return pattern.createElement();
    }
  }
  return null;
};
