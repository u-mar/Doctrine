import { useMDXComponents } from "@/mdx-components";
import { MDXRemote } from "next-mdx-remote/rsc";

import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { normalizeMarkdownSource } from "@/lib/markdown-normalize";

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
          remarkPlugins: [remarkGfm, remarkBreaks],
          rehypePlugins: [
            rehypeSlug,
            rehypeAutolinkHeadings,
          ],
        },
      }}
    />
  );
}