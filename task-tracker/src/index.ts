import fastify from "fastify";
import jwt from "jsonwebtoken";
import { PrismaClient, User } from "@prisma/client";

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

app.listen({ port: Number(PORT) }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`🚀 Task Tracker server ready at: http://localhost:${PORT}`);
});
