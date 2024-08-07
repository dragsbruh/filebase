import { FileStore } from "./filestore/filestore";

const systems: { [key: string]: new () => FileStore } = {};

export function registerSystem<T extends FileStore>(
  name: string,
  ClassName: new () => T
) {
  if (!(ClassName.prototype instanceof FileStore)) {
    throw new Error("Unable to register filestore, not a child");
  }
  systems[name] = ClassName;
}

export function getSystemInstance(name: string): new () => FileStore {
  return systems[name];
}
