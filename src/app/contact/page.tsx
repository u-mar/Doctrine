import type { Metadata } from "next";
import ContactPageClient from "./ContactPageClient";

export const metadata: Metadata = {
  title: "Contact — THE DOCTRINE",
  description: "Share opinions or a note.",
};

export default function ContactPage() {
  return <ContactPageClient />;
}
