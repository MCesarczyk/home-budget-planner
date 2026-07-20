-- Seed data: transfer transactions (money moved between the user's own accounts).
-- Transfers have BOTH account legs set and NO subcategory (per the
-- tx_subcategory_iff_not_transfer constraint). Depends on the wallets accounts
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
    ((SELECT id FROM wallets_account WHERE name = 'Main Checking'),
     (SELECT id FROM wallets_account WHERE name = 'Retirement Term Deposit'),
     NULL, '2023-10-18', 500.00),
    ((SELECT id FROM wallets_account WHERE name = 'Main Checking'),
     (SELECT id FROM wallets_account WHERE name = 'Brokerage Account'),
     NULL, '2023-11-08', 600.00),
    -- a withdrawal back from savings into checking
    ((SELECT id FROM wallets_account WHERE name = 'Everyday Savings'),
     (SELECT id FROM wallets_account WHERE name = 'Main Checking'),
     NULL, '2023-12-01', 200.00);
