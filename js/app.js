/* =========================================================
   FitFuel — app.js
   Modular SPA logic: hash router, product catalog, cart
   (persisted to localStorage), search/filter, dark mode,
   and mobile navigation.
   ========================================================= */

const CART_KEY = "fitfuel_cart";
const THEME_KEY = "fitfuel_theme";

const state = {
  products: [],
  cart: [],       // [{ id, qty }]
  category: "all",
  query: "",
};

/* ---------- Data ---------- */
async function loadProducts() {
  const res = await fetch("data/products.json");
  if (!res.ok) throw new Error("Failed to load product data");
  state.products = await res.json();
}

/* ---------- Cart persistence ---------- */
function loadCart() {
  try {
    state.cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    state.cart = [];
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
  updateCartCount();
}

function addToCart(id, qty = 1) {
  const line = state.cart.find((item) => item.id === id);
  if (line) line.qty += qty;
  else state.cart.push({ id, qty });
  saveCart();
}

function setCartQty(id, qty) {
  if (qty <= 0) {
    state.cart = state.cart.filter((item) => item.id !== id);
  } else {
    const line = state.cart.find((item) => item.id === id);
    if (line) line.qty = qty;
  }
  saveCart();
  renderCartPage();
}

function cartTotalCount() {
  return state.cart.reduce((sum, item) => sum + item.qty, 0);
}

function updateCartCount() {
  const badge = document.querySelector(".cart-count");
  const link = document.querySelector(".cart-link");
  const count = cartTotalCount();
  if (badge) badge.textContent = count;
  if (link) link.setAttribute("aria-label", `View cart, ${count} item${count === 1 ? "" : "s"}`);
}

/* ---------- Rendering helpers ---------- */
function formatPrice(n) {
  return `$${n.toFixed(2)}`;
}

function productCardHTML(p) {
  return `
    <article class="product-card">
      <a class="product-card-media" href="#/product/${p.id}">
        <img src="${p.image}" alt="${p.name}" loading="lazy" width="400" height="260">
      </a>
      <div class="product-card-body">
        <p class="product-card-category">${p.category}</p>
        <h3><a href="#/product/${p.id}">${p.name}</a></h3>
        <p class="product-card-price">${formatPrice(p.price)}</p>
        <button class="btn btn-secondary btn-small" data-add-to-cart="${p.id}">Add to Cart</button>
      </div>
    </article>`;
}

function filteredProducts() {
  return state.products.filter((p) => {
    const matchesCategory = state.category === "all" || p.category === state.category;
    const matchesQuery = p.name.toLowerCase().includes(state.query.toLowerCase());
    return matchesCategory && matchesQuery;
  });
}

function renderProductsPage() {
  const grid = document.getElementById("products-grid");
  if (!grid) return;
  const list = filteredProducts();
  grid.innerHTML = list.length
    ? list.map(productCardHTML).join("")
    : `<p class="empty-state">No products match your search. Try a different term or category.</p>`;

  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.classList.toggle("is-active", chip.dataset.category === state.category);
  });
}

function renderProductDetail(id) {
  const container = document.getElementById("product-detail");
  if (!container) return;
  const p = state.products.find((item) => item.id === Number(id));
  if (!p) {
    container.innerHTML = `<p class="empty-state">Product not found. <a href="#/products">Back to Products</a></p>`;
    return;
  }
  container.innerHTML = `
    <a class="back-link" href="#/products">&larr; Back to Products</a>
    <div class="product-detail-grid">
      <img src="${p.image}" alt="${p.name}" width="400" height="260">
      <div>
        <p class="product-card-category">${p.category}</p>
        <h2>${p.name}</h2>
        <p class="product-detail-price">${formatPrice(p.price)}</p>
        <p class="product-detail-desc">${p.description}</p>
        <button class="btn btn-primary" data-add-to-cart="${p.id}">Add to Cart</button>
      </div>
    </div>`;
}

function cartLineHTML(line, product) {
  return `
    <div class="cart-line" data-cart-line="${product.id}">
      <img src="${product.image}" alt="${product.name}" width="80" height="52">
      <div class="cart-line-info">
        <h3>${product.name}</h3>
        <p>${formatPrice(product.price)}</p>
      </div>
      <div class="qty-control">
        <button type="button" data-qty-decrease="${product.id}" aria-label="Decrease quantity">&minus;</button>
        <span aria-live="polite">${line.qty}</span>
        <button type="button" data-qty-increase="${product.id}" aria-label="Increase quantity">+</button>
      </div>
      <p class="cart-line-subtotal">${formatPrice(product.price * line.qty)}</p>
      <button type="button" class="cart-remove" data-remove="${product.id}" aria-label="Remove ${product.name} from cart">&times;</button>
    </div>`;
}

