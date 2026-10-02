import Seo from "../components/Seo";

export default function ConfiguratorPage() {
  return (
    <div className="pt-28 pb-24 max-w-7xl mx-auto px-6">
      <Seo
        title="Sign Configurator"
        description="Upload your logo and see it rendered as a 3D channel-letter sign before you request a quote."
        path="/configurator"
      />
      <h1 className="text-5xl md:text-7xl mb-4">Sign Configurator</h1>
      <p className="text-muted-foreground max-w-xl">Coming soon.</p>
    </div>
  );
}
