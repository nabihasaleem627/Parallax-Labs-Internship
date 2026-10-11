import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { DbShape } from '../types.js';
import { config } from '../config.js';

const emptyDb = (): DbShape => ({
  users: [],
  departments: [],
  projects: [],
  projectMembers: [],
  tasks: [],
  collaborativeDocuments: [],
  documentVersions: [],
  researchSections: [],
  comments: [],
  meetings: [],
  activities: [],
  notifications: [],
  files: [],
  resetTokens: [],
});

/**
 * Small typed JSON-backed store. Collections mirror the PostgreSQL schema
 * documented in README.md; swapping this for `pg` only requires replacing
 * this module (all access goes through the helpers below).
 */
class Store {
  private data: DbShape = emptyDb();
  private dirty = false;
  private flushTimer: NodeJS.Timeout | null = null;

  load(): void {
    if (config.persist && existsSync(config.dbPath)) {
      try {
        this.data = { ...emptyDb(), ...(JSON.parse(readFileSync(config.dbPath, 'utf8')) as DbShape) };
      } catch {
        this.data = emptyDb();
      }
    }
  }

  reset(data?: Partial<DbShape>): void {
    this.data = { ...emptyDb(), ...data };
  }

  collection<K extends keyof DbShape>(name: K): DbShape[K] {
    return this.data[name];
  }

  find<K extends keyof DbShape, T extends DbShape[K][number]>(
    name: K,
    predicate: (item: T) => boolean,
  ): T | undefined {
    return (this.data[name] as T[]).find(predicate);
  }

  filter<K extends keyof DbShape, T extends DbShape[K][number]>(
    name: K,
    predicate: (item: T) => boolean,
  ): T[] {
    return (this.data[name] as T[]).filter(predicate);
  }

  insert<K extends keyof DbShape>(name: K, item: Omit<DbShape[K][number], 'id'> & { id?: string }): DbShape[K][number] {
    const record = { id: randomUUID(), ...item } as DbShape[K][number];
    (this.data[name] as unknown as DbShape[K][number][]).push(record);
    this.markDirty();
    return record;
  }

  update<K extends keyof DbShape>(name: K, id: string, patch: Partial<DbShape[K][number]>): DbShape[K][number] | undefined {
    const list = this.data[name] as { id: string }[];
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return undefined;
    list[index] = { ...list[index], ...patch };
    this.markDirty();
    return list[index] as DbShape[K][number];
  }

  remove<K extends keyof DbShape>(name: K, id: string): boolean {
    const list = this.data[name] as { id: string }[];
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    this.markDirty();
    return true;
  }

  private markDirty(): void {
    if (!config.persist) return;
    this.dirty = true;
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flush();
    }, 250);
  }

  flush(): void {
    if (!config.persist || !this.dirty) return;
    this.dirty = false;
    mkdirSync(dirname(config.dbPath), { recursive: true });
    const tmp = `${config.dbPath}.tmp`;
    writeFileSync(tmp, JSON.stringify(this.data, null, 2));
    renameSync(tmp, config.dbPath);
  }

  snapshot(): DbShape {
    return this.data;
  }
}

export const store = new Store();
export { randomUUID };
