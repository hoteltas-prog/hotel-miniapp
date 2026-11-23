(function () {
  "use strict";

  var tg = (window.Telegram && window.Telegram.WebApp) || null;
  var inTelegram = !!(tg && tg.initData);  // SDK подключается и вне Telegram, но initData есть только внутри
  var CONFIG = window.APP_CONFIG || {};
  var app = document.getElementById("app");
  var titleEl = document.getElementById("title");
  var langsEl = document.getElementById("langs");
  var LANGS = [["ru", "RU"], ["uz", "UZ"], ["en", "EN"], ["zh", "中文"]];

  // Тексты интерфейса на 4 языках (переводы на uz и zh сделаны автоматически, показать носителям).
  // Фразы с числами и временем сделаны шаблонами: порядок слов в языках разный.
  var UI = {
    ru: { title: "Гостиницы", fromTpl: "от {p} сум / ночь", perNight: "сум за ночь", rooms: "Номера", amenities: "Удобства",
          checkin: "Заезд", checkout: "Выезд", breakfast: "Завтрак", included: "включён",
          afterTpl: "после {t}", beforeTpl: "до {t}", guestsTpl: "до {n} гостей", areaTpl: "{a} м²", sep: ", ",
          book: "Забронировать", ask: "Узнать в чате", back: "← Все гостиницы",
          loadError: "Не удалось загрузить данные. Попробуйте позже.", notFound: "Гостиница не найдена." },
    uz: { title: "Mehmonxonalar", fromTpl: "kechasi {p} so'mdan", perNight: "so'm / kecha", rooms: "Xonalar", amenities: "Qulayliklar",
          checkin: "Joylashish", checkout: "Ketish", breakfast: "Nonushta", included: "narxga kiritilgan",
          afterTpl: "{t} dan keyin", beforeTpl: "{t} gacha", guestsTpl: "{n} tagacha mehmon", areaTpl: "{a} m²", sep: ", ",
          book: "Bron qilish", ask: "Chatda so'rash", back: "← Barcha mehmonxonalar",
          loadError: "Ma'lumotlarni yuklab bo'lmadi. Keyinroq urinib ko'ring.", notFound: "Mehmonxona topilmadi." },
    en: { title: "Hotels", fromTpl: "from {p} UZS / night", perNight: "UZS per night", rooms: "Rooms", amenities: "Amenities",
          checkin: "Check-in", checkout: "Check-out", breakfast: "Breakfast", included: "included",
          afterTpl: "after {t}", beforeTpl: "before {t}", guestsTpl: "up to {n} guests", areaTpl: "{a} m²", sep: ", ",
          book: "Book this room", ask: "Ask in chat", back: "← All hotels",
          loadError: "Could not load the data. Please try again later.", notFound: "Hotel not found." },
    zh: { title: "酒店", fromTpl: "每晚 {p} 苏姆起", perNight: "苏姆/晚", rooms: "房型", amenities: "设施",
          checkin: "入住", checkout: "退房", breakfast: "早餐", included: "已含",
          afterTpl: "{t} 之后", beforeTpl: "{t} 之前", guestsTpl: "最多 {n} 人", areaTpl: "{a} 平方米", sep: "，",
          book: "预订此房型", ask: "在聊天中咨询", back: "← 全部酒店",
          loadError: "无法加载数据，请稍后再试。", notFound: "未找到该酒店。" }
  };

  var data = null;
  var lang = pickLang();

  function pickLang() {
    var saved = null;
    try { saved = localStorage.getItem("lang"); } catch (e) { /* хранилище недоступно: не страшно */ }
    if (saved && UI[saved]) return saved;
    var code = "";
    try { code = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.language_code) || navigator.language || ""; } catch (e) { code = ""; }
    code = String(code).toLowerCase();
    if (code.indexOf("uz") === 0) return "uz";
    if (code.indexOf("zh") === 0) return "zh";
    if (code.indexOf("en") === 0) return "en";
    return "ru";
  }

  function t(obj) { return (obj && (obj[lang] || obj.en || obj.ru)) || ""; }
  function ui(key) { return UI[lang][key]; }
  function fill(tpl, values) {
    return tpl.replace(/\{(\w+)\}/g, function (m, key) { return values[key] === undefined ? m : values[key]; });
  }
  function money(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }

  // Безопасное создание элементов: текст вставляется как текст, не как HTML
  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (key) {
        if (key === "text") node.textContent = props[key];
        else if (key === "class") node.className = props[key];
        else if (key.indexOf("on") === 0) node.addEventListener(key.slice(2), props[key]);
        else node.setAttribute(key, props[key]);
      });
    }
    (children || []).forEach(function (child) { if (child) node.appendChild(child); });
    return node;
  }

  // Картинки в карточках декоративные: смысл несут подписи рядом, поэтому alt пустой
  function img(src) { return el("img", { src: src, alt: "", loading: "lazy" }); }
  function stars(n) { return el("span", { class: "stars", role: "img", "aria-label": n + " ★", text: new Array(n + 1).join("★") }); }

  function minPrice(hotel) {
    var prices = (hotel.rooms || []).map(function (r) { return r.price; });
    return prices.length ? Math.min.apply(null, prices) : null;
  }

  function cover(hotel) {
    if (hotel.photos && hotel.photos[0] && hotel.photos[0].src) return hotel.photos[0].src;
    if (hotel.rooms && hotel.rooms[0] && hotel.rooms[0].image) return hotel.rooms[0].image;
    return "";
  }

  function renderLangs() {
    langsEl.textContent = "";
    LANGS.forEach(function (pair) {
      langsEl.appendChild(el("button", {
        type: "button", text: pair[1], "aria-pressed": String(pair[0] === lang),
        onclick: function () {
          lang = pair[0];
          try { localStorage.setItem("lang", lang); } catch (e) { /* не страшно */ }
          document.documentElement.lang = lang;
          render(true);
        }
      }));
    });
  }

  function renderList() {
    app.textContent = "";
    data.hotels.forEach(function (hotel) {
      var low = minPrice(hotel);
      var body = [
        el("h2", { text: t(hotel.name) + " " }, [stars(hotel.stars || 0)]),
        el("div", { class: "muted", text: t(hotel.tagline) })
      ];
      if (low !== null) body.push(el("div", { class: "price", text: fill(ui("fromTpl"), { p: money(low) }) }));
      var image = cover(hotel);
      app.appendChild(el("a", { class: "card", href: "#/hotel/" + hotel.id }, [
        image ? img(image) : null,
        el("div", { class: "body" }, body)
      ]));
    });
  }

  function fact(label, value) {
    return el("div", { class: "fact" }, [el("b", { text: value }), el("span", { text: label })]);
  }

  function renderHotel(id) {
    var hotel = data.hotels.filter(function (h) { return h.id === id; })[0];
    app.textContent = "";
    if (!hotel) { app.appendChild(el("div", { class: "error", text: ui("notFound") })); return; }

    app.appendChild(el("button", { class: "back", type: "button", text: ui("back"), onclick: function () { location.hash = "#/"; } }));

    if (hotel.photos && hotel.photos.length) {
      var gallery = el("div", { class: "gallery" });
      hotel.photos.forEach(function (photo) {
        gallery.appendChild(el("figure", null, [img(photo.src), el("figcaption", { text: t(photo.caption) })]));
      });
      app.appendChild(gallery);
    }

    app.appendChild(el("h2", { class: "section", text: t(hotel.name) + " " }, [stars(hotel.stars || 0)]));
    app.appendChild(el("p", { text: t(hotel.description) }));

    var b = hotel.breakfast || {};
    app.appendChild(el("div", { class: "facts" }, [
      fact(ui("checkin"), fill(ui("afterTpl"), { t: hotel.checkin })),
      fact(ui("checkout"), fill(ui("beforeTpl"), { t: hotel.checkout })),
      fact(ui("breakfast") + (b.included ? ui("sep") + ui("included") : ""), (b.from || "") + "–" + (b.to || ""))
    ]));

    app.appendChild(el("h2", { class: "section", text: ui("amenities") }));
    var list = el("ul", { class: "amenities" });
    (hotel.amenities || []).forEach(function (a) {
      list.appendChild(el("li", null, [el("span", { text: a.icon, "aria-hidden": "true" }), el("span", { text: t(a.text) })]));
    });
    app.appendChild(list);

    app.appendChild(el("h2", { class: "section", text: ui("rooms") }));
    (hotel.rooms || []).forEach(function (room) {
      var meta = fill(ui("guestsTpl"), { n: room.capacity }) + " · " + fill(ui("areaTpl"), { a: room.area });
      app.appendChild(el("div", { class: "room" }, [
        room.image ? img(room.image) : null,
        el("div", { class: "body" }, [
          el("h3", { text: t(room.name) }),
          el("div", { class: "meta", text: meta }),
          el("div", { class: "row" }, [
            el("div", { class: "price" }, [document.createTextNode(money(room.price) + " "), el("small", { text: ui("perNight") })]),
            // Онлайн-бронь есть не у всех гостиниц: у остальных кнопка ведёт в чат с вопросом
            el("button", { class: "btn", type: "button", text: hotel.bookable ? ui("book") : ui("ask"), onclick: function () { book(room); } })
          ])
        ])
      ]));
    });
  }

  // «Забронировать»: открываем чат с ботом (язык и номер передаются в ссылке) и закрываем приложение
  function book(room) {
    var url = "https://t.me/" + CONFIG.botUsername + "?start=book_" + lang + "_" + room.id;
    if (inTelegram && tg.openTelegramLink) {
      tg.openTelegramLink(url);
      // небольшая пауза: на некоторых клиентах мгновенное закрытие обрывает переход по ссылке
      setTimeout(function () { try { tg.close(); } catch (e) { /* не страшно */ } }, 300);
    } else {
      window.open(url, "_blank");
    }
  }

  function render(keepScroll) {
    document.title = ui("title");
    titleEl.textContent = ui("title");
    renderLangs();
    if (!data) return;
    var hash = location.hash || "#/";
    var match = hash.match(/^#\/hotel\/([A-Za-z0-9_-]+)$/);
    try {
      if (match) renderHotel(match[1]); else renderList();
    } catch (e) {
      app.textContent = "";
      app.appendChild(el("div", { class: "error", text: ui("loadError") }));
    }
    if (keepScroll !== true) window.scrollTo(0, 0);
    if (tg && tg.BackButton) { if (match) tg.BackButton.show(); else tg.BackButton.hide(); }
  }

  function start() {
    if (tg) {
      try { tg.ready(); tg.expand(); } catch (e) { /* не в Telegram: не страшно */ }
      try { if (tg.setHeaderColor) tg.setHeaderColor("bg_color"); } catch (e) { /* старые клиенты */ }
      if (tg.BackButton && tg.BackButton.onClick) tg.BackButton.onClick(function () { location.hash = "#/"; });
    }
    document.documentElement.lang = lang;
    renderLangs();
    fetch("hotels.json?v=" + encodeURIComponent(CONFIG.version || "1"), { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (json) {
        if (!json || !Array.isArray(json.hotels)) throw new Error("bad data");
        data = json;
        render();
      })
      .catch(function () { app.textContent = ""; app.appendChild(el("div", { class: "error", text: ui("loadError") })); });
    window.addEventListener("hashchange", function () { render(); });
  }

  start();
})();
