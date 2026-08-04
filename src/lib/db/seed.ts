import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { users } from "./schema";

async function main() {
  const name = process.env.SEED_ADMIN_NAME;
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      "SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, and SEED_ADMIN_PASSWORD must be set in .env",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const normalizedEmail = email.toLowerCase();

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing) {
    await db
      .update(users)
      .set({ name, passwordHash, role: "admin", isActive: true })
      .where(eq(users.id, existing.id));
    console.log(`Updated existing admin account: ${normalizedEmail}`);
  } else {
    await db.insert(users).values({
      name,
      email: normalizedEmail,
      passwordHash,
      role: "admin",
    });
    console.log(`Created admin account: ${normalizedEmail}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
