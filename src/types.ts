export type MenuOption = {
  id: string;
  name: string;
  priceCents: number;
  available: boolean;
};

export type OptionGroup = {
  id: string;
  name: string;
  min: number;
  max: number;
  options: MenuOption[];
};

export type Product = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  image: string | null;
  isAlcohol: boolean;
  available: boolean;
  optionGroups: OptionGroup[];
};

export type MenuGroup = {
  id: string;
  name: string;
  slug: string;
  items: Product[];
};

export type MenuData = {
  store: { name: string; whatsapp: string; address: string; instagram: string };
  retrievedAt: string;
  source: string;
  groups: MenuGroup[];
};

export type CartLine = {
  id: string;
  productId: string;
  quantity: number;
  optionKeys: string[];
  note: string;
};

export type CheckoutDetails = {
  name: string;
  mode: "entrega" | "retirada";
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
  payment: string;
  changeFor: string;
};
