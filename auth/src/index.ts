import fastify from "fastify";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { PrismaClient, User } from "@prisma/client";

declare module "fastify" {
  interface FastifyRequest {
    user: User | null;
  }
}

const SECRET_KEY = process.env.SECRET_KEY;
const PORT = process.env.PORT;

if (!SECRET_KEY || !PORT) {
  throw new Error("Provide a SECRET_KEY and PORT env variables");
}

const prisma = new PrismaClient();
const app = fastify({ logger: true }).decorate("user", null);

app.addHook("preHandler", async (req, reply) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return;
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const validated = decoded as { userId: string };

    const user = await prisma.user.findUnique({
      where: { publicId: validated.userId },
    });

    if (!user) {
      reply.status(403).send({ message: "User not found" });
      return;
    }

    // Attach the decoded user information to the request object
    req.user = user;
  } catch (e: unknown) {
    reply.status(403).send({ message: "Invalid token" });
    return;
  }
});

app.post<{
  Body: {
    email: string;
    username: string;
    password: string;
  };
}>("/register", async (req, reply) => {
  const { username, password, email } = req.body;

  // Hash the password before saving
  const encryptedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: encryptedPassword,
    },
  });

  // PRODUCE: UserCreated

  reply.send({ message: "User registered successfully" });
});

app.post<{
  Body: {
    email: string;
    password: string;
  };
}>("/login", async (req, reply) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    reply.status(401).send({ message: "Invalid email or password" });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    reply.status(401).send({ message: "Invalid email or password" });
    return;
  }

  const token = jwt.sign({ userId: user.publicId }, SECRET_KEY);

  reply.send({ token });
});

app.get("/users", async (req, reply) => {
  if (req.user?.role !== "admin") {
    reply.status(401).send({ message: "Not authorized" });
    return;
  }

  const users = await prisma.user.findMany();

  reply.status(200).send({ users });
});

app.put<{
  Params: { id: number };
  Body: { email: string; username: string; role: string };
}>("/users/:id", async (req, reply) => {
  if (req.user?.role !== "admin") {
    reply.status(401).send({ message: "Not authorized" });
    return;
  }
  const { id: _id } = req.params;

  const id = Number(_id);

  const { email, username, role } = req.body;

  const oldUser = await prisma.user.findUnique({
    where: { id: id },
  });

  if (!oldUser) {
    reply.status(404).send({ message: "User not found" });
    return;
  }

  const roleChanged = oldUser.role !== role;

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      username,
      role,
      email,
    },
  });

  // PRODUCE: UserUpdated

  if (roleChanged) {
    // PRODUCE: UserRoleChanged
  }

  reply.status(200).send({ updatedUser });
});

app.listen({ port: Number(PORT) }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`🚀 Auth server ready at: http://localhost:${PORT}`);
});
