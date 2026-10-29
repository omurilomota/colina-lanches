import { describe, expect, it } from "vitest";
import {
  addLine,
  buildWhatsAppMessage,
  cartCount,
  cartSubtotal,
  lineSignature,
  makeCartLine,
  money,
  products,
} from "./cart";

describe("money", () => {
  it("formata centavos em reais", () => {
    expect(money(2790).replace(/\u00a0/g, " ")).toBe("R$ 27,90");
    expect(money(100).replace(/\u00a0/g, " ")).toBe("R$ 1,00");
  });
});

describe("carrinho", () => {
  it("soma quantidade e subtotal", () => {
    const product = products[0];
    const line = makeCartLine(product.id, 2, [], "");
    expect(cartCount([line])).toBe(2);
    expect(cartSubtotal([line])).toBe(product.priceCents * 2);
  });

  it("agrupa linhas iguais em vez de duplicar", () => {
    const product = products[0];
    const line = makeCartLine(product.id, 1, [], "");
    const merged = addLine([line], makeCartLine(product.id, 2, [], ""));
    expect(merged).toHaveLength(1);
    expect(merged[0].quantity).toBe(3);
  });

  it("considera opções e observação na assinatura da linha", () => {
    const product = products[0];
    const base = makeCartLine(product.id, 1, [], "");
    expect(lineSignature(base)).toBe(lineSignature({ ...base }));
    expect(lineSignature(base)).not.toBe(lineSignature({ ...base, note: "sem cebola" }));
  });
});

describe("buildWhatsAppMessage", () => {
  it("inclui itens, total e endereço fictício de retirada", () => {
    const product = products[0];
    const message = buildWhatsAppMessage(
      [makeCartLine(product.id, 1, [], "")],
      {
        name: "Ana",
        mode: "retirada",
        street: "",
        number: "",
        neighborhood: "",
        complement: "",
        payment: "Pix",
        changeFor: "",
      },
    );
    expect(message).toContain("Ana");
    expect(message).toContain(product.name);
    expect(message).toContain("Rua das Acácias, 120");
    expect(message).toContain("Pix");
  });
});
