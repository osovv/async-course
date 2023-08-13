import fastify from "fastify";
import jwt from "jsonwebtoken";
import { PrismaClient, User } from "@prisma/client";
import { getRandomElement } from "./utils";

declare module "fastify" {
  interface FastifyRequest {
    user: User;
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
    reply.status(403).send({ message: "No token present!" });
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

app.get("/tasks", async (req, reply) => {
  const tasks = await prisma.task.findMany();

  reply.status(200).send({ tasks });
});

app.get<{ Params: { id: string } }>("/tasks/:id", async (req, reply) => {
  const { id: _id } = req.params;

  const id = Number(_id);

  const task = await prisma.task.findUnique({ where: { id } });

  if (!task) {
    reply.status(404).send({ message: "Not found" });
    return;
  }

  reply.status(200).send(task);
});

app.post<{
  Body: {
    title: string;
    description: string;
  };
}>("/tasks", async (req, reply) => {
  const possibleAssigneeIds = await prisma.user.findMany({
    select: {
      publicId: true,
    },
    where: {
      NOT: {
        role: {
          in: ["admin", "manager"],
        },
      },
    },
  });

  const { title, description } = req.body;

  const assigneeId = getRandomElement(possibleAssigneeIds).publicId;

  const task = await prisma.task.create({
    data: {
      title,
      description,
      userId: assigneeId,
      status: "in-progress",
    },
  });

  // PRODUCE: TaskCreated

  // PRODUCE: TaskAssigned

  reply.status(200).send(task);
});

app.listen({ port: Number(PORT) }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`🚀 Task Tracker server ready at: http://localhost:${PORT}`);
});
