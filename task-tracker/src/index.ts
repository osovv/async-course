import fastify from "fastify";
import jwt from "jsonwebtoken";
import { PrismaClient, User } from "@prisma/client";
import { getRandomElement } from "./utils";
import { fastifyGracefulShutdown } from "fastify-graceful-shutdown";
import { Kafka, Message } from "kafkajs";

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
async function main({ secretKey, port }: { secretKey: string; port: number }) {
  const kafka = new Kafka({
    clientId: "task-tracker",
    brokers: ["localhost:9092"],
  });

  const makeMessage = (event_name: string, data: unknown): Message => {
    const event = {
      event_name,
      data,
    };

    return { value: JSON.stringify(event) };
  };

  const prisma = new PrismaClient();
  const app = fastify({ logger: true }).decorate("user", null);
  app.register(fastifyGracefulShutdown);

  const consumer = kafka.consumer({ groupId: "task-tracker-group" });
  await consumer.connect();

  const producer = kafka.producer();
  await producer.connect();

  app.after(() => {
    app.gracefulShutdown(async (signal, next) => {
      console.log("Upps!");
      await consumer.disconnect();
      await producer.disconnect();
      next();
    });
  });

  await consumer.subscribe({ topics: ["users-stream", "users"] });

  await consumer.run({
    eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
      if (message.value === null) {
        console.error("empty event");
        return;
      }

      const content = message?.value.toString();
      const event = JSON.parse(content);

      console.log("NEW MESSAGE ARRIVED", topic, event);

      if (topic === "users-stream") {
        switch (event?.event_name) {
          case "user_created":
            const user = await prisma.user.create({ data: event.data });
            console.log("CREATED USER", user);
            break;
          case "user_updated":
            await prisma.user.update({
              where: { publicId: event?.data.publicId },
              data: {
                email: event?.data.email,
                username: event?.data.username,
                updatedAt: event?.data.updatedAt,
              },
            });
            break;
          default:
            console.warn(`Unknown users-stream event: ${event?.event_name}`);
        }
      }

      if (topic === "users") {
        switch (event?.event_name) {
          case "user_role_changed":
            const user = await prisma.user.update({
              where: { publicId: event.data.publicId },
              data: {
                role: event.data.role,
              },
            });
            break;
          default:
            console.warn(`Unknown users-stream event: ${event?.event_name}`);
        }
      }
    },
  });

  app.addHook("preHandler", async (req, reply) => {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      reply.status(403).send({ message: "No token present!" });
      return;
    }

    try {
      const decoded = jwt.verify(token, secretKey);
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

  app.patch<{
    Params: { id: string };
    Body: { status?: "completed"; title?: string; description?: string };
  }>("/tasks/:id", async (req, reply) => {
    const { id: _id } = req.params;
    const id = Number(_id);
    const { status, title, description } = req.body;
    const patch = { status, title, description };

    const oldTask = await prisma.task.findUnique({
      where: { id: id },
    });

    if (!oldTask) {
      reply.status(404).send({ message: "Task not found" });
      return;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: patch,
    });

    const taskCompleted =
      oldTask.status === "in-progress" && updatedTask.status === "completed";

    if (taskCompleted) {
      await producer.send({
        topic: "tasks",
        messages: [
          makeMessage("task_completed", {
            publicId: updatedTask.publicId,
            assigneeId: updatedTask.userId,
          }),
        ],
      });
    }
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

    await producer.send({
      topic: "tasks",
      messages: [
        makeMessage("task_created", {
          title: task.title,
          description: task.description,
          publicId: task.publicId,
          status: task.status,
          assigneeId: task.userId,
        }),
      ],
    });

    // PRODUCE: TaskAssigned

    await producer.send({
      topic: "tasks",
      messages: [
        makeMessage("task_assigned", {
          publicId: task.publicId,
          assigneeId: task.userId,
        }),
      ],
    });

    reply.status(200).send(task);
  });

  app.listen({ port }, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`🚀 Task Tracker server ready at: http://localhost:${PORT}`);
  });
}

main({ secretKey: SECRET_KEY, port: Number(PORT) });
