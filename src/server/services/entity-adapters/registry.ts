/**
 * Entity Adapter Registry
 *
 * Central registry for all entity adapters. Provides lookup and
 * management of adapters by entity type.
 *
 * @module entity-adapters/registry
 */

import type { EntityAdapter, EntityType } from "./base-adapter";

/**
 * Singleton registry for entity adapters
 *
 * Maintains a map of entity types to their corresponding adapter instances.
 * Each entity type can only have one adapter registered.
 *
 * @example
 * ```typescript
 * import { adapterRegistry } from './registry';
 * import { ServiceTicketAdapter } from './service-ticket-adapter';
 *
 * // Get adapter for service tickets
 * const adapter = adapterRegistry.get('service_ticket');
 *
 * // Use adapter
 * await adapter.onTaskComplete(ctx, taskId);
 * ```
 */
export class EntityAdapterRegistry {
  private adapters = new Map<EntityType, EntityAdapter>();

  /**
   * Register an adapter for an entity type
   *
   * @param adapter - Entity adapter instance to register
   * @throws Error if adapter for this entity type already registered
   *
   * @example
   * ```typescript
   * const registry = new EntityAdapterRegistry();
   * registry.register(new ServiceTicketAdapter());
   * ```
   */
  register(adapter: EntityAdapter): void {
    if (this.adapters.has(adapter.entityType)) {
      throw new Error(
        `Adapter for entity type "${adapter.entityType}" is already registered`,
      );
    }

    this.adapters.set(adapter.entityType, adapter);
  }

  /**
   * Get adapter for an entity type
   *
   * @param entityType - Entity type to get adapter for
   * @returns Entity adapter instance
   * @throws Error if no adapter found for entity type
   *
   * @example
   * ```typescript
   * const adapter = registry.get('service_ticket');
   * await adapter.getEntityContext(ctx, entityId);
   * ```
   */
  get(entityType: EntityType): EntityAdapter {
    const adapter = this.adapters.get(entityType);

    if (!adapter) {
      throw new Error(`No adapter registered for entity type: ${entityType}`);
    }

    return adapter;
  }

  /**
   * Check if an adapter is registered for an entity type
   *
   * @param entityType - Entity type to check
   * @returns True if adapter is registered
   *
   * @example
   * ```typescript
   * if (registry.has('inventory_receipt')) {
   *   const adapter = registry.get('inventory_receipt');
   * }
   * ```
   */
  has(entityType: EntityType): boolean {
    return this.adapters.has(entityType);
  }

  /**
   * Get all registered entity types
   *
   * @returns Array of registered entity types
   *
   * @example
   * ```typescript
   * const types = registry.getRegisteredTypes();
   * // ['service_ticket', 'inventory_receipt', ...]
   * ```
   */
  getRegisteredTypes(): EntityType[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Unregister an adapter (mainly for testing)
   *
   * @param entityType - Entity type to unregister
   * @returns True if adapter was unregistered, false if not found
   *
   * @internal
   */
  unregister(entityType: EntityType): boolean {
    return this.adapters.delete(entityType);
  }

  /**
   * Clear all registered adapters (mainly for testing)
   *
   * @internal
   */
  clear(): void {
    this.adapters.clear();
  }

  /**
   * Get count of registered adapters
   *
   * @returns Number of registered adapters
   */
  get size(): number {
    return this.adapters.size;
  }
}

/**
 * Global adapter registry instance
 *
 * Import and use this singleton throughout the application.
 * Adapters are registered at application startup.
 */
export const adapterRegistry = new EntityAdapterRegistry();
