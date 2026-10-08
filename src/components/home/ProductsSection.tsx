import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SectionHeader from "../SectionHeader";
import { productCategories, type ProductCategory } from "../../data/products";
import Picture from "../Picture";

/** Compact horizontal card: photo on the left, text and a clear orange link on the right. The whole card is the link. */
function ProductTile({ product, signature }: { product: ProductCategory; signature?: boolean }) {
  return (
    <article data-product={product.id} className="group relative grid grid-cols-[7rem_1fr] sm:grid-cols-[9rem_1fr] border border-border bg-card/60 transition-colors hover:border-primary">
      <div className="relative overflow-hidden">
        <Picture
          src={product.image.src}
          alt={product.image.alt}
          width={product.image.width}
          height={product.image.height}
          sizes="(min-width: 640px) 9rem, 7rem"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />
      </div>
      <div className="flex min-w-0 flex-col justify-center gap-1 p-4">
        <p className="mono-label text-muted-foreground">
          {product.number}
          {signature && <span className="ml-2 text-primary">· Signature product</span>}
        </p>
        <h3 className="text-xl leading-tight sm:text-2xl">{product.title}</h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {product.systems}. {product.description}
        </p>
        <Link
          to={product.cta.to}
          className="mono-label mt-1 inline-flex items-center gap-1.5 text-primary after:absolute after:inset-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          {product.cta.label}
          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}

export default function ProductsSection() {
  return (
    <section id="products" className="py-10 md:py-14 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader eyebrow="What we build" title="Built for the jobs your shop wins." className="mb-6 pb-5 md:mb-8" titleClassName="text-3xl sm:text-4xl md:text-5xl" />
        <div className="grid gap-3 sm:grid-cols-2 md:gap-4">
          {productCategories.map((p, i) => (
            <ProductTile key={p.id} product={p} signature={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}
