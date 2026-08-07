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
  return res.status(200).json({message : "Good to go"})
})
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

// 3. Socket.IO Signaling Server Setup
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
