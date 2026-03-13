import Logo from "@/components/ui/Logo";

const Footer = () => (
  <footer className="bg-secondary py-10">
    <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4">
      <Logo variant="on-navy" />
      <p className="font-body text-sm text-secondary-foreground/70">
        360lateral.com.co
      </p>
    </div>
  </footer>
);

export default Footer;
