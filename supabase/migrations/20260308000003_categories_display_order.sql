-- Add display_order to categories for admin-controlled sort + visibility
ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Seed initial order matching current known sequence
UPDATE categories SET display_order = 1 WHERE slug = 'necklaces';
UPDATE categories SET display_order = 2 WHERE slug = 'earrings';
UPDATE categories SET display_order = 3 WHERE slug = 'bangles-bracelets';
UPDATE categories SET display_order = 4 WHERE slug = 'pendant-sets';
UPDATE categories SET display_order = 5 WHERE slug = 'jadau-jewelry';
UPDATE categories SET display_order = 6 WHERE slug = 'hair-accessories';
UPDATE categories SET display_order = 7 WHERE slug = 'dresses';
