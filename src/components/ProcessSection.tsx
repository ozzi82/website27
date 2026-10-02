import { useNavigate } from "react-router-dom";
import { Button } from '@project/components/ui/button';

const steps = [
  { num: "01", title: "Send Files", desc: "Logo, dimensions, photos" },
  { num: "02", title: "Review", desc: "Material & light effect" },
  { num: "03", title: "Quote", desc: "Pricing & visualization" },
  { num: "04", title: "Production", desc: "Manufacturing after approval" },
  { num: "05", title: "Delivery", desc: "Ready-to-install to your address" },
];

export default function ProcessSection() {
  const navigate = useNavigate();
  return (
    <section id="process" className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-4xl font-bold mb-6 md:mb-10 text-center">Our Process</h2>

        <div className="md:hidden max-w-sm mx-auto space-y-0 mb-6">
          {steps.map((s, i) => (
            <div key={s.num} className="flex gap-3 items-start">
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {s.num}
                </div>
                {i < steps.length - 1 && <div className="w-px h-6 bg-border" />}
              </div>
              <div className="pb-4">
                <h3 className="font-semibold text-sm">{s.title}</h3>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:grid grid-cols-5 gap-4 max-w-4xl mx-auto mb-8">
          {steps.map((s) => (
            <div key={s.num} className="bg-card border border-border rounded-xl p-4 text-center">
              <span className="text-2xl font-bold text-primary">{s.num}</span>
              <h3 className="font-semibold text-sm mt-2">{s.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" onClick={() => navigate("/contact")}>
            Start Your Project
          </Button>
        </div>
      </div>
    </section>
  );
}
