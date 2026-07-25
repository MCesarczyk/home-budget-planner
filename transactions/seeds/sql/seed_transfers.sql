-- Seed data: transfer transactions (money moved between the user's own accounts).
-- Transfers have BOTH account legs set; a subcategory is OPTIONAL for them (per
-- the tx_subcategory_required_for_non_transfer constraint). Most rows leave it
-- NULL; one is categorized to exercise the "categorized transfer" path (e.g. a
-- move earmarked as retirement saving). Depends on the wallets accounts
-- (seed_wallets.sql) and the transaction account legs (0004) existing first.
-- Resolves account ids by name (account names are unique).

INSERT INTO transactions_transaction
    (source_account_id, destination_account_id, subcategory_id, tx_date, amount) VALUES
    ((SELECT id FROM wallets_account WHERE name = 'Main Checking'),
     (SELECT id FROM wallets_account WHERE name = 'Everyday Savings'),
     NULL, '2023-07-05', 400.00),
    ((SELECT id FROM wallets_account WHERE name = 'Main Checking'),
     (SELECT id FROM wallets_account WHERE name = 'Home Repair Fund'),
     NULL, '2023-08-04', 250.00),
    ((SELECT id FROM wallets_account WHERE name = 'Main Checking'),
     (SELECT id FROM wallets_account WHERE name = 'Vacation Pot'),
     NULL, '2023-09-02', 150.00),
    -- a categorized transfer: money moved into the term deposit, earmarked as
    -- retirement saving. Allowed since the constraint was relaxed to permit a
    -- subcategory on transfers (kept out of spending/cashflow, which exclude
    -- transfers regardless).
    ((SELECT id FROM wallets_account WHERE name = 'Main Checking'),
     (SELECT id FROM wallets_account WHERE name = 'Retirement Term Deposit'),
     (SELECT id FROM transactions_subcategory WHERE name = 'Retirement Account'),
     '2023-10-18', 500.00),
    ((SELECT id FROM wallets_account WHERE name = 'Main Checking'),
     (SELECT id FROM wallets_account WHERE name = 'Brokerage Account'),
     NULL, '2023-11-08', 600.00),
    -- a withdrawal back from savings into checking
    ((SELECT id FROM wallets_account WHERE name = 'Everyday Savings'),
     (SELECT id FROM wallets_account WHERE name = 'Main Checking'),
     NULL, '2023-12-01', 200.00),
    -- closing transfer: the full balance of 'Closed Deposit' is moved back into
    -- Main Checking, bringing its computed balance (opening_balance + legs) to
    -- zero. Only then is it archivable (is_active FALSE), per the zero-balance
    -- rule enforced by AccountSerializer. opening_balance itself is untouched.
    ((SELECT id FROM wallets_account WHERE name = 'Closed Deposit'),
     (SELECT id FROM wallets_account WHERE name = 'Main Checking'),
     NULL, '2023-12-20', 5000.00);
