/**
 * src/config/components.ts
 *
 * Registry of all draggable infrastructure components available in the game.
 *
 * WHY THIS EXISTS:
 * Components are data, not code. Adding a new component type (e.g. Kafka, Shard Router)
 * should never require touching engine logic. Just add an entry here.
 *
 * HOW TO ADD A NEW COMPONENT:
 * 1. Add a new entry to the `componentRegistry` array below
 * 2. The engine, canvas, and palette will automatically pick it up
 *
 * Icon names reference lucide-react icon identifiers.
 * Border colors are mapped by category in the Canvas component.
 */

import type { ComponentDefinition } from '@/types'

export const componentRegistry: ComponentDefinition[] = [
  {
    type: 'load-balancer',
    label: 'Load Balancer',
    icon: 'Network',
    category: 'network',
    purchaseCost: 300,
    runtimeCostPerSecond: 2,
    capacityRps: 5000,
    baseLatencyMs: 2,
    description: 'Distributes incoming traffic evenly across backend servers.',
  },
  {
    type: 'api-server',
    label: 'API Server',
    icon: 'Server',
    category: 'compute',
    purchaseCost: 200,
    runtimeCostPerSecond: 3,
    capacityRps: 800,
    baseLatencyMs: 10,
    description: 'Handles business logic. Multiple instances increase throughput.',
  },
  {
    type: 'redis-cache',
    label: 'Redis Cache',
    icon: 'Zap',
    category: 'cache',
    purchaseCost: 400,
    runtimeCostPerSecond: 2,
    capacityRps: 10000,
    baseLatencyMs: 1,
    description: 'In-memory cache. Reduces database load via high cache hit ratio.',
  },
  {
    type: 'sql-database',
    label: 'SQL Database',
    icon: 'Database',
    category: 'database',
    purchaseCost: 500,
    runtimeCostPerSecond: 4,
    capacityRps: 400,
    baseLatencyMs: 20,
    description: 'Relational database. High consistency, limited write throughput.',
  },
  {
    type: 'nosql-database',
    label: 'NoSQL Database',
    icon: 'DatabaseZap',
    category: 'database',
    purchaseCost: 500,
    runtimeCostPerSecond: 4,
    capacityRps: 800,
    baseLatencyMs: 15,
    description: 'Document store. Higher throughput than SQL, eventual consistency.',
  },
  {
    type: 'cdn',
    label: 'CDN',
    icon: 'Globe',
    category: 'cdn',
    purchaseCost: 500,
    runtimeCostPerSecond: 3,
    capacityRps: 50000,
    baseLatencyMs: 5,
    description: 'Serves static assets from edge nodes. Dramatically reduces origin load.',
  },
  {
    type: 'message-queue',
    label: 'Message Queue',
    icon: 'MessageSquare',
    category: 'queue',
    purchaseCost: 350,
    runtimeCostPerSecond: 2,
    capacityRps: 3000,
    baseLatencyMs: 5,
    description: 'Decouples producers from consumers. Absorbs traffic spikes gracefully.',
  },
  {
    type: 'rate-limiter',
    label: 'Rate Limiter',
    icon: 'Shield',
    category: 'security',
    purchaseCost: 150,
    runtimeCostPerSecond: 1,
    capacityRps: 10000,
    baseLatencyMs: 1,
    description: 'Throttles abusive clients. Protects downstream services from overload.',
  },
]

/**
 * Helper: look up a component definition by its type string.
 * Returns undefined if not found — caller must handle this case.
 */
export function getComponentByType(type: string): ComponentDefinition | undefined {
  return componentRegistry.find((c) => c.type === type)
}

/**
 * Derive the canvas node border color from a component's category.
 * Color is never stored — always computed at render time.
 *
 * @param category - ComponentCategory value
 * @returns Hex color string for the node border
 */
export function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    network:  '#378ADD',
    compute:  '#4ade80',
    cache:    '#f87171',
    database: '#a78bfa',
    cdn:      '#fbbf24',
    queue:    '#fb923c',
    security: '#f472b6',
  }
  return map[category] ?? '#334155'
}
