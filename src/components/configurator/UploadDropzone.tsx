import { useState, type ChangeEvent, type DragEvent } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";
import { parseArtwork } from "./parseArtwork";
import { CONTACT_PHRASE, userMessageFor } from "./errorMessages";

interface UploadDropzoneProps {
  onParsed: (shapes: THREE.Shape[]) => void;
}

export default function UploadDropzone({ onParsed }: UploadDropzoneProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      const shapes = await parseArtwork(file);
      onParsed(shapes);
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
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="border-2 border-dashed border-border rounded-xl p-10 text-center"
    >
      <label htmlFor="artwork-upload" className="block mb-3 font-medium">
        Upload your logo (SVG or PDF)
      </label>
      <input id="artwork-upload" type="file" accept=".svg,.pdf" onChange={handleChange} className="mx-auto" />
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
