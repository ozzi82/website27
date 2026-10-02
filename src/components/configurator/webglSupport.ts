import { useEffect, useState } from "react";

export function isWebglSupported(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

export function useWebglSupported(): boolean {
  const [supported, setSupported] = useState(true);
  useEffect(() => {
    setSupported(isWebglSupported());
  }, []);
  return supported;
}
