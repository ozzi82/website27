const groups = [
  "Sign Companies", "Agencies", "Shopfitters", "Interior Build-Out",
  "Architects", "Planning Firms", "Trade Show Builders", "Print Shops", "Retail Agencies",
];

export default function TargetGroups() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">Built for Sign Companies and Trade Professionals</h2>
        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          {groups.map((g) => (
            <span key={g} className="bg-muted text-foreground text-sm font-medium px-4 py-2 rounded-full border border-border">
              {g}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
