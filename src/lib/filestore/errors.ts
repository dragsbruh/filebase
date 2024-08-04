export class FilestoreError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class FileNotFoundError extends FilestoreError {
  constructor(path: string) {
    super(`File not Found: ${path}`);
  }
}

export class FileExistsError extends FilestoreError {
  constructor(path: string) {
    super(`File exists: ${path}`);
  }
}

export class IsADirectoryError extends FilestoreError {
  constructor(path: string) {
    super(`Is a directory: ${path}`);
  }
}

export class NotADirectoryError extends FilestoreError {
  constructor(path: string) {
    super(`Not a directory: ${path}`);
  }
}
