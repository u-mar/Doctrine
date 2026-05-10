Hello, I'm working on a Next.js application and I'm running into some issues with `next-mdx-remote` while trying to implement client-side pagination for my MDX content.

**My Goal:**

I want to fetch MDX content from my database, split it into pages using a `---` separator, and allow users to navigate through these pages on the client side.

**My Setup:**

1.  **Pages (`/briefs/[slug]/page.tsx`, `/ideas/[slug]/page.tsx`):** These are Client Components (they use the `"use client";` directive). They fetch content from an API route when the component mounts.
2.  **API Routes (`/api/.../[slug]/route.ts`):** These routes fetch the MDX string from the database, split it into an array of strings based on the `---` separator, and then serialize each string in the array using `next-mdx-remote/serialize`. The API response for the content looks something like this: `content: [serializedPage1, serializedPage2, ...]`.
3.  **Renderer Component (`/components/MDXRenderer.tsx`):** This is a simple component that takes the serialized source and renders it.

    ```tsx
    // src/components/MDXRenderer.tsx
    import { MDXRemote } from "next-mdx-remote";

    export default function MDXRenderer({ source }: { source: any }) {
      return <MDXRemote {...source} />;
    }
    ```

4.  **Page Component Logic:** The page component fetches the data, gets the array of serialized pages, and passes the current page's content to `MDXRenderer`.

    ```tsx
    // src/app/briefs/[slug]/page.tsx (simplified)
    "use client";
    // ... imports
    
    export default function JournalEntryPage() {
      // ... state for entry, activePage, etc.
    
      useEffect(() => {
        // fetch data from API
      }, [slug]);
    
      const pages = useMemo(() => (Array.isArray(entry?.content) ? entry.content : []), [entry?.content]);
      const currentPageContent = pages[activePage];
    
      // ... render logic
      return (
        // ... JSX
        <MDXRenderer source={currentPageContent} />
        // ... JSX for pagination buttons
      );
    }
    ```

**The Problem:**

I'm encountering a runtime error: `Cannot read properties of undefined (reading 'default')` which points to the `<MDXRemote ... />` line in my `MDXRenderer` component.

This seems to indicate that the `source` prop I'm passing to `MDXRenderer` is not in the format that `MDXRemote` expects, even though it's the direct output from the `serialize` function in my API.

**Question:**

What is the correct way to handle an array of serialized MDX content on the client side? Is my approach of serializing on the server and passing the array to the client flawed? How can I fix the `Cannot read properties of undefined (reading 'default')` error?
