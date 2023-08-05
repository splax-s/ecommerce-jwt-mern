import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { createServer, Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({
  path: "./.env",
});

const app: Express = express();
const server: HTTPServer = createServer(app);
const io: Server = new Server(server);

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello world from socket server!");
});

interface User {
  userId: string;
  socketId: string;
}

let users: User[] = [];

const addUser = (userId: string, socketId: string) => {
  !users.some((user: User) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId: string) => {
  users = users.filter((user: User) => user.socketId !== socketId);
};

const getUser = (receiverId: string) => {
  return users.find((user: User) => user.userId === receiverId);
};

interface MessageInput {
  senderId: string;
  receiverId: string;
  text: string;
  images: string[];
}

interface Message extends MessageInput {
  id: string;
  seen: boolean;
}

const createMessage = ({ senderId, receiverId, text, images }: MessageInput): Message => ({
  senderId,
  receiverId,
  text,
  images,
  seen: false,
  id: uuidv4(),
});

io.on("connection", (socket: Socket) => {
  console.log(`a user is connected`);

  socket.on("addUser", (userId: string) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  let messages: { [key: string]: Message[] } = {};

  socket.on("sendMessage", ({ senderId, receiverId, text, images }: MessageInput) => {
    const message: Message = createMessage({senderId, receiverId, text, images });
    const user: User | undefined = getUser(receiverId);
    if (!messages[receiverId]) {
      messages[receiverId] = [message];
    } else {
      messages[receiverId].push(message);
    }
    if (user) {
      io.to(user.socketId).emit("getMessage", message);
    }
  });

  socket.on("messageSeen", ({ senderId, receiverId, messageId }: { senderId: string, receiverId: string, messageId: string }) => {
    const user: User | undefined = getUser(senderId);
    if (messages[senderId]) {
      const message: Message | undefined = messages[senderId].find(
        (message: Message) =>
          message.receiverId === receiverId && message.id === messageId
      );
      if (message) {
        message.seen = true;
        if (user) {
          io.to(user.socketId).emit("messageSeen", {
            senderId,
            receiverId,
            messageId,
          });
        }
      }
    }
  });

  socket.on("updateLastMessage", ({ lastMessage, lastMessagesId }: { lastMessage: string, lastMessagesId: string }) => {
    io.emit("getLastMessage", {
      lastMessage,
      lastMessagesId,
    });
  });

  socket.on("disconnect", () => {
    console.log(`a user disconnected!`);
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});

const PORT: string | number = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
