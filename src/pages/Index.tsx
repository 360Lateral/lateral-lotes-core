import Logo from "@/components/ui/Logo";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="bg-secondary flex items-center justify-between px-6 py-4">
        <Logo variant="on-navy" />
        <span className="text-secondary-foreground font-body text-sm">
          Plataforma Inmobiliaria
        </span>
      </nav>

      {/* Content */}
      <main className="flex flex-col items-center justify-center py-20 px-4">
        <Logo variant="on-white" className="text-3xl mb-6" />
        <h1 className="text-3xl font-bold text-carbon mb-2 font-body">
          360Lateral Lotes
        </h1>
        <p className="text-muted-foreground font-body mb-8">
          Sistema de diseño configurado. Esperando instrucciones.
        </p>

        {/* Design system preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
          <div className="rounded-lg border border-gray-light bg-card p-4 text-center">
            <span className="inline-block w-3 h-3 rounded-full bg-success mr-1" />
            <span className="text-sm font-body">Disponible</span>
          </div>
          <div className="rounded-lg border border-gray-light bg-card p-4 text-center">
            <span className="inline-block w-3 h-3 rounded-full bg-warning mr-1" />
            <span className="text-sm font-body">Reservado</span>
          </div>
          <div className="rounded-lg border border-gray-light bg-card p-4 text-center">
            <span className="inline-block w-3 h-3 rounded-full bg-danger mr-1" />
            <span className="text-sm font-body">Vendido</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
