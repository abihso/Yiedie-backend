// src/db/schema.ts
import { pgTable, serial, text, timestamp, decimal, boolean, integer, } from "drizzle-orm/pg-core";
// 1. Users table (Handles clients, counselors, and admins)
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull(), // 'client', 'counselor', 'admin'
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
// 2. Counselor Profiles table (Extended professional details)
export const counselorProfiles = pgTable("counselor_profiles", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    bio: text("bio"),
    specialties: text("specialties").array(), // PostgreSQL array of text
    hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
    isVerified: boolean("is_verified").default(false).notNull(),
    profileImageUrl: text("profile_image_url"),
});
// 3. Appointments table (Links clients, counselors, and secret room codes)
export const appointments = pgTable("appointments", {
    id: serial("id").primaryKey(),
    clientId: integer("client_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    counselorId: integer("counselor_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    appointmentTime: timestamp("appointment_time").notNull(),
    roomCode: text("room_code").notNull().unique(),
    status: text("status").default("scheduled").notNull(), // scheduled, in-progress, completed, cancelled
});
//# sourceMappingURL=schema.js.map