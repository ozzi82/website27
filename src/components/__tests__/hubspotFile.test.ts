import { describe, it, expect, vi, afterEach } from "vitest";
import { attachFileToInput, clearFileInput, fillHiddenFields, findFileInput, isSameFile } from "../hubspotFile";
import { FakeDataTransfer, makeFileInput } from "./helpers/fakeFileInput";

const svg = (name = "logo.svg") => new File(["<svg/>"], name, { type: "image/svg+xml", lastModified: 5 });

afterEach(() => {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

describe("attachFileToInput", () => {
  it("puts the file in the input and fires input and change so the form notices", () => {
    vi.stubGlobal("DataTransfer", FakeDataTransfer);
    const input = makeFileInput(document);
    const events: string[] = [];
    input.addEventListener("input", (e) => events.push(e.type + (e.bubbles ? "+bubbles" : "")));
    input.addEventListener("change", (e) => events.push(e.type + (e.bubbles ? "+bubbles" : "")));

    expect(attachFileToInput(input, svg())).toBe(true);
    expect(input.files).toHaveLength(1);
    expect(input.files![0].name).toBe("logo.svg");
    expect(events).toEqual(["input+bubbles", "change+bubbles"]);
  });

  it("uses the DataTransfer of the input's own window (the HubSpot iframe), not the page's", () => {
    const frame = document.createElement("iframe");
    document.body.appendChild(frame);
    const frameWin = frame.contentWindow as unknown as { DataTransfer?: unknown };
    const used: string[] = [];
    frameWin.DataTransfer = class extends FakeDataTransfer {
      constructor() {
        super();
        used.push("iframe");
      }
    };
    vi.stubGlobal(
      "DataTransfer",
      class extends FakeDataTransfer {
        constructor() {
          super();
          used.push("page");
        }
      }
    );
    const input = makeFileInput(frame.contentDocument!);
    expect(attachFileToInput(input, svg())).toBe(true);
    expect(used).toEqual(["iframe"]);
  });

  it("retries with a File built in the input's own window when the first add is refused", () => {
    const frame = document.createElement("iframe");
    document.body.appendChild(frame);
    const frameWin = frame.contentWindow as unknown as { DataTransfer: unknown; File: typeof File };
    const added: File[] = [];
    frameWin.DataTransfer = class extends FakeDataTransfer {
      items = {
        add: (f: File) => {
          if (!(f instanceof frameWin.File)) throw new TypeError("not a File of this window");
          added.push(f);
        },
      };
      get files() {
        return added;
      }
    };
    const input = makeFileInput(frame.contentDocument!);
    expect(svg() instanceof frameWin.File).toBe(false); // the page's File really is foreign to the iframe
    expect(attachFileToInput(input, svg())).toBe(true);
    expect(input.files![0]).toBeInstanceOf(frameWin.File);
    expect(input.files![0].name).toBe("logo.svg");
  });

  it("reports failure, without throwing, where DataTransfer does not exist", () => {
    vi.stubGlobal("DataTransfer", undefined);
    const input = makeFileInput(document);
    expect(attachFileToInput(input, svg())).toBe(false);
    expect(input.files).toHaveLength(0);
  });

  it("reports failure when the browser refuses the file", () => {
    vi.stubGlobal(
      "DataTransfer",
      class {
        items = {
          add: () => {
            throw new Error("nope");
          },
        };
        files = [];
      }
    );
    const input = makeFileInput(document);
    expect(attachFileToInput(input, svg())).toBe(false);
  });
});

describe("isSameFile", () => {
  it("compares name, size and modified time (a FileList entry is not the same object we added)", () => {
    expect(isSameFile(svg(), svg())).toBe(true);
    expect(isSameFile(svg("a.svg"), svg("b.svg"))).toBe(false);
    expect(isSameFile(new File(["12"], "a.svg", { lastModified: 5 }), new File(["123"], "a.svg", { lastModified: 5 }))).toBe(false);
    expect(isSameFile(undefined, svg())).toBe(false);
    expect(isSameFile(svg(), undefined)).toBe(false);
  });
});

describe("clearFileInput", () => {
  it("empties the input and tells the form", () => {
    vi.stubGlobal("DataTransfer", FakeDataTransfer);
    const input = makeFileInput(document);
    attachFileToInput(input, svg());
    const onChange = vi.fn();
    input.addEventListener("change", onChange);
    clearFileInput(input);
    expect(input.files).toHaveLength(0);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe("findFileInput", () => {
  it("finds the named file field in the page", () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const other = makeFileInput(document, "something_else");
    const wanted = makeFileInput(document, "upload_your_file_here");
    root.append(other, wanted);
    expect(findFileInput(root)).toBe(wanted);
  });

  it("finds it inside a same-origin iframe, like HubSpot's", () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const frame = document.createElement("iframe");
    root.appendChild(frame);
    const wanted = makeFileInput(frame.contentDocument!);
    expect(findFileInput(root)).toBe(wanted);
  });

  it("falls back to the only file input, and is null when there is none", () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    expect(findFileInput(root)).toBeNull();
    const only = makeFileInput(document, "attachment");
    root.appendChild(only);
    expect(findFileInput(root)).toBe(only);
  });
});

describe("fillHiddenFields", () => {
  const hidden = (doc: Document, name: string) => {
    const i = doc.createElement("input");
    i.type = "hidden";
    i.name = name;
    return i;
  };

  it("fills hidden fields that sit directly in the container", () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const g = hidden(document, "gclid");
    const m = hidden(document, "utm_medium");
    root.append(g, m);
    expect(fillHiddenFields(root, { gclid: "TEST1", utm_medium: "cpc", utm_term: "x" }).sort()).toEqual(["gclid", "utm_medium"]);
    expect(g.value).toBe("TEST1");
    expect(m.value).toBe("cpc");
  });

  it("fills hidden fields inside the iframe HubSpot draws the form in, and tells the form about it", () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const frame = document.createElement("iframe");
    root.appendChild(frame);
    const doc = frame.contentDocument!;
    const field = hidden(doc, "utm_source");
    doc.body.appendChild(field);
    const events: string[] = [];
    field.addEventListener("input", () => events.push("input"));
    field.addEventListener("change", () => events.push("change"));
    expect(fillHiddenFields(root, { utm_source: "google" })).toEqual(["utm_source"]);
    expect(field.value).toBe("google");
    expect(events).toEqual(["input", "change"]);
  });

  it("skips empty values and names the form does not have", () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const g = hidden(document, "gclid");
    root.appendChild(g);
    expect(fillHiddenFields(root, { gclid: "", utm_source: "google" })).toEqual([]);
    expect(g.value).toBe("");
  });
});
