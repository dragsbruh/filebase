import {
  FileExistsError,
  FileNotFoundError,
  IsADirectoryError,
  NotADirectoryError,
} from "./filestore/errors";

import {
  Directory,
  File,
  FileStore,
  Path,
  type StatItem,
} from "./filestore/filestore";

export class MemoryFile extends File {
  contents: Uint8Array;
  constructor(name: string, contents: Uint8Array) {
    super(name, contents.length);
    this.contents = contents;
  }
  public async read(): Promise<Uint8Array> {
    this.atime = Date.now();
    return this.contents;
  }
  public async write(data: Uint8Array): Promise<void> {
    this.mtime = Date.now();
    this.contents = data;
    this.size = data.length;
  }
  public async append(data: Uint8Array): Promise<void> {
    this.mtime = Date.now();
    const newContents = new Uint8Array(this.contents.length + data.length);
    newContents.set(this.contents, 0);
    newContents.set(data, this.contents.length);
    this.contents = newContents;
  }
}

export class MemoryDirectory extends Directory {
  children: Map<string, MemoryDirectory | MemoryFile>;

  constructor(name: string) {
    super(name);
    this.children = new Map();
  }

  public async rename(source: string, destination: string): Promise<void> {
    if (!(await this.exists(source))) {
      throw new FileNotFoundError(source);
    }
    if (await this.exists(destination)) {
      throw new FileExistsError(destination);
    }

    let item = this.children.get(source) as MemoryDirectory | MemoryFile;

    item.name = destination;

    this.children.set(destination, item);
    this.children.delete(source);
  }
  public async exists(source: string): Promise<boolean> {
    return this.children.has(source);
  }
  public async remove(source: string): Promise<void> {
    if (!(await this.exists(source))) {
      throw new FileNotFoundError(source);
    }
    if (this.children.get(source)?.type !== "file") {
      throw new IsADirectoryError(source);
    }
    this.children.delete(source);
  }
  public async removeforce(source: string): Promise<void> {
    this.children.delete(source);
  }
  public async open(source: string, create = true): Promise<MemoryFile> {
    let item = this.children.get(source);
    if (!item) {
      if (create) {
        item = new MemoryFile(source, new Uint8Array(0));
        this.children.set(source, item);
      } else {
        throw new FileNotFoundError(source);
      }
    }
    if (!(item instanceof MemoryFile)) {
      throw new IsADirectoryError(source);
    }
    return item;
  }
  public async opendir(source: string): Promise<MemoryDirectory> {
    let item = this.children.get(source);
    if (!item) {
      throw new FileNotFoundError(source);
    }
    if (!(item instanceof MemoryDirectory)) {
      throw new NotADirectoryError(source);
    }
    return item;
  }

  public async touch(destination: string): Promise<void> {
    if (await this.exists(destination)) {
      throw new FileExistsError(destination);
    }
    await this.open(destination, true);
  }
  public async mkdir(destination: string): Promise<void> {
    if (await this.exists(destination)) {
      throw new FileExistsError(destination);
    }
    let item = new MemoryDirectory(destination);
    this.children.set(destination, item);
  }

  public async list(): Promise<(File | Directory)[]> {
    let files: (MemoryFile | MemoryDirectory)[] = [];
    this.children.forEach(async (item) => {
      files.push(item);
    });
    // @ts-ignore
    return files;
  }

  public async liststat(): Promise<StatItem[]> {
    let stats: StatItem[] = [];
    this.children.forEach(async (item) => {
      stats.push(await item.stat());
    });
    return stats;
  }
}

export class MemoryFS extends FileStore {
  root: MemoryDirectory;
  constructor() {
    super();
    this.root = new MemoryDirectory("root");
  }

  public async init(): Promise<void> {
    await this.root.mkdir("openme");
    (await (await this.root.opendir("openme")).open("hello.txt", true)).write(
      new TextEncoder().encode("- your dad")
    );
  }

  public async nestedItem(
    path: string
  ): Promise<MemoryFile | MemoryDirectory | null> {
    let p = new Path(path);
    let current: MemoryDirectory | MemoryFile = this.root;
    for (let comp of p.components) {
      if (current instanceof MemoryFile) {
        return null; // Since current is a file, yet path specifies we need to traverse more
      }
      if (!(await current.exists(comp))) {
        return null;
      }
      current = current.children.get(comp) as MemoryFile | MemoryDirectory;
    }
    return current;
  }
}
