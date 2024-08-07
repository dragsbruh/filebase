import { generateID } from "./utils";

export class Path {
  private _raw: string;
  private _components: string[];

  constructor(raw: string) {
    this._raw = raw;
    this._components = raw
      .split("/")
      .filter((component) => component.length > 0);
  }

  get parent() {
    return new Path(this.dirname);
  }

  get raw() {
    return "/" + this._components.join("/");
  }

  get dirname() {
    return "/" + this._components.slice(0, -1).join("/") || "/";
  }

  get basename() {
    return this._components.at(-1) || "/";
  }

  get components() {
    return this._components;
  }

  join(path: Path | string) {
    if (path instanceof Path) {
      return Path.fromComponents([...this.components, ...path.components]);
    } else {
      return Path.fromComponents([...this.components, path]);
    }
  }

  static fromComponents(components: string[]) {
    return new Path(components.join("/")); // TODO: Do it manually
  }
}

export interface StatItem {
  name: string;
  size: number;

  ctime: number;
  mtime: number;
  atime: number;

  id: string;
  type: "file" | "directory";
}

export abstract class File implements StatItem {
  public name: string;
  public size: number;

  public ctime: number;
  public mtime: number;
  public atime: number;

  public id: string;
  public type: "file" = "file";

  constructor(name: string, size: number) {
    this.name = name;
    this.size = size;

    this.ctime = Date.now();
    this.mtime = Date.now();
    this.atime = Date.now();

    this.id = generateID();
  }

  public abstract read(): Promise<Uint8Array>; // Read everything in file
  public abstract write(data: Uint8Array): Promise<void>; // Write everything to file
  public abstract append(data: Uint8Array): Promise<void>; // Append data to file, equals `write` if file does not exist

  public async stat(): Promise<StatItem> {
    return this as StatItem;
  }
}

export abstract class Directory implements StatItem {
  public name: string;
  public size: number; // Is number of items in directory

  public ctime: number;
  public mtime: number;
  public atime: number;

  public id: string;
  public type: "directory" = "directory";

  constructor(name: string) {
    this.name = name;
    this.size = 0;

    this.ctime = Date.now();
    this.mtime = Date.now();
    this.atime = Date.now();

    this.id = generateID();
  }

  public abstract rename(source: string, destination: string): Promise<void>; // Rename `source` file/directory to `dest` in current directory
  public abstract exists(source: string): Promise<boolean>; // Returns true if `source` exists inside current directory
  public abstract remove(source: string): Promise<void>; // Deletes `source` only if its a file
  public abstract removeforce(source: string): Promise<void>; // Deletes `source` regardless of its type

  public abstract open(source: string, create: boolean): Promise<File>; // Returns file object to `source`
  public abstract opendir(source: string): Promise<Directory>; // Returns handle to directory named `source`
  public abstract list(): Promise<(File | Directory)[]>; // Returns list of items in `source`
  public abstract liststat(): Promise<StatItem[]>; // Returns list of item stats in `source`. Use when file handle is not needed. NOTE: Might be useless

  public abstract touch(destination: string): Promise<void>; // Creates a new empty file named `destination`
  public abstract mkdir(destination: string): Promise<void>; // Creates a new empty directory named `destination`

  public abstract putIn(
    destination: string,
    item: File | Directory
  ): Promise<void>; // Internal use only

  public async stat(): Promise<StatItem> {
    return this as StatItem;
  }
}

export abstract class FileStore {
  constructor() {}

  public abstract init(): Promise<void>; // Must be called, may contain asynchronous logic for initalization of filestore instances
  public abstract nestedItem(path: string): Promise<File | Directory | null>; // Returns nested `path` object or `null` if not exists. For internal use
}
