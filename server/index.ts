import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { PORT, CLIENT_URL } from "./config/config";
import fileRoutes from "./routes/fileRoutes";
import { socketHandler } from "./controllers/socketController";
import errorHandler from "./middleware/errorHandler";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());
app.use("/api/files", fileRoutes);
app.use(errorHandler); // Centralized error handling

// Handle WebSockets
io.on("connection", (socket) => socketHandler(socket));

server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
