"use client";

import { motion } from "framer-motion";
import { FC, ReactNode } from "react";

interface AnimatedSectionProps {
  children: ReactNode;
  delay?: number;
}

const AnimatedSection: FC<AnimatedSectionProps> = ({
  children,
  delay = 0,
}) => {
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
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <AnimatedSection>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              About THE DOCTRINE
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-muted-foreground">
              A personal set of briefs on politics, leadership, and society.
            </p>
          </div>
        </AnimatedSection>

        <div className="max-w-2xl mx-auto space-y-16 mt-20">
          <AnimatedSection delay={0.2}>
            <div>
              <h2 className="text-2xl font-semibold mb-4">What This Is</h2>
              <div className="space-y-4 text-muted-foreground text-base leading-relaxed">
                <p>
                  This is a personal collection of briefs - reflections on politics, societal shifts, and leadership as they unfold. It is not journalism, expert analysis, or academic research.
                </p>
                <p>
                  The thoughts here are personal interpretations of public events. They are written in real time and are subject to evolution. This is a space for thinking out loud, not for claiming absolute truths.
                </p>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.4}>
            <div>
              <h2 className="text-2xl font-semibold mb-4">Why This Exists</h2>
              <div className="space-y-4 text-muted-foreground text-base leading-relaxed">
                <p>
                  Beyond personal reflection, this is also an effort to think about how local realities can improve, and how broader challenges affecting the Ummah can be better understood and addressed over time.
                </p>
                <p>
                  The goal is not only to observe, but to develop ideas that may contribute, directly or indirectly, to better governance, stronger societies, and a more thoughtful future.
                </p>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.6}>
            <div>
              <h2 className="text-2xl font-semibold mb-4">What You’ll Find Here</h2>
              <ul className="space-y-3 text-muted-foreground list-disc list-inside text-base">
                <li>Personal reflections on political events.</li>
                <li>Commentary on leadership and governance decisions.</li>
                <li>Observations on societal trends and public discourse.</li>
                <li>Interpretations of current affairs, not just reports.</li>
              </ul>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.8}>
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-3">Disclaimer</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The views and opinions expressed on this site are the author's own and do not represent any organization. Content is for informational and reflective purposes only. Opinions are subject to change over time as new information becomes available.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={1.0}>
            <div className="text-center mt-12">
              <p className="text-lg italic text-muted-foreground">
                Do not wait for leaders; do it alone, person to person.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
