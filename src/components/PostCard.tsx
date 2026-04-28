
import Link from "next/link";

interface PostCardProps {
  title: string;
  summary: string;
  slug: string;
  readingTime: string;
  tags: string[];
}

export default function PostCard({ title, summary, slug, readingTime, tags }: PostCardProps) {
  return (
    <Link href={`/ideas/${slug}`}>
      <a className="block p-6 border rounded-lg hover:border-gold-500">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-muted-foreground mb-4">{summary}</p>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{readingTime}</span>
          <div className="flex space-x-2">
            {tags.map((tag) => (
              <span key={tag} className="px-2 py-1 bg-secondary rounded-md">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </a>
    </Link>
  );
}
