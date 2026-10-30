import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUpRight, Camera, Check, Download, MapPin, Menu, MessageCircle, Plus, Search, ShoppingBag, WifiOff, X } from "lucide-react";
import CartPanel from "./components/CartPanel";
import { DemoNotice } from "./components/DemoNotice";
import ModalShell from "./components/ModalShell";
import OrderModal from "./components/OrderModal";
import ProductModal from "./components/ProductModal";
import { HERO_IMAGE } from "./data/images";
import { usePwa } from "./hooks/usePwa";
import type { CartLine, Product } from "./types";
import { addLine, cartCount, cartSubtotal, defaultOptionKeys, imageSrc, loadCart, makeCartLine, menu, money, products, saveCart } from "./utils/cart";

const WHATSAPP = `https://wa.me/${menu.store.whatsapp}`;
const MAPS = "https://www.openstreetmap.org/?mlat=-21.5145&mlon=-51.4336#map=14/-21.5145/-51.4336";
const drinkPattern = /coca|fanta|sprite|guaran|tubaina|skol|brahma|antarctica|original|long neck|água|agua|suco|powerade/i;
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function Logo() {
  return (
    <a className="brand" href="#inicio" aria-label="Colina — início">
      <svg className="brand-mark" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1.4" />
        <path d="M12 23c.9-6.4 5.6-10.4 12-10.4S35.1 16.6 36 23H12Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M11.5 27h25M14 31h20l-1.5 3.7h-17L14 31Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 17.5h.1m7.8 0h.1m-4 2.4h.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span><strong>COLINA</strong><small>LANCHONETE &amp; DELIVERY</small></span>
    </a>
  );
}

