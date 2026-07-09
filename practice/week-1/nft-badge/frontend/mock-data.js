// Mock data for NFT Badge prototype
// 12 badges across 4 series, 4 rarity tiers
// Hybrid mode: mock metadata + on-chain hasBadge() for unlock status
// Exposed as window.BADGE_DATA (no ES module — works under file:// and http://)

(function () {
  const RARITY = {
    bronze:   { label: 'Bronze',   color: '#cd7f32', glow: 'rgba(205,127,50,0.55)',  order: 1 },
    silver:   { label: 'Silver',   color: '#c0c0c0', glow: 'rgba(192,192,192,0.55)', order: 2 },
    gold:     { label: 'Gold',     color: '#ffd700', glow: 'rgba(255,215,0,0.65)',   order: 3 },
    platinum: { label: 'Platinum', color: '#e5e4e2', glow: 'rgba(229,228,226,0.75)', order: 4 },
  };

  const SERIES = {
    cohort:     { label: 'Cohort',     color: '#3b82f6' },
    hackathon:  { label: 'Hackathon',  color: '#a855f7' },
    opensource: { label: 'Open Source', color: '#10b981' },
    devrel:     { label: 'DevRel',     color: '#f59e0b' },
  };

  // 12 badges — typeId aligns with on-chain badge types (0 = Week1Demo deployed earlier)
  const BADGES = [
    // Cohort series (4)
    {
      typeId: 0,
      name: 'Week 1 Pioneer',
      series: 'cohort',
      rarity: 'bronze',
      description: 'Completed Week 1: AI-assisted Solidity + Monad Testnet deploy',
      unlockRule: 'Finish Week 1 tasks: AI prompt, contract review, deploy to Monad Testnet, one write tx.',
      image: '🌌',
      track: 'Tech',
      level: 'Novice',
      contribution: 'Docs',
      progress: { current: 4, total: 4 },
    },
    {
      typeId: 1,
      name: 'Week 2 Builder',
      series: 'cohort',
      rarity: 'bronze',
      description: 'Completed Week 2: smart contract patterns + testing',
      unlockRule: 'Submit Week 2 contract with passing tests.',
      image: '🧪',
      track: 'Tech',
      level: 'Novice',
      contribution: 'Docs',
      progress: { current: 2, total: 4 },
    },
    {
      typeId: 2,
      name: 'Week 3 Architect',
      series: 'cohort',
      rarity: 'silver',
      description: 'Completed Week 3: protocol design + indexing',
      unlockRule: 'Submit indexer + integration tests for event indexing.',
      image: '🏛️',
      track: 'Tech',
      level: 'Builder',
      contribution: 'Docs',
      progress: { current: 0, total: 4 },
    },
    {
      typeId: 3,
      name: 'Cohort Graduate',
      series: 'cohort',
      rarity: 'gold',
      description: 'Finished all 4 weeks of the Monad Cohort',
      unlockRule: 'Complete Week 1-4 with verified proof of work.',
      image: '🎓',
      track: 'Tech',
      level: 'Builder',
      contribution: 'Docs',
      progress: { current: 1, total: 4 },
    },
    // Hackathon series (3)
    {
      typeId: 4,
      name: 'Hackathon Participant',
      series: 'hackathon',
      rarity: 'bronze',
      description: 'Submitted a project to a Monad hackathon',
      unlockRule: 'Submit a working demo to any Monad hackathon.',
      image: '🚀',
      track: 'Tech',
      level: 'Novice',
      contribution: 'Hackathon',
      progress: { current: 0, total: 1 },
    },
    {
      typeId: 5,
      name: 'Hackathon Finalist',
      series: 'hackathon',
      rarity: 'silver',
      description: 'Top 10 finalist in a Monad hackathon',
      unlockRule: 'Reach top 10 in any Monad hackathon.',
      image: '🏆',
      track: 'Tech',
      level: 'Builder',
      contribution: 'Hackathon',
      progress: { current: 0, total: 1 },
    },
    {
      typeId: 6,
      name: 'Hackathon Winner',
      series: 'hackathon',
      rarity: 'gold',
      description: 'Won 1st place in a Monad hackathon',
      unlockRule: 'Win 1st place in any Monad hackathon track.',
      image: '👑',
      track: 'Tech',
      level: 'Master',
      contribution: 'Hackathon',
      progress: { current: 0, total: 1 },
    },
    // Open Source series (3)
    {
      typeId: 7,
      name: 'First PR',
      series: 'opensource',
      rarity: 'bronze',
      description: 'Merged your first PR to a Monad ecosystem repo',
      unlockRule: 'Have a PR merged in any Monad ecosystem repo.',
      image: '🌱',
      track: 'Tech',
      level: 'Novice',
      contribution: 'Open Source',
      progress: { current: 0, total: 1 },
    },
    {
      typeId: 8,
      name: 'Doc Contributor',
      series: 'opensource',
      rarity: 'silver',
      description: 'Contributed meaningful documentation',
      unlockRule: 'Have a docs PR merged (>= 100 lines).',
      image: '📚',
      track: 'Ops',
      level: 'Builder',
      contribution: 'Open Source',
      progress: { current: 2, total: 5 },
    },
    {
      typeId: 9,
      name: 'Core Contributor',
      series: 'opensource',
      rarity: 'platinum',
      description: 'Recognized as a core contributor',
      unlockRule: 'Become a recurring maintainer on a Monad repo.',
      image: '⚙️',
      track: 'Tech',
      level: 'Master',
      contribution: 'Open Source',
      progress: { current: 0, total: 1 },
    },
    // DevRel series (2)
    {
      typeId: 10,
      name: 'Workshop Speaker',
      series: 'devrel',
      rarity: 'silver',
      description: 'Hosted a workshop about Monad',
      unlockRule: 'Host a public workshop with >= 20 attendees.',
      image: '🎤',
      track: 'Ops',
      level: 'Builder',
      contribution: 'DevRel',
      progress: { current: 0, total: 1 },
    },
    {
      typeId: 11,
      name: 'Evangelist',
      series: 'devrel',
      rarity: 'platinum',
      description: 'Recognized Monad evangelist',
      unlockRule: 'Produce 5+ pieces of quality Monad content (talks, articles, videos).',
      image: '🌟',
      track: 'Ops',
      level: 'Master',
      contribution: 'DevRel',
      progress: { current: 1, total: 5 },
    },
  ];

  function getBadge(typeId) {
    return BADGES.find((b) => b.typeId === Number(typeId));
  }
  function getBadgesBySeries(series) {
    if (series === 'all') return BADGES.slice();
    return BADGES.filter((b) => b.series === series);
  }
  function getSeriesSiblings(typeId) {
    const badge = getBadge(typeId);
    if (!badge) return [];
    return BADGES.filter((b) => b.series === badge.series && b.typeId !== badge.typeId);
  }
  function getNextUnlock(unlockedSet) {
    return BADGES.find((b) => !unlockedSet.has(b.typeId)) || null;
  }

  window.BADGE_DATA = {
    RARITY,
    SERIES,
    BADGES,
    getBadge,
    getBadgesBySeries,
    getSeriesSiblings,
    getNextUnlock,
  };
})();
