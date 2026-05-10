import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t py-8 sm:mt-24">
      <div className="container mx-auto max-w-2xl px-4 text-center text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
        <p>
          &ldquo;Allah does not change the condition of a people until they change what is within themselves.&rdquo; —
          Qur&apos;an 13:11
        </p>
        <p className="mt-4">
          <Link href="/contact" className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline">
            Contact
          </Link>
        </p>
      </div>
    </footer>
  );
}
