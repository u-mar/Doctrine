import type { MDXComponents } from "mdx/types";

export function useMDXComponents(
  components: MDXComponents
): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1
        className="mb-6 mt-8 text-4xl font-bold tracking-tight"
      >
        {children}
      </h1>
    ),

    h2: ({ children }) => (
      <h2
        className="mb-4 mt-8 text-3xl font-semibold tracking-tight"
      >
        {children}
      </h2>
    ),

    h3: ({ children }) => (
      <h3
        className="mb-3 mt-6 text-2xl font-semibold"
      >
        {children}
      </h3>
    ),

    p: (props) => (
      <p
        className="mb-4 leading-7 text-muted-foreground"
        {...props}
      />
    ),

    ul: (props) => (
      <ul
        className="mb-4 ml-6 list-disc space-y-2"
        {...props}
      />
    ),

    ol: (props) => (
      <ol
        className="mb-4 ml-6 list-decimal space-y-2"
        {...props}
      />
    ),

    li: (props) => (
      <li
        className="leading-7"
        {...props}
      />
    ),

    blockquote: (props) => (
      <blockquote
        className="my-6 border-l-4 border-border pl-4 italic text-muted-foreground"
        {...props}
      />
    ),

    strong: (props) => (
      <strong className="font-semibold text-foreground" {...props} />
    ),

    em: (props) => <em className="italic text-foreground/95" {...props} />,

    code: (props) => (
      <code
        className="rounded bg-muted px-1.5 py-0.5 text-sm"
        {...props}
      />
    ),

    pre: (props) => (
      <pre
        className="mb-6 overflow-x-auto rounded-xl bg-muted p-4"
        {...props}
      />
    ),

    ...components,
  };
}
