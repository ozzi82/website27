import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SectionHeader from "../SectionHeader";
import { productCategories, type ProductCategory } from "../../data/products";

function ProductCta({ product }: { product: ProductCategory }) {
  // The label is the link; its ::after covers the whole card so the card is clickable without nesting links.
  return (
    <Link
      to={product.cta.to}
      className="mono-label mt-auto pt-5 inline-flex items-center gap-2 text-primary group-hover:text-foreground transition-colors after:absolute after:inset-0"
    >
      {product.cta.label}
      <ArrowRight aria-hidden="true" className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function FeaturedProduct({ product }: { product: ProductCategory }) {
  return (
    <article data-product={product.id} className="group relative flex flex-col border border-border bg-card/50 hover:border-primary/60 transition-colors lg:col-span-7 lg:row-span-3">
      <div className="relative overflow-hidden aspect-[4/3] lg:aspect-auto lg:flex-1 lg:min-h-[22rem]">
        <img
          src={product.image.src}
          alt={product.image.alt}
          width={product.image.width}
          height={product.image.height}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
        <span className="absolute top-4 left-4 mono-label bg-background/90 px-2.5 py-1.5">{product.number}</span>
      </div>
      <div className="p-6 md:p-8 flex flex-col border-t border-border">
        <p className="mono-label text-primary">Signature product · {product.systems}</p>
        <h3 className="text-4xl md:text-6xl mt-3">{product.title}</h3>
        <p className="text-muted-foreground mt-4 max-w-xl">{product.description}</p>
        <ProductCta product={product} />
      </div>
    </article>
  );
}

function ProductRow({ product }: { product: ProductCategory }) {
  return (
    <article data-product={product.id} className="group relative grid grid-cols-[7.5rem_1fr] sm:grid-cols-[11rem_1fr] border border-border bg-card/50 hover:border-primary/60 transition-colors lg:col-span-5">
      <div className="relative overflow-hidden min-h-[8.5rem]">
        <img
          src={product.image.src}
          alt={product.image.alt}
          width={product.image.width}
          height={product.image.height}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      </div>
      <div className="p-5 flex flex-col border-l border-border">
        <p className="mono-label text-muted-foreground">{product.number} · {product.systems}</p>
        <h3 className="text-2xl md:text-3xl mt-1">{product.title}</h3>
        <p className="text-sm text-muted-foreground mt-2">{product.description}</p>
        <ProductCta product={product} />
      </div>
    </article>
  );
}

export default function ProductsSection() {
  const [featured, ...rest] = productCategories;
  return (
    <section id="products" className="py-14 md:py-28 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader eyebrow="What we build" title="Built for the jobs your shop wins." />
        <div className="grid lg:grid-cols-12 gap-5 md:gap-6">
          <FeaturedProduct product={featured} />
          {rest.map((p) => (
            <ProductRow key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
