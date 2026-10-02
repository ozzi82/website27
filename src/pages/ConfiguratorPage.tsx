import * as THREE from "three";
import Seo from "../components/Seo";
import SignPreview from "../components/configurator/SignPreview";

function makeSquare(offsetX: number): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(offsetX - 0.8, -1);
  shape.lineTo(offsetX + 0.8, -1);
  shape.lineTo(offsetX + 0.8, 1);
  shape.lineTo(offsetX - 0.8, 1);
  shape.closePath();
  return shape;
}

const testShapes = [makeSquare(-1.2), makeSquare(1.2)];

// TEMPORARY test wiring for Chunk 3's visual verification — replaced in Chunk 5.
export default function ConfiguratorPage() {
  return (
    <div className="pt-28 pb-24 max-w-7xl mx-auto px-6">
      <Seo
        title="Sign Configurator"
        description="Upload your logo and see it rendered as a 3D channel-letter sign before you request a quote."
        path="/configurator"
      />
      <h1 className="text-5xl md:text-7xl mb-4">Sign Configurator</h1>
      <SignPreview
        shapes={testShapes}
        config={{
          product: "trimless-letters",
          illumination: "face-lit",
          depth: "standard",
          faceColor: "white",
          returnColor: "black",
          dayNight: "day",
        }}
      />
    </div>
  );
}
