# Auditorías — Índice

Documentos movidos desde la raíz del repo el 2026-06-10 (Fase 0 del plan maestro).

## Auditorías técnicas

| Documento | Fecha | Contenido |
|-----------|-------|-----------|
| [AUDIT_ARCHITECTURE_2026_05_18.md](AUDIT_ARCHITECTURE_2026_05_18.md) | 2026-05-18 | **La auditoría principal**: veredicto refactor-no-rewrite, hallazgos de seguridad C-1..C-4, plan de 4 semanas. Base del plan maestro actual |
| [AUDITORIA_BASE_DATOS.md](AUDITORIA_BASE_DATOS.md) | 2026-05 | Auditoría completa del schema Supabase |
| [DB_AUDIT_SUMMARY.md](DB_AUDIT_SUMMARY.md) | 2026-05 | Resumen ejecutivo de la auditoría de BD |
| [AUDIT_DEMO_2026_05_17.md](AUDIT_DEMO_2026_05_17.md) | 2026-05-17 | Auditoría pre-demo Tec de Monterrey |
| [AUDITORIA_VISUAL.txt](AUDITORIA_VISUAL.txt) | 2026-05 | Auditoría visual/UX |
| [AUDITORIA_INDEX.md](AUDITORIA_INDEX.md) | 2026-05 | Índice de la serie de auditorías de mayo |
| [REPORTE_AUDITORIAS.md](REPORTE_AUDITORIAS.md) | 2026-05 | Reporte consolidado |
| [BACKEND_FIXES_REQUIRED.md](BACKEND_FIXES_REQUIRED.md) | 2026-05 | Fixes de backend identificados |
| [marketing_audit.md](marketing_audit.md) | 2026-05 | Auditoría de marketing |
| [scalability_analysis.md](scalability_analysis.md) | 2026-04 | Análisis de escalabilidad (costos IA, colas, MoR) |

## SQL legacy (`legacy-sql/` — NO aplicar, solo referencia)

- `DB_MIGRATION_SQL.sql` — script monolítico pre-consolidación; contiene RPCs (`increment_landing_views`) aún no portados a migrations numeradas.
- `SQL_AUTOMATION.sql`, `setup_admin.sql` — scripts sueltos históricos.

La fuente única de migrations es ahora [`supabase/migrations/`](../../supabase/migrations/README.md).

## Documentos vivos relacionados

- Plan maestro vigente: [docs/superpowers/plans/2026-06-10-plan-maestro-refactor-modular.md](../superpowers/plans/2026-06-10-plan-maestro-refactor-modular.md)
- Spec de separación B2B: [docs/superpowers/specs/2026-06-01-estabilizacion-y-separacion-b2b-design.md](../superpowers/specs/2026-06-01-estabilizacion-y-separacion-b2b-design.md)
- Historia del proyecto (estados de sesión, checklists, guiones de demo): [docs/history/](../history/)
