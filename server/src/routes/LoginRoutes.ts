import { Router } from "express"
import { LoginController } from "@/controllers/LoginController"

const loginRoutes = Router()
const loginController = new LoginController()

loginRoutes.post("/", (request, response) => {
  return loginController.handle(request, response)
})

export { loginRoutes }
