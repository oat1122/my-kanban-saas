import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  int,
  boolean,
} from "drizzle-orm/mysql-core";

// Users table
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Boards table
export const boards = mysqlTable("boards", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  userId: varchar("user_id", { length: 36 }).notNull(), // UUID FK
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Columns table
export const columns = mysqlTable("columns", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  name: varchar("name", { length: 255 }).notNull(),
  position: int("position").notNull().default(0),
  boardId: varchar("board_id", { length: 36 }).notNull(), // UUID FK
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Tasks table
export const tasks = mysqlTable("tasks", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  position: int("position").notNull().default(0),
  columnId: varchar("column_id", { length: 36 }).notNull(), // UUID FK
  assigneeId: varchar("assignee_id", { length: 36 }), // UUID FK (optional)
  dueDate: timestamp("due_date"),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
