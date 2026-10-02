import { useNavigate } from 'react-router-dom';
import { Button } from '@project/components/ui/button';

export default function FinalCTA() {
  const navigate = useNavigate();
  return (
    <section className="py-10 md:py-16 bg-primary">
      <div className="container mx-auto px-4 text-center max-w-2xl">
        <h2 className="text-xl md:text-3xl font-bold mb-2 md:mb-3 text-primary-foreground">
          Have a project? Get a quote now.
        </h2>
        <p className="text-primary-foreground/80 mb-4 md:mb-6 text-sm md:text-base">
          Send your logo and dimensions — we'll send back a quote within 48 hours.
        </p>
        <Button size="lg" variant="secondary" onClick={() => navigate("/contact")}>
          Start Your Project
        </Button>
      </div>
    </section>
  );
}
