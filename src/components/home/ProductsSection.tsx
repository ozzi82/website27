import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SectionHeader from "../SectionHeader";
import { productCategories, type ProductCategory } from "../../data/products";
import Picture from "../Picture";

/** One whole-card link: big photo, big title over it, and an obvious button, so it is clear where to click. */
function ProductTile({ product, signature }: { product: ProductCategory; signature?: boolean }) {
  return (
    <article data-product={product.id} className="group relative flex flex-col overflow-hidden border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-[0_0_0_1px_hsl(var(--primary)),0_18px_40px_-18px_hsl(var(--primary)/0.5)]">
      <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[3/4] lg:aspect-[4/5]">
        <Picture
          src={product.image.src}
          alt={product.image.alt}
          width={product.image.width}
          height={product.image.height}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" aria-hidden />
        <span className="absolute left-4 top-4 mono-label bg-background/90 px-2.5 py-1.5">{product.number}</span>
        {signature && <span className="absolute right-4 top-4 mono-label bg-primary px-2.5 py-1.5 text-primary-foreground">Signature product</span>}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="text-3xl leading-[1.05] sm:text-4xl lg:text-[1.7rem] xl:text-4xl">{product.title}</h3>
          <p className="mono-label mt-2 text-primary">{product.systems}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5 pt-4">
        <p className="text-sm text-muted-foreground">{product.description}</p>
        <Link
          to={product.cta.to}
          className="mt-5 inline-flex items-center justify-between gap-2 bg-primary px-4 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-colors group-hover:bg-primary/90 after:absolute after:inset-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
    <section id="products" className="py-14 md:py-24 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader eyebrow="What we build" title="Built for the jobs your shop wins." intro="Pick a product to see the options, sizes and examples." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-5">
          {productCategories.map((p, i) => (
            <ProductTile key={p.id} product={p} signature={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}
