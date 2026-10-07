import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";

export interface StorageProvider {
  save(contents: Buffer, extension: "pdf" | "docx"): Promise<string>;
  read(storageKey: string): Promise<Buffer>;
  remove(storageKey: string): Promise<void>;
}

export class LocalStorageProvider implements StorageProvider {
  private readonly root = resolve(env.RESUME_STORAGE_PATH);

  async save(contents: Buffer, extension: "pdf" | "docx"): Promise<string> {
    await mkdir(this.root, { recursive: true });
    const storageKey = `${randomUUID()}.${extension}`;
    await writeFile(join(this.root, storageKey), contents, { flag: "wx", mode: 0o600 });
    return storageKey;
  }

  async remove(storageKey: string): Promise<void> {
    if (storageKey.includes("/") || storageKey.includes("\\") || storageKey.includes("..")) {
      throw new Error("Invalid storage key.");
    }
    try {
      await unlink(join(this.root, storageKey));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }

  async read(storageKey: string): Promise<Buffer> {
    if (storageKey.includes("/") || storageKey.includes("\\") || storageKey.includes("..")) {
      throw new Error("Invalid storage key.");
    }
    return readFile(join(this.root, storageKey));
  }
}
