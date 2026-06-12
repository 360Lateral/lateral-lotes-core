import { Link } from "react-router-dom";
import { Linkedin, Instagram, Mail } from "lucide-react";
import Logo from "@/components/ui/Logo";

// TODO: las páginas /terminos, /privacidad, /nda, /sobre-nosotros, /blog aún no existen.
// Cuando se creen, estos links ya funcionarán sin cambios.

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Columna marca */}
          <div className="lg:col-span-1">
            <Logo variant="on-navy" />
            <p className="mt-4 font-body text-sm text-secondary-foreground/70">
              Plataforma SaaS B2B para diagnóstico inmobiliario e inteligencia del mercado en Colombia.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href="https://www.linkedin.com/company/360lateral"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn 360Lateral"
                className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 transition-colors hover:bg-primary/20 hover:text-primary motion-reduce:transition-none"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/360lateral"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram 360Lateral"
                className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 transition-colors hover:bg-primary/20 hover:text-primary motion-reduce:transition-none"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="mailto:hola@360lateral.com"
                aria-label="Enviar correo a 360Lateral"
                className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 transition-colors hover:bg-primary/20 hover:text-primary motion-reduce:transition-none"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Columna Producto */}
          <div>
            <h4 className="font-body text-sm font-semibold uppercase tracking-wider text-secondary-foreground">
              Producto
            </h4>
            <ul className="mt-4 space-y-2 font-body text-sm text-secondary-foreground/70">
              <li>
                <Link to="/#como-funciona" className="transition-colors hover:text-primary">
                  Cómo funciona
                </Link>
              </li>
              <li>
                <Link to="/bienvenida?rol=propietario" className="transition-colors hover:text-primary">
                  Para propietarios
                </Link>
              </li>
              <li>
                <Link to="/bienvenida?rol=desarrollador" className="transition-colors hover:text-primary">
                  Para desarrolladores
                </Link>
              </li>
              <li>
                <Link to="/mercado" className="transition-colors hover:text-primary">
                  Mercado
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna Empresa */}
          <div>
            <h4 className="font-body text-sm font-semibold uppercase tracking-wider text-secondary-foreground">
              Empresa
            </h4>
            <ul className="mt-4 space-y-2 font-body text-sm text-secondary-foreground/70">
              <li>
                <Link to="/sobre-nosotros" className="transition-colors hover:text-primary">
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <a href="mailto:hola@360lateral.com" className="transition-colors hover:text-primary">
                  Contacto
                </a>
              </li>
              <li>
                <Link to="/blog" className="transition-colors hover:text-primary">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna Legal */}
          <div>
            <h4 className="font-body text-sm font-semibold uppercase tracking-wider text-secondary-foreground">
              Legal
            </h4>
            <ul className="mt-4 space-y-2 font-body text-sm text-secondary-foreground/70">
              <li>
                <Link to="/terminos" className="transition-colors hover:text-primary">
                  Términos
                </Link>
              </li>
              <li>
                <Link to="/privacidad" className="transition-colors hover:text-primary">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link to="/nda" className="transition-colors hover:text-primary">
                  NDA
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 font-body text-xs text-secondary-foreground/60 sm:flex-row">
          <span>© {year} 360Lateral. Todos los derechos reservados.</span>
          <span>Medellín, Colombia</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
