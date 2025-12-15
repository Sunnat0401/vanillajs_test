let products = []
let cart = []
let currentCategory = "all"

const productsGrid = document.getElementById("productsGrid")
const productsLoader = document.getElementById("productsLoader")
const cartContent = document.getElementById("cartContent")
const cartTotal = document.getElementById("cartTotal")
const cartSummary = document.getElementById("cartSummary")
const categoryFilter = document.getElementById("categoryFilter")
const checkoutBtn = document.getElementById("checkoutBtn")
const toast = document.getElementById("toast")

document.addEventListener("DOMContentLoaded", () => {
  loadCart()
  fetchProducts()
  setupEventListeners()
})

function setupEventListeners() {
  categoryFilter.addEventListener("change", (e) => {
    currentCategory = e.target.value
    renderProducts()
  })

  checkoutBtn.addEventListener("click", handleCheckout)
}

async function fetchProducts() {
  try {
    productsLoader.style.display = "block"
    productsGrid.style.display = "none"

    const response = await fetch("https://fakestoreapi.com/products")

    if (!response.ok) {
      throw new Error("Failed to fetch products")
    }

    products = await response.json()

    const categories = [...new Set(products.map((p) => p.category))]
    populateCategories(categories)

    renderProducts()

    productsLoader.style.display = "none"
    productsGrid.style.display = "grid"
  } catch (error) {
    console.error("Error fetching products:", error)
    productsLoader.textContent = "There was an error loading the products. Please try again."
    showToast("Error loading products!", "error")
  }
}

function populateCategories(categories) {
  categories.forEach((category) => {
    const option = document.createElement("option")
    option.value = category
    option.textContent = category.charAt(0).toUpperCase() + category.slice(1)
    categoryFilter.appendChild(option)
  })
}

function renderProducts() {
  const filteredProducts = currentCategory === "all" ? products : products.filter((p) => p.category === currentCategory)

  productsGrid.innerHTML = ""

  filteredProducts.forEach((product) => {
    const productCard = createProductCard(product)
    productsGrid.appendChild(productCard)
  })
}

function createProductCard(product) {
  const card = document.createElement("div")
  card.className = "product-card"

  const isInCart = cart.some((item) => item.id === product.id)

  card.innerHTML = `
        <img src="${product.image}" alt="${product.title}" class="product-image" loading="lazy">
        <div class="product-info">
            <div class="product-category">${product.category}</div>
            <h3 class="product-title">${product.title}</h3>
            <div class="product-footer">
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <button 
                    class="btn btn-primary add-to-cart-btn" 
                    data-id="${product.id}"
                    ${isInCart ? "disabled" : ""}
                >
                    ${isInCart ? "✓ In Card" : "Add to cart"}
                </button>
            </div>
        </div>
    `

  const addButton = card.querySelector(".add-to-cart-btn")
  addButton.addEventListener("click", () => addToCart(product))

  return card
}

function addToCart(product) {
  const existingItem = cart.find((item) => item.id === product.id)

  if (existingItem) {
    existingItem.quantity += 1
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity: 1,
    })
  }

  saveCart()
  renderCart()
  renderProducts() 
  showToast("Product added to cart!", "success")
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId)
  saveCart()
  renderCart()
  renderProducts() 
  showToast("Product removed from cart", "error")
}

function updateQuantity(productId, change) {
  const item = cart.find((item) => item.id === productId)

  if (item) {
    item.quantity += change

    if (item.quantity <= 0) {
      removeFromCart(productId)
    } else {
      saveCart()
      renderCart()
    }
  }
}

function renderCart() {
  if (cart.length === 0) {
    cartContent.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <p>Your cart is empty.</p>
                <small>To add a product, click "Add to cart"</small>
            </div>
        `
    cartTotal.classList.add("hidden")
    updateCartSummary()
    return
  }

  const cartItems = document.createElement("div")
  cartItems.className = "cart-items"

  cart.forEach((item) => {
    const cartItem = createCartItem(item)
    cartItems.appendChild(cartItem)
  })

  cartContent.innerHTML = ""
  cartContent.appendChild(cartItems)

  cartTotal.classList.remove("hidden")
  updateCartSummary()
}

function createCartItem(item) {
  const cartItem = document.createElement("div")
  cartItem.className = "cart-item"

  cartItem.innerHTML = `
        <img src="${item.image}" alt="${item.title}" class="cart-item-image">
        <div class="cart-item-details">
            <div class="cart-item-title">${item.title}</div>
            <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
            <div class="cart-item-actions">
                <div class="quantity-controls">
                    <button class="quantity-btn decrease-btn" data-id="${item.id}">−</button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button class="quantity-btn increase-btn" data-id="${item.id}">+</button>
                </div>
                <button class="btn btn-danger remove-btn" data-id="${item.id}">Delete</button>
            </div>
        </div>
    `

  cartItem.querySelector(".decrease-btn").addEventListener("click", () => {
    updateQuantity(item.id, -1)
  })

  cartItem.querySelector(".increase-btn").addEventListener("click", () => {
    updateQuantity(item.id, 1)
  })

  cartItem.querySelector(".remove-btn").addEventListener("click", () => {
    removeFromCart(item.id)
  })

  return cartItem
}

function updateCartSummary() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  document.getElementById("totalItems").textContent = totalItems
  document.getElementById("totalPrice").textContent = `$${totalPrice.toFixed(2)}`
  cartSummary.textContent = `Cart : ${totalItems} items`
}

function handleCheckout() {
  if (cart.length === 0) return

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const confirmed = confirm(
    `Would you like to confirm the purchase?\n\n` + `ami products : ${totalItems}\n` + `Total amount: $${totalPrice.toFixed(2)}`,
  )

  if (confirmed) {
    cart = []
    saveCart()
    renderCart()
    renderProducts()
    showToast("The purchase was successful!", "success")
  }
}

function saveCart() {
  localStorage.setItem("miniMarketplaceCart", JSON.stringify(cart))
}

function loadCart() {
  const savedCart = localStorage.getItem("miniMarketplaceCart")
  if (savedCart) {
    cart = JSON.parse(savedCart)
    renderCart()
  }
}

function showToast(message, type = "success") {
  toast.textContent = message
  toast.className = `toast ${type}`

  void toast.offsetWidth

  toast.classList.add("show")

  setTimeout(() => {
    toast.classList.remove("show")
  }, 3000)
}
