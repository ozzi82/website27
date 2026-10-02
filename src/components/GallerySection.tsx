import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@project/components/ui/button';

const items = [
  { img: "/images/pasted-image-1786571168082-g326u0k5.png" },
  { img: "/images/pasted-image-1786571168465-hoggarou.png" },
  { img: "/images/pasted-image-1786571174777-ihzwikss.jpg" },
  { img: "/images/pasted-image-1786571178138-56b8eh5p.jpg" },
  { img: "/images/pasted-image-1786571504837-jti27n6h.jpeg" },
  { img: "/images/pasted-image-1786571527961-nvve6zo0.jpg" },
  { img: "/images/pasted-image-1787166590601-hr7ca0em.jpeg", label: "Stroh + Scheuerpflug" },
  { img: "/images/pasted-image-1787166590730-o61irwkk.jpeg", label: "Tradebyte" },
  { img: "/images/pasted-image-1787166590805-pvuw1j0d.jpeg", label: "MACS" },
  { img: "/images/pasted-image-1787166590876-4gqe7y4j.jpeg", label: "JenTower" },
  { img: "/images/pasted-image-1787166590951-kao0m19c.jpeg", label: "ARGO-HYTOS" },
  { img: "/images/pasted-image-1787166591040-2vakze8k.jpeg", label: "itonics" },
];

const MOBILE_INITIAL = 6;

function GalleryTile({ item }: { item: typeof items[0] }) {
  return (
    <div className="group relative rounded-lg overflow-hidden aspect-[4/3] bg-black/5">
      <img
        src={item.img}
        alt={item.label || "Product example"}
        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 brightness-[1.02] contrast-[1.02] saturate-[1.05]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      {item.label && (
        <span className="absolute bottom-0 left-0 right-0 text-white text-xs font-medium px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 truncate">
          {item.label}
        </span>
      )}
    </div>
  );
}

export default function GallerySection() {
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  return (
    <section id="projects" className="py-12 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-4xl font-bold mb-6 md:mb-12 text-center">
          Project Examples
        </h2>

        <div className="md:hidden">
          <div className="grid grid-cols-2 gap-2">
            {(showAll ? items : items.slice(0, MOBILE_INITIAL)).map((item, i) => (
              <GalleryTile key={i} item={item} />
            ))}
          </div>
          {!showAll && items.length > MOBILE_INITIAL && (
            <div className="text-center mt-4">
              <Button variant="outline" size="sm" onClick={() => setShowAll(true)}>
                Show All {items.length} Projects
              </Button>
            </div>
          )}
        </div>

        <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
          {items.map((item, i) => (
            <GalleryTile key={i} item={item} />
          ))}
        </div>

        <div className="text-center mt-6 md:mt-10">
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/contact")}
          >
            Get a Quote for a Similar Project
          </Button>
        </div>
      </div>
    </section>
  );
}
