import { useMemo, useState } from "react";
import { ChevronDown, Minus, Plus, ShoppingBag, SlidersHorizontal } from "lucide-react";
import type { CartLine, OptionGroup, Product } from "../types";
import { HERO_IMAGE } from "../data/images";
import { defaultOptionKeys, imageSrc, makeCartLine, money, optionKey } from "../utils/cart";
import ModalShell from "./ModalShell";

const drinkPattern = /coca|fanta|sprite|guaran|tubaina|skol|brahma|antarctica|original|long neck|água|agua|suco|powerade/i;

function friendlyGroupName(name: string) {
  if (/capricha|adicionar mais coisa|porç/i.test(name)) return "Adicionais";
  if (/molho/i.test(name)) return "Molhos extras";
  if (/pão|pao/i.test(name)) return "Tipo de pão";
  if (/sach/i.test(name)) return "Sachês";
  if (/acompanhamento/i.test(name)) return "Acompanhamentos inclusos";
  if (/turbine/i.test(name)) return "Extras para o copo";
  if (/suco/i.test(name)) return "Deixar o suco do seu jeito";
  return name.replace(/\?$/, "");
}

function groupSummary(group: OptionGroup, chosenIds: string[]) {
  if (!chosenIds.length) {
    if (/pão|pao/i.test(group.name)) return "Padrão: tradicional";
    return group.min > 0 ? `Escolha pelo menos ${group.min}` : "Opcional";
  }
  const names = group.options.filter((option) => chosenIds.includes(option.id)).map((option) => option.name);
  return names.length <= 2 ? names.join(", ") : `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

export default function ProductModal({
  product,
  initialLine,
  onClose,
  onSave,
}: {
  product: Product;
  initialLine?: CartLine;
  onClose: () => void;
  onSave: (line: CartLine, editId?: string) => void;
}) {
  const [quantity, setQuantity] = useState(initialLine?.quantity ?? 1);
  const [note, setNote] = useState(initialLine?.note ?? "");
  const [noteOpen, setNoteOpen] = useState(Boolean(initialLine?.note));
  const [error, setError] = useState("");
  const isAcai = /copo\s*\d+\s*ml|açaí|acai/i.test(product.name);
  const [showOptions, setShowOptions] = useState(Boolean(initialLine) || isAcai);
  const defaultKeys = useMemo(() => defaultOptionKeys(product), [product]);
  const [selections, setSelections] = useState<Record<string, string[]>>(() => {
    const sourceKeys = initialLine?.optionKeys ?? defaultKeys;
    const next: Record<string, string[]> = {};
    for (const group of product.optionGroups) {
      next[group.id] = sourceKeys
        .filter((key) => key.startsWith(`${group.id}:`))
        .map((key) => key.split(":")[1]);
    }
    return next;
  });

  const optionKeys = useMemo(
    () => Object.entries(selections).flatMap(([groupId, ids]) => ids.map((id) => optionKey(groupId, id))),
    [selections],
  );
  const extrasCents = product.optionGroups.reduce(
    (sum, group) =>
      sum +
      (selections[group.id] ?? []).reduce(
        (inner, id) => inner + (group.options.find((option) => option.id === id)?.priceCents ?? 0),
        0,
      ),
    0,
  );
  const total = (product.priceCents + extrasCents) * quantity;
  const isDrink = drinkPattern.test(product.name);
  const customCount = optionKeys.filter((key) => !defaultKeys.includes(key)).length;

  function toggle(groupId: string, optionId: string, max: number) {
    setError("");
    setSelections((previous) => {
      const current = previous[groupId] ?? [];
      if (max === 1) return { ...previous, [groupId]: current.includes(optionId) ? [] : [optionId] };
      if (current.includes(optionId)) return { ...previous, [groupId]: current.filter((id) => id !== optionId) };
      if (current.length >= max) return previous;
      return { ...previous, [groupId]: [...current, optionId] };
    });
  }

  function submit() {
    for (const group of product.optionGroups) {
      const count = (selections[group.id] ?? []).length;
      if (count < group.min) {
        setError(`Escolha pelo menos ${group.min} opção em “${friendlyGroupName(group.name)}”.`);
        document.getElementById(`group-${group.id}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
        return;
      }
    }
    onSave(makeCartLine(product.id, quantity, optionKeys, note), initialLine?.id);
  }

  return (
    <ModalShell
      title={product.name}
      eyebrow={initialLine ? "Editar item" : "Detalhes do item"}
      onClose={onClose}
      footer={
        <div className="product-modal-actions">
          <div className="stepper" aria-label="Quantidade">
            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} aria-label="Diminuir quantidade"><Minus size={17} /></button>
            <span aria-live="polite">{quantity}</span>
            <button type="button" onClick={() => setQuantity((q) => Math.min(99, q + 1))} disabled={quantity >= 99} aria-label="Aumentar quantidade"><Plus size={17} /></button>
          </div>
          <button type="button" className="button button-red grow" onClick={submit} disabled={!product.available}>
            <ShoppingBag size={17} />
            {initialLine ? "Salvar" : "Adicionar"} · {money(total)}
          </button>
        </div>
      }
    >
      <div className={`product-modal-photo ${isDrink ? "contain" : ""}`}>
        <img src={imageSrc(product.image)} alt={product.name} onError={(event) => { event.currentTarget.src = HERO_IMAGE; }} />
      </div>
      <div className="product-modal-description">
        <strong>{money(product.priceCents)}</strong>
        <p>{product.description || "Confirme opções e disponibilidade com a equipe."}</p>
      </div>

      {product.optionGroups.length > 0 && (
        !showOptions ? (
          <button type="button" className="customize-reveal" onClick={() => setShowOptions(true)}>
            <SlidersHorizontal size={16} />
            <div>
              <strong>Quero adicionar extras ou mudar opções</strong>
              <span>Adicionais, molhos, tipo de pão e sachês (opcional)</span>
            </div>
            <ChevronDown size={18} aria-hidden="true" />
          </button>
        ) : (
          <div className="options-stack">
            <div className="options-head">
              <p className="options-hint">
                <SlidersHorizontal size={14} />
                <span>{customCount > 0 ? `${customCount} alteração(ões) escolhida(s)` : "Abra só o que quiser alterar."}</span>
              </p>
              {!isAcai && (
                <button type="button" className="text-button" onClick={() => setShowOptions(false)}>
                  Ocultar opções
                </button>
              )}
            </div>
            {product.optionGroups.map((group, index) => {
              const chosen = selections[group.id] ?? [];
              const hasCustomChoice = chosen.some((id) => !defaultKeys.includes(optionKey(group.id, id)));
              const openByDefault = Boolean(initialLine && chosen.length > 0) || hasCustomChoice || (isAcai && index === 0);
              return (
                <details className="option-accordion" id={`group-${group.id}`} key={group.id} open={openByDefault}>
                  <summary>
                    <div>
                      <strong>{friendlyGroupName(group.name)}</strong>
                      <span>{groupSummary(group, chosen)}</span>
                    </div>
                    <ChevronDown size={18} aria-hidden="true" />
                  </summary>
                  <div className="option-accordion-body">
                    <p className="option-help">
                      {group.min > 0 ? `Escolha de ${group.min} a ${group.max}` : `Até ${group.max} opção(ões)`}
                      {group.max > 1 ? ` · ${chosen.length}/${group.max}` : ""}
                    </p>
                    <div className="option-list">
                      {group.options.map((option) => {
                        const checked = chosen.includes(option.id);
                        const disabled = !option.available || (!checked && group.max > 1 && chosen.length >= group.max);
                        return (
                          <label className={`option-row ${checked ? "selected" : ""} ${disabled ? "disabled" : ""}`} key={option.id}>
                            <input
                              type={group.max === 1 ? "radio" : "checkbox"}
                              name={`group-${group.id}`}
                              checked={checked}
                              disabled={disabled}
                              onChange={() => toggle(group.id, option.id, group.max)}
                            />
                            <span>{option.name}</span>
                            <em>{option.priceCents ? `+ ${money(option.priceCents)}` : "Grátis"}</em>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        )
      )}

      <div className="note-box">
        {!noteOpen ? (
          <button type="button" className="note-toggle" onClick={() => setNoteOpen(true)}>
            + Alguma observação? (sem cebola, ponto da carne, molho à parte...)
          </button>
        ) : (
          <>
            <label className="field-label" htmlFor="item-note">Observações do item</label>
            <textarea
              id="item-note"
              className="text-field"
              rows={2}
              maxLength={240}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ex.: sem cebola, molho à parte, ponto da carne..."
            />
            <p className="field-help">{note.length}/240</p>
          </>
        )}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </ModalShell>
  );
}
