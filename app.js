(function () {
  "use strict";

  var tg = (window.Telegram && window.Telegram.WebApp) || null;
  var inTelegram = !!(tg && tg.initData);  // SDK подключается и вне Telegram, но initData есть только внутри
  var CONFIG = window.APP_CONFIG || {};
  var app = document.getElementById("app");
  var titleEl = document.getElementById("title");
  var langsEl = document.getElementById("langs");
  var barEl = document.getElementById("bar");
  var LANGS = [["ru", "RU"], ["uz", "UZ"], ["en", "EN"], ["zh", "中文"]];
  var LOCALES = { ru: "ru-RU", uz: "uz-UZ", en: "en-GB", zh: "zh-CN" };
  var MAX_NIGHTS = 30;
  var MAX_GUESTS = 6;

  // Тексты интерфейса на 4 языках (переводы на uz и zh сделаны автоматически, показать носителям).
  // Фразы с числами и временем сделаны шаблонами: порядок слов в языках разный.
  var UI = {
    ru: { title: "Гостиницы", fromTpl: "от {p} сум / ночь", perNight: "сум за ночь", rooms: "Номера", amenities: "Удобства",
          checkin: "Заезд", checkout: "Выезд", breakfast: "Завтрак", included: "включён",
          afterTpl: "после {t}", beforeTpl: "до {t}", guestsTpl: "до {n} гостей", areaTpl: "{a} м²", sep: ", ",
          book: "Забронировать", ask: "Узнать в чате", back: "← Все гостиницы",
          nightsLabel: "Ночей", guestsLabel: "Гостей", totalTpl: "Итого за {n}: {total} сум", totalShort: "Итого",
          breakfastIn: "Завтрак включён", breakfastOpt: "Завтрак по желанию", payOnSite: "Оплата на месте",
          notFitTpl: "Не подходит: до {n} гостей", showAllTpl: "Показать все ({n})", showLess: "Свернуть",
          trust: "Без регистрации · Оплата на месте · Бронь подтверждает менеджер",
          termsTitle: "Условия", terms: ["Оплата на месте, предоплаты нет.", "Бронь подтверждает менеджер гостиницы.", "Отмена и изменения: напишите в чат с ботом."],
          loadError: "Не удалось загрузить данные. Попробуйте позже.", notFound: "Гостиница не найдена." },
    uz: { title: "Mehmonxonalar", fromTpl: "kechasi {p} so'mdan", perNight: "so'm / kecha", rooms: "Xonalar", amenities: "Qulayliklar",
          checkin: "Joylashish", checkout: "Ketish", breakfast: "Nonushta", included: "narxga kiritilgan",
          afterTpl: "{t} dan keyin", beforeTpl: "{t} gacha", guestsTpl: "{n} tagacha mehmon", areaTpl: "{a} m²", sep: ", ",
          book: "Bron qilish", ask: "Chatda so'rash", back: "← Barcha mehmonxonalar",
          nightsLabel: "Kechalar", guestsLabel: "Mehmonlar", totalTpl: "{n} uchun jami: {total} so'm", totalShort: "Jami",
          breakfastIn: "Nonushta narxga kiritilgan", breakfastOpt: "Nonushta xohishga ko'ra", payOnSite: "To'lov joyida",
          notFitTpl: "Mos kelmaydi: {n} tagacha mehmon", showAllTpl: "Barchasini ko'rsatish ({n})", showLess: "Yig'ish",
          trust: "Ro'yxatdan o'tmasdan · To'lov joyida · Bronni menejer tasdiqlaydi",
          termsTitle: "Shartlar", terms: ["To'lov joyida, oldindan to'lov yo'q.", "Bronni mehmonxona menejeri tasdiqlaydi.", "Bekor qilish va o'zgartirish: bot chatiga yozing."],
          loadError: "Ma'lumotlarni yuklab bo'lmadi. Keyinroq urinib ko'ring.", notFound: "Mehmonxona topilmadi." },
    en: { title: "Hotels", fromTpl: "from {p} UZS / night", perNight: "UZS per night", rooms: "Rooms", amenities: "Amenities",
          checkin: "Check-in", checkout: "Check-out", breakfast: "Breakfast", included: "included",
          afterTpl: "after {t}", beforeTpl: "before {t}", guestsTpl: "up to {n} guests", areaTpl: "{a} m²", sep: ", ",
          book: "Book", ask: "Ask in chat", back: "← All hotels",
          nightsLabel: "Nights", guestsLabel: "Guests", totalTpl: "Total for {n}: {total} UZS", totalShort: "Total",
          breakfastIn: "Breakfast included", breakfastOpt: "Breakfast optional", payOnSite: "Pay at the hotel",
          notFitTpl: "Not suitable: up to {n} guests", showAllTpl: "Show all ({n})", showLess: "Show less",
          trust: "No sign-up · Pay at the hotel · Booking confirmed by a manager",
          termsTitle: "Terms", terms: ["Pay at the hotel, no prepayment.", "A hotel manager confirms the booking.", "Cancellations and changes: write in the bot chat."],
          loadError: "Could not load the data. Please try again later.", notFound: "Hotel not found." },
    zh: { title: "酒店", fromTpl: "每晚 {p} 苏姆起", perNight: "苏姆/晚", rooms: "房型", amenities: "设施",
          checkin: "入住", checkout: "退房", breakfast: "早餐", included: "已含",
          afterTpl: "{t} 之后", beforeTpl: "{t} 之前", guestsTpl: "最多 {n} 人", areaTpl: "{a} 平方米", sep: "，",
          book: "预订", ask: "在聊天中咨询", back: "← 全部酒店",
          nightsLabel: "晚数", guestsLabel: "人数", totalTpl: "{n}合计：{total} 苏姆", totalShort: "合计",
          breakfastIn: "含早餐", breakfastOpt: "早餐可选", payOnSite: "到店付款",
          notFitTpl: "不适合：最多 {n} 人", showAllTpl: "显示全部（{n}）", showLess: "收起",
          trust: "无需注册 · 到店付款 · 经理确认预订",
          termsTitle: "条款", terms: ["到店付款，无需预付。", "酒店经理确认预订。", "取消或修改：请在机器人聊天中留言。"],
          loadError: "无法加载数据，请稍后再试。", notFound: "未找到该酒店。" }
  };

  var data = null;
  var lang = pickLang();
  var state = loadSearch();

  // ---------- вспомогательное ----------
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

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function toIso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseIso(iso) { return new Date(iso + "T12:00:00"); }
  function addDays(iso, n) { var d = parseIso(iso); d.setDate(d.getDate() + n); return toIso(d); }
  function todayIso() { return toIso(new Date()); }
  var UZ_MONTHS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
  function fmtDate(iso) {
    var d = parseIso(iso);
    // В браузерах нет коротких узбекских названий месяцев (получается «M11»), поэтому подставляем свои
    if (lang === "uz") return d.getDate() + "-" + UZ_MONTHS[d.getMonth()];
    try { return new Intl.DateTimeFormat(LOCALES[lang], { day: "numeric", month: "short" }).format(d); } catch (e) { return iso; }
  }

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function loadSearch() {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem("search") || "{}") || {}; } catch (e) { saved = {}; }
    return {
      checkin: addDays(todayIso(), 1),
      nights: clamp(parseInt(saved.nights, 10) || 1, 1, MAX_NIGHTS),
      guests: clamp(parseInt(saved.guests, 10) || 2, 1, MAX_GUESTS),
      roomId: null,
      amenitiesOpen: false
    };
  }
  function saveSearch() {
    try { localStorage.setItem("search", JSON.stringify({ nights: state.nights, guests: state.guests })); } catch (e) { /* не страшно */ }
  }

  function t(obj) { return (obj && (obj[lang] || obj.en || obj.ru)) || ""; }
  function ui(key) { return UI[lang][key]; }
  function fill(tpl, values) {
    return tpl.replace(/\{(\w+)\}/g, function (m, key) { return values[key] === undefined ? m : values[key]; });
  }
  function money(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }

  function ruPlural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }
  function nightsText(n) {
    if (lang === "ru") return n + " " + ruPlural(n, "ночь", "ночи", "ночей");
    if (lang === "uz") return n + " kecha";
    if (lang === "zh") return n + " 晚";
    return n + (n === 1 ? " night" : " nights");
  }
  function guestsText(n) {
    if (lang === "ru") return n + " " + ruPlural(n, "гость", "гостя", "гостей");
    if (lang === "uz") return n + " mehmon";
    if (lang === "zh") return n + " 位客人";
    return n + (n === 1 ? " guest" : " guests");
  }

  // Безопасное создание элементов: текст вставляется как текст, не как HTML
  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (key) {
        if (props[key] === null || props[key] === undefined) return;  // пустые свойства пропускаем
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

  // ---------- шапка и язык ----------
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

  // ---------- выбор дат и гостей ----------
  function stepper(label, value, onMinus, onPlus, minusDisabled, plusDisabled) {
    return el("div", { class: "stepper" }, [
      el("span", { class: "lbl", text: label }),
      el("div", { class: "ctl" }, [
        el("button", { type: "button", "aria-label": "−", text: "−", onclick: onMinus, disabled: minusDisabled ? "disabled" : null }),
        el("b", { text: value }),
        el("button", { type: "button", "aria-label": "+", text: "+", onclick: onPlus, disabled: plusDisabled ? "disabled" : null })
      ])
    ]);
  }

  function searchBox() {
    var input = el("input", { type: "date", value: state.checkin, min: todayIso(), "aria-label": ui("checkin") });
    input.addEventListener("change", function () {
      if (input.value && input.value >= todayIso()) { state.checkin = input.value; refresh(); } else { input.value = state.checkin; }
    });
    var box = el("div", { class: "search" }, [
      el("label", { class: "datefield" }, [el("span", { class: "lbl", text: ui("checkin") }), input]),
      stepper(ui("nightsLabel"), nightsText(state.nights),
        function () { state.nights = clamp(state.nights - 1, 1, MAX_NIGHTS); saveSearch(); refresh(); },
        function () { state.nights = clamp(state.nights + 1, 1, MAX_NIGHTS); saveSearch(); refresh(); },
        state.nights <= 1, state.nights >= MAX_NIGHTS),
      stepper(ui("guestsLabel"), guestsText(state.guests),
        function () { state.guests = clamp(state.guests - 1, 1, MAX_GUESTS); saveSearch(); refresh(); },
        function () { state.guests = clamp(state.guests + 1, 1, MAX_GUESTS); saveSearch(); refresh(); },
        state.guests <= 1, state.guests >= MAX_GUESTS)
    ]);
    return el("div", { class: "searchwrap" }, [
      box,
      el("div", { class: "range muted", text: fmtDate(state.checkin) + " → " + fmtDate(addDays(state.checkin, state.nights)) + " · " + nightsText(state.nights) + " · " + guestsText(state.guests) })
    ]);
  }

  // ---------- главный экран ----------
  function renderList() {
    app.textContent = "";
    app.appendChild(el("div", { class: "trust", text: ui("trust") }));
    app.appendChild(searchBox());
    data.hotels.forEach(function (hotel) {
      var low = minPrice(hotel);
      var body = [
        el("h2", { text: t(hotel.name) + " " }, [stars(hotel.stars || 0)]),
        el("div", { class: "muted", text: t(hotel.tagline) })
      ];
      var badges = el("div", { class: "badges" });
      if (hotel.breakfast && hotel.breakfast.included) badges.appendChild(el("span", { class: "badge good", text: "🍳 " + ui("breakfastIn") }));
      badges.appendChild(el("span", { class: "badge", text: "💵 " + ui("payOnSite") }));
      body.push(badges);
      if (low !== null) body.push(el("div", { class: "price", text: fill(ui("fromTpl"), { p: money(low) }) }));
      var image = cover(hotel);
      app.appendChild(el("a", { class: "card", href: "#/hotel/" + hotel.id }, [
        image ? img(image) : null,
        el("div", { class: "body" }, body)
      ]));
    });
    setBar(null);
  }

  // ---------- страница гостиницы ----------
  function fact(label, value) {
    return el("div", { class: "fact" }, [el("b", { text: value }), el("span", { text: label })]);
  }

  function buildGallery(photos) {
    var gallery = el("div", { class: "gallery" });
    photos.forEach(function (photo) {
      gallery.appendChild(el("figure", null, [img(photo.src), el("figcaption", { text: t(photo.caption) })]));
    });
    var counter = el("span", { class: "counter", text: "1/" + photos.length });
    gallery.addEventListener("scroll", function () {
      var figures = gallery.querySelectorAll("figure");
      var center = gallery.scrollLeft + gallery.clientWidth / 2;
      var best = 0, bestDist = Infinity;
      for (var i = 0; i < figures.length; i++) {
        var mid = figures[i].offsetLeft + figures[i].offsetWidth / 2;
        var dist = Math.abs(mid - center);
        if (dist < bestDist) { bestDist = dist; best = i; }
      }
      counter.textContent = (best + 1) + "/" + photos.length;
    });
    return el("div", { class: "gwrap" }, [gallery, counter]);
  }

  function fits(room) { return room.capacity >= state.guests; }

  function pickDefaultRoom(hotel) {
    var current = (hotel.rooms || []).filter(function (r) { return r.id === state.roomId && fits(r); })[0];
    if (current) return current;
    var first = (hotel.rooms || []).filter(fits)[0];
    state.roomId = first ? first.id : null;
    return first || null;
  }

  var roomEls = [];

  function roomCard(hotel, room) {
    var ok = fits(room);
    var total = room.price * state.nights;
    var selected = ok && room.id === state.roomId;
    var badges = el("div", { class: "badges" });
    badges.appendChild(hotel.breakfast && hotel.breakfast.included
      ? el("span", { class: "badge good", text: "🍳 " + ui("breakfastIn") })
      : el("span", { class: "badge", text: "🍳 " + ui("breakfastOpt") }));
    badges.appendChild(el("span", { class: "badge", text: "💵 " + ui("payOnSite") }));
    var meta = fill(ui("guestsTpl"), { n: room.capacity }) + " · " + fill(ui("areaTpl"), { a: room.area });
    var card = el("div", {
      class: "room" + (selected ? " selected" : "") + (ok ? "" : " disabled"),
      role: "radio", "aria-checked": String(selected), "aria-disabled": String(!ok), tabindex: ok ? "0" : "-1"
    }, [
      room.image ? img(room.image) : null,
      el("div", { class: "body" }, [
        el("h3", { text: t(room.name) }),
        el("div", { class: "meta", text: ok ? meta : fill(ui("notFitTpl"), { n: room.capacity }) }),
        badges,
        el("div", { class: "row" }, [
          el("div", { class: "price" }, [document.createTextNode(money(room.price) + " "), el("small", { text: ui("perNight") })]),
          state.nights > 1 ? el("div", { class: "sum", text: fill(ui("totalTpl"), { n: nightsText(state.nights), total: money(total) }) }) : null
        ])
      ])
    ]);
    if (ok) {
      var choose = function () { state.roomId = room.id; updateSelection(hotel); };
      card.addEventListener("click", choose);
      card.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(); } });
    }
    roomEls.push({ room: room, node: card });
    return card;
  }

  function updateSelection(hotel) {
    roomEls.forEach(function (item) {
      var on = item.room.id === state.roomId && fits(item.room);
      item.node.classList.toggle("selected", on);
      item.node.setAttribute("aria-checked", String(on));
    });
    setBar(hotel);
  }

  function selectedRoom(hotel) {
    return (hotel.rooms || []).filter(function (r) { return r.id === state.roomId && fits(r); })[0] || null;
  }

  function renderHotel(id) {
    var hotel = data.hotels.filter(function (h) { return h.id === id; })[0];
    app.textContent = "";
    roomEls = [];
    if (!hotel) { app.appendChild(el("div", { class: "error", text: ui("notFound") })); setBar(null); return; }

    app.appendChild(el("button", { class: "back", type: "button", text: ui("back"), onclick: function () { location.hash = "#/"; } }));
    if (hotel.photos && hotel.photos.length) app.appendChild(buildGallery(hotel.photos));

    app.appendChild(el("h2", { class: "section", text: t(hotel.name) + " " }, [stars(hotel.stars || 0)]));
    app.appendChild(el("p", { text: t(hotel.description) }));

    var b = hotel.breakfast || {};
    app.appendChild(el("div", { class: "facts" }, [
      fact(ui("checkin"), fill(ui("afterTpl"), { t: hotel.checkin })),
      fact(ui("checkout"), fill(ui("beforeTpl"), { t: hotel.checkout })),
      fact(ui("breakfast") + (b.included ? ui("sep") + ui("included") : ""), (b.from || "") + "–" + (b.to || ""))
    ]));

    // Удобства: сначала главные, остальное по кнопке
    app.appendChild(el("h2", { class: "section", text: ui("amenities") }));
    var all = hotel.amenities || [];
    var shown = state.amenitiesOpen ? all : all.slice(0, 4);
    var list = el("ul", { class: "amenities" });
    shown.forEach(function (a) {
      list.appendChild(el("li", null, [el("span", { text: a.icon, "aria-hidden": "true" }), el("span", { text: t(a.text) })]));
    });
    app.appendChild(list);
    if (all.length > 4) {
      app.appendChild(el("button", {
        class: "link", type: "button",
        text: state.amenitiesOpen ? ui("showLess") : fill(ui("showAllTpl"), { n: all.length }),
        "aria-expanded": String(state.amenitiesOpen),
        onclick: function () { state.amenitiesOpen = !state.amenitiesOpen; render(true); }
      }));
    }

    app.appendChild(el("h2", { class: "section", text: ui("rooms") }));
    app.appendChild(searchBox());
    pickDefaultRoom(hotel);
    var roomsBox = el("div", { role: "radiogroup", "aria-label": ui("rooms") });
    (hotel.rooms || []).forEach(function (room) { roomsBox.appendChild(roomCard(hotel, room)); });
    app.appendChild(roomsBox);

    app.appendChild(el("h2", { class: "section", text: ui("termsTitle") }));
    var terms = el("ul", { class: "terms" });
    ui("terms").forEach(function (line) { terms.appendChild(el("li", { text: line })); });
    app.appendChild(terms);

    setBar(hotel);
  }

  // ---------- закреплённая кнопка внизу ----------
  function setBar(hotel) {
    barEl.textContent = "";
    var room = hotel ? selectedRoom(hotel) : null;
    document.body.classList.toggle("has-bar", !!room);
    if (!room) { barEl.hidden = true; return; }
    barEl.hidden = false;
    var total = room.price * state.nights;
    barEl.appendChild(el("div", { class: "sumbox" }, [
      el("span", { class: "small", text: ui("totalShort") + " · " + nightsText(state.nights) + " · " + guestsText(state.guests) }),
      el("b", { text: money(total) + " " + (lang === "zh" ? "苏姆" : lang === "uz" ? "so'm" : lang === "en" ? "UZS" : "сум") })
    ]));
    barEl.appendChild(el("button", {
      class: "btn", type: "button", text: hotel.bookable ? ui("book") : ui("ask"),
      onclick: function () { book(room); }
    }));
  }

  // «Забронировать»: открываем чат с ботом (язык, номер, даты и гости передаются в ссылке) и закрываем приложение
  function book(room) {
    var d = state.checkin.replace(/-/g, "").slice(2);  // ГГММДД
    var url = "https://t.me/" + CONFIG.botUsername + "?start=book_" + lang + "_" + room.id + "_" + d + "_" + state.nights + "_" + state.guests;
    if (inTelegram && tg.openTelegramLink) {
      tg.openTelegramLink(url);
      // небольшая пауза: на некоторых клиентах мгновенное закрытие обрывает переход по ссылке
      setTimeout(function () { try { tg.close(); } catch (e) { /* не страшно */ } }, 300);
    } else {
      window.open(url, "_blank");
    }
  }

  // ---------- отрисовка ----------
  function render(keepScroll) {
    document.title = ui("title");
    titleEl.textContent = ui("title");
    renderLangs();
    if (!data) return;
    var hash = location.hash || "#/";
    var match = hash.match(/^#\/hotel\/([A-Za-z0-9_-]+)$/);
    var scrollY = window.pageYOffset;
    try {
      if (match) renderHotel(match[1]); else renderList();
    } catch (e) {
      app.textContent = "";
      setBar(null);
      app.appendChild(el("div", { class: "error", text: ui("loadError") }));
    }
    if (keepScroll === true) window.scrollTo(0, scrollY); else window.scrollTo(0, 0);
    if (tg && tg.BackButton) { if (match) tg.BackButton.show(); else tg.BackButton.hide(); }
  }

  function refresh() { render(true); }

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
