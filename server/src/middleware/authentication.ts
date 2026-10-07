import type { RequestHandler } from "express";
import { AUTH_COOKIE_NAME, AuthService } from "../services/auth-service.js";
import { UserRepository } from "../repositories/user-repository.js";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/errors.js";
import { toPublicUser } from "../utils/user.js";

const authService = new AuthService(new UserRepository(prisma));

export const requireAuthentication: RequestHandler = async (request, _response, next) => {
  try {
    const token = request.cookies?.[AUTH_COOKIE_NAME];
    if (!token) {
      throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    }
    const session = authService.verifySessionToken(token);
    const user = await new UserRepository(prisma).findById(session.userId);
    if (!user || user.sessionVersion !== session.sessionVersion) {
      throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
    }
    request.user = toPublicUser(user);
    next();
  } catch (error) {
    next(error);
  }
};
