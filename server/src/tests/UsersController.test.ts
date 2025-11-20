import request from "supertest";
import { prisma } from "@/database/Prisma";

import { App } from "@/App";

import { hash } from "bcrypt";

import fs from "fs";

let superAdminToken: string;

beforeAll(async () => {

  await prisma.called.deleteMany();
  await prisma.technician.deleteMany();
  await prisma.client.deleteMany();
  await prisma.admin.deleteMany();

  const hashedPassword = await hash("admin123", 8);
  await prisma.admin.create({
    data: {
      name: "Super Admin",
      email: "superadmin@email.com",
      password: hashedPassword,
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
  await prisma.called.deleteMany();
  await prisma.technician.deleteMany();
  await prisma.client.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.$disconnect();
});
describe("AdminsController", () => {

  it("should create a new admin", async () => {
    const response = await request(App)
      .post("/admins").set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        name: "John Doe",
        email: "JohnDoeAdmin@email.com",
        password: "123456",
        hashedPassword: await hash("123456", 8),
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("name", "John Doe");
    expect(response.body).toHaveProperty("email", "JohnDoeAdmin@email.com");
    expect(response.body).not.toHaveProperty("password");
  });

  it("should list all admins", async () => {
    const loginResponse = await request(App)
      .post("/login")
      .send({
        email: "superadmin@email.com",
        password: "admin123",
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty("token");

    const token = loginResponse.body.token;

    const indexResponse = await request(App)
      .get(`/admins`)
      .set("Authorization", `Bearer ${token}`)

    expect(indexResponse.status).toBe(200);
    expect(Array.isArray(indexResponse.body)).toBe(true);
  });

  it("should update a admin", async () => {
    const createResponse = await request(App)
      .post("/admins").set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        name: "Jane Doe",
        email: "janedoe@email.com",
        password: "654321",
      });

    expect(createResponse.status).toBe(201);

    const loginResponse = await request(App)
      .post("/login")
      .send({
        email: "janedoe@email.com",
        password: "654321",
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty("token");

    const token = loginResponse.body.token;


    const updateResponse = await request(App)
      .patch(`/admins/${createResponse.body.id}`)
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        name: "Jane Smith",
        email: "janesmith@email.com",
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toHaveProperty("id", createResponse.body.id);
  });

  it("should delete a admin", async () => {

    const createResponse = await request(App)
      .post("/admins").set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        name: "Mark Doe",
        email: "markdoe@email.com",
        password: "654321",
      });

    expect(createResponse.status).toBe(201);


    const loginResponse = await request(App)
      .post("/login")
      .send({
        email: "markdoe@email.com",
        password: "654321",
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty("token");

    const token = loginResponse.body.token;


    const deleteResponse = await request(App)
      .delete(`/admins/${createResponse.body.id}`).set("Authorization", `Bearer ${superAdminToken}`)
      ;

    expect(deleteResponse.status).toBe(200);
  });
});

describe("TechniciansController", () => {

  it("should create a new technician", async () => {
    const loginResponse = await request(App).post("/login").send({
      email: "superadmin@email.com",
      password: "admin123",
    });

    const { token } = loginResponse.body;

    expect(loginResponse.status).toBe(200);
    expect(token).toBeDefined();

    const response = await request(App)
      .post("/technicians").set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        name: "Tech Doe",
        email: "techDoe@email.com",
        password: "654321",
        hashedPassword: await hash("654321", 8),
        availability: ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00"]
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("name", "Tech Doe");
    expect(response.body).toHaveProperty("email", "techDoe@email.com");
    expect(response.body).not.toHaveProperty("password");


  });

  it("duplicate email on technician creation should return 409", async () => {
    const loginResponse = await request(App).post("/login").send({
      email: "superadmin@email.com",
      password: "admin123",
    });
    const { token } = loginResponse.body;

    expect(loginResponse.status).toBe(200);
    expect(token).toBeDefined();

    const firstResponse = await request(App).post("/technicians").set("Authorization", `Bearer ${superAdminToken}`).send({
      name: "Duplicate Test",
      email: "duplicateTestTechnician@email.com",
      password: "duplicate123",
      availability: ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00"]
    });

    expect(firstResponse.status).toBe(201);

    const secondResponse = await request(App)
      .post("/technicians").set("Authorization", `Bearer ${superAdminToken}`).send({
        name: "Duplicate Test 2",
        email: "duplicateTestTechnician@email.com",
        password: "duplicate123",
        availability: ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00"]
      });

    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body).toHaveProperty(
      "message",
      "Um usuário com esse email já existe!"
    );
  });

  it("should list all technicians", async () => {
    const loginResponse = await request(App).post("/login").send({
      email: "superadmin@email.com",
      password: "admin123",
    });

    const { token } = loginResponse.body;

    expect(loginResponse.status).toBe(200);
    expect(token).toBeDefined();
    const response = await request(App).get("/technicians").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should update a technician", async () => {
    const loginResponse = await request(App).post("/login").send({
      email: "superadmin@email.com",
      password: "admin123",
    });

    const { token } = loginResponse.body;

    expect(loginResponse.status).toBe(200);
    expect(token).toBeDefined();

    const createResponse = await request(App)
      .post("/technicians").set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        name: "Tech to Update",
        email: "techupdate@email.com",
        password: "654321",
        availability: ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00"]
      });

    expect(createResponse.status).toBe(201);

    const updateResponse = await request(App)
      .patch(`/technicians/${createResponse.body.id}/update`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Tech Updated",
        email: "techupdate@email.com",
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toHaveProperty("id", createResponse.body.id);
    expect(updateResponse.body).toHaveProperty("name", "Tech Updated");
    expect(updateResponse.body).toHaveProperty("email", "techupdate@email.com");
  });

  it("Update a image for technician profile", async () => {
    const loginResponse = await request(App).post("/login").send({
      email: "superadmin@email.com",
      password: "admin123",
    });

    const { token } = loginResponse.body;

    expect(loginResponse.status).toBe(200);
    expect(token).toBeDefined();

    const createResponse = await request(App)
      .post("/technicians").set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        name: "Image Test",
        email: "imageTesteTechnicians@email.com",
        password: "image123",
        availability: ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00"]
      });

    expect(createResponse.status).toBe(201);

    const loginTechniciansResponse = await request(App)
      .post("/login")
      .send({
        email: "imageTesteTechnicians@email.com",
        password: "image123",
      });

    expect(loginTechniciansResponse.status).toBe(200);
    expect(loginTechniciansResponse.body).toHaveProperty("token");

    const tokenTechnicians = loginTechniciansResponse.body.token;

    const updateResponse = await request(App)
      .put(`/technicians/${createResponse.body.id}/photo/upload`)
      .set("Authorization", `Bearer ${tokenTechnicians}`)
      .attach("photo", "__tests__/files/test-image.jpg");

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toHaveProperty("id", createResponse.body.id);
    expect(updateResponse.body).toHaveProperty("photoUrl");
  });

  it("should not change password if old password is incorrect", async () => {
    const loginResponse = await request(App).post("/login").send({
      email: "superadmin@email.com",
      password: "admin123",
    });

    const { token } = loginResponse.body;
    expect(loginResponse.status).toBe(200);

    const createResponse = await request(App)
      .post("/technicians").set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        name: "Change Password",
        email: "changePassword@email.com",
        password: "111111",
        availability: ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00"]
      });

    console.log(createResponse.body)

    expect(createResponse.status).toBe(201);

    const loginTechniciansResponse = await request(App)
      .post("/login")
      .send({
        email: "changePassword@email.com",
        password: "111111",
      });

    const tokenTechnicians = loginTechniciansResponse.body.token;
    expect(tokenTechnicians).toBeDefined();


    const changeResponse = await request(App)
      .put(`/technicians/${createResponse.body.id}/password`)
      .send({
        currentPassword: "111113",
        newPassword: "123456",
      })
      .set("Authorization", `Bearer ${tokenTechnicians}`);

    expect(changeResponse.status).toBe(400);
    expect(changeResponse.body).toHaveProperty("message", "Senha antiga incorreta.");
  });

  it("change password if old password is correct", async () => {
    const loginResponse = await request(App).post("/login").send({
      email: "superadmin@email.com",
      password: "admin123",
    });
    const { token } = loginResponse.body;
    expect(loginResponse.status).toBe(200);

    const createResponse = await request(App)
      .post("/technicians").set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        name: "Change Password",
        email: "changePasswordCorrect@email.com",
        password: "111111",
        availability: ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00"]
      });

    console.log(createResponse.body)

    expect(createResponse.status).toBe(201);

    const loginTechniciansResponse = await request(App)
      .post("/login")
      .send({
        email: "changePasswordCorrect@email.com",
        password: "111111",
      });

    const tokenTechnicians = loginTechniciansResponse.body.token;
    expect(tokenTechnicians).toBeDefined();


    const changeResponse = await request(App)
      .put(`/technicians/${createResponse.body.id}/password`)
      .send({
        currentPassword: "111111",
        newPassword: "123456",
      })
      .set("Authorization", `Bearer ${tokenTechnicians}`);

    expect(changeResponse.status).toBe(200);
    expect(changeResponse.body).toHaveProperty("message", "Senha alterada com sucesso.");
  });

  it("change availability", async () => {
    const loginResponse = await request(App).post("/login").send({
      email: "superadmin@email.com",
      password: "admin123",
    });
    const { token } = loginResponse.body;
    expect(loginResponse.status).toBe(200);

    const createResponse = await request(App)
      .post("/technicians").set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        name: "Change Availability",
        email: "changeAvailability@email.com",
        password: "111111",
        availability: ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00"]
      });

    expect(createResponse.status).toBe(201);

    const loginTechniciansResponse = await request(App)
      .post("/login")
      .send({
        email: "changeAvailability@email.com",
        password: "111111",
      });

    const tokenTechnicians = loginTechniciansResponse.body.token;
    expect(tokenTechnicians).toBeDefined();

    const changeAvailabilityResponse = await request(App)
      .put(`/technicians/availability/${createResponse.body.id}`)
      .set("Authorization", `Bearer ${tokenTechnicians}`)
      .send({
        availability: ["16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"]
      });


    expect(changeAvailabilityResponse.status).toBe(200);
    expect(changeAvailabilityResponse.body).toHaveProperty("message", "Disponibilidade atualizada com sucesso.");
    expect(changeAvailabilityResponse.body.technician).toHaveProperty("availability");
    expect(changeAvailabilityResponse.body.technician.availability).toContain("16:00");

  })

  it("verify if availability Empty", async () => {
    const loginResponse = await request(App).post("/login").send({
      email: "superadmin@email.com",
      password: "admin123",
    });
    const { token } = loginResponse.body;
    expect(loginResponse.status).toBe(200);

    const createResponse = await request(App)
      .post("/technicians").set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        name: "Delete Technician Test",
        email: "deleteTechnicianTest@email.com",
        password: "111111",
        availability: ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00"]
      });

    expect(createResponse.status).toBe(201);

    const loginTechniciansResponse = await request(App)
      .post("/login")
      .send({
        email: "deleteTechnicianTest@email.com",
        password: "111111",
      });

    const tokenTechnicians = loginTechniciansResponse.body.token;
    expect(tokenTechnicians).toBeDefined();

    const changeAvailabilityResponse = await request(App)
      .put(`/technicians/availability/${createResponse.body.id}`)
      .set("Authorization", `Bearer ${tokenTechnicians}`)
      .send({
        availability: []
      });

    expect(changeAvailabilityResponse.status).toBe(400);
    expect(changeAvailabilityResponse.body).toHaveProperty("message", "Erro de validação.");
    expect(changeAvailabilityResponse.body.errors).toContain("O array de disponibilidade não pode estar vazio.");

  })

  it("remove technician", async () => {
    const loginResponse = await request(App).post("/login").send({
      email: "superadmin@email.com",
      password: "admin123",
    });
    const { token } = loginResponse.body;
    expect(loginResponse.status).toBe(200);

    const createResponse = await request(App)
      .post("/technicians").set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        name: "Change Availability Empty",
        email: "changeAvailabilityEmpty@email.com",
        password: "111111",
        availability: ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00"]
      });

    expect(createResponse.status).toBe(201);

    const loginTechniciansResponse = await request(App)
      .post("/login")
      .send({
        email: "changeAvailabilityEmpty@email.com",
        password: "111111",
      });

    const tokenTechnicians = loginTechniciansResponse.body.token;
    expect(tokenTechnicians).toBeDefined();

    const removeTechnician = await request(App).delete(`/technicians/${createResponse.body.id}/delete`).set("Authorization", `Bearer ${tokenTechnicians}`)

    expect(removeTechnician.status).toBe(200)
  })
});

