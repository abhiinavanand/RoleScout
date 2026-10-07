import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import { prisma } from "../config/database.js";
import { AUTH_COOKIE_NAME, AuthService } from "../services/auth-service.js";
import { UserRepository } from "../repositories/user-repository.js";
import { loginSchema, registerSchema } from "../validators/auth.js";
import { AppError } from "../utils/errors.js";

const authService = new AuthService(new UserRepository(prisma));
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? ("strict" as const) : ("lax" as const),
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

export const register: RequestHandler = async (request, response, next) => {
  try {
    const input = registerSchema.parse(request.body);
    const user = await authService.register(input.name, input.email, input.password);
    response.cookie(AUTH_COOKIE_NAME, authService.createSessionToken(user), cookieOptions);
    response.status(201).json({ success: true, data: { user: authService.toPublicUser(user) } });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (request, response, next) => {
  try {
    const input = loginSchema.parse(request.body);
    const user = await authService.login(input.email, input.password);
    response.cookie(AUTH_COOKIE_NAME, authService.createSessionToken(user), cookieOptions);
    response.json({ success: true, data: { user: authService.toPublicUser(user) } });
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = async (request, response) => {
  const token = request.cookies?.[AUTH_COOKIE_NAME];
  if (token) await authService.revokeSessionToken(token);
  response.clearCookie(AUTH_COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
  response.json({ success: true, data: { loggedOut: true } });
};

export const me: RequestHandler = (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    }
    response.json({ success: true, data: { user: request.user } });
  } catch (error) {
    next(error);
  }
};
