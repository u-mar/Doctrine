
import { MDXRemote } from "next-mdx-remote/rsc";

export default function MDXRenderer({ source }: { source: string }) {
  return <MDXRemote source={source} />;
}