describe("ClientsController", () => {
  beforeAll(async () => {
    await prisma.called.deleteMany();
    await prisma.technician.deleteMany();
    await prisma.client.deleteMany();
    await prisma.admin.deleteMany();
  });

  it("should create a new client", async () => {
    const response = await request(App)
      .post("/clients")
      .send({
        name: "John Doe",
        email: "JohnDoe@email.com",
        password: "123456",
        hashedPassword: await hash("123456", 8),
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("name", "John Doe");
    expect(response.body).toHaveProperty("email", "JohnDoe@email.com");
    expect(response.body).not.toHaveProperty("password");
  });

  it("duplicate email on client creation should return 409", async () => {

    const firstResponse = await request(App)
      .post("/clients")
      .send({
        name: "Duplicate Test",
        email: "duplicateTest@email.com",
        password: "duplicate123",
      });

    expect(firstResponse.status).toBe(201);

    const secondResponse = await request(App)
      .post("/clients")
      .send({
        name: "Duplicate Test 2",
        email: "duplicateTest@email.com",
        password: "duplicate456",
      });

    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body).toHaveProperty(
      "message",
      "Um usuário com esse email já existe!"
    );
  });

  it("should list all clients", async () => {
    const response = await request(App).get("/clients");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should update a client", async () => {

    const createResponse = await request(App)
      .post("/clients")
      .send({
        name: "Jane Doe",
        email: "JaneDoe@email.com",
        password: "654321",
      });

    expect(createResponse.status).toBe(201);


    const loginResponse = await request(App)
      .post("/login")
      .send({
        email: "JaneDoe@email.com",
        password: "654321",
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty("token");

    const token = loginResponse.body.token;

    const updateResponse = await request(App)
      .patch(`/clients/${createResponse.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Jane Smith",
        email: "JaneSmith@email.com",
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toHaveProperty("id", createResponse.body.id);
    expect(updateResponse.body).toHaveProperty("name", "Jane Smith");
    expect(updateResponse.body).toHaveProperty("email", "JaneSmith@email.com");
  });

  it("should delete a client", async () => {
    const createResponse = await request(App)
      .post("/clients")
      .send({
        name: "Delete Test",
        email: "deleteTest@email.com",
        password: "delete123",
      });

    expect(createResponse.status).toBe(201);

    const loginResponse = await request(App)
      .post("/login")
      .send({
        email: "deleteTest@email.com",
        password: "delete123",
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty("token");

    const token = loginResponse.body.token;

    const deleteResponse = await request(App)
      .delete(`/clients/${createResponse.body.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteResponse.status).toBe(200);
  });

})
