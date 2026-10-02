import { useEffect } from "react";
import GallerySection from "../components/GallerySection";
import FinalCTA from "../components/FinalCTA";
import Seo from "../components/Seo";

export default function GalleryPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <>
      <Seo
        title="Project Gallery"
        description="Channel letters, 3D logos and illuminated signage built for sign companies and trade partners across the United States — browse completed Sunlite Signs projects."
        path="/gallery"
      />
      <section className="pt-24 pb-12 bg-secondary">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Our Projects</h1>
          <p className="text-muted-foreground text-lg">
            Channel letters, 3D logos, and illuminated signage — see what we've built for partners like you.
          </p>
        </div>
      </section>
      <GallerySection />
      <FinalCTA />
    </>
  );
}
