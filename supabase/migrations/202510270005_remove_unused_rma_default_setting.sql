-- Remove unused default_rma_return_warehouse setting
-- RMA products now return to their previous_virtual_warehouse_type instead of a configured default

DELETE FROM public.system_settings 
WHERE key = 'default_rma_return_warehouse';
