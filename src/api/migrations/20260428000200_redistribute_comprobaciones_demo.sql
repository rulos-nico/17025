-- Redistribuye temporalmente las comprobaciones demo para que abarquen el
-- mismo rango (~2 años) que las 3 calibraciones por sensor, de modo que las
-- líneas verticales de calibración caigan dentro del trazado y la gráfica se
-- vea más orgánica (no concentrada en los últimos 6 meses).
--
-- Estrategia: actualizar in-place los registros CMP-SEN-*-NNN ya creados por
-- la migración 20260428000000, cambiando el espaciado de 7 a 29 días.
-- 25 puntos × 29 días ≈ 725 días → atraviesa las calibraciones a -730d, -365d
-- y la vigente reciente.

UPDATE comprobacion
SET fecha = NOW() - ((25 - CAST(SUBSTRING(id FROM '([0-9]+)$') AS INT)) * INTERVAL '29 days'),
    created_at = NOW() - ((25 - CAST(SUBSTRING(id FROM '([0-9]+)$') AS INT)) * INTERVAL '29 days'),
    updated_at = NOW() - ((25 - CAST(SUBSTRING(id FROM '([0-9]+)$') AS INT)) * INTERVAL '29 days')
WHERE id LIKE 'CMP-SEN-%'
  AND id ~ 'CMP-SEN-[A-Z]+-[0-9]+-[0-9]+$';
