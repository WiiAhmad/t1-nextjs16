import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Example table - you can modify this according to your needs
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// You can add more tables here as needed
// export const posts = sqliteTable('posts', { ... });
