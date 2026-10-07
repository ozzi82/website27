/**
 * Helpers for putting a file into the HubSpot form's file field. HubSpot renders its form inside a same-origin
 * iframe, so the fields live in that iframe's own document and window.
 */

/** Documents that may hold the form's fields: the page itself and any same-origin iframe inside `root`. */
export function formDocuments(root: HTMLElement): Document[] {
  const docs: Document[] = [root.ownerDocument];
  for (const frame of Array.from(root.querySelectorAll("iframe"))) {
    try {
      if (frame.contentDocument) docs.push(frame.contentDocument);
    } catch {
      // cross-origin frame (the reCAPTCHA one): nothing to read
    }
  }
  return docs;
}

/**
 * Writes the visit's campaign tags (gclid, utm_source, ...) into the form's hidden fields of the same names. HubSpot draws
 * the form in a same-origin iframe, so every document that may hold the fields is searched; values are written the way the
 * field's own window would (its own Event class), and "input"/"change" are fired so HubSpot's form state picks them up.
 * Returns the names of the fields that were filled.
 */
export function fillHiddenFields(root: HTMLElement, values: Record<string, string | undefined>): string[] {
  const filled: string[] = [];
  for (const doc of formDocuments(root)) {
    const scope: ParentNode = doc === root.ownerDocument ? root : doc;
    for (const [name, value] of Object.entries(values)) {
      if (!value) continue;
      const field = scope.querySelector<HTMLInputElement>(`input[name="${name}"]`);
      if (!field || filled.includes(name)) continue;
      field.value = value;
      const win = field.ownerDocument.defaultView ?? window;
      field.dispatchEvent(new win.Event("input", { bubbles: true }));
      field.dispatchEvent(new win.Event("change", { bubbles: true }));
      filled.push(name);
    }
  }
  return filled;
}

const FILE_FIELD_NAME = "upload_your_file_here";

/** The form's file field: the one named `upload_your_file_here`, otherwise the only file input there is. */
export function findFileInput(root: HTMLElement): HTMLInputElement | null {
  let fallback: HTMLInputElement | null = null;
  for (const doc of formDocuments(root)) {
    const scope: ParentNode = doc === root.ownerDocument ? root : doc;
    const inputs = Array.from(scope.querySelectorAll<HTMLInputElement>("input[type=file]"));
    const named = inputs.find((i) => i.name === FILE_FIELD_NAME);
    if (named) return named;
    fallback ??= inputs[0] ?? null;
  }
  return fallback;
}

/** True when both are the same file. A FileList entry is not the object that was added, so compare what identifies it. */
export function isSameFile(a: File | null | undefined, b: File | null | undefined): boolean {
  return !!a && !!b && a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
}

function notify(input: HTMLInputElement) {
  const win = input.ownerDocument.defaultView ?? window;
  // HubSpot's form (React) reads the files in its change handler; some versions also listen for input.
  input.dispatchEvent(new win.Event("input", { bubbles: true }));
  input.dispatchEvent(new win.Event("change", { bubbles: true }));
}

/**
 * Attaches `files` to a file input the way a visitor choosing them would: through a DataTransfer (the only way to set
 * `input.files`), then input and change events so the form's own state registers them. Uses the input's own window,
 * whose DataTransfer the field belongs to. Returns false, never throws, if the browser cannot do it.
 */
export function attachFilesToInput(input: HTMLInputElement, files: File[]): boolean {
  if (files.length === 0) return false;
  const win = (input.ownerDocument.defaultView ?? window) as Window & typeof globalThis;
  const DT = win.DataTransfer ?? (typeof DataTransfer !== "undefined" ? DataTransfer : undefined);
  if (!DT) return false;

  const tryAdd = (list: File[]): boolean => {
    try {
      const dt = new DT();
      for (const f of list) dt.items.add(f);
      input.files = dt.files;
      return input.files?.length === list.length;
    } catch {
      return false;
    }
  };

  let ok = tryAdd(files);
  if (!ok && win.File && files.some((f) => !(f instanceof win.File))) {
    // A File from another window can be refused by some browsers: rebuild them in the input's own window.
    ok = tryAdd(files.map((f) => new win.File([f], f.name, { type: f.type, lastModified: f.lastModified })));
  }
  if (ok) notify(input);
  return ok;
}

/** One file: see attachFilesToInput. */
export function attachFileToInput(input: HTMLInputElement, file: File): boolean {
  return attachFilesToInput(input, [file]);
}

/** True when the field holds exactly these files, in this order. */
export function holdsFiles(input: HTMLInputElement, files: File[]): boolean {
  const held = input.files;
  return !!held && held.length === files.length && files.every((f, i) => isSameFile(held[i], f));
}

/** Empties the file field and tells the form. */
export function clearFileInput(input: HTMLInputElement): void {
  const win = (input.ownerDocument.defaultView ?? window) as Window & typeof globalThis;
  try {
    const DT = win.DataTransfer ?? (typeof DataTransfer !== "undefined" ? DataTransfer : undefined);
    if (DT) input.files = new DT().files;
    else input.value = "";
  } catch {
    try {
      input.value = "";
    } catch {
      return;
    }
  }
  notify(input);
}