function renderCartPage() {
  const container = document.getElementById("cart-contents");
  if (!container) return;

  if (state.cart.length === 0) {
    container.innerHTML = `<p class="empty-state">Your cart is empty. <a href="#/products">Browse products</a></p>`;
    return;
  }

  let total = 0;
  const lines = state.cart
    .map((line) => {
      const product = state.products.find((p) => p.id === line.id);
      if (!product) return "";
      total += product.price * line.qty;
      return cartLineHTML(line, product);
    })
    .join("");

  container.innerHTML = `
    <div class="cart-lines">${lines}</div>
    <div class="cart-summary">
      <p>Total</p>
      <p class="cart-total">${formatPrice(total)}</p>
    </div>
    <button class="btn btn-primary" id="checkout-btn">Checkout</button>`;
}

/* ---------- Router ---------- */
function parseHash() {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash.startsWith("/")) return { route: "home" };
  const parts = hash.slice(1).split("/").filter(Boolean);
  if (parts[0] === "product" && parts[1]) return { route: "product", id: parts[1] };
  if (parts[0] === "products") return { route: "products" };
  if (parts[0] === "cart") return { route: "cart" };
  if (parts[0] === "about") return { route: "about" };
  if (parts[0] === "contact") return { route: "contact" };
  return { route: "home" };
}

function setActiveNav(route) {
  const navRoute = route === "product" ? "products" : route === "cart" ? "home" : route;
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.route === navRoute);
  });
}

function router() {
  const { route, id } = parseHash();

  document.getElementById("home-view").hidden = route !== "home";
  document.getElementById("products-view").hidden = route !== "products" && route !== "product";
  document.getElementById("product-list-panel").hidden = route !== "products";
  document.getElementById("product-detail-panel").hidden = route !== "product";
  document.getElementById("cart-view").hidden = route !== "cart";
  document.getElementById("about-view").hidden = route !== "about";
  document.getElementById("contact-view").hidden = route !== "contact";

  if (route === "products") renderProductsPage();
  if (route === "product") renderProductDetail(id);
  if (route === "cart") renderCartPage();

  setActiveNav(route);
  window.scrollTo({ top: 0, behavior: "instant" in document.documentElement.style ? "instant" : "auto" });
}

/* ---------- Dark mode ---------- */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const toggle = document.getElementById("theme-toggle");
  if (toggle) toggle.setAttribute("aria-pressed", theme === "dark");
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

/* ---------- Event wiring ---------- */
function setupNavigation() {
  const menuToggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("primary-nav");
  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
    nav.querySelectorAll(".nav-link").forEach((link) =>
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) themeToggle.addEventListener("click", toggleTheme);
}

function setupCatalogControls() {
  const searchInput = document.getElementById("product-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.query = e.target.value;
      renderProductsPage();
    });
  }

  const filterBar = document.getElementById("filter-bar");
  if (filterBar) {
    filterBar.addEventListener("click", (e) => {
      const chip = e.target.closest(".filter-chip");
      if (!chip) return;
      state.category = chip.dataset.category;
      renderProductsPage();
    });
  }
}

function setupContactForm() {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("contact-form-status");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      status.textContent = "Please fill in your name, email, and message.";
      status.classList.add("form-status-error");
      form.reportValidity();
      return;
    }

    // No backend is connected yet — this simulates a successful send.
    // To go live, point this at a form endpoint (see README: "Connecting the contact form").
    status.classList.remove("form-status-error");
    status.textContent = "Thanks — your message has been sent.-----   Demo version.";
    form.reset();
  });
}

function setupDelegatedClicks() {
  document.body.addEventListener("click", (e) => {
    const addBtn = e.target.closest("[data-add-to-cart]");
    if (addBtn) {
      addToCart(Number(addBtn.dataset.addToCart));
      addBtn.textContent = "Added ✓";
      setTimeout(() => (addBtn.textContent = "Add to Cart"), 1200);
      return;
    }

    const incBtn = e.target.closest("[data-qty-increase]");
    if (incBtn) {
      const id = Number(incBtn.dataset.qtyIncrease);
      const line = state.cart.find((item) => item.id === id);
      if (line) setCartQty(id, line.qty + 1);
      return;
    }

    const decBtn = e.target.closest("[data-qty-decrease]");
    if (decBtn) {
      const id = Number(decBtn.dataset.qtyDecrease);
      const line = state.cart.find((item) => item.id === id);
      if (line) setCartQty(id, line.qty - 1);
      return;
    }

    const removeBtn = e.target.closest("[data-remove]");
    if (removeBtn) {
      setCartQty(Number(removeBtn.dataset.remove), 0);
    }
  });
}

/* ---------- Boot ---------- */
async function init() {
  initTheme();
  loadCart();
  updateCartCount();
  setupNavigation();
  setupCatalogControls();
  setupContactForm();
  setupDelegatedClicks();

  try {
    await loadProducts();
  } catch (err) {
    console.error("FitFuel: could not load product data", err);
  }

  window.addEventListener("hashchange", router);
  router();
}

document.addEventListener("DOMContentLoaded", init);
