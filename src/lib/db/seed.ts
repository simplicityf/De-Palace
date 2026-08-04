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
    // Non-fatal: this runs on every deploy, and a missing seed var (e.g. if
    // it's intentionally removed after the admin account already exists)
    // shouldn't block deploying the app itself.
    console.warn(
      "SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, and SEED_ADMIN_PASSWORD are not all set — skipping admin seed.",
    );
    return;
  }

  const normalizedEmail = email.toLowerCase();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing) {
    // Intentionally a no-op if the account already exists: this script runs
    // on every deploy, and must not clobber a password the admin has since
    // changed via /admin/account. To force-reset, delete the account first.
    console.log(`Admin account already exists, skipping: ${normalizedEmail}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(users).values({
    name,
    email: normalizedEmail,
    passwordHash,
    role: "admin",
  });
  console.log(`Created admin account: ${normalizedEmail}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
