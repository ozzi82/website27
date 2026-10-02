import { useState, type ChangeEvent, type DragEvent } from "react";
import * as THREE from "three";
import { parseArtwork } from "./parseArtwork";

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
      setError(err instanceof Error ? err.message : "Something went wrong reading that file.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
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
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-4">
        Need to send us your artwork directly instead?{" "}
        <a href="/contact" className="underline">Contact us</a>.
      </p>
    </div>
  );
}
