// User-Facing Messages
// Constants for success messages, error messages, and confirmations

// Success messages
export const SUCCESS_MESSAGES = {
  // Task workflow
  task_template_created: 'Task template created successfully',
  task_template_updated: 'Task template updated successfully',
  task_template_deleted: 'Task template deleted successfully',
  task_type_created: 'Task type created successfully',
  task_type_updated: 'Task type updated successfully',
  task_completed: 'Task marked as completed',
  task_blocked: 'Task marked as blocked',
  task_unblocked: 'Task unblocked successfully',
  task_assigned: 'Task assigned successfully',
  template_applied: 'Template applied to ticket successfully',

  // Warehouse management
  product_received: 'Product received successfully',
  product_moved: 'Product moved to new location',
  product_assigned_to_ticket: 'Product assigned to service ticket',
  product_returned: 'Product returned from service',
  product_disposed: 'Product marked for disposal',
  warehouse_created: 'Warehouse created successfully',
  warehouse_updated: 'Warehouse updated successfully',
  threshold_set: 'Stock threshold configured',
  bulk_import_completed: 'Bulk import completed successfully',
  serial_verified: 'Serial number verified successfully',

  // Service requests
  request_submitted: 'Service request submitted successfully',
  request_reviewed: 'Service request reviewed',
  request_approved: 'Service request approved',
  request_rejected: 'Service request rejected',
  request_converted: 'Service request converted to ticket',
  tracking_sent: 'Tracking information sent to customer',

  // RMA
  rma_batch_created: 'RMA batch created successfully',
  rma_batch_shipped: 'RMA batch marked as shipped',
  rma_batch_completed: 'RMA batch completed',

  // General
  changes_saved: 'Changes saved successfully',
  data_exported: 'Data exported successfully',
  email_sent: 'Email notification sent',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  // Task workflow
  task_template_not_found: 'Task template not found',
  task_type_not_found: 'Task type not found',
  task_not_found: 'Task not found',
  task_already_completed: 'Task is already completed',
  task_blocked_cannot_proceed: 'Cannot proceed while task is blocked',
  invalid_task_sequence: 'Tasks must be completed in sequence',
  task_notes_required: 'Completion notes are required',
  task_photo_required: 'Photo verification is required',
  cannot_skip_required_task: 'Cannot skip required task',
  template_in_use: 'Template is in use and cannot be deleted',

  // Warehouse management
  product_not_found: 'Product not found',
  serial_already_exists: 'Serial number already exists',
  serial_not_found: 'Serial number not found in system',
  invalid_serial_format: 'Invalid serial number format',
  product_in_use: 'Product is assigned to active ticket',
  warehouse_not_found: 'Warehouse not found',
  invalid_movement: 'Invalid stock movement',
  insufficient_stock: 'Insufficient stock available',
  threshold_already_exists: 'Stock threshold already configured',
  bulk_import_failed: 'Bulk import failed',
  invalid_csv_format: 'Invalid CSV file format',
  file_too_large: 'File size exceeds maximum limit',

  // Service requests
  request_not_found: 'Service request not found',
  invalid_tracking_token: 'Invalid tracking token',
  request_already_reviewed: 'Request has already been reviewed',
  request_already_converted: 'Request has already been converted',
  invalid_email: 'Invalid email address',
  invalid_phone: 'Invalid phone number',
  description_too_short: 'Issue description is too short',
  too_many_photos: 'Too many photos uploaded',
  photo_upload_failed: 'Photo upload failed',
  delivery_address_required: 'Delivery address is required',

  // RMA
  rma_batch_not_found: 'RMA batch not found',
  rma_batch_already_shipped: 'RMA batch has already been shipped',
  cannot_add_to_shipped_batch: 'Cannot add products to shipped batch',

  // Permissions
  permission_denied: 'You do not have permission to perform this action',
  authentication_required: 'Authentication required',

  // General
  something_went_wrong: 'Something went wrong. Please try again.',
  network_error: 'Network error. Please check your connection.',
  validation_failed: 'Validation failed. Please check your input.',
  required_field: 'This field is required',
  invalid_format: 'Invalid format',
  save_failed: 'Failed to save changes',
  delete_failed: 'Failed to delete',
  export_failed: 'Failed to export data',
} as const;

