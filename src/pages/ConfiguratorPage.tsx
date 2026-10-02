import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import * as THREE from "three";
import { Button } from "@project/components/ui/button";
import Seo from "../components/Seo";
import ProductChooser from "../components/configurator/ProductChooser";
import UploadDropzone from "../components/configurator/UploadDropzone";
import ConfigControls from "../components/configurator/ConfigControls";
import SignPreview from "../components/configurator/SignPreview";
import PreviewErrorFallback from "../components/configurator/PreviewErrorFallback";
import { useWebglSupported } from "../components/configurator/webglSupport";
import { defaultConfigFor } from "../components/configurator/types";
import type { Product, ProductConfig } from "../components/configurator/types";

function isValidProduct(value: string | null): value is Product {
  return value === "trimless-letters" || value === "cast-block-acrylic";
}

export default function ConfiguratorPage() {
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("product");
  const initialProduct = isValidProduct(preselected) ? preselected : null;

  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [config, setConfig] = useState<ProductConfig | null>(
    initialProduct ? defaultConfigFor(initialProduct) : null
  );
  const [shapes, setShapes] = useState<THREE.Shape[] | null>(null);

  const webglSupported = useWebglSupported();

  function handleSelectProduct(selected: Product) {
    setProduct(selected);
    setConfig(defaultConfigFor(selected)); // shapes, if any, are intentionally left as-is — parsing is product-agnostic.
  }

  if (!webglSupported) {
    return (
      <div className="pt-28 pb-24 max-w-2xl mx-auto px-6 text-center">
        <Seo
          title="Sign Configurator"
          description="Upload your logo and see it rendered as a 3D channel-letter sign before you request a quote."
          path="/configurator"
        />
        <h1 className="text-3xl font-bold mb-4">3D preview isn't supported in this browser</h1>
        <p className="text-muted-foreground mb-6">
          You can still send us your logo directly and we'll quote it by hand.
        </p>
        <Button asChild size="lg">
          <Link to="/contact">Get a Quote</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-24 max-w-7xl mx-auto px-6">
      <Seo
        title="Sign Configurator"
        description="Upload your logo and see it rendered as a 3D channel-letter sign before you request a quote."
        path="/configurator"
      />
      <h1 className="text-5xl md:text-7xl mb-4">Sign Configurator</h1>

      {!product && <ProductChooser onSelect={handleSelectProduct} />}

      {product && config && (
        <>
          <div className="flex gap-6 mb-6">
            <button
              onClick={() => setProduct(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Switch product
            </button>
            {shapes && (
              <button
                onClick={() => setShapes(null)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Use a different file
              </button>
            )}
          </div>

          {!shapes && <UploadDropzone onParsed={setShapes} />}

          {shapes && (
            <div className="grid lg:grid-cols-[2fr_1fr] gap-8 mt-6">
              <ErrorBoundary FallbackComponent={PreviewErrorFallback} resetKeys={[shapes]}>
                <SignPreview shapes={shapes} config={config} />
              </ErrorBoundary>
              <div className="space-y-6">
                <ConfigControls config={config} onChange={setConfig} />
                <Button asChild size="lg" className="w-full">
                  <Link to="/contact">Get a Quote</Link>
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
