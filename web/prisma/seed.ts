import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Fila singleton de configuración con valores neutros (plantilla white-label).
  // El admin la personaliza desde /admin/configuracion. update:{} → no pisa lo
  // ya configurado en re-seeds.
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  // Admin inicial. Credenciales por env; cambiar tras el primer login.
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_PASSWORD ?? "Cambiar123456";

  await prisma.admin.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: await bcrypt.hash(password, 12),
    },
  });

  // La plantilla arranca SIN categorías ni productos: cada instancia crea los
  // suyos desde el panel. (Regla de gobernanza: no publicar categorías vacías;
  // el grid ya oculta las que no tienen productos.)

  console.log("Seed completado.");
  console.log(`Admin: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
