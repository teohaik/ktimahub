/**
 * One-time script: grants teohaik@gmail.com the SUPER_ADMIN (+ LAND_OWNER) roles.
 * Run with: npx tsx --env-file=.env.local scripts/set-super-admin.ts
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const db = new PrismaClient({ adapter });

async function main() {
  const email = "teohaik@gmail.com";

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User ${email} not found.`);
    process.exit(1);
  }

  const updated = await db.user.update({
    where: { email },
    data: { roles: ["SUPER_ADMIN", "LAND_OWNER"] },
  });

  console.log(`Updated roles for ${email}:`, updated.roles);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
