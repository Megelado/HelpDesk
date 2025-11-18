import request from "supertest";
import { prisma } from "@/database/Prisma";

import { App } from "@/App";

import { hash } from "bcrypt";

let superAdminToken: string;

beforeAll(async () => {

  await prisma.service.deleteMany();
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

  const hashedPasswordTechnician = await hash("technician123", 8);
  await prisma.technician.create({
    data: {
      name: "Technician",
      email: "supertechnician@email.com",
      password: hashedPasswordTechnician,
    },
  });

  const loginTechnicianResponse = await request(App).post("/login").send({
    email: "supertechnician@email.com",
    password: "technician123",
  });

  const hashedPasswordClient = await hash("client123", 8);
  await prisma.client.create({
    data: {
      name: "Client",
      email: "superclient@email.com",
      password: hashedPasswordClient,
    },
  });

  const loginClientResponse = await request(App).post("/login").send({
    email: "superclient@email.com",
    password: "client123",
  });

  const superClientToken = loginClientResponse.body.token;
  expect(superClientToken).toBeDefined();

});

afterAll(async () => {
  await prisma.called.deleteMany();
  await prisma.service.deleteMany();
  await prisma.technician.deleteMany();
  await prisma.client.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.$disconnect();
});


describe("CalledsController", () => {
  it("should create a called with multiple services", async () => {

    const loginResponse = await request(App)
      .post("/login")
      .send({
        email: "superclient@email.com",
        password: "client123",
      });

    expect(loginResponse.status).toBe(200);
    const token = loginResponse.body.token;
    const clientId = loginResponse.body.user.id;

    const loginTechnicianResponse = await request(App)
      .post("/login")
      .send({
        email: "supertechnician@email.com",
        password: "technician123",
      });

    expect(loginTechnicianResponse.status).toBe(200);
    const technicianId = loginTechnicianResponse.body.user.id;

    const service1 = await prisma.service.create({
      data: { title: "Recuperação de dados", price: 200, active: true },
    });

    const service2 = await prisma.service.create({
      data: { title: "Formatação de sistema", price: 150, active: true },
    });

    const serviceIds = [service1.id, service2.id];

    const response = await request(App)
      .post("/calleds")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Rede lenta",
        description:
          "O sistema de backup automático parou de funcionar. Última execução bem-sucedida foi há uma semana.",
        clientId,
        technicianId,
        serviceIds
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.title).toBe("Rede lenta");
    expect(response.body.services).toHaveLength(2);
  });


  it("index calleds by client", async () => {

    const loginClientResponse = await request(App).post("/login").send({
      email: "superclient@email.com",
      password: "client123",
    });

    const superClientToken = loginClientResponse.body.token;

    const response = await request(App).get("/calleds/client").set("Authorization", `Bearer ${superClientToken}`)

    expect(response.status).toBe(200)
  })

  it("index calleds by technician", async () => {

    const loginTechnicianResponse = await request(App).post("/login").send({
      email: "supertechnician@email.com",
      password: "technician123",
    });

    const superTechnicianToken = loginTechnicianResponse.body.token;

    const response = await request(App).get("/calleds/technician").set("Authorization", `Bearer ${superTechnicianToken}`)


    expect(response.status).toBe(200)
  })

  it("index all calleds", async () => {
    const loginResponse = await request(App).post("/login").send({
      email: "superadmin@email.com",
      password: "admin123",
    });

    const superAdminToken = loginResponse.body.token

    const response = await request(App).get("/calleds").set("Authorization", `Bearer ${superAdminToken}`)
  })

  it("should update services of called successfully", async () => {
    
    const loginClientResponse = await request(App)
      .post("/login")
      .send({
        email: "superclient@email.com",
        password: "client123",
      });

    expect(loginClientResponse.status).toBe(200);
    const clientToken = loginClientResponse.body.token;
    const clientId = loginClientResponse.body.user.id;

    
    const loginTechnicianResponse = await request(App)
      .post("/login")
      .send({
        email: "supertechnician@email.com",
        password: "technician123",
      });

    expect(loginTechnicianResponse.status).toBe(200);
    const technicianToken = loginTechnicianResponse.body.token;
    const technicianId = loginTechnicianResponse.body.user.id;

   
    const service1 = await prisma.service.create({
      data: {
        title: "Formatação de computador",
        price: 150,
        active: true,
      },
    });

    const service2 = await prisma.service.create({
      data: {
        title: "Troca de HD",
        price: 250,
        active: true,
      },
    });

    
    const createCalledResponse = await request(App)
      .post("/calleds")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({
        title: "Computador travando muito",
        description: "O sistema demora para iniciar e trava constantemente.",
        clientId,
        technicianId,
        serviceIds: [service1.id]
      });

    expect(createCalledResponse.status).toBe(201);
    const calledId = createCalledResponse.body.id;
   
    const updateServiceResponse = await request(App)
      .put(`/calleds/${calledId}/`)
      .set("Authorization", `Bearer ${technicianToken}`)
      .send({
        serviceIds: [service2.id]
      });


    expect(updateServiceResponse.status).toBe(200);
    expect(updateServiceResponse.body.services.length).toBe(2);

    const serviceIds = updateServiceResponse.body.services.map((s: any) => s.id);
    expect(serviceIds).toContain(service1.id);
    expect(serviceIds).toContain(service2.id);
  });



  it("should updated status of calleds", async () => {
    const loginClientResponse = await request(App)
      .post("/login")
      .send({
        email: "superclient@email.com",
        password: "client123",
      });

    expect(loginClientResponse.status).toBe(200);
    const clientToken = loginClientResponse.body.token;
    const clientId = loginClientResponse.body.user.id;

    const loginTechnicianResponse = await request(App)
      .post("/login")
      .send({
        email: "supertechnician@email.com",
        password: "technician123",
      });

    expect(loginTechnicianResponse.status).toBe(200);
    const technicianToken = loginTechnicianResponse.body.token;
    const technicianId = loginTechnicianResponse.body.user.id;

    const service = await prisma.service.create({
      data: {
        title: "Diagnóstico e remoção de vírus",
        price: 150,
        active: true,
      },
    });


    const createCalledResponse = await request(App)
      .post("/calleds")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({
        title: "Computador travando muito",
        description: "O sistema demora para iniciar e trava constantemente.",
        clientId,
        technicianId,
        serviceIds: [service.id]
      });

    expect(createCalledResponse.status).toBe(201);
    const calledId = createCalledResponse.body.id;


    const updateStatusResponse = await request(App)
      .put(`/calleds/${calledId}/status`)
      .set("Authorization", `Bearer ${technicianToken}`)
      .send({
        status: "em_andamento"
      });

    expect(updateStatusResponse.status).toBe(200);
    expect(updateStatusResponse.body.status).toEqual("em_andamento")
  })

})