import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { normalizeMarkdownSource } from "@/lib/markdown-normalize";
import { useMDXComponents } from "@/mdx-components";

/**
 * Article bodies are plain Markdown from the admin textarea. `react-markdown` + GFM
 * renders lists and line breaks reliably; MDX compilation was fragile for this use case.
 */
export default function MDXRenderer({
  source,
}: {
  source: string;
}) {
  const components = useMDXComponents({});
  const normalizedSource = normalizeMarkdownSource(source);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      rehypePlugins={[rehypeSlug, rehypeAutolinkHeadings]}
      components={components as Components}
    >
      {normalizedSource}
    </ReactMarkdown>
  );
}
