-- =============================================================================
-- Seed: Datos demo de equipos (subset PoC)
-- =============================================================================
-- Subset de 20260428000000_seed_equipos_demo_data.sql limitado a la tabla
-- equipos para validar el módulo en la PoC. Los seeds de sensores,
-- calibraciones y comprobaciones se portarán en fases posteriores junto
-- con sus respectivas tablas y funciones.
-- =============================================================================
-- Fase A.0: la PK `id` es UNIQUEIDENTIFIER. Los códigos legibles
-- (EQ-BAL-001, etc.) viven en la columna `codigo`. Los GUIDs aquí son
-- estables (hardcodeados) para que tests/seeds/refs entre migraciones
-- siempre referencien el mismo equipo.
-- =============================================================================

MERGE dbo.equipos AS target
USING (VALUES
    (CAST('11111111-1111-1111-1111-000000000001' AS UNIQUEIDENTIFIER), 'EQ-BAL-001', N'Balanza analítica',  'SAR-MS204-2024', N'Sartorius', 'MS204',   N'Laboratorio Físicos', 'disponible', N'Balanza analítica de precisión 0.0001 g',     N'Demo Técnico', CAST(1 AS BIT)),
    (CAST('11111111-1111-1111-1111-000000000002' AS UNIQUEIDENTIFIER), 'EQ-HRN-001', N'Horno de secado',    'MEM-UF55-2023',  N'Memmert',   'UF55',    N'Laboratorio Suelos',  'disponible', N'Horno universal de secado hasta 250 °C',      N'Demo Técnico', CAST(1 AS BIT)),
    (CAST('11111111-1111-1111-1111-000000000003' AS UNIQUEIDENTIFIER), 'EQ-PRN-001', N'Prensa CBR',         'ELE-2150-2022',  N'ELE',       '26-2150', N'Laboratorio Suelos',  'disponible', N'Prensa de compresión 50 kN para CBR',         N'Demo Técnico', CAST(1 AS BIT))
) AS source (id, codigo, nombre, serie, marca, modelo, ubicacion, estado, descripcion, responsable, activo)
ON target.id = source.id
WHEN NOT MATCHED BY TARGET THEN
    INSERT (id, codigo, nombre, serie, marca, modelo, ubicacion, estado, descripcion, responsable, activo, sync_source)
    VALUES (source.id, source.codigo, source.nombre, source.serie, source.marca, source.modelo,
            source.ubicacion, source.estado, source.descripcion, source.responsable, source.activo, 'db');
GO
