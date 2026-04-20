import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1713600000000 implements MigrationInterface {
  name = 'InitialSchema1713600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // users
    await queryRunner.query(`
      CREATE TYPE "users_role_enum" AS ENUM ('admin', 'user')
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "username" varchar(50) NOT NULL,
        "email" varchar(150) NOT NULL,
        "password" varchar(255) NOT NULL,
        "points" int NOT NULL DEFAULT 0,
        "role" "users_role_enum" NOT NULL DEFAULT 'user',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_username" ON "users" ("username")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email")`);

    // gifts
    await queryRunner.query(`
      CREATE TABLE "gifts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(200) NOT NULL,
        "description" text,
        "image" varchar(500),
        "stock" int NOT NULL DEFAULT 0,
        "points_required" int NOT NULL DEFAULT 0,
        "is_hot" boolean NOT NULL DEFAULT false,
        "is_new" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_gifts_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_gifts_name" ON "gifts" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_gifts_stock" ON "gifts" ("stock")`);
    await queryRunner.query(`CREATE INDEX "IDX_gifts_created_at" ON "gifts" ("created_at")`);

    // redemptions
    await queryRunner.query(`
      CREATE TABLE "redemptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "gift_id" uuid NOT NULL,
        "quantity" int NOT NULL DEFAULT 1,
        "points_spent" int NOT NULL DEFAULT 0,
        "redeemed_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_redemptions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_redemptions_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_redemptions_gift" FOREIGN KEY ("gift_id") REFERENCES "gifts" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_redemptions_user_gift" ON "redemptions" ("user_id", "gift_id")`);

    // ratings
    await queryRunner.query(`
      CREATE TABLE "ratings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "gift_id" uuid NOT NULL,
        "redemption_id" uuid NOT NULL,
        "rating" numeric(3,2) NOT NULL,
        "review" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ratings_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_ratings_range" CHECK ("rating" >= 0 AND "rating" <= 5),
        CONSTRAINT "FK_ratings_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ratings_gift" FOREIGN KEY ("gift_id") REFERENCES "gifts" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ratings_redemption" FOREIGN KEY ("redemption_id") REFERENCES "redemptions" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_ratings_user_gift" ON "ratings" ("user_id", "gift_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_ratings_gift_id" ON "ratings" ("gift_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ratings"`);
    await queryRunner.query(`DROP TABLE "redemptions"`);
    await queryRunner.query(`DROP TABLE "gifts"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
  }
}
