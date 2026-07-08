-- Seed data: categories + subcategories (reference/lookup data).
-- Explicit IDs so FKs are deterministic and reproducible.
-- Derived from transactions_sample.sql / docs/schema_design.md
-- (12 categories, 42 subcategories).

INSERT INTO transactions_category (id, name, kind) VALUES
    (1,  'Salary & Wages',            'income'),
    (2,  'Other Income',              'income'),
    (3,  'Housing',                   'expense'),
    (4,  'Groceries',                 'expense'),
    (5,  'Utilities & Subscriptions', 'expense'),
    (6,  'Transportation',            'expense'),
    (7,  'Fitness & Hobbies',         'expense'),
    (8,  'Pets',                      'expense'),
    (9,  'Debt Payments',             'expense'),
    (10, 'Savings & Investments',     'expense'),
    (11, 'Clothing',                  'expense'),
    (12, 'Miscellaneous',             'expense');

INSERT INTO transactions_subcategory (id, category_id, name) VALUES
    -- Salary & Wages
    (1,  1,  'Primary Job'),
    (2,  1,  'Freelance Gig'),
    (3,  1,  'Bonus'),
    -- Other Income
    (4,  2,  'Interest Earned'),
    (5,  2,  'Cashback Rewards'),
    -- Housing
    (6,  3,  'Rent'),
    (7,  3,  'Electricity'),
    (8,  3,  'Water'),
    (9,  3,  'Building Maintenance Fee'),
    -- Groceries
    (10, 4,  'Supermarket'),
    (11, 4,  'Bakery'),
    (12, 4,  'Farmers Market'),
    -- Utilities & Subscriptions
    (13, 5,  'Streaming Service'),
    (14, 5,  'Mobile Plan'),
    (15, 5,  'Home Internet'),
    (16, 5,  'Cloud Storage'),
    -- Transportation
    (17, 6,  'Fuel'),
    (18, 6,  'Parking'),
    (19, 6,  'Car Wash'),
    (20, 6,  'Public Transit Pass'),
    -- Fitness & Hobbies
    (21, 7,  'Gym Membership'),
    (22, 7,  'Books & Games'),
    (23, 7,  'Event Fee'),
    (24, 7,  'Supplements'),
    (25, 7,  'Sports Gear'),
    -- Pets
    (26, 8,  'Pet Food'),
    (27, 8,  'Grooming'),
    (28, 8,  'Vet Visit'),
    (29, 8,  'Toys & Accessories'),
    -- Debt Payments
    (30, 9,  'Car Loan'),
    (31, 9,  'Student Loan'),
    (32, 9,  'Credit Card'),
    -- Savings & Investments
    (33, 10, 'Index Fund'),
    (34, 10, 'Emergency Fund'),
    (35, 10, 'Retirement Account'),
    -- Clothing
    (36, 11, 'Apparel'),
    (37, 11, 'Shoes'),
    -- Miscellaneous
    (38, 12, 'Gifts'),
    (39, 12, 'Bank Fees'),
    (40, 12, 'Charity Donation'),
    (41, 12, 'Online Courses'),
    (42, 12, 'Other');

-- Note: on SQLite the rowid auto-advances past the max inserted id, so no
-- sequence reset is needed. On PostgreSQL, run `manage.py sqlsequencereset
-- transactions` once after seeding so future auto-id inserts don't collide.
