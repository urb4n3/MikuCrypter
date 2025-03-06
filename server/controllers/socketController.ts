import { Socket } from "socket.io";

export const socketHandler = (socket: Socket) => {
  console.log("User connected:", socket.id);

  socket.on("encrypt", (data) => {
    console.log(`Encrypt request received for ${data.file}`);
    socket.emit("log", `Encrypting ${data.file}...`);
  });

  socket.on("decrypt", (data) => {
    console.log(`Decrypt request received for ${data.file}`);
    socket.emit("log", `Decrypting ${data.file}...`);
  });

  socket.on("corrupt", (data) => {
    console.log(`Corrupt request received for ${data.file}`);
    socket.emit("log", `Corrupting ${data.file}...`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
};
