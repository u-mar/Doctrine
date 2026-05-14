import type { MDXComponents } from "mdx/types";

export function useMDXComponents(
  components: MDXComponents
): MDXComponents {
  return {
    h1: ({ node: _n, children, ...props }) => (
      <h1 className="mb-6 mt-8 text-4xl font-bold tracking-tight" {...props}>
        {children}
      </h1>
    ),

    h2: ({ node: _n, children, ...props }) => (
      <h2 className="mb-4 mt-8 text-3xl font-semibold tracking-tight" {...props}>
        {children}
      </h2>
    ),

    h3: ({ node: _n, children, ...props }) => (
      <h3 className="mb-3 mt-6 text-2xl font-semibold" {...props}>
        {children}
      </h3>
    ),

    p: ({ node: _n, ...props }) => (
      <p className="mb-4 leading-7 text-muted-foreground" {...props} />
    ),

    ul: ({ node: _n, ...props }) => (
      <ul className="mb-4 ml-6 list-disc space-y-2" {...props} />
    ),

    ol: ({ node: _n, ...props }) => (
      <ol className="mb-4 ml-6 list-decimal space-y-2" {...props} />
    ),

    li: ({ node: _n, ...props }) => (
      <li className="leading-7" {...props} />
    ),

    blockquote: ({ node: _n, ...props }) => (
      <blockquote
        className="my-6 border-l-4 border-border pl-4 italic text-muted-foreground"
        {...props}
      />
    ),

    strong: ({ node: _n, ...props }) => (
      <strong className="font-semibold text-foreground" {...props} />
    ),

    em: ({ node: _n, ...props }) => <em className="italic text-foreground/95" {...props} />,

    code: ({ node: _n, inline: _inline, ...props }) => (
      <code className="rounded bg-muted px-1.5 py-0.5 text-sm" {...props} />
    ),

    pre: ({ node: _n, ...props }) => (
      <pre className="mb-6 overflow-x-auto rounded-xl bg-muted p-4" {...props} />
    ),

    ...components,
  };
}
