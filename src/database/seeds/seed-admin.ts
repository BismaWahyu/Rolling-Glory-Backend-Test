import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';

export async function seedAdmin(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(User);
  const username = process.env.ADMIN_USERNAME!;
  const email = process.env.ADMIN_EMAIL!;
  const password = process.env.ADMIN_PASSWORD!;

  const existing = await repo.findOne({ where: [{ username }, { email }] });
  if (existing) {
    console.log(`  • Admin user "${username}" already exists, skipping.`);
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const admin = repo.create({
    username,
    email,
    password: hashed,
    role: Role.ADMIN,
    points: 1_000_000,
  });
  await repo.save(admin);
  console.log(`  • Admin user "${username}" created.`);
}