function ProductCard({
  product,
  onQuickAdd,
  onCustomize,
}: {
  product: Product;
  onQuickAdd: (product: Product) => void;
  onCustomize: (product: Product) => void;
}) {
  const isDrink = drinkPattern.test(product.name);
  const hasOptions = product.optionGroups.length > 0;
  return (
    <motion.article
      className="product-card"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.28 }}
    >
      <button type="button" className={`product-photo ${isDrink ? "contain" : ""}`} onClick={() => onCustomize(product)} aria-label={`Ver ${product.name}`}>
        <img src={imageSrc(product.image)} alt={product.name} decoding="async" onError={(event) => { event.currentTarget.src = HERO_IMAGE; }} />
      </button>
      <div className="product-copy">
        <h3><button type="button" className="product-title-button" onClick={() => onCustomize(product)}>{product.name}</button></h3>
        <p>{product.description || "Opções e disponibilidade confirmadas pela loja."}</p>
        <div className="product-bottom">
          <strong>{money(product.priceCents)}</strong>
          <div className="product-card-actions">
            {hasOptions && (
              <button type="button" className="customize-button" onClick={() => onCustomize(product)}>
                Personalizar
              </button>
            )}
            <button type="button" className="add-button" onClick={() => onQuickAdd(product)} disabled={!product.available} aria-label={`Adicionar ${product.name}`}>
              <Plus size={15} /> Adicionar
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default function App() {
  const [cart, setCart] = useState<CartLine[]>(loadCart);
  const [activeCategory, setActiveCategory] = useState("destaques");
  const [query, setQuery] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [installHelp, setInstallHelp] = useState(false);
  const [productModal, setProductModal] = useState<{ product: Product; line?: CartLine } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const reduced = useReducedMotion();
  const pwa = usePwa();
  const count = cartCount(cart);
  const subtotal = cartSubtotal(cart);

  useEffect(() => { saveCart(cart); }, [cart]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const featured = useMemo(() => menu.groups.slice(0, 6).map((group) => group.items[0]).filter(Boolean), []);
  const visibleProducts = useMemo(() => {
    const term = normalize(query.trim());
    if (term) return products.filter((product) => normalize(`${product.name} ${product.description}`).includes(term));
    if (activeCategory === "destaques") return featured;
    return menu.groups.find((group) => group.id === activeCategory)?.items ?? [];
  }, [activeCategory, query, featured]);

  const closeProduct = useCallback(() => setProductModal(null), []);
  const closeCart = useCallback(() => setCartOpen(false), []);
  const closeCheckout = useCallback(() => setCheckoutOpen(false), []);
  const closeInstall = useCallback(() => setInstallHelp(false), []);

  function chooseProduct(product: Product, line?: CartLine) {
    setToast(null);
    setCartOpen(false);
    setCheckoutOpen(false);
    setProductModal({ product, line });
  }

  function quickAdd(product: Product) {
    if (/copo\s*\d+\s*ml|açaí|acai/i.test(product.name)) {
      chooseProduct(product);
      return;
    }
    const line = makeCartLine(product.id, 1, defaultOptionKeys(product), "");
    setCart((previous) => addLine(previous, line));
    setToast(product.optionGroups.length ? `${product.name} adicionado. Se quiser adicionais, toque em Personalizar.` : `${product.name} adicionado ao carrinho.`);
  }

  function saveLine(line: CartLine, editId?: string) {
    setCart((previous) => editId ? previous.map((item) => item.id === editId ? { ...line, id: editId } : item) : addLine(previous, line));
    setProductModal(null);
    setToast(editId ? "Item atualizado no carrinho." : "Item adicionado ao carrinho.");
  }

  function openCart() {
    setToast(null);
    setProductModal(null);
    setCheckoutOpen(false);
    setMobileMenu(false);
    setCartOpen(true);
  }

  function openCheckout() {
    setToast(null);
    setCartOpen(false);
    setProductModal(null);
    setCheckoutOpen(true);
  }

  function browse() {
    setCartOpen(false);
    document.getElementById("cardapio")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  }

  async function installApp() {
    setMobileMenu(false);
    if (pwa.canInstall) {
      const accepted = await pwa.install();
      if (accepted) setToast("App instalado. O cardápio fica na tela inicial.");
    } else {
      setInstallHelp(true);
    }
  }

  const cartHandlers = {
    cart,
    onQuantity: (id: string, quantity: number) => setCart((previous) => previous.map((line) => line.id === id ? { ...line, quantity: Math.max(1, Math.min(99, quantity)) } : line)),
    onRemove: (id: string) => setCart((previous) => previous.filter((line) => line.id !== id)),
    onEdit: (line: CartLine) => { const product = products.find((p) => p.id === line.productId); if (product) chooseProduct(product, line); },
    onClear: () => { setCart([]); setToast("Carrinho esvaziado."); },
    onCheckout: openCheckout,
    onBrowse: browse,
  };

  return (
    <div className="site-shell">
      <a className="skip-link" href="#cardapio">Pular para o cardápio</a>
      {!pwa.online && <div className="offline-banner" role="status"><WifiOff size={15} /> Você está offline. O carrinho continua salvo neste aparelho.</div>}

      <header className="hero" id="inicio">
        <img className="hero-bg" src={HERO_IMAGE} alt="" aria-hidden="true" />
        <div className="hero-shade" aria-hidden="true" />
        <nav className="nav container" aria-label="Navegação principal">
          <Logo />
          <div className="nav-links">
            <a href="#cardapio">Cardápio</a>
            <a href="#contato">Contato</a>
            {!pwa.installed && <button type="button" onClick={installApp}><Download size={15} /> Instalar app</button>}
          </div>
          <button type="button" className="nav-cart" onClick={openCart} aria-label={`Abrir carrinho com ${count} itens`}>
            <ShoppingBag size={17} /> <span className="nav-cart-label">Carrinho</span>{count > 0 && <b>{count}</b>}
          </button>
          <button type="button" className="menu-toggle" aria-expanded={mobileMenu} aria-controls="mobile-menu" aria-label={mobileMenu ? "Fechar menu" : "Abrir menu"} onClick={() => setMobileMenu((value) => !value)}>
            {mobileMenu ? <X size={23} /> : <Menu size={23} />}
          </button>
        </nav>

        <AnimatePresence>
          {mobileMenu && (
            <motion.div id="mobile-menu" className="mobile-menu" initial={reduced ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <a href="#cardapio" onClick={() => setMobileMenu(false)}>Cardápio</a>
              <button type="button" onClick={openCart}>Carrinho {count > 0 && `(${count})`}</button>
              <a href="#contato" onClick={() => setMobileMenu(false)}>Contato</a>
              {!pwa.installed && <button type="button" onClick={installApp}>Instalar app</button>}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="hero-content container">
          <motion.div className="hero-copy" initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="hero-kicker">JUNQUEIRÓPOLIS / SP</p>
            <h1>COLINA<span>.</span></h1>
            <p className="hero-description">Burgers, hot dogs, xis e porções. Monte seu pedido com adicionais e envie direto pelo WhatsApp.</p>
            <div className="hero-actions">
              <a className="button button-yellow" href="#cardapio">Ver cardápio <ArrowDown size={17} /></a>
              <a className="hero-link" href={WHATSAPP} target="_blank" rel="noreferrer">Falar com a loja <ArrowUpRight size={16} /></a>
            </div>
          </motion.div>
        </div>
      </header>

      <main>
        <section className="menu-section" id="cardapio">
          <div className="container">
            <div className="menu-heading">
              <div>
                <p className="section-kicker">CARDÁPIO</p>
                <h2>O QUE VAI HOJE?</h2>
              </div>
              <label className="search-box">
                <Search size={17} />
                <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar lanche, bebida..." aria-label="Buscar no cardápio" />
                {query && <button type="button" onClick={() => setQuery("")} aria-label="Limpar busca"><X size={15} /></button>}
              </label>
            </div>

            <div className="category-bar" role="tablist" aria-label="Categorias do cardápio">
              <button type="button" role="tab" aria-selected={activeCategory === "destaques" && !query} className={activeCategory === "destaques" && !query ? "active" : ""} onClick={() => { setActiveCategory("destaques"); setQuery(""); }}>Destaques</button>
              {menu.groups.map((group) => (
                <button type="button" role="tab" key={group.id} aria-selected={activeCategory === group.id && !query} className={activeCategory === group.id && !query ? "active" : ""} onClick={() => { setActiveCategory(group.id); setQuery(""); }}>{group.name}</button>
              ))}
            </div>

            <div className="order-layout">
              <div className="menu-results" role="tabpanel" aria-label="Produtos">
                <div className="results-meta">
                  <span>{query ? `${visibleProducts.length} resultado(s) para “${query}”` : activeCategory === "destaques" ? "Destaques da casa" : menu.groups.find((g) => g.id === activeCategory)?.name}</span>
                  <small>{visibleProducts.length} itens</small>
                </div>
                {visibleProducts.length ? (
                  <div className="product-grid">
                    {visibleProducts.map((product) => <ProductCard key={product.id} product={product} onQuickAdd={quickAdd} onCustomize={chooseProduct} />)}
                  </div>
                ) : (
                  <div className="empty-search"><Search size={28} /><h3>Nada encontrado</h3><p>Tente outro nome ou veja todas as categorias.</p><button type="button" className="button button-red" onClick={() => setQuery("")}>Limpar busca</button></div>
                )}
                <p className="menu-disclaimer">Fotos do cardápio da loja. Valores e disponibilidade são confirmados no WhatsApp antes do preparo.</p>
              </div>

              <aside className="desktop-cart" aria-label="Carrinho de compras">
                <div className="desktop-cart-head"><ShoppingBag size={18} /><h3>Seu pedido</h3>{count > 0 && <span>{count}</span>}</div>
                <CartPanel {...cartHandlers} />
              </aside>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer" id="contato">
        <div className="container footer-grid">
          <div><Logo /><p>Burgers, hot dogs, xis, porções, bebidas e doces.</p></div>
          <div><h3>Endereço</h3><a href={MAPS} target="_blank" rel="noreferrer"><MapPin size={16} /><span>Rua das Acácias, 120<br />Centro<br />Junqueirópolis / SP</span></a></div>
          <div><h3>Contato</h3><a href={WHATSAPP} target="_blank" rel="noreferrer"><MessageCircle size={16} /> (18) 0000-0000</a><a href={menu.store.instagram} target="_blank" rel="noreferrer"><Camera size={16} /> @exemplo.demo</a></div>
          <div><h3>Leve o cardápio com você</h3>{!pwa.installed ? <button type="button" className="button button-yellow" onClick={installApp}><Download size={16} /> Instalar app</button> : <p className="installed-note"><Check size={16} /> App instalado</p>}<p className="footer-note">O pedido é confirmado pela equipe no WhatsApp.</p></div>
        </div>
        <div className="container footer-bottom"><span>COLINA • JUNQUEIRÓPOLIS / SP</span><span>Cardápio de referência • confirme valores e disponibilidade</span><a href="https://wa.me/5518998133524" target="_blank" rel="noreferrer" aria-label="Falar com Murilo Mota no WhatsApp" className="footer-credit">Desenvolvido por Murilo Mota · 55 (18) 99813-3524</a></div>
      </footer>
      <DemoNotice />

      <AnimatePresence>
        {count > 0 && !cartOpen && !checkoutOpen && !productModal && (
          <motion.div className="mobile-cart-bar" initial={reduced ? false : { y: 90 }} animate={{ y: 0 }} exit={{ y: 90 }} transition={{ duration: 0.18 }}>
            <div><span>{count} {count === 1 ? "item" : "itens"}</span><strong>{money(subtotal)}</strong></div>
            <button type="button" className="button button-yellow" onClick={openCart}>Ver carrinho <ShoppingBag size={17} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && !productModal && !cartOpen && !checkoutOpen && <motion.div className="toast" role="status" initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }}><Check size={16} />{toast}</motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {productModal && <ProductModal product={productModal.product} initialLine={productModal.line} onClose={closeProduct} onSave={saveLine} />}
        {cartOpen && <ModalShell title="Seu pedido" eyebrow="Carrinho" onClose={closeCart} drawer><CartPanel {...cartHandlers} /></ModalShell>}
        {checkoutOpen && <OrderModal cart={cart} onClose={closeCheckout} />}
        {installHelp && (
          <ModalShell title="Instalar o app" eyebrow="Cardápio na tela inicial" onClose={closeInstall}>
            <div className="install-help">
              <p><strong>Android / Chrome:</strong> toque no menu do navegador e escolha “Adicionar à tela inicial” ou “Instalar app”.</p>
              <p><strong>iPhone / Safari:</strong> toque em Compartilhar e depois em “Adicionar à Tela de Início”.</p>
              <p>O carrinho fica salvo neste aparelho. Depois da primeira visita, o cardápio também pode abrir offline.</p>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>
    </div>
  );
}
