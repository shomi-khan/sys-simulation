/**
 * src/problems/url-shortener.ts
 *
 * Challenge: URL Shortener
 * Difficulty: Beginner
 *
 * The user must build an architecture that handles read-heavy traffic
 * with a burst spike, while staying within budget.
 */

import type { Problem } from '@/types'

export const urlShortener: Problem = {
  id: 'url-shortener',
  title: 'URL Shortener',
  subtitle: 'Handle 100M users with a read-heavy traffic spike.',
  difficulty: 'beginner',
  description: `
    A viral link is being shared across social media.
    Your URL shortener must handle a sudden spike to 2,000 req/s
    without dropping requests or exceeding your budget.
    Hint: most traffic is reads — caching will help significantly.
  `,
  durationSeconds: 45,
  initialBudget: 1200,
  trafficPattern: [
    { atSecond: 0,  rps: 100  },
    { atSecond: 10, rps: 500  },
    { atSecond: 20, rps: 2000 },
    { atSecond: 35, rps: 800  },
    { atSecond: 45, rps: 200  },
  ],
  availableComponents: [
    'load-balancer',
    'api-server',
    'redis-cache',
    'sql-database',
    'rate-limiter',
  ],
  successConditions: [
    { metric: 'availability',     operator: 'gte', value: 99,   label: 'Availability ≥ 99%' },
    { metric: 'avgLatency',       operator: 'lte', value: 100,  label: 'Avg latency ≤ 100ms' },
    { metric: 'droppedRequests',  operator: 'lte', value: 0,    label: 'Zero dropped requests' },
    { metric: 'balance',          operator: 'gte', value: 0,    label: 'Budget not exceeded' },
  ],
  scoringProfile: 'default',
  unlocksAfter: null,
}
