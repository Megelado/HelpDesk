import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminExists = await prisma.admin.findFirst();

  if (!adminExists) {
    const password = await hash("admin123", 8);
    await prisma.admin.create({
      data: {
        name: "Super Admin",
        email: "admin@system.com",
        password,
      },
    });
    console.log("✅ Admin inicial criado com sucesso!");
  } else {
    console.log("⚠️ Já existe um admin, seed ignorado.");
  }

  const technicianExists = await prisma.technician.findFirst();

  if (!technicianExists) {
    const password1 = await hash("luis123", 8);
    await prisma.technician.create({
      data: {
        name: "luis",
        email: "luistechnician@email.com",
        password: password1,
        availability: ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
      },
    })

    const password2 = await hash("joao123", 8);
    await prisma.technician.create({
      data: {
        name: "joao",
        email: "joaotechnician@email.com",
        password: password2,
        availability: ["10:00", "11:00", "12:00", "13:00", "14:00", "16:00", "17:00", "18:00", "19:00", "20:00"]
      },
    })
    const password3 = await hash("ana123", 8)
    await prisma.technician.create({
      data: {
        name: "ana",
        email: "anatechnician@email.com",
        password: password3,
        availability: ["12:00", "13:00", "14:00", "15:00", "16:00", "18:00", "19:00", "20:00", "21:00", "22:00"]
      },
    });

    console.log("Técnicos iniciais criados com sucesso")

  } else {
    console.log("⚠️ Já existem técnicos, seed ignorado.");
  }

  const serviceExists = await prisma.service.findFirst();
  if (!serviceExists) {
    await prisma.service.createMany({

      data: [
        { title: "Instalação e atualização de softwares", price: 100, isDefault: true },
        { title: "Instalação e atualização de hardwares", price: 50, isDefault: true },
        { title: "Diagnóstico e remoção de vírus", price: 78.90, isDefault: true },
        { title: "Suporte a impressoras", price: 124.90, isDefault: true },
        { title: "Solução de problemas de conectividade de internet", price: 230, isDefault: true }
      ]
    })
  } else {
    console.log("⚠️ Já existem serviços, seed ignorado.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
