import request from "supertest";
import { prisma } from "@/database/Prisma";
import { App } from "@/App";

describe("Auth flow - guest restriction", () => {
  afterAll(async () => {
    await prisma.revokedToken.deleteMany();
    await prisma.client.deleteMany();
    await prisma.$disconnect();
  });

  it("should block logged user from creating a new client, but allow after logout", async () => {
    
    const createResponse1 = await request(App)
      .post("/clients")
      .send({
        name: "Alice Doe",
        email: "alice@example.com",
        password: "password123",
      });

    expect(createResponse1.status).toBe(201);

    const loginResponse = await request(App)
      .post("/login")
      .send({
        email: "alice@example.com",
        password: "password123",
      });

    expect(loginResponse.status).toBe(200);
    const { token } = loginResponse.body;

    const createResponse2 = await request(App)
      .post("/clients")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Bob Doe",
        email: "bob@example.com",
        password: "password123",
      });

    expect(createResponse2.status).toBe(403);
    expect(createResponse2.body).toHaveProperty(
      "message",
      "Usuário já autenticado. Faça logout antes de criar outra conta."
    );

    const logoutResponse = await request(App)
      .post("/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(logoutResponse.status).toBe(200);

    const createResponse3 = await request(App)
      .post("/clients")
      .send({
        name: "Charlie Doe",
        email: "charlie@example.com",
        password: "password123",
      });

    expect(createResponse3.status).toBe(201);
  });
});
