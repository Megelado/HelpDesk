import request from "supertest";
import { prisma } from "@/database/Prisma";

import { App } from "@/App";

import { hash } from "bcrypt";

let superAdminToken: string;

beforeAll(async () => {

  await prisma.called.deleteMany();
  await prisma.technician.deleteMany();
  await prisma.client.deleteMany();
  await prisma.admin.deleteMany();

  const hashedPasswordAdmin = await hash("admin123", 8);
  await prisma.admin.create({
    data: {
      name: "Super Admin",
      email: "superadmin@email.com",
      password: hashedPasswordAdmin,
    },
  });

  const loginResponse = await request(App).post("/login").send({
    email: "superadmin@email.com",
    password: "admin123",
  });

  superAdminToken = loginResponse.body.token;
  expect(superAdminToken).toBeDefined();
});

afterAll(async () => {
  await prisma.admin.deleteMany();
  await prisma.service.deleteMany();
  await prisma.$disconnect();
});

describe("ServicesController", () => {
  afterAll(async () => {
    await prisma.service.deleteMany();
    await prisma.$disconnect();
  });

  it("Create new service", async () => {
    const loginResponse = await request(App)
      .post("/login")
      .send({
        email: "superadmin@email.com",
        password: "admin123",
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty("token");

    const response = await request(App)
      .post("/services").set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        title: "Instalação e atualização de softwares",
        price: 189.90,
        active: false
      });

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty("title")
    expect(response.body).toHaveProperty("price")

  })

  it("should list only active services", async () => {
    const loginResponse = await request(App)
      .post("/login")
      .send({
        email: "superadmin@email.com",
        password: "admin123",
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty("token");

    const token = loginResponse.body.token;

    // Cria serviço ativo
    const activeService = await request(App)
      .post("/services")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Serviço Ativo",
        price: 150,
        active: true,
      });
    expect(activeService.status).toBe(201);

    // Cria serviço inativo
    const inactiveService = await request(App)
      .post("/services")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Serviço Inativo",
        price: 200,
        active: false,
      });
    expect(inactiveService.status).toBe(201);

    // Lista serviços
    const response = await request(App)
      .get("/services")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    // Verifica que existe o serviço ativo
    expect(response.body.some((s: any) => s.title === "Serviço Ativo" && s.active === true)).toBe(true);

    // Verifica que não existe o serviço inativo
    expect(response.body.some((s: any) => s.title === "Serviço Inativo")).toBe(true);
  });


  it("update a service", async () => {
    const loginResponse = await request(App)
      .post("/login")
      .send({
        email: "superadmin@email.com",
        password: "admin123",
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty("token");

    const token = loginResponse.body.token;

    const activeService = await request(App)
      .post("/services")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Instalação e atualização de hardwares",
        price: 150,
      });

    expect(activeService.status).toBe(201);

    const response = await request(App)
      .patch(`/services/${activeService.body.id}`)
      .set("Authorization", `Bearer ${token}`).send({
        title: "Suporte a periféricos"
      });

    expect(response.status).toBe(200)
    expect(response.body.title).toEqual("Suporte a periféricos")
  })

  it("should soft delete a service", async () => {
    const loginResponse = await request(App)
      .post("/login")
      .send({
        email: "superadmin@email.com",
        password: "admin123",
      });

    expect(loginResponse.status).toBe(200);
    const token = loginResponse.body.token;

    const createResponse = await request(App)
      .post("/services")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Serviço para desativar",
        price: 100,
        active: true,
      });

    expect(createResponse.status).toBe(201);

    const deleteResponse = await request(App)
      .delete(`/services/${createResponse.body.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.active).toBe(false);

    const listResponse = await request(App)
      .get("/services")
      .set("Authorization", `Bearer ${token}`);

    const titles = listResponse.body.map((s: any) => s.title);
    expect(titles).toContain("Serviço para desativar");
  });

  it("Delete a service", async () => {
    const loginResponse = await request(App)
      .post("/login")
      .send({
        email: "superadmin@email.com",
        password: "admin123",
      });

    expect(loginResponse.status).toBe(200);
    const token = loginResponse.body.token;

    const createResponse = await request(App)
      .post("/services")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Serviço para deletar",
        price: 100,
        active: true,
      });

    expect(createResponse.status).toBe(201);

    const deleteResponse = await request(App)
      .delete(`/services/${createResponse.body.id}/delete`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteResponse.status).toBe(200);

    const listResponse = await request(App)
      .get("/services")
      .set("Authorization", `Bearer ${token}`);

    const titles = listResponse.body.map((s: any) => s.title);
    expect(titles).not.toContain("Serviço para deletar");
  })

})
