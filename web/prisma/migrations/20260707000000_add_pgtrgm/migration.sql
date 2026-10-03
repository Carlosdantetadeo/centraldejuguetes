-- Habilita búsqueda fuzzy con similarity() para el buscador del catálogo.
-- Requiere Postgres >= 9.1. En Supabase está disponible en todos los planes.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
