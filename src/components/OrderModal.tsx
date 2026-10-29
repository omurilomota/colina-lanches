import { useMemo, useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import type { CartLine, CheckoutDetails } from "../types";
import { buildWhatsAppMessage, cartSubtotal, money, whatsappUrl } from "../utils/cart";
import ModalShell from "./ModalShell";

const initial: CheckoutDetails = {
  name: "",
  mode: "entrega",
  street: "",
  number: "",
  neighborhood: "",
  complement: "",
  payment: "Pix",
  changeFor: "",
};

export default function OrderModal({ cart, onClose }: { cart: CartLine[]; onClose: () => void }) {
  const [details, setDetails] = useState<CheckoutDetails>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [prepared, setPrepared] = useState(false);
  const [copied, setCopied] = useState(false);
  const message = useMemo(() => buildWhatsAppMessage(cart, details), [cart, details]);

  const set = (key: keyof CheckoutDetails, value: string) => {
    setDetails((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: "" }));
    setPrepared(false);
  };

  function validate() {
    const next: Record<string, string> = {};
    if (details.name.trim().length < 2) next.name = "Informe seu nome.";
    if (details.mode === "entrega") {
      if (!details.street.trim()) next.street = "Informe a rua.";
      if (!details.number.trim()) next.number = "Informe o número.";
      if (!details.neighborhood.trim()) next.neighborhood = "Informe o bairro.";
    }
    if (!details.payment) next.payment = "Escolha uma forma de pagamento.";
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(`checkout-${Object.keys(next)[0]}`)?.focus();
      return false;
    }
    return true;
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <ModalShell title="Finalizar pedido" eyebrow="Quase lá" onClose={onClose} wide>
      <div className="checkout-grid">
        <form
          className="checkout-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (validate()) {
              setPrepared(true);
              window.dispatchEvent(new CustomEvent("demo:contact"));
            }
          }}
        >
          <div className="field">
            <label htmlFor="checkout-name">Seu nome *</label>
            <input id="checkout-name" className="text-field" autoComplete="name" value={details.name} onChange={(e) => set("name", e.target.value)} placeholder="Como podemos te chamar?" />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>

          <fieldset className="delivery-toggle">
            <legend>Como quer receber?</legend>
            <label className={details.mode === "entrega" ? "active" : ""}>
              <input type="radio" name="mode" checked={details.mode === "entrega"} onChange={() => set("mode", "entrega")} />
              Entrega
            </label>
            <label className={details.mode === "retirada" ? "active" : ""}>
              <input type="radio" name="mode" checked={details.mode === "retirada"} onChange={() => set("mode", "retirada")} />
              Retirada
            </label>
          </fieldset>

          {details.mode === "entrega" ? (
            <div className="address-grid">
              <div className="field street">
                <label htmlFor="checkout-street">Rua *</label>
                <input id="checkout-street" className="text-field" autoComplete="address-line1" value={details.street} onChange={(e) => set("street", e.target.value)} />
                {errors.street && <p className="field-error">{errors.street}</p>}
              </div>
              <div className="field">
                <label htmlFor="checkout-number">Número *</label>
                <input id="checkout-number" className="text-field" inputMode="numeric" autoComplete="address-line2" value={details.number} onChange={(e) => set("number", e.target.value)} />
                {errors.number && <p className="field-error">{errors.number}</p>}
              </div>
              <div className="field">
                <label htmlFor="checkout-neighborhood">Bairro *</label>
                <input id="checkout-neighborhood" className="text-field" value={details.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
                {errors.neighborhood && <p className="field-error">{errors.neighborhood}</p>}
              </div>
              <div className="field">
                <label htmlFor="checkout-complement">Complemento / referência</label>
                <input id="checkout-complement" className="text-field" value={details.complement} onChange={(e) => set("complement", e.target.value)} placeholder="Apto, bloco, ponto de referência" />
              </div>
            </div>
          ) : (
            <p className="pickup-note">Retirada na Lanchonete Colina — Rua das Acácias, 120, Centro.</p>
          )}

          <div className="field">
            <label htmlFor="checkout-payment">Pagamento *</label>
            <select id="checkout-payment" className="text-field" value={details.payment} onChange={(e) => set("payment", e.target.value)}>
              <option>Pix</option>
              <option>Cartão</option>
              <option>Dinheiro</option>
              <option>A combinar</option>
            </select>
            {errors.payment && <p className="field-error">{errors.payment}</p>}
            {details.payment === "Pix" && <p className="field-help">A loja envia a chave Pix depois de confirmar o pedido.</p>}
          </div>

          {details.payment === "Dinheiro" && (
            <div className="field">
              <label htmlFor="checkout-change">Troco para quanto? (opcional)</label>
              <input id="checkout-change" className="text-field" inputMode="decimal" value={details.changeFor} onChange={(e) => set("changeFor", e.target.value)} placeholder="Ex.: R$ 50,00" />
            </div>
          )}

          <div className="checkout-total">
            <span>Subtotal</span>
            <strong>{money(cartSubtotal(cart))}</strong>
            <small>Taxa de entrega e prazo confirmados pela loja.</small>
          </div>

          <a
            className={`button button-red w-full ${!cart.length ? "pointer-events-none opacity-50" : ""}`}
            href={whatsappUrl(message)}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => {
              if (!cart.length || !validate()) {
                event.preventDefault();
                return;
              }
              setPrepared(true);
            }}
          >
            <MessageCircle size={18} /> Simular envio do pedido
          </a>
          <p className="field-help text-center">Você revisa e toca em enviar dentro do WhatsApp. Nenhum pagamento é feito aqui.</p>
          {prepared && <p className="success-note" role="status">Demonstração: nenhum pedido será enviado.</p>}
        </form>

        <aside className="message-preview">
          <div className="message-preview-head">
            <h3>Prévia da mensagem</h3>
            <button type="button" className="text-button" onClick={copyMessage}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copiado" : "Copiar"}</button>
          </div>
          <pre>{message}</pre>
        </aside>
      </div>
    </ModalShell>
  );
}
