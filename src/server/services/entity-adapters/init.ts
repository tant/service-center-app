/**
 * Entity Adapter Initialization
 *
 * Registers all entity adapters with the global registry.
 * This file should be imported once at application startup.
 *
 * @module entity-adapters/init
 */

import { adapterRegistry } from "./registry";
import { ServiceTicketAdapter } from "./service-ticket-adapter";
import { InventoryReceiptAdapter } from "./inventory-receipt-adapter";
import { InventoryIssueAdapter } from "./inventory-issue-adapter";
import { InventoryTransferAdapter } from "./inventory-transfer-adapter";
import { ServiceRequestAdapter } from "./service-request-adapter";

/**
 * Initialize and register all entity adapters
 *
 * Call this function once at application startup to register
 * all entity adapters with the global registry.
 *
 * @throws Error if adapter registration fails (e.g., duplicate registration)
 *
 * @example
 * ```typescript
 * // In your main server file (e.g., app.ts or server.ts)
 * import { initializeEntityAdapters } from './services/entity-adapters/init';
 *
 * // At startup
 * initializeEntityAdapters();
 * ```
 */
export function initializeEntityAdapters(): void {
  // Register all entity adapters
  adapterRegistry.register(new ServiceTicketAdapter());
  adapterRegistry.register(new InventoryReceiptAdapter());
  adapterRegistry.register(new InventoryIssueAdapter());
  adapterRegistry.register(new InventoryTransferAdapter());
  adapterRegistry.register(new ServiceRequestAdapter());

  console.log(
    `[EntityAdapters] Registered ${adapterRegistry.size} adapters: ${adapterRegistry
      .getRegisteredTypes()
      .join(", ")}`
  );
}

/**
 * Get the initialized adapter registry
 *
 * Convenience function to get the registry after initialization.
 *
 * @returns The global adapter registry instance
 */
export function getAdapterRegistry() {
  return adapterRegistry;
}
