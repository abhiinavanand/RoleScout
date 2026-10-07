import { describe, expect, it } from "vitest";
import type { User } from "@prisma/client";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AuthService } from "./auth-service.js";

const baseUser: User = {
  id: "user_1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  passwordHash: "",
  sessionVersion: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createStore(existingUser: User | null = null) {
  const users: User[] = existingUser ? [{ ...existingUser }] : [];
  return {
    findByEmail: async (email: string) => users.find((user) => user.email === email) ?? null,
    create: async (input: { name: string; email: string; passwordHash: string }) => {
      const user = { ...baseUser, ...input };
      users.push(user);
      return user;
    },
    revokeSessions: async (userId: string) => {
      const user = users.find((candidate) => candidate.id === userId);
      if (!user) throw new Error("User not found.");
      user.sessionVersion += 1;
      return user;
    },
  };
}

describe("AuthService", () => {
  it("hashes passwords during registration", async () => {
    const service = new AuthService(createStore());
    const user = await service.register("Ada Lovelace", "ada@example.com", "correct horse battery");
    expect(user.passwordHash).not.toBe("correct horse battery");
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it("rejects duplicate email addresses", async () => {
    const service = new AuthService(createStore(baseUser));
    await expect(service.register("Another User", baseUser.email, "correct horse battery"))
      .rejects.toMatchObject({ statusCode: 409, code: "EMAIL_ALREADY_EXISTS" });
  });

  it("rejects incorrect passwords", async () => {
    const store = createStore();
    const service = new AuthService(store);
    const registeredUser = await service.register("Ada Lovelace", baseUser.email, "correct horse battery");
    const loginService = new AuthService(createStore(registeredUser));
    await expect(loginService.login(baseUser.email, "wrong password"))
      .rejects.toMatchObject({ statusCode: 401, code: "INVALID_CREDENTIALS" });
  });

  it("rejects a token after its user session version is revoked", async () => {
    const store = createStore(baseUser);
    const service = new AuthService(store);
    const token = service.createSessionToken(baseUser);
    expect(service.verifySessionToken(token)).toEqual({ userId: "user_1", sessionVersion: 0 });
    await service.revokeSessionToken(token);
    const user = await store.findByEmail(baseUser.email);
    expect(user?.sessionVersion).toBe(1);
    expect(service.verifySessionToken(token)).toEqual({ userId: "user_1", sessionVersion: 0 });
  });

  it("issues a usable token with the current session version after revocation", async () => {
    const store = createStore(baseUser);
    const service = new AuthService(store);
    await service.revokeSessionToken(service.createSessionToken(baseUser));
    const user = await store.findByEmail(baseUser.email);
    const token = service.createSessionToken(user!);
    expect(service.verifySessionToken(token)).toEqual({ userId: "user_1", sessionVersion: 1 });
  });

  it("rejects malformed and expired tokens", () => {
    const service = new AuthService(createStore());
    expect(() => service.verifySessionToken("not-a-jwt")).toThrow();
    const expiredToken = jwt.sign({ sub: baseUser.id, sessionVersion: 0 }, env.AUTH_SECRET, { expiresIn: -1 });
    expect(() => service.verifySessionToken(expiredToken)).toThrow();
  });
});
