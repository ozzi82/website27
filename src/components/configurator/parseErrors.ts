export class UnsupportedFormatError extends Error {
  readonly fileName: string;
  constructor(fileName: string) {
    super(`Unsupported file type: ${fileName}. Only SVG, PDF and Illustrator (.ai) files are supported.`);
    this.fileName = fileName;
    this.name = "UnsupportedFormatError";
  }
}

/** The PDF reader itself (a lazy-loaded chunk) could not be fetched, e.g. a flaky connection or a stale page after a deploy. */
export class ReaderUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("The PDF reader could not be loaded.");
    (this as { cause?: unknown }).cause = cause;
    this.name = "ReaderUnavailableError";
  }
}

export class FileTooLargeError extends Error {
  constructor(sizeBytes: number, maxBytes: number) {
    super(`File is ${sizeBytes} bytes, which exceeds the ${maxBytes}-byte limit.`);
    this.name = "FileTooLargeError";
  }
}

export class ParseError extends Error {
  constructor(fileName: string, cause: unknown) {
    super(`Failed to parse ${fileName}: ${cause instanceof Error ? cause.message : String(cause)}`);
    this.name = "ParseError";
  }
}

export class TextNotOutlinedError extends Error {
  constructor() {
    super(
      "This file has text that hasn't been converted to outlines. In most design tools this is " +
        "called 'Create Outlines' or 'Convert to Path' — re-export and try again."
    );
    this.name = "TextNotOutlinedError";
  }
}

export class NoVectorPathsFoundError extends Error {
  constructor() {
    super("We couldn't find a clean outline in this file. Please send us a vector file instead.");
    this.name = "NoVectorPathsFoundError";
  }
}
