
ALTER TABLE knowledge_specialization ADD COLUMN sort_order integer DEFAULT 0;

UPDATE knowledge_specialization SET sort_order = 1  WHERE name LIKE '1R -%';
UPDATE knowledge_specialization SET sort_order = 2  WHERE name LIKE '2R -%';
UPDATE knowledge_specialization SET sort_order = 3  WHERE name LIKE '3R -%';
UPDATE knowledge_specialization SET sort_order = 4  WHERE name LIKE '4R -%';
UPDATE knowledge_specialization SET sort_order = 5  WHERE name LIKE '5R -%';
UPDATE knowledge_specialization SET sort_order = 6  WHERE name LIKE '6R -%';
UPDATE knowledge_specialization SET sort_order = 7  WHERE name LIKE '7R -%';
UPDATE knowledge_specialization SET sort_order = 8  WHERE name LIKE '8R -%';
UPDATE knowledge_specialization SET sort_order = 9  WHERE name LIKE '9R -%';
UPDATE knowledge_specialization SET sort_order = 10 WHERE name LIKE '10R -%';
UPDATE knowledge_specialization SET sort_order = 11 WHERE name LIKE '11R -%';
UPDATE knowledge_specialization SET sort_order = 12 WHERE name LIKE '12R -%';
