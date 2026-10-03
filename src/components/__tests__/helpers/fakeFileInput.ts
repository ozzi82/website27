/**
 * jsdom has neither DataTransfer nor a settable `files`. These stand in for the browser pieces the attach helper
 * uses: a DataTransfer that collects files, and an input whose `files` accepts what that DataTransfer produced.
 */
export class FakeDataTransfer {
  private list: File[] = [];
  items: { add: (f: File) => void } = {
    add: (f: File) => {
      this.list.push(f);
    },
  };
  get files() {
    return this.list;
  }
}

/** A file input in `doc` whose `files` can be set like a browser's. */
export function makeFileInput(doc: Document, name = "upload_your_file_here"): HTMLInputElement {
  const input = doc.createElement("input");
  input.type = "file";
  input.name = name;
  let files: File[] = [];
  Object.defineProperty(input, "files", {
    configurable: true,
    get: () => files,
    set: (v: File[]) => {
      files = Array.from(v);
    },
  });
  doc.body.appendChild(input);
  return input;
}
