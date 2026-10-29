import { useState } from "react";
import { Minus, Pencil, Plus, ShoppingBag, Trash2 } from "lucide-react";
import type { CartLine } from "../types";
import { HERO_IMAGE } from "../data/images";
import { cartCount, cartSubtotal, imageSrc, lineTotalCents, money, productById, selectedOptions } from "../utils/cart";

export default function CartPanel({
  cart,
  onQuantity,
  onRemove,
  onEdit,
  onClear,
  onCheckout,
  onBrowse,
}: {
  cart: CartLine[];
  onQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onEdit: (line: CartLine) => void;
  onClear: () => void;
  onCheckout: () => void;
  onBrowse: () => void;
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  const count = cartCount(cart);

  if (!cart.length) {
    return (
      <div className="cart-empty-state">
        <ShoppingBag size={34} strokeWidth={1.5} />
        <h3>Seu carrinho está vazio</h3>
        <p>Escolha um lanche, uma porção ou uma bebida para começar.</p>
        <button type="button" className="button button-red" onClick={onBrowse}>Ver cardápio</button>
      </div>
    );
  }

  return (
    <div className="cart-panel">
      <div className="cart-meta">
        <span>{count} {count === 1 ? "item" : "itens"}</span>
        {confirmClear ? (
          <span className="clear-confirm">
            Esvaziar?
            <button type="button" onClick={() => { onClear(); setConfirmClear(false); }}>Sim</button>
            <button type="button" onClick={() => setConfirmClear(false)}>Não</button>
          </span>
        ) : (
          <button type="button" className="text-button" onClick={() => setConfirmClear(true)}>Esvaziar</button>
        )}
      </div>

      <ul className="cart-lines">
        {cart.map((line) => {
          const product = productById.get(line.productId);
          if (!product) return null;
          const options = selectedOptions(product, line.optionKeys);
          return (
            <li className="cart-line" key={line.id}>
              <img src={imageSrc(product.image)} alt="" onError={(event) => { event.currentTarget.src = HERO_IMAGE; }} />
              <div className="cart-line-body">
                <strong>{product.name}</strong>
                {options.length > 0 && <p>{options.map(({ option }) => option.name).join(", ")}</p>}
                {line.note && <p className="cart-note">Obs.: {line.note}</p>}
                <div className="cart-line-bottom">
                  <div className="stepper small">
                    <button type="button" aria-label={`Diminuir ${product.name}`} disabled={line.quantity <= 1} onClick={() => onQuantity(line.id, line.quantity - 1)}><Minus size={14} /></button>
                    <span>{line.quantity}</span>
                    <button type="button" aria-label={`Aumentar ${product.name}`} disabled={line.quantity >= 99} onClick={() => onQuantity(line.id, line.quantity + 1)}><Plus size={14} /></button>
                  </div>
                  <strong>{money(lineTotalCents(line))}</strong>
                </div>
                <div className="cart-line-tools">
                  <button type="button" onClick={() => onEdit(line)}><Pencil size={12} /> Editar</button>
                  <button type="button" onClick={() => onRemove(line.id)}><Trash2 size={12} /> Remover</button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="cart-summary">
        <div><span>Subtotal</span><strong>{money(cartSubtotal(cart))}</strong></div>
        <p>Entrega e disponibilidade confirmadas pela loja no WhatsApp.</p>
        <button type="button" className="button button-red w-full" onClick={onCheckout}>Continuar para entrega <ShoppingBag size={16} /></button>
      </div>
    </div>
  );
}
