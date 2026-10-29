import menuJson from "../data/menu.json";
import { imageSrc } from "../data/images";
import type { CartLine, CheckoutDetails, MenuData, Product } from "../types";

export const menu = menuJson as MenuData;
export const products = menu.groups.flatMap((group) => group.items);
export const productById = new Map(products.map((product) => [product.id, product]));
export { imageSrc };

export const CART_KEY = "colina-cart-v3";

export const money = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

export const optionKey = (groupId: string, optionId: string) => `${groupId}:${optionId}`;

export function selectedOptions(product: Product, keys: string[]) {
  const wanted = new Set(keys);
  return product.optionGroups.flatMap((group) =>
    group.options
      .filter((option) => wanted.has(optionKey(group.id, option.id)))
      .map((option) => ({ group, option })),
  );
}

export function lineUnitCents(line: CartLine) {
  const product = productById.get(line.productId);
  if (!product) return 0;
  return product.priceCents + selectedOptions(product, line.optionKeys).reduce((sum, { option }) => sum + option.priceCents, 0);
}

export const lineTotalCents = (line: CartLine) => lineUnitCents(line) * line.quantity;
export const cartSubtotal = (cart: CartLine[]) => cart.reduce((sum, line) => sum + lineTotalCents(line), 0);
export const cartCount = (cart: CartLine[]) => cart.reduce((sum, line) => sum + line.quantity, 0);

export function lineSignature(line: Pick<CartLine, "productId" | "optionKeys" | "note">) {
  return JSON.stringify([line.productId, [...line.optionKeys].sort(), line.note.trim()]);
}

export function defaultOptionKeys(product: Product): string[] {
  return product.optionGroups.flatMap((group) => {
    if (group.min <= 0) return [];
    const available = group.options.filter((option) => option.available);
    const preferred = /sach/i.test(group.name)
      ? available.find((option) => /todos/i.test(option.name)) ?? available[0]
      : available[0];
    return (preferred ? [preferred] : available.slice(0, group.min)).map((option) => optionKey(group.id, option.id));
  });
}

export function makeCartLine(productId: string, quantity: number, optionKeys: string[], note: string): CartLine {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    productId,
    quantity: Math.max(1, Math.min(99, Math.floor(quantity))),
    optionKeys: [...new Set(optionKeys)].sort(),
    note: note.trim().slice(0, 240),
  };
}

export function addLine(cart: CartLine[], next: CartLine) {
  const signature = lineSignature(next);
  const index = cart.findIndex((line) => lineSignature(line) === signature);
  if (index < 0) return [...cart, next];
  return cart.map((line, i) => i === index ? { ...line, quantity: Math.min(99, line.quantity + next.quantity) } : line);
}

export function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((line: Partial<CartLine>) => {
      if (!line || typeof line.productId !== "string" || !productById.has(line.productId)) return [];
      const product = productById.get(line.productId)!;
      if (!product.available) return [];
      const validKeys = new Set(product.optionGroups.flatMap((g) => g.options.map((o) => optionKey(g.id, o.id))));
      const keys = Array.isArray(line.optionKeys) ? line.optionKeys.filter((key): key is string => typeof key === "string" && validKeys.has(key)) : [];
      const quantity = Number(line.quantity);
      if (!Number.isFinite(quantity) || quantity < 1) return [];
      return [{
        id: typeof line.id === "string" ? line.id : makeCartLine(line.productId, 1, [], "").id,
        productId: line.productId,
        quantity: Math.min(99, Math.floor(quantity)),
        optionKeys: [...new Set(keys)].sort(),
        note: typeof line.note === "string" ? line.note.slice(0, 240) : "",
      }];
    });
  } catch {
    return [];
  }
}

export function saveCart(cart: CartLine[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    // The cart still works in memory when storage is unavailable.
  }
}

export function buildWhatsAppMessage(cart: CartLine[], details: CheckoutDetails) {
  const lines = cart.map((line, index) => {
    const product = productById.get(line.productId);
    if (!product) return "";
    const options = selectedOptions(product, line.optionKeys);
    const parts = [`${index + 1}. ${line.quantity}x ${product.name}`];
    parts.push(`   Unitário: ${money(lineUnitCents(line))} | Total: ${money(lineTotalCents(line))}`);
    if (options.length) {
      parts.push("   Adicionais/opções:");
      for (const { group, option } of options) {
        parts.push(`   - ${group.name}: ${option.name}${option.priceCents ? ` (${money(option.priceCents)})` : ""}`);
      }
    }
    if (line.note) parts.push(`   Observação: ${line.note}`);
    return parts.join("\n");
  });

  const address = details.mode === "entrega"
    ? [
        `Rua: ${details.street.trim()}`,
        `Número: ${details.number.trim()}`,
        `Bairro: ${details.neighborhood.trim()}`,
        details.complement.trim() ? `Complemento/referência: ${details.complement.trim()}` : "",
      ].filter(Boolean).join("\n")
    : "Retirada na Lanchonete Colina\nRua das Acácias, 120 - Centro";

  const payment = details.payment === "Dinheiro" && details.changeFor.trim()
    ? `Dinheiro (troco para ${details.changeFor.trim()})`
    : details.payment;

  return [
    "*NOVO PEDIDO — LANCHONETE COLINA*",
    "",
    `*Cliente:* ${details.name.trim()}`,
    `*Recebimento:* ${details.mode === "entrega" ? "Entrega" : "Retirada"}`,
    address,
    "",
    "*ITENS*",
    ...lines,
    "",
    `*Subtotal:* ${money(cartSubtotal(cart))}`,
    "*Taxa de entrega:* a confirmar",
    `*Pagamento:* ${payment}`,
    "",
    "Podem confirmar disponibilidade, prazo e valor final?",
  ].join("\n");
}

export const whatsappUrl = (message: string) =>
  `https://wa.me/${menu.store.whatsapp}?text=${encodeURIComponent(message)}`;
