/**
 * Entity Adapters - Main Export
 *
 * Exports all entity adapters and the adapter registry.
 * This is the main entry point for the entity adapter pattern.
 *
 * @module entity-adapters
 */

// Core interfaces and types
export * from "./base-adapter";
export * from "./inventory-issue-adapter";
export * from "./inventory-receipt-adapter";
export * from "./inventory-transfer-adapter";
// Adapter registry
export * from "./registry";
// Re-export singleton registry instance for convenience
export { adapterRegistry } from "./registry";
export * from "./service-request-adapter";
// Concrete adapters
export * from "./service-ticket-adapter";
