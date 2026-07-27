-- Manufacturer was never surfaced meaningfully to buyers (Category/Company
-- already cover that need) and added a third near-duplicate catalog concept
-- alongside categories/brands. Removing it entirely.

alter table products drop column manufacturer_id;
drop table manufacturers;
