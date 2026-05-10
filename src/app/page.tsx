import HomePageClient from "./HomePageClient";
import { getLatestHomeEntries } from "@/lib/home-latest";
import { getHomeNoticeBubble } from "@/lib/home-notice-bubble";

export default async function HomePage() {
  const [latestEntries, homeNoticeBubble] = await Promise.all([getLatestHomeEntries(3), getHomeNoticeBubble()]);
  return <HomePageClient latestEntries={latestEntries} homeNoticeBubble={homeNoticeBubble} />;
}
