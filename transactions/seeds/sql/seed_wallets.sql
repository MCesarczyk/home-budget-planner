-- Seed data: purposes + accounts (reference/sample data).
-- Explicit IDs so FKs are deterministic and reproducible.
-- See docs/schema_design.md § "v2 — Accounts & transfers".

INSERT INTO wallets_purpose (id, name, description, target_amount) VALUES
    (1, 'Emergency Fund',    '3-6 months of expenses set aside for emergencies', 20000.00),
    (2, 'Future Home Repair', 'Roof, boiler and general home upkeep',            15000.00),
    (3, 'Retirement',         'Long-term retirement savings',                    NULL),
    (4, 'Vacation',           'Annual holiday budget',                            5000.00);

INSERT INTO wallets_account
    (id, name, type, opening_balance, purpose_id, is_active) VALUES
    (1, 'Main Checking',         'checking',   2500.00, NULL, TRUE),
    (2, 'Everyday Savings',      'savings',    8000.00, 1,    TRUE),
    (3, 'Home Repair Fund',      'savings',    4200.00, 2,    TRUE),
    (4, 'Retirement Term Deposit','savings',  30000.00, 3,    TRUE),
    (5, 'Brokerage Account',     'investment',12000.00, 3,    TRUE),
    (6, 'Vacation Pot',          'savings',    1500.00, 4,    TRUE);

-- Note: booleans use TRUE (portable — SQLite accepts it, PostgreSQL requires it).
-- On PostgreSQL the id sequences are re-pointed past these explicit ids by
-- migration wallets/0003_reset_sequences (no-op on SQLite).
