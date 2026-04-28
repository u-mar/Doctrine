export interface JournalEntry {
  id: number;
  slug: string;
  title: string;
  date: string;
  topic: string;
  excerpt: string;
  content: string;
}

export const journalEntries: JournalEntry[] = [
  {
    id: 5,
    slug: "strait-of-hormuz-strategic-pressure-point",
    title: "Brief: Strait of Hormuz - Strategic Pressure Point",
    date: "April 27, 2026",
    topic: "Geopolitics",
    excerpt:
      "An overview of why the Strait of Hormuz remains a key pressure point for global energy and regional security.",
    content:
      "Situation Summary\n\nThe Strait of Hormuz is one of the most strategically important maritime chokepoints in the world, connecting the Persian Gulf to the Arabian Sea and enabling a significant share of global oil and liquefied natural gas shipments. Any disruption in this narrow waterway has immediate global economic implications, particularly for energy prices and supply chains.\n\nIn periods of heightened regional tension, especially involving Iran, the United States, and Gulf states, the Strait of Hormuz often becomes a focal point of strategic signaling, military posturing, and diplomatic pressure. While full closure has never been sustained, the risk of disruption consistently shapes international calculations.\n\nWhy It Matters\n\nGlobal Energy Flow:\nA large portion of the world's seaborne oil passes through this route, making it essential to global energy stability.\n\nGeopolitical Leverage:\nControl or disruption of the strait provides significant strategic influence, especially for regional actors involved in broader security disputes.\n\nEconomic Sensitivity:\nEven minor incidents, such as vessel seizures, warnings, or military drills, can trigger fluctuations in global oil prices and insurance costs.\n\nMilitary Presence:\nThe area is heavily monitored by international naval forces to ensure open navigation and deter escalation.\n\nRecent Dynamics\n\nRecent regional tensions have increased attention on the Strait of Hormuz as a potential pressure point in broader geopolitical disputes. This includes heightened naval activity, surveillance operations, and periodic confrontations involving commercial and military vessels in the surrounding waters.\n\nAlthough shipping continues normally, risk perception remains elevated, with markets and governments closely monitoring developments for signs of disruption or escalation.\n\nBroader Context\n\nThe Strait of Hormuz has long been a symbolic and strategic leverage point in Middle Eastern geopolitics. Its importance means that even without direct conflict, it functions as a constant background factor in negotiations, sanctions regimes, and military planning.\n\nRather than being a site of continuous conflict, it is better understood as a strategic pressure zone where signaling often matters as much as action.\n\nAnalytical Note\n\nThe stability of the Strait of Hormuz depends less on physical control and more on political restraint among regional and global powers. Its role in global energy security ensures that escalation risks are closely managed, but never fully eliminated.\n\nAs a result, it remains one of the most sensitive geopolitical flashpoints in the modern international system.",
  },
  {
    id: 4,
    slug: "us-iran-escalation-overview",
    title: "Brief: U.S.-Iran Escalation (Overview)",
    date: "April 27, 2026",
    topic: "Geopolitics",
    excerpt:
      "A concise overview of the latest U.S.-Iran escalation, its drivers, and regional risk pathways.",
    content:
      "Situation Summary\n\nRelations between the United States and Iran have remained highly strained for decades, shaped by historical distrust, regional power struggles, and disputes over Iran's nuclear program and military influence in the Middle East. While the two countries have not traditionally engaged in a full-scale conventional war, tensions have repeatedly escalated through sanctions, proxy conflicts, targeted strikes, cyber operations, and diplomatic breakdowns.\n\nIn recent developments, the confrontation has intensified into direct military action involving coordinated strikes on Iranian-linked infrastructure, alongside Iranian responses targeting regional assets and strategic maritime routes. This escalation has raised concerns about the possibility of a wider regional conflict involving multiple state and non-state actors.\n\nKey Drivers of Escalation\n\nNuclear Program Dispute:\nThe United States and its allies have long accused Iran of pursuing capabilities that could lead to nuclear weapons development. Iran maintains that its nuclear program is strictly for civilian energy and scientific purposes, but the lack of mutual trust has prevented a lasting agreement.\n\nRegional Influence and Alliances:\nIran's support for allied groups across Lebanon, Iraq, Syria, and Yemen has contributed to long-standing tensions with the U.S. and its regional partners, who view this influence as destabilizing.\n\nStrategic Geography and Energy Routes:\nControl and influence over key maritime chokepoints, particularly the Strait of Hormuz, remain central to global energy security. Any disruption in this region has immediate international economic consequences.\n\nSanctions and Economic Pressure:\nExtensive sanctions imposed by the U.S. and allied states have significantly impacted Iran's economy, shaping domestic conditions and influencing its foreign policy posture. In response, Iran has increasingly leaned on regional alliances and asymmetric strategies.\n\nRecent Developments\n\nRecent escalation has included direct military strikes and counter-strikes involving Iranian-linked facilities and regional positions. These actions have increased instability in surrounding areas and raised concerns over energy supply disruption, insurance costs for shipping routes, and broader regional spillover.\n\nDiplomatic efforts have continued intermittently through indirect channels, but negotiations remain fragile due to deep disagreements over security guarantees, sanctions relief, and regional influence.\n\nBroader Context\n\nThe U.S.-Iran relationship has evolved from earlier periods of cooperation into a long-term strategic rivalry shaped by the 1979 Iranian Revolution, shifting alliances, and competing visions of regional order. Over time, this has produced repeated cycles of confrontation, limited engagement, and breakdowns in diplomatic progress.\n\nRather than a linear escalation toward war, the relationship is better understood as a fluctuating pattern of pressure, retaliation, and temporary de-escalation.\n\nAnalytical Note\n\nThis situation reflects a broader pattern in international relations where unresolved historical grievances, security dilemmas, and regional competition create recurring cycles of escalation. Without sustained diplomatic breakthroughs, such dynamics tend to stabilize in tension rather than resolution, with periodic spikes in conflict risk.",
  },
  {
    id: 1,
    slug: "summit-initial-thoughts",
    title: "Initial Thoughts on the Summit",
    date: "April 21, 2026",
    topic: "Geopolitics",
    excerpt:
      "The statement appears designed to prevent disagreement rather than produce meaningful progress.",
    content:
      "The joint statement feels weaker than anticipated. It seems more like a document designed to avoid disagreement rather than to forge a path forward. The language is vague, and the commitments are non-binding. My initial reaction is one of disappointment, but perhaps there are strategic subtleties I'm missing.",
  },
  {
    id: 2,
    slug: "public-rhetoric-shift",
    title: "A Shift in Public Rhetoric",
    date: "April 20, 2026",
    topic: "Economy",
    excerpt:
      "Leaders are replacing the language of recovery with resilience, which signals a deeper expectation shift.",
    content:
      "I've noticed a distinct shift in the way political leaders are addressing the economic downturn. The focus has moved from 'recovery' to 'resilience'. This is not just a semantic change; it signals a psychological pivot from optimism to endurance. It's a subtle but important indicator of what they expect is coming.",
  },
  {
    id: 3,
    slug: "appendices-hold-the-power",
    title: "The Power Hidden in the Appendices",
    date: "April 19, 2026",
    topic: "Policy",
    excerpt:
      "The most consequential authority transfer is buried in supplemental sections, not headline clauses.",
    content:
      "Reading through the proposed legislation, it's clear that the most significant part is not in the main clauses, but in the appendices. This is where the real power is being allocated. A classic case of hiding mountains in molehills.",
  },
];

export const journalTopics = [
  "All",
  ...new Set(journalEntries.map((entry) => entry.topic)),
] as const;
