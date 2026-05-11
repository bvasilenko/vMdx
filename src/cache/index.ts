import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { CompileResult } from "../types.js";

type CacheEntryKey = {
  contentHash: string;
  mtimeMs: number;
  path: string;
};

type CacheEntry = {
  key: CacheEntryKey;
  result: CompileResult;
};

export class DiskCache {
  readonly dir: string;

  constructor(cacheDir: string) {
    this.dir = cacheDir;
    mkdirSync(cacheDir, { recursive: true });
  }

  get(filePath: string, content: string): CompileResult | null {
    const hash = sha256Prefix(content);
    const entryPath = this.entryPath(hash);
    try {
      const raw = readFileSync(entryPath, "utf8");
      const entry: CacheEntry = JSON.parse(raw);
      if (entry.key.contentHash === hash && entry.key.path === filePath) {
        return entry.result;
      }
    } catch {
    }
    return null;
  }

  set(filePath: string, content: string, result: CompileResult): void {
    const contentHash = sha256Prefix(content);
    const mtimeMs = fileMtimeMs(filePath);
    const entry: CacheEntry = {
      key: { contentHash, mtimeMs, path: filePath },
      result,
    };
    writeFileSync(this.entryPath(contentHash), JSON.stringify(entry), "utf8");
  }

  private entryPath(contentHash: string): string {
    return join(this.dir, `${contentHash}.json`);
  }
}

function sha256Prefix(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 24);
}

function fileMtimeMs(filePath: string): number {
  try {
    return statSync(filePath).mtimeMs;
  } catch {
    return 0;
  }
}
