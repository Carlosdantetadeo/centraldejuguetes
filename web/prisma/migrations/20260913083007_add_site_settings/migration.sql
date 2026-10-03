-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "siteName" TEXT NOT NULL DEFAULT 'Mi Catálogo',
    "siteDescription" TEXT NOT NULL DEFAULT 'Catálogo de productos con cotización por WhatsApp.',
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "ogImageUrl" TEXT,
    "brandColor" TEXT NOT NULL DEFAULT '#64717a',
    "brandColorDark" TEXT,
    "whatsappNumber" TEXT NOT NULL DEFAULT '',
    "phone" TEXT,
    "address" TEXT,
    "socialFacebook" TEXT,
    "socialInstagram" TEXT,
    "socialTiktok" TEXT,
    "footerTagline" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "locale" TEXT NOT NULL DEFAULT 'es-PE',
    "country" TEXT NOT NULL DEFAULT 'PE',
    "priceLabel" TEXT NOT NULL DEFAULT 'Precio incluye impuestos',
    "priceNote" TEXT NOT NULL DEFAULT 'Precio referencial, cotización final por WhatsApp.',
    "legalEntity" TEXT,
    "legalText" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
