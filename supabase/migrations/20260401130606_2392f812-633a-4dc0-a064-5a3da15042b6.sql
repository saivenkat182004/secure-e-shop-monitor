
-- Delete duplicate USD-priced products
DELETE FROM products WHERE id IN (
  '94294ec4-37b4-46b4-9ec6-be6f328078fc',
  '7d3171ce-a0be-4801-bbd3-8164497ad634',
  'b9e83dd5-8a46-4115-b808-f30de1ac0243',
  '4d154d7b-86a3-489a-956b-e0b2588ec853',
  'f28e8086-c5bd-448e-8fd5-7b50eb89a3c9',
  '16801e4c-3f5e-443e-a133-037dafc59b35',
  '564cf5ee-7b31-4850-93af-d3c267a16ffe',
  '8b8e4931-949a-49a8-b28d-d95d11b43f2c'
);

-- Update all product prices to current 2026 Indian market values
UPDATE products SET price = 134900 WHERE id = '92f384d7-d9f1-4c77-b09c-72950bfac542'; -- MacBook Air M3
UPDATE products SET price = 164990 WHERE id = 'b1d1b784-f3fd-474b-bb7b-fc13d362c56f'; -- Dell XPS 15
UPDATE products SET price = 54990 WHERE id = 'c04b674b-d418-4b23-9d50-074577eb2e3c'; -- HP Pavilion 14
UPDATE products SET price = 159900 WHERE id = 'b13f65e1-d875-4184-a116-5c5b63120d10'; -- iPhone 15 Pro Max
UPDATE products SET price = 64999 WHERE id = '26612720-77da-4d3c-97d1-be9e6b53c225'; -- OnePlus 12
UPDATE products SET price = 129999 WHERE id = '264da48d-8b84-4208-8e4a-75b95a3aafac'; -- Samsung Galaxy S24 Ultra
UPDATE products SET price = 74900 WHERE id = '6f379384-5c52-4638-a9d8-ddf1b4df1538'; -- iPad Air M2
UPDATE products SET price = 44999 WHERE id = '245a98e0-ab5a-4dce-829a-cfc0d54b844c'; -- Samsung Galaxy Tab S9 FE
UPDATE products SET price = 44900 WHERE id = 'eebc58e8-3c2e-4bab-9606-06afd8f2ed89'; -- Apple Watch Series 9
UPDATE products SET price = 35999 WHERE id = '4c4eb464-84c2-4a55-be0c-32cb3cd5fef6'; -- Samsung Galaxy Watch 6 Classic
UPDATE products SET price = 24900 WHERE id = '4a7a15d6-0a2a-48de-b06b-027dff7bfe09'; -- Apple AirPods Pro 2
UPDATE products SET price = 29990 WHERE id = '7c6e4f70-1467-4ed4-8ccc-60fd845202c8'; -- Sony WH-1000XM5
UPDATE products SET price = 5999 WHERE id = '5cd01aae-177b-4e3c-873f-e298eca5634a'; -- JBL Tune 770NC
UPDATE products SET price = 14999 WHERE id = '5510769b-f36c-40cc-9431-b71a8eb56381'; -- Marshall Emberton II
UPDATE products SET price = 39990 WHERE id = '8c4b67aa-12fe-407f-a280-4e014c71307d'; -- Sony PlayStation 5 Slim
UPDATE products SET price = 27499 WHERE id = 'f17fa777-cd3e-44eb-9ea6-4f8b110ee8df'; -- Nintendo Switch OLED
UPDATE products SET price = 74990 WHERE id = '4d36f8af-2d52-4ccf-97e5-eabbbaa4d74c'; -- Canon EOS R50
UPDATE products SET price = 239990 WHERE id = '82a325ea-ee8f-4551-8082-3ef3b7f10bdd'; -- Sony Alpha A7 IV
UPDATE products SET price = 119990 WHERE id = 'a3aa6f6a-9084-4b65-9593-2135e4190f71'; -- LG C3 55" OLED TV
UPDATE products SET price = 62990 WHERE id = '59f6eb53-1fee-448c-bec6-b0c27bb15987'; -- Samsung 65" Crystal 4K UHD