// Confirmation messages
export const CONFIRMATION_MESSAGES = {
  // Task workflow
  delete_task_template: 'Are you sure you want to delete this task template? This action cannot be undone.',
  delete_task_type: 'Are you sure you want to delete this task type? This will affect all templates using it.',
  complete_task: 'Mark this task as completed?',
  block_task: 'Are you sure you want to block this task? You will need to provide a reason.',
  skip_task: 'Are you sure you want to skip this task? This action cannot be undone.',
  change_template: 'Changing the template will modify existing tasks. Continue?',

  // Warehouse management
  delete_warehouse: 'Are you sure you want to delete this warehouse? All products must be moved first.',
  dispose_product: 'Are you sure you want to dispose of this product? This action cannot be undone.',
  move_product: 'Move this product to the selected location?',
  bulk_import: 'Import {{count}} products from CSV file?',
  export_stock: 'Export current stock data to {{format}}?',

  // Service requests
  reject_request: 'Are you sure you want to reject this service request? The customer will be notified.',
  approve_request: 'Approve this service request and create a service ticket?',
  convert_request: 'Convert this request to a service ticket? This will create a new customer if needed.',
  cancel_request: 'Cancel this service request?',

  // RMA
  delete_rma_batch: 'Are you sure you want to delete this RMA batch?',
  ship_rma_batch: 'Mark this RMA batch as shipped? This action cannot be undone.',

  // General
  unsaved_changes: 'You have unsaved changes. Are you sure you want to leave?',
  confirm_delete: 'Are you sure you want to delete this item? This action cannot be undone.',
  confirm_action: 'Are you sure you want to proceed with this action?',
} as const;

// Info messages
export const INFO_MESSAGES = {
  // Task workflow
  strict_sequence_enabled: 'Strict sequence is enabled. Tasks must be completed in order.',
  task_requires_notes: 'Completion notes are required for this task.',
  task_requires_photo: 'Photo verification is required for this task.',
  template_preview: 'Preview how this template will appear for service tickets.',

  // Warehouse management
  serial_verification_help: 'Scan or enter serial number to verify product.',
  bulk_import_help: 'Upload CSV file with columns: serial_number, product_sku, condition, warehouse_type.',
  low_stock_alert: 'Stock level is below minimum threshold.',
  warranty_expiring_soon: 'Warranty expires in {{days}} days.',
  product_in_service: 'This product is currently assigned to service ticket {{ticket_number}}.',

  // Service requests
  tracking_lookup_help: 'Enter your tracking token (SR-XXXXXXXXXXXX) to check request status.',
  public_portal_maintenance: 'The service request portal is currently under maintenance. Please try again later.',
  review_pending: 'This request is pending review. We will notify you once it has been reviewed.',
  request_converted_info: 'This request has been converted to service ticket {{ticket_number}}.',

  // General
  loading: 'Loading...',
  no_data: 'No data available',
  empty_state: 'Nothing here yet',
  search_no_results: 'No results found for your search',
} as const;

// Placeholder text
export const PLACEHOLDER_TEXT = {
  search: 'Search...',
  search_serial: 'Search by serial number...',
  search_product: 'Search by product name or SKU...',
  search_customer: 'Search by customer name or email...',
  search_ticket: 'Search by ticket number...',
  search_tracking: 'Enter tracking token (SR-XXXXXXXXXXXX)',
  select_option: 'Select an option',
  select_template: 'Select a template',
  select_product: 'Select a product',
  select_warehouse: 'Select a warehouse',
  enter_notes: 'Enter notes or comments...',
  enter_reason: 'Enter reason...',
  enter_description: 'Enter description...',
} as const;

// Loading messages
export const LOADING_MESSAGES = {
  loading_tasks: 'Loading tasks...',
  loading_products: 'Loading products...',
  loading_warehouses: 'Loading warehouses...',
  loading_requests: 'Loading requests...',
  loading_templates: 'Loading templates...',
  processing: 'Processing...',
  saving: 'Saving changes...',
  deleting: 'Deleting...',
  uploading: 'Uploading...',
  verifying: 'Verifying...',
  importing: 'Importing data...',
  exporting: 'Exporting data...',
} as const;
