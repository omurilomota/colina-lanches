import { useEffect, useState } from "react";

const CONTACT_SELECTOR = [
  'a[href^="tel:"]',
  'a[href^="mailto:"]',
  'a[href*="wa.me"]',
  'a[href*="api.whatsapp.com"]',
  'a[href*="instagram.com"]',
].join(",");

/**
 * Demonstração pública: nenhum telefone, WhatsApp, e-mail ou Instagram
 * fictício deve abrir um canal externo. O clique vira um aviso explicativo.
 */
export function DemoNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement | null)?.closest("a");
      if (link && link.matches(CONTACT_SELECTOR)) {
        event.preventDefault();
        setOpen(true);
      }
    };
    const onDemoContact = () => setOpen(true);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("demo:contact", onDemoContact);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("demo:contact", onDemoContact);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!open) return null;

  return (
    <div className="demo-overlay" onClick={() => setOpen(false)}>
      <div
        className="demo-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-title"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="demo-kicker">Demonstração</p>
        <h2 id="demo-title">Este site é uma peça de portfólio</h2>
        <p>
          Telefone, WhatsApp, e-mail, endereço e redes sociais são fictícios. Os preços e o
          cardápio também são exemplos.
        </p>
        <p>Nenhum pedido ou mensagem será enviado. Para falar sobre o projeto, use o contato do portfólio.</p>
        <button type="button" className="demo-close" onClick={() => setOpen(false)}>
          Entendi
        </button>
      </div>
    </div>
  );
}
