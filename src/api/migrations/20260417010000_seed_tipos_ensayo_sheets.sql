INSERT INTO tipos_ensayo_sheets (id, tipo_ensayo_id, url, drive_id, activo) VALUES
-- Humedad - ASTM D2216-19
(gen_random_uuid(), '31c830aa-9ecb-4981-ba6e-adc6292a016a', 'https://docs.google.com/spreadsheets/d/1VROzZNrChIdERmjoGiJGeaTLIj5OJnYWpzAX8KOgdSk/edit', '1VROzZNrChIdERmjoGiJGeaTLIj5OJnYWpzAX8KOgdSk', true),
-- Límites de Atterberg - ASTM D4318-17
(gen_random_uuid(), 'd339d18b-38db-4edc-bc40-f58720b7a133', 'https://docs.google.com/spreadsheets/d/1VROzZNrChIdERmjoGiJGeaTLIj5OJnYWpzAX8KOgdSk/edit', '1VROzZNrChIdERmjoGiJGeaTLIj5OJnYWpzAX8KOgdSk', true),
-- Granulometría suelos - ASTM D6913/D6913M-17
(gen_random_uuid(), 'dae3f50d-6261-4c2b-afd0-69825498b2ea', 'https://docs.google.com/spreadsheets/d/1VROzZNrChIdERmjoGiJGeaTLIj5OJnYWpzAX8KOgdSk/edit', '1VROzZNrChIdERmjoGiJGeaTLIj5OJnYWpzAX8KOgdSk', true),
-- Granulometría agregados - ASTM C136/C136M-19
(gen_random_uuid(), '1de8cc54-d48b-4c19-969a-ed7a57077f63', 'https://docs.google.com/spreadsheets/d/1VROzZNrChIdERmjoGiJGeaTLIj5OJnYWpzAX8KOgdSk/edit', '1VROzZNrChIdERmjoGiJGeaTLIj5OJnYWpzAX8KOgdSk', true),
-- Lavado tamiz 75μm - ASTM C117-23
(gen_random_uuid(), 'ba7124e0-207f-4e9c-ae9c-430e4e24194c', 'https://docs.google.com/spreadsheets/d/1VROzZNrChIdERmjoGiJGeaTLIj5OJnYWpzAX8KOgdSk/edit', '1VROzZNrChIdERmjoGiJGeaTLIj5OJnYWpzAX8KOgdSk', true),
-- Gravedad específica - ASTM D854-23
(gen_random_uuid(), 'c367a111-ad6f-4896-9562-4fa6717b38e0', 'https://docs.google.com/spreadsheets/d/1AfLRPOiX2-grlTYlKJ1f1hD4YsiV03-JaViEL5v_0DA/edit', '1AfLRPOiX2-grlTYlKJ1f1hD4YsiV03-JaViEL5v_0DA', true),
-- Densidad parafinado - ASTM D7263-21
(gen_random_uuid(), 'e1194d82-d4fa-4853-9c24-f8977c6dfa38', 'https://docs.google.com/spreadsheets/d/1Hfe0x9aiu6ccqosVWG8rDITUFLsvhPNZooBaZSnOK8c/edit', '1Hfe0x9aiu6ccqosVWG8rDITUFLsvhPNZooBaZSnOK8c', true),
-- Consolidación - INV E-151:2013
(gen_random_uuid(), 'f15cd05c-0ad6-45d9-b064-cf303389d0c2', 'https://docs.google.com/spreadsheets/d/1307glLDS4xHXn0FoUJ1kmsei-98qBjUCrHPJ90Q0x0U/edit', '1307glLDS4xHXn0FoUJ1kmsei-98qBjUCrHPJ90Q0x0U', true),
-- Compresión inconfinada - INV E-152:2013
(gen_random_uuid(), 'd63dfb42-8fb3-47cf-be17-825ab340c1b9', 'https://docs.google.com/spreadsheets/d/1SYiujYwTe-BjjVQ8OAKbG0WoVWhB8TQefHF3Dh3KUsQ/edit', '1SYiujYwTe-BjjVQ8OAKbG0WoVWhB8TQefHF3Dh3KUsQ', true),
-- Triaxial CU - INV E-153:2013
(gen_random_uuid(), '3874958f-dbd0-4a75-a9da-5de2ee8d06f0', 'https://docs.google.com/spreadsheets/d/1_3yBFqK_SNX_b_txAZlNJGX86qjFyHi6FWyMmUwfH38/edit', '1_3yBFqK_SNX_b_txAZlNJGX86qjFyHi6FWyMmUwfH38', true),
-- Corte directo CD - INV E-154:2013
(gen_random_uuid(), '41934b7e-68b6-4c45-9196-a7f57a7e7a9c', 'https://docs.google.com/spreadsheets/d/1MMhkVWKnltrliGjW9CToVeGq8rVwFk6INmD5aMXTAFI/edit', '1MMhkVWKnltrliGjW9CToVeGq8rVwFk6INmD5aMXTAFI', true),
-- Módulo resiliente - INV E-156:2013
(gen_random_uuid(), 'a5e52ac3-d84a-46e5-9289-8b4b30c58b29', 'https://docs.google.com/spreadsheets/d/1zlQz6xcvJ7GbGtmzvID1daOIIpHWxeEry7CAvvcuZa0/edit', '1zlQz6xcvJ7GbGtmzvID1daOIIpHWxeEry7CAvvcuZa0', true),
-- Expansión controlada/colapso - ASTM D4546-21
(gen_random_uuid(), '11e6147c-ff37-4132-ad9b-d276d3b3a74e', 'https://docs.google.com/spreadsheets/d/1pK3mmgRiAUesY_eAnSQQh1pw7m5x_b7d97RHCDOScCg/edit', '1pK3mmgRiAUesY_eAnSQQh1pw7m5x_b7d97RHCDOScCg', true),
-- Expansión libre/colapso - ASTM D4546-21
(gen_random_uuid(), 'a8e3351c-887d-45df-9110-1eb46e5d3dea', 'https://docs.google.com/spreadsheets/d/1QkWHm3OBDVnj8WoQUjRApqnxxZBDM-kWNuZFWD4makU/edit', '1QkWHm3OBDVnj8WoQUjRApqnxxZBDM-kWNuZFWD4makU', true),
-- Compresión simple + módulo elasticidad - ASTM D7012-23 Método D
(gen_random_uuid(), '80c5ef5e-b7e9-4c4f-a26e-7d27ff1fcdcc', 'https://docs.google.com/spreadsheets/d/1lLdkzQP22CpFycro3ltlx2ZArnX_i8Sz33nTrzf5HUk/edit', '1lLdkzQP22CpFycro3ltlx2ZArnX_i8Sz33nTrzf5HUk', true),
-- Compresión triaxial roca - ASTM D7012-23 Método C
(gen_random_uuid(), '474c0a07-2f45-4d12-b64c-3aa4ab2ba565', 'https://docs.google.com/spreadsheets/d/19_ONlqvJBFTGKBDT3dNxhneHlWR0ffUUMvC7aEVHOSA/edit', '19_ONlqvJBFTGKBDT3dNxhneHlWR0ffUUMvC7aEVHOSA', true),
-- Triaxial CD - ASTM D7181-20
(gen_random_uuid(), '26c18628-fd82-41b0-9259-309f2f62ea09', 'https://docs.google.com/spreadsheets/d/17D5sFvpJ49RRqfXlGuXzivyPclg8rwTSUc_mgd_yFmg/edit', '17D5sFvpJ49RRqfXlGuXzivyPclg8rwTSUc_mgd_yFmg', true);
