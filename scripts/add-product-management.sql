-- Add Categories table
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Add category_id to Products table
ALTER TABLE products ADD COLUMN category_id INTEGER;
ALTER TABLE products ADD COLUMN description TEXT;
ALTER TABLE products ADD COLUMN created_by INTEGER DEFAULT 1;
ALTER TABLE products ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Insert default categories
INSERT INTO categories (name, description, created_by) VALUES
('เมล็ดกาแฟ', 'เมล็ดกาแฟทุกชนิด', 1),
('นม', 'นมและผลิตภัณฑ์จากนม', 1),
('เครื่องปรุง', 'น้ำตาล เครื่องเทศ', 1),
('ขนมและเบเกอรี่', 'คุกกี้ มัฟฟิน เค้ก', 1),
('อุปกรณ์', 'ถ้วย ฝา หลอด', 1);

-- Update existing products with categories
UPDATE products SET category_id = 1, created_by = 1 WHERE name LIKE '%กาแฟ%';
UPDATE products SET category_id = 2, created_by = 1 WHERE name LIKE '%นม%';
UPDATE products SET category_id = 3, created_by = 1 WHERE name LIKE '%น้ำตาล%';
UPDATE products SET category_id = 4, created_by = 1 WHERE name LIKE '%คุกกี้%' OR name LIKE '%มัฟฟิน%';
UPDATE products SET category_id = 5, created_by = 1 WHERE name LIKE '%ถ้วย%' OR name LIKE '%ฝา%';
