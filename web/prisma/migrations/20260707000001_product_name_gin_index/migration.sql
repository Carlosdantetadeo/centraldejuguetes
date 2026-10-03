-- Índice GIN trigrama en Product.name para que similarity() use el índice
-- en vez de hacer seq-scan. Requiere que pg_trgm esté activa (migración anterior).
CREATE INDEX IF NOT EXISTS idx_product_name_trgm
  ON "Product" USING gin (name gin_trgm_ops);
