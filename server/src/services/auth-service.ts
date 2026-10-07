import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { User } from "@prisma/client";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { toPublicUser } from "../utils/user.js";

export const AUTH_COOKIE_NAME = "rolescout_session";

export interface UserStore {
  findByEmail(email: string): Promise<User | null>;
  create(input: { name: string; email: string; passwordHash: string }): Promise<User>;
  revokeSessions(userId: string): Promise<User>;
}

export class AuthService {
  constructor(private readonly users: UserStore) {}

  async register(name: string, email: string, password: string): Promise<User> {
    const existingUser = await this.users.findByEmail(email);
    if (existingUser) {
      throw new AppError(409, "EMAIL_ALREADY_EXISTS", "An account with that email already exists.");
    }
    const passwordHash = await bcrypt.hash(password, 12);
    return this.users.create({ name, email, passwordHash });
  }

  async login(email: string, password: string): Promise<User> {
    const user = await this.users.findByEmail(email);
    const validPassword = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !validPassword) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    }
    return user;
  }

  createSessionToken(user: User): string {
    return jwt.sign({ sub: user.id, sessionVersion: user.sessionVersion }, env.AUTH_SECRET, { expiresIn: "7d" });
  }

  verifySessionToken(token: string): { userId: string; sessionVersion: number } {
    const payload = jwt.verify(token, env.AUTH_SECRET);
    if (
      typeof payload === "string"
      || typeof payload.sub !== "string"
      || typeof payload.sessionVersion !== "number"
      || !Number.isInteger(payload.sessionVersion)
      || payload.sessionVersion < 0
    ) {
      throw new AppError(401, "INVALID_SESSION", "Your session is invalid or expired.");
    }
    return { userId: payload.sub, sessionVersion: payload.sessionVersion };
  }

  async revokeSessionToken(token: string): Promise<void> {
    let session: { userId: string; sessionVersion: number };
    try {
      session = this.verifySessionToken(token);
    } catch (error) {
      if (error instanceof AppError || error instanceof jwt.JsonWebTokenError) return;
      throw error;
    }
    await this.users.revokeSessions(session.userId);
  }

  toPublicUser(user: User) {
    return toPublicUser(user);
  }
}
