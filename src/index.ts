// import "dotenv/config";
// import express from "express";
// import type { Request, Response } from "express";
// import http from "http";
// import { Server } from "socket.io";
// import cors from "cors";
// import { eq, ilike, and } from "drizzle-orm";
// import { db } from "./db/index.js";
// import { users, counselorProfiles, appointments } from "./db/schema.js";

// const app = express();
// const server = http.createServer(app);

// app.use(cors());
// app.use(express.json());

// // 1. Search Counselors Route
// app.get("/api/counselors", async (req: Request, res: Response) => {
//   const { search } = req.query;

//   try {
//     const conditions = [
//       eq(users.role, "counselor"),
//       eq(counselorProfiles.isVerified, true),
//     ];

//     if (search && typeof search === "string") {
//       conditions.push(ilike(users.name, `%${search}%`));
//     }

//     const result = await db
//       .select({
//         id: users.id,
//         name: users.name,
//         email: users.email,
//         bio: counselorProfiles.bio,
//         specialties: counselorProfiles.specialties,
//         hourlyRate: counselorProfiles.hourlyRate,
//         profileImageUrl: counselorProfiles.profileImageUrl,
//       })
//       .from(users)
//       .innerJoin(counselorProfiles, eq(users.id, counselorProfiles.userId))
//       .where(and(...conditions));

//     res.json({ success: true, counselors: result });
//   } catch (err) {
//     console.error(err);
//     res
//       .status(500)
//       .json({ success: false, message: "Server error searching counselors" });
//   }
// });

// app.get("/", (req: Request, res: Response) => {
//   return res.status(200).json({message : "Good to go"})
// })
// // 2. Verify Secret Room Code Route
// app.post("/api/verify-room", async (req: Request, res: Response) => {
//   const { roomCode, userId } = req.body;

//   try {
//     const [appointment] = await db
//       .select()
//       .from(appointments)
//       .where(eq(appointments.roomCode, roomCode));

//     if (!appointment) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Invalid or incorrect secret code." });
//     }

//     if (
//       userId !== undefined &&
//       appointment.clientId !== userId &&
//       appointment.counselorId !== userId
//     ) {
//       return res.status(403).json({
//         success: false,
//         message: "Unauthorized access to this session.",
//       });
//     }

//     res.json({ success: true, roomId: appointment.roomCode });
//   } catch (err) {
//     console.error(err);
//     res
//       .status(500)
//       .json({ success: false, message: "Server verification error" });
//   }
// });

// // Trial/Test User Creation Route
// app.post("/api/test/create-user", async (req: Request, res: Response) => {
//   const { name, email, role, bio, specialties, hourlyRate } = req.body;

//   try {
//     // 1. Insert the user (using a dummy password hash since it's just for testing)
//     const [newUser] = await db
//       .insert(users)
//       .values({
//         name: name || "Test User",
//         email: email || `test-${Date.now()}@example.com`,
//         passwordHash: "dummy_hash_for_testing",
//         role: role || "client", // 'client' or 'counselor'
//       })
//       .returning();

//     let profile = null;

//     // 2. If they are a counselor, create a verified counselor profile automatically
//     if (newUser.role === "counselor") {
//       [profile] = await db
//         .insert(counselorProfiles)
//         .values({
//           userId: newUser.id,
//           bio: bio || "Default testing bio.",
//           specialties: specialties || ["General", "Testing"],
//           hourlyRate: hourlyRate || "100.00",
//           isVerified: true, // auto-verify for testing search
//         })
//         .returning();
//     }

//     res.status(201).json({
//       success: true,
//       message: "Test user created successfully",
//       user: newUser,
//       counselorProfile: profile,
//     });
//   } catch (err: any) {
//     console.error("Error creating test user:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error creating test user",
//       error: err.message,
//     });
//   }
// });
// // 3. Socket.IO Signaling Server Setup
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });

// io.on("connection", (socket) => {
//   let currentRoom: string | null = null;

//   socket.on("join-room", (roomCode: string) => {
//     currentRoom = roomCode;
//     socket.join(roomCode);
//     socket.to(roomCode).emit("user-connected", socket.id);
//   });

//   socket.on("signal", (data: { roomCode: string; signal: any }) => {
//     socket.to(data.roomCode).emit("signal", data.signal);
//   });

