(() => {
  "use strict";

  const STORAGE_KEY = "shopmini-mvp-v1";
  const $ = (selector) => document.querySelector(selector);
  const money = (value) => new Intl.NumberFormat("vi-VN", {
    style: "currency", currency: "VND", maximumFractionDigits: 0
  }).format(Number(value) || 0);
  const safeText = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const makeId = () => "DH" + Date.now().toString().slice(-8);

  const starterData = {
    products: [
      { id: "SP01", name: "Bình giữ nhiệt", price: 129000, stock: 18, emoji: "🥤" },
      { id: "SP02", name: "Túi tote canvas", price: 89000, stock: 24, emoji: "👜" },
      { id: "SP03", name: "Đèn bàn mini", price: 159000, stock: 9, emoji: "💡" }
    ],
    orders: [
      { id: "DH240101", customer: "Nguyễn Minh Anh", productId: "SP01", productName: "Bình giữ nhiệt", quantity: 2, unitPrice: 129000, status: "Đã giao", createdAt: "Hôm nay" },
      { id: "DH240102", customer: "Trần Gia Huy", productId: "SP03", productName: "Đèn bàn mini", quantity: 1, unitPrice: 159000, status: "Đang giao", createdAt: "Hôm nay" },
      { id: "DH240103", customer: "Lê Thu Hà", productId: "SP02", productName: "Túi tote canvas", quantity: 3, unitPrice: 89000, status: "Mới", createdAt: "Hôm nay" }
    ],
    chats: [
      {
        id: "CH001", customer: "Nguyễn Minh Anh", contact: "Khách mua Bình giữ nhiệt",
        unread: 2, messages: [
          { id: "CHM001", sender: "customer", text: "Shop ơi, bình giữ nhiệt còn hàng không ạ?", time: Date.now() - 1000 * 60 * 14 },
          { id: "CHM002", sender: "shop", text: "Dạ shop vẫn còn hàng ạ. Bạn muốn xem màu nào ạ?", time: Date.now() - 1000 * 60 * 11 },
          { id: "CHM003", sender: "customer", text: "Mình muốn màu xanh, có giao trong hôm nay không shop?", time: Date.now() - 1000 * 60 * 3 }
        ]
      },
      {
        id: "CH002", customer: "Trần Gia Huy", contact: "Hỏi về tình trạng đơn hàng",
        unread: 0, messages: [
          { id: "CHM004", sender: "customer", text: "Shop cho mình hỏi đơn hàng của mình đến đâu rồi ạ?", time: Date.now() - 1000 * 60 * 54 },
          { id: "CHM005", sender: "shop", text: "Dạ shop đã tiếp nhận đơn và đang chuẩn bị giao hàng nhé.", time: Date.now() - 1000 * 60 * 50 }
        ]
      },
      {
        id: "CH003", customer: "Lê Thu Hà", contact: "Tư vấn trước khi mua",
        unread: 1, messages: [
          { id: "CHM006", sender: "customer", text: "Shop tư vấn giúp mình sản phẩm phù hợp làm quà tặng với ạ.", time: Date.now() - 1000 * 60 * 150 }
        ]
      }
    ]
  };

  let state;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    state = saved && Array.isArray(saved.products) && Array.isArray(saved.orders) ? saved : structuredClone(starterData);
  } catch {
    state = JSON.parse(JSON.stringify(starterData));
  }

  // Migration for data saved by older versions before the chat center existed.
  if (!Array.isArray(state.chats)) {
    state.chats = JSON.parse(JSON.stringify(starterData.chats));
  }
  let selectedChatId = state.chats[0]?.id || null;

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      notify("Không thể lưu dữ liệu trên trình duyệt này.");
    }
  }

  let toastTimer;
  function notify(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function getProduct(id) {
    return state.products.find((product) => product.id === id);
  }

  function renderStats() {
    const revenue = state.orders
      .filter((order) => order.status === "Đã giao")
      .reduce((sum, order) => sum + order.unitPrice * order.quantity, 0);
    $("#stat-revenue").textContent = money(revenue);
    $("#stat-orders").textContent = state.orders.length;
    $("#stat-pending").textContent = state.orders.filter((order) => ["Mới", "Đang giao"].includes(order.status)).length;
    $("#stat-products").textContent = state.products.length;
    $("#product-count-label").textContent = state.products.length + " sản phẩm";
  }

  function renderProducts() {
    const list = $("#product-list");
    if (!state.products.length) {
      list.innerHTML = '<div class="empty-state"><strong>Chưa có sản phẩm</strong><p>Thêm sản phẩm ở biểu mẫu phía trên.</p></div>';
    } else {
      list.innerHTML = state.products.map((product) => `
        <div class="product-item">
          <span class="product-emoji" aria-hidden="true">${product.emoji || "📦"}</span>
          <div class="product-info"><strong>${safeText(product.name)}</strong><small class="${product.stock <= 3 ? "stock-warning" : ""}">Còn ${product.stock} sản phẩm</small></div>
          <span class="product-price">${money(product.price)}</span>
          <button class="product-delete" type="button" data-delete-product="${safeText(product.id)}" aria-label="Xóa ${safeText(product.name)}" title="Xóa sản phẩm">×</button>
        </div>`).join("");
    }

    const select = $("#order-product");
    const current = select.value;
    select.innerHTML = state.products.length
      ? state.products.map((product) => `<option value="${safeText(product.id)}" ${product.stock < 1 ? "disabled" : ""}>${safeText(product.name)} — ${money(product.price)} (còn ${product.stock})</option>`).join("")
      : '<option value="">Hãy thêm sản phẩm trước</option>';
    if (state.products.some((product) => product.id === current && product.stock > 0)) select.value = current;
    updateOrderPreview();
  }

  function renderOrders() {
    const search = $("#order-search").value.trim().toLocaleLowerCase("vi");
    const filter = $("#order-filter").value;
    const orders = state.orders.filter((order) => {
      const matchesSearch = (order.id + " " + order.customer + " " + order.productName).toLocaleLowerCase("vi").includes(search);
      return matchesSearch && (filter === "all" || order.status === filter);
    });
    $("#orders-body").innerHTML = orders.map((order) => {
      const nextStatus = { "Mới": "Đang giao", "Đang giao": "Đã giao", "Đã giao": "Đã giao", "Đã hủy": "Đã hủy" }[order.status];
      const canAdvance = order.status === "Mới" || order.status === "Đang giao";
      return `<tr>
        <td><div class="order-id">#${safeText(order.id)}</div><div class="customer-name">${safeText(order.customer)}</div></td>
        <td class="product-cell">${safeText(order.productName)} × ${order.quantity}</td>
        <td class="money">${money(order.unitPrice * order.quantity)}</td>
        <td><span class="status-pill status-${safeText(order.status).replaceAll(" ", "-")}">${safeText(order.status)}</span></td>
        <td><div class="row-actions">${canAdvance ? `<button class="mini-button" type="button" data-advance-order="${safeText(order.id)}" title="Chuyển sang trạng thái tiếp theo">Cập nhật</button>` : ""}${order.status !== "Đã giao" && order.status !== "Đã hủy" ? `<button class="mini-button danger" type="button" data-cancel-order="${safeText(order.id)}" title="Hủy đơn">Hủy</button>` : ""}</div></td>
      </tr>`;
    }).join("");
    $("#orders-empty").hidden = orders.length > 0;
  }

  function render() {
    renderStats();
    renderProducts();
    renderOrders();
    renderChats();
  }

  function chatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }

  function chatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    if (date.toDateString() === new Date().toDateString()) return chatTime(value);
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  }

  function initials(name) {
    return String(name || "?").trim().split(/\\s+/).slice(-2).map((part) => part[0] || "").join("").toLocaleUpperCase("vi");
  }

  function getSelectedChat() {
    return state.chats.find((chat) => chat.id === selectedChatId) || null;
  }

  function renderChats() {
    const list = $("#chat-list");
    const query = $("#chat-search").value.trim().toLocaleLowerCase("vi");
    const filter = $("#chat-filter").value;
    const unreadTotal = state.chats.reduce((sum, chat) => sum + (Number(chat.unread) || 0), 0);
    const badge = $("#chat-unread-badge");
    badge.textContent = unreadTotal > 99 ? "99+" : String(unreadTotal);
    badge.hidden = unreadTotal === 0;

    const filtered = state.chats.filter((chat) => {
      const last = chat.messages?.[chat.messages.length - 1];
      const searchable = [chat.customer, chat.contact, last?.text, ...(chat.messages || []).map((message) => message.text)].join(" ").toLocaleLowerCase("vi");
      return searchable.includes(query) && (filter !== "unread" || (Number(chat.unread) || 0) > 0);
    }).sort((a, b) => {
      const aTime = a.messages?.[a.messages.length - 1]?.time || 0;
      const bTime = b.messages?.[b.messages.length - 1]?.time || 0;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    list.innerHTML = filtered.length ? filtered.map((chat) => {
      const last = chat.messages?.[chat.messages.length - 1];
      return `<button type="button" class="chat-list-item ${chat.id === selectedChatId ? "active" : ""}" data-chat-id="${safeText(chat.id)}">
        <span class="chat-avatar">${safeText(initials(chat.customer))}</span>
        <span class="chat-list-copy"><span class="chat-list-top"><span class="chat-list-name">${safeText(chat.customer)}</span><span class="chat-time">${chatDate(last?.time)}</span></span>
        <span class="chat-preview">${safeText(last?.text || chat.contact || "Chưa có tin nhắn")}</span></span>
        ${chat.unread ? `<span class="chat-unread-dot">${chat.unread > 9 ? "9+" : chat.unread}</span>` : ""}
      </button>`;
    }).join("") : '<div class="empty-state"><strong>Không tìm thấy hội thoại</strong><p>Thử từ khóa khác hoặc tạo hội thoại demo.</p></div>';

    const chat = getSelectedChat();
    const reply = $("#chat-reply");
    const send = $("#chat-send");
    if (!chat) {
      $("#chat-header").innerHTML = '<strong>Chọn một hội thoại để bắt đầu</strong>';
      $("#chat-messages").innerHTML = '<div class="chat-empty-state">Chọn khách hàng ở danh sách bên trái để xem lịch sử trò chuyện.</div>';
      reply.disabled = true;
      send.disabled = true;
      return;
    }

    $("#chat-header").innerHTML = `<div class="chat-person"><span class="chat-avatar">${safeText(initials(chat.customer))}</span><span><strong>${safeText(chat.customer)}</strong><small>${safeText(chat.contact || "Khách hàng ShopMini")}</small></span></div><span class="chat-connection-note">Bản demo · Chưa kết nối kênh thật</span><button class="mini-button" type="button" id="simulate-customer-message">＋ Tin nhắn khách demo</button>`;
    const messages = [...(chat.messages || [])].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    $("#chat-messages").innerHTML = messages.length ? messages.map((message) => {
      const fromShop = message.sender === "shop";
      return `<div class="chat-message ${fromShop ? "from-shop" : "from-customer"}"><div class="chat-bubble">${safeText(message.text).replace(/\\n/g, "<br>")}</div><div class="chat-message-meta">${fromShop ? "ShopMini" : safeText(chat.customer)} · ${chatTime(message.time)}</div></div>`;
    }).join("") : '<div class="chat-empty-state">Chưa có tin nhắn. Gửi lời chào đầu tiên nhé.</div>';
    $("#chat-messages").scrollTop = $("#chat-messages").scrollHeight;
    reply.disabled = false;
    send.disabled = false;
  }

  function sendChatReply(event) {
    event.preventDefault();
    const chat = getSelectedChat();
    const input = $("#chat-reply");
    const messageText = input.value.trim();
    if (!chat || !messageText) return;
    chat.messages ||= [];
    chat.messages.push({ id: "CHM" + Date.now(), sender: "shop", text: messageText, time: Date.now() });
    chat.unread = 0;
    persist();
    input.value = "";
    renderChats();
    notify("Đã lưu tin nhắn trả lời trong bản demo.");
  }

  function addDemoConversation() {
    const customer = prompt("Nhập tên khách hàng cho hội thoại demo:");
    if (!customer || !customer.trim()) return;
    const firstMessage = prompt("Nhập tin nhắn đầu tiên của khách:", "Xin chào shop, mình muốn hỏi thêm về sản phẩm ạ.");
    if (!firstMessage || !firstMessage.trim()) return;
    const chat = {
      id: "CH" + Date.now(),
      customer: customer.trim().slice(0, 70),
      contact: "Hội thoại demo mới",
      unread: 0,
      messages: [{ id: "CHM" + Date.now(), sender: "customer", text: firstMessage.trim().slice(0, 1000), time: Date.now() }]
    };
    state.chats.unshift(chat);
    selectedChatId = chat.id;
    $("#chat-search").value = "";
    $("#chat-filter").value = "all";
    persist();
    renderChats();
    notify("Đã tạo hội thoại demo.");
  }

  function simulateCustomerMessage() {
    const chat = getSelectedChat();
    if (!chat) return;
    const messageText = prompt("Nhập nội dung tin nhắn khách gửi (mô phỏng):", "Shop ơi, mình muốn hỏi thêm về sản phẩm ạ.");
    if (!messageText || !messageText.trim()) return;
    chat.messages ||= [];
    chat.messages.push({ id: "CHM" + Date.now(), sender: "customer", text: messageText.trim().slice(0, 1000), time: Date.now() });
    chat.unread = 0;
    persist();
    renderChats();
    notify("Đã thêm tin nhắn khách mô phỏng.");
  }

  function updateOrderPreview() {
    const product = getProduct($("#order-product").value);
    const quantity = Math.max(1, Number($("#order-quantity").value) || 1);
    $("#order-total-preview").textContent = money(product ? product.price * quantity : 0);
  }

  function resetDemo() {
    state = JSON.parse(JSON.stringify(starterData));
    selectedChatId = state.chats[0]?.id || null;
    persist();
    render();
    notify("Đã khôi phục dữ liệu demo ban đầu.");
  }

  $("#product-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("#product-name").value.trim();
    const price = Number($("#product-price").value);
    const stock = Number($("#product-stock").value);
    if (!name || !Number.isFinite(price) || price < 1000 || !Number.isInteger(stock) || stock < 0) {
      notify("Vui lòng kiểm tra tên, giá và số lượng sản phẩm.");
      return;
    }
    state.products.unshift({
      id: "SP" + Date.now().toString().slice(-7),
      name, price, stock, emoji: ["📦", "🎁", "🛍️", "✨"][state.products.length % 4]
    });
    persist();
    render();
    event.target.reset();
    $("#product-stock").value = "10";
    notify("Đã thêm sản phẩm.");
  });

  $("#product-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-product]");
    if (!button) return;
    const product = getProduct(button.dataset.deleteProduct);
    if (!product) return;
    if (state.orders.some((order) => order.productId === product.id && order.status !== "Đã hủy")) {
      notify("Không thể xóa sản phẩm đã có trong đơn hàng chưa hủy.");
      return;
    }
    state.products = state.products.filter((item) => item.id !== product.id);
    persist();
    render();
    notify("Đã xóa sản phẩm.");
  });

  $("#orders-body").addEventListener("click", (event) => {
    const advance = event.target.closest("[data-advance-order]");
    const cancel = event.target.closest("[data-cancel-order]");
    if (advance) {
      const order = state.orders.find((item) => item.id === advance.dataset.advanceOrder);
      if (!order) return;
      if (order.status === "Mới") order.status = "Đang giao";
      else if (order.status === "Đang giao") order.status = "Đã giao";
      persist();
      render();
      notify("Đã cập nhật trạng thái đơn hàng.");
    }
    if (cancel) {
      const order = state.orders.find((item) => item.id === cancel.dataset.cancelOrder);
      if (!order) return;
      if (!confirm("Bạn có chắc muốn hủy đơn " + order.id + "?")) return;
      order.status = "Đã hủy";
      const product = getProduct(order.productId);
      if (product) product.stock += order.quantity;
      persist();
      render();
      notify("Đã hủy đơn hàng và hoàn lại số lượng demo.");
    }
  });

  $("#order-search").addEventListener("input", renderOrders);
  $("#order-filter").addEventListener("change", renderOrders);
  $("#order-product").addEventListener("change", updateOrderPreview);
  $("#order-quantity").addEventListener("input", updateOrderPreview);

  const dialog = $("#order-dialog");
  $("#open-order-form").addEventListener("click", () => {
    if (!state.products.some((product) => product.stock > 0)) {
      notify("Hãy thêm sản phẩm còn hàng trước khi tạo đơn.");
      return;
    }
    renderProducts();
    dialog.showModal();
    $("#customer-name").focus();
  });
  function closeDialog() {
    dialog.close();
    $("#order-form").reset();
    $("#order-quantity").value = "1";
    updateOrderPreview();
  }
  $("#close-order-form").addEventListener("click", closeDialog);
  $("#cancel-order-form").addEventListener("click", closeDialog);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });

  $("#order-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const customer = $("#customer-name").value.trim();
    const product = getProduct($("#order-product").value);
    const quantity = Number($("#order-quantity").value);
    if (!customer || !product || !Number.isInteger(quantity) || quantity < 1) {
      notify("Vui lòng điền đầy đủ thông tin đơn hàng.");
      return;
    }
    if (quantity > product.stock) {
      notify("Số lượng đặt vượt quá số lượng tồn kho.");
      return;
    }
    product.stock -= quantity;
    state.orders.unshift({
      id: makeId(), customer, productId: product.id, productName: product.name,
      quantity, unitPrice: product.price, status: "Mới", createdAt: new Date().toLocaleDateString("vi-VN")
    });
    persist();
    render();
    closeDialog();
    notify("Tạo đơn hàng thành công.");
  });

  $("#chat-search").addEventListener("input", renderChats);
  $("#chat-filter").addEventListener("change", renderChats);
  $("#chat-list").addEventListener("click", (event) => {
    const item = event.target.closest("[data-chat-id]");
    if (!item) return;
    selectedChatId = item.dataset.chatId;
    const chat = getSelectedChat();
    if (chat) chat.unread = 0;
    $("#chat-reply").value = "";
    persist();
    renderChats();
  });
  $("#chat-form").addEventListener("submit", sendChatReply);
  $("#chat-new-conversation").addEventListener("click", addDemoConversation);
  $("#chat-header").addEventListener("click", (event) => {
    if (event.target.closest("#simulate-customer-message")) simulateCustomerMessage();
  });
  document.querySelector(".quick-replies").addEventListener("click", (event) => {
    const button = event.target.closest("[data-chat-template]");
    if (!button) return;
    const reply = $("#chat-reply");
    if (reply.disabled) {
      notify("Hãy chọn hội thoại trước.");
      return;
    }
    reply.value = button.dataset.chatTemplate;
    reply.focus();
  });

  // Chạy nhanh khi demo: khôi phục dữ liệu mẫu bằng ShopMini.resetDemo() trong console.
  window.ShopMini = { resetDemo };
  render();
})();