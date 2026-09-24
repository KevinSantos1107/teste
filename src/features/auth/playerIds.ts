import type { SiteConfig } from '../../config/siteConfig.schema';

/**
 * Returns the stable player IDs for a given SiteConfig.
 *
 * These IDs are used as Firestore document key suffixes (e.g. "snake_kevin").
 * They never change even if the display names change.
 *
 * Falls back to 'kevin'/'iara' for backwards compatibility with existing data.
 */
export function getPlayerIds(config: SiteConfig | null) {
  const p1Id = config?.couple?.partner1?.playerId || config?.couple?.partner1?.name?.toLowerCase() || 'kevin';
  const p2Id = config?.couple?.partner2?.playerId || config?.couple?.partner2?.name?.toLowerCase() || 'iara';
  return { p1Id, p2Id };
}

/**
 * Given a player's stored ID (e.g. 'kevin'), returns the display name.
 * Falls back to capitalizing the ID if no config match.
 */
export function getPlayerDisplayName(playerId: string, config: SiteConfig | null): string {
  if (!config) return capitalize(playerId);
  const { p1Id, p2Id } = getPlayerIds(config);
  if (playerId === p1Id) return config.couple.partner1.name;
  if (playerId === p2Id) return config.couple.partner2.name;
  return capitalize(playerId);
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
