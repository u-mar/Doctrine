import HomePageClient from "./HomePageClient";
import { getLatestHomeEntries } from "@/lib/home-latest";
import { getHomeNoticeBubble } from "@/lib/home-notice-bubble";

/** Always read Mongo on each request so “Latest Entries” matches the DB (avoids stale build-time data on Vercel). */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [latestEntries, homeNoticeBubble] = await Promise.all([getLatestHomeEntries(3), getHomeNoticeBubble()]);
  return <HomePageClient latestEntries={latestEntries} homeNoticeBubble={homeNoticeBubble} />;
}
