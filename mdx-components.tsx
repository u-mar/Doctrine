
import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => <h1 style={{ fontSize: "2.25rem", fontWeight: "bold" }}>{children}</h1>,
    h2: ({ children }) => <h2 style={{ fontSize: "1.875rem", fontWeight: "bold" }}>{children}</h2>,
    h3: ({ children }) => <h3 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{children}</h3>,
    h4: ({ children }) => <h4 style={{ fontSize: "1.25rem", fontWeight: "bold" }}>{children}</h4>,
    h5: ({ children }) => <h5 style={{ fontSize: "1.125rem", fontWeight: "bold" }}>{children}</h5>,
    h6: ({ children }) => <h6 style={{ fontSize: "1rem", fontWeight: "bold" }}>{children}</h6>,
    p: (props) => <p style={{ marginBottom: "1rem" }} {...props} />,
    ...components,
  };
}