//   socket.on("disconnect", () => {
//     if (currentRoom) {
//       socket.to(currentRoom).emit("user-disconnected", socket.id);
//     }
//   });
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { eq, ilike, and } from "drizzle-orm";
import { db } from "./db/index.js";
import { users, counselorProfiles, appointments } from "./db/schema.js";

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// 1. Search Counselors Route
app.get("/api/counselors", async (req: Request, res: Response) => {
  const { search } = req.query;

  try {
    const conditions = [
      eq(users.role, "counselor"),
      eq(counselorProfiles.isVerified, true),
    ];

    if (search && typeof search === "string") {
      conditions.push(ilike(users.name, `%${search}%`));
    }

    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        bio: counselorProfiles.bio,
        specialties: counselorProfiles.specialties,
        hourlyRate: counselorProfiles.hourlyRate,
        profileImageUrl: counselorProfiles.profileImageUrl,
      })
      .from(users)
      .innerJoin(counselorProfiles, eq(users.id, counselorProfiles.userId))
      .where(and(...conditions));

    res.json({ success: true, counselors: result });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Server error searching counselors" });
  }
});

app.get("/", (req: Request, res: Response) => {
  return res.status(200).json({ message: "Good to go" });
});

// 2. Verify Secret Room Code Route
app.post("/api/verify-room", async (req: Request, res: Response) => {
  const { roomCode, userId } = req.body;

  try {
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.roomCode, roomCode));

    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid or incorrect secret code." });
    }

    if (
      userId !== undefined &&
      appointment.clientId !== userId &&
      appointment.counselorId !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to this session.",
      });
    }

    res.json({ success: true, roomId: appointment.roomCode });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Server verification error" });
  }
});

// 3. Trial/Test User Creation Route
app.post("/api/test/create-user", async (req: Request, res: Response) => {
  const { name, email, role, bio, specialties, hourlyRate } = req.body;

  try {
    const userEmail = email || `test-${Date.now()}@example.com`;
    const userRole = role || "client";
    const userName = name || "Test User";

    const [newUser] = await db
      .insert(users)
      .values({
        name: userName,
        email: userEmail,
        passwordHash: "dummy_hash_for_testing",
        role: userRole,
      })
      .returning();

    if (!newUser) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to create user record" });
    }

    let profile = null;

    if (newUser.role === "counselor") {
      [profile] = await db
        .insert(counselorProfiles)
        .values({
          userId: newUser.id,
          bio: bio || "Default testing bio.",
          specialties: specialties || ["General", "Testing"],
          hourlyRate: hourlyRate || "100.00",
          isVerified: true,
        })
        .returning();
    }

    res.status(201).json({
      success: true,
      message: "Test user created successfully",
      user: newUser,
      counselorProfile: profile,
    });
  } catch (err: any) {
    console.error("Error creating test user:", err);
    res.status(500).json({
      success: false,
      message: "Server error creating test user",
      error: err.message,
    });
  }
});

// 4. Register a New Client Route
app.post("/api/auth/register-client", async (req: Request, res: Response) => {
  const { name, email, passwordHash } = req.body;

  try {
    const userEmail = email || `client-${Date.now()}@example.com`;

    const [newClient] = await db
      .insert(users)
      .values({
        name: name || "Test Client",
        email: userEmail,
        passwordHash: passwordHash || "dummy_client_password_hash",
        role: "client",
      })
      .returning();

    if (!newClient) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to register client" });
    }

    res.status(201).json({
      success: true,
      message: "Client registered successfully",
      user: newClient,
    });
  } catch (err: any) {
    console.error("Error registering client:", err);
    res.status(500).json({
      success: false,
      message: "Server error registering client",
      error: err.message,
    });
  }
});

// 5. Book a Counseling Session Route
app.post("/api/appointments/book", async (req: Request, res: Response) => {
  const { clientId, counselorId, appointmentTime } = req.body;

  try {
    if (!clientId || !counselorId || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: clientId, counselorId, or appointmentTime",
      });
    }

    // Generate a secure, unique random room code
    const roomCode = `ROOM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const [newAppointment] = await db
      .insert(appointments)
      .values({
        clientId: Number(clientId),
        counselorId: Number(counselorId),
        appointmentTime: new Date(appointmentTime),
        roomCode: roomCode,
        status: "scheduled",
      })
      .returning();

    if (!newAppointment) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to book appointment" });
    }

    res.status(201).json({
      success: true,
      message: "Session booked successfully",
      appointment: newAppointment,
      roomCode: roomCode,
    });
  } catch (err: any) {
    console.error("Error booking session:", err);
    res.status(500).json({
      success: false,
      message: "Server error booking session",
      error: err.message,
    });
  }
});

// 6. Socket.IO Signaling Server Setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  let currentRoom: string | null = null;

  socket.on("join-room", (roomCode: string) => {
    currentRoom = roomCode;
    socket.join(roomCode);
    socket.to(roomCode).emit("user-connected", socket.id);
  });

  socket.on("signal", (data: { roomCode: string; signal: any }) => {
    socket.to(data.roomCode).emit("signal", data.signal);
  });

  socket.on("disconnect", () => {
    if (currentRoom) {
      socket.to(currentRoom).emit("user-disconnected", socket.id);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});