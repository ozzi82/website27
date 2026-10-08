import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SectionHeader from "../SectionHeader";
import { productCategories, type ProductCategory } from "../../data/products";
import Picture from "../Picture";

/** Four cards of one size: a short photo, the name, a summary and a solid orange button. The whole card is the link. */
function ProductCard({ product, signature }: { product: ProductCategory; signature?: boolean }) {
  return (
    <article data-product={product.id} className="group relative flex flex-col border border-border bg-card/60 transition-colors hover:border-primary">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Picture
          src={product.image.src}
          alt={product.image.alt}
          width={product.image.width}
          height={product.image.height}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <span className="absolute left-3 top-3 mono-label bg-background/90 px-2 py-1">{product.number}</span>
        {signature && <span className="absolute right-3 top-3 mono-label bg-primary px-2 py-1 text-primary-foreground">Signature product</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-2xl leading-tight">{product.title}</h3>
        <p className="mono-label text-primary">{product.systems}</p>
        <p className="line-clamp-4 text-sm text-muted-foreground">{product.description}</p>
        <Link
          to={product.cta.to}
          className="mt-auto inline-flex items-center justify-between gap-2 bg-primary px-4 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-colors after:absolute after:inset-0 group-hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {product.cta.label}
          <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}

export default function ProductsSection() {
  return (
    <section id="products" className="py-14 md:py-20 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader eyebrow="What we build" title="Built for the jobs your shop wins." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-5">
          {productCategories.map((p, i) => (
            <ProductCard key={p.id} product={p} signature={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}
