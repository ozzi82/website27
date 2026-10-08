import { useState, type ChangeEvent, type DragEvent } from "react";
import { UploadCloud } from "lucide-react";
import { Link } from "react-router-dom";
import * as THREE from "three";
import { parseArtwork } from "./parseArtwork";
import { CONTACT_PHRASE, userMessageFor } from "./errorMessages";

interface UploadDropzoneProps {
  onParsed: (shapes: THREE.Shape[], file: File) => void;
  /** The drop box inside the configurator panel: a short dashed box instead of the full-page one. */
  compact?: boolean;
}

export default function UploadDropzone({ onParsed, compact = false }: UploadDropzoneProps) {
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      const shapes = await parseArtwork(file);
      onParsed(shapes, file);
    } catch (err) {
      console.error("Artwork upload failed:", err);
      setError(userMessageFor(err));
    } finally {
      setLoading(false);
    }
  }

  // Turns the CONTACT_PHRASE inside a message into a router link to /contact.
  function renderMessage(message: string) {
    const at = message.indexOf(CONTACT_PHRASE);
    if (at === -1) return message;
    return (
      <>
        {message.slice(0, at)}
        <Link to="/contact" className="underline">
          {CONTACT_PHRASE}
        </Link>
        {message.slice(at + CONTACT_PHRASE.length)}
      </>
    );
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Clear after grabbing the File (the FileList is live) so picking the same
    // filename again — e.g. after fixing it and re-exporting — fires change.
    e.target.value = "";
    if (file) void handleFile(file);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  const messages = (
    <>
      {loading && <p className="mt-3 text-sm text-muted-foreground">Reading file…</p>}
      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {renderMessage(error)}
        </p>
      )}
    </>
  );

  if (compact) {
    return (
      <div>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={handleDrop}
          className={`rounded-xl border-2 border-dashed transition-colors ${over ? "border-primary bg-primary/10" : "border-input bg-card/40"}`}
        >
          <label
            htmlFor="artwork-upload"
            className="flex cursor-pointer flex-col items-center gap-1.5 px-4 py-8 text-center has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring"
          >
            <UploadCloud aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
            <span className="text-base font-semibold">Upload your logo</span>
            <span className="text-xs text-muted-foreground">Click to choose a file, or drop it here</span>
            <span className="mt-1 rounded-full border border-input px-3 py-1 text-xs font-medium">Choose a file</span>
            <input id="artwork-upload" type="file" accept=".svg,.pdf,.ai" onChange={handleChange} className="sr-only" />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">SVG, PDF or AI (vector artwork).</p>
        {messages}
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="border-2 border-dashed border-border rounded-xl p-10 text-center"
    >
      <label htmlFor="artwork-upload" className="block mb-3 font-medium">
        Upload your logo (SVG, PDF or AI)
      </label>
      <input id="artwork-upload" type="file" accept=".svg,.pdf,.ai" onChange={handleChange} className="mx-auto block w-full max-w-full min-w-0 text-sm" />
      {loading && <p className="text-sm text-muted-foreground mt-3">Reading file…</p>}
      {error && (
        <p className="text-sm text-destructive mt-3" role="alert">
          {renderMessage(error)}
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-4">
        Need to send us your artwork directly instead?{" "}
        <Link to="/contact" className="underline">Contact us</Link>.
      </p>
    </div>
  );
}
