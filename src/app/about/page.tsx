"use client";

import { motion } from "framer-motion";
import { FC, ReactNode } from "react";

interface AnimatedSectionProps {
  children: ReactNode;
  delay?: number;
}

const AnimatedSection: FC<AnimatedSectionProps> = ({ children, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      className="mb-12"
    >
      {children}
    </motion.div>
  );
};

const AboutPage: FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/25 text-foreground font-sans">
      <div className="container mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-10 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            About The Doctrine
          </h1>

          <div className="space-y-14">
          <AnimatedSection delay={0.1}>
            <div>
              <h2 className="text-2xl font-semibold mb-4">What This Is</h2>
              <div className="space-y-4 text-muted-foreground text-base leading-relaxed">
                <p>
                  This is a personal collection of briefs, reflections, and ideas focused on Somali politics, governance,
                  society, and the future direction of the country. The writings here are not presented as journalism,
                  academic research, or absolute political truth. They are personal interpretations of events, written from
                  observation, concern, and interest in state-building and national development.
                </p>
                <p>
                  Some pieces focus on current political events as they unfold, while others explore long-term ideas
                  around institutions, leadership, elections, economic reform, and national stability. The purpose is not
                  simply to react to events, but to think critically about where the country is heading and what could be
                  done differently.
                </p>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div>
              <h2 className="text-2xl font-semibold mb-4">Why This Exists</h2>
              <div className="space-y-4 text-muted-foreground text-base leading-relaxed">
                <p>
                  Somalia continues to face challenges that go beyond individual leaders or temporary political moments.
                  Many of the issues affecting the country today are tied to institutions, governance, political culture,
                  and long-term national direction. This space exists as an effort to think through those issues openly and
                  honestly.
                </p>
                <p>
                  It is also a place to document ideas over time — ideas about governance, political reform, national unity,
                  economic stability, and the future of Somalia. Some of these thoughts may evolve, change, or even prove
                  wrong with time, but the goal is to contribute to wider discussion and encourage deeper thinking about
                  the country&apos;s future.
                </p>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.3}>
            <div>
              <h2 className="text-2xl font-semibold mb-4">What You’ll Find Here</h2>
              <ul className="space-y-3 text-muted-foreground list-disc list-inside text-base leading-relaxed marker:text-primary">
                <li>Political briefs on current events and leadership developments.</li>
                <li>Reflections on governance, institutions, and federal politics.</li>
                <li>Commentary on elections, political reforms, and state-building.</li>
                <li>Ideas focused on Somalia&apos;s long-term future and stability.</li>
                <li>Observations on societal trends, public sentiment, and national direction.</li>
                <li>
                  Personal interpretations of events as they unfold, not just summaries of headlines.
                </li>
              </ul>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.4}>
            <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-3">Disclaimer</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The views and opinions expressed on this site are the author&apos;s own and do not represent any
                organization. Content is for informational and reflective purposes only. Opinions are subject to change
                over time as new information becomes available.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.5}>
            <div className="text-center mt-8 rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-10">
              <p className="text-lg italic text-muted-foreground leading-relaxed">
                Do not wait for leaders; do it alone, person to person.
              </p>
            </div>
          </AnimatedSection>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
