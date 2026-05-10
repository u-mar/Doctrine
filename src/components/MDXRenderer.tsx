import { useMDXComponents } from "@/mdx-components";
import { MDXRemote } from "next-mdx-remote/rsc";

import remarkGfm from "remark-gfm";

import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

/**
 * CommonMark/GFM reject strong/emphasis if there is whitespace right after the opener
 * (e.g. `** Counterfeit` renders as literal asterisks). Normalize typical authoring mistakes.
 *
 * Also fixes `**Label:**Word` (no space after closing **) which often renders as raw asterisks,
 * and turns block-leading `**Label:** …` paragraphs into bullet lines for point-form lists.
 */
function normalizeMarkdownSource(raw: string): string {
  let s = raw.replace(/\*\*\s+/g, "**");
  s = s.replace(/__\s+/g, "__");
  // Glue: `:**` immediately followed by a word — insert space so ** closes reliably for parsers
  s = s.replace(/(\*\*[^*\n]+?:\*\*)([A-Za-z0-9(])/g, "$1 $2");
  // Point form: paragraph (or document) starts with **Title:** → markdown bullet
  s = s.replace(/(^|\n\n)(\*\*[^*\n]+?:\*\*[^\n]*)/gm, (full, sep: string, body: string) => {
    if (/^\s*-\s/.test(body)) {
      return full;
    }
    return `${sep}- ${body}`;
  });
  // Single newline between drivers: `...\n**Next:**` → list continuation
  s = s.replace(/\n(?!\n)(\*\*[^*\n]+?:\*\*[^\n]*)/g, (full, body: string) => {
    if (/^\s*-\s/.test(body)) {
      return full;
    }
    return `\n- ${body}`;
  });
  return s;
}

export default function MDXRenderer({
  source,
}: {
  source: string;
}) {
  const components = useMDXComponents({});
  const normalizedSource = normalizeMarkdownSource(source);

  return (
    <MDXRemote
      source={normalizedSource}
      components={components}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [
            rehypeSlug,
            rehypeAutolinkHeadings,
          ],
        },
      }}
    />
  );
}