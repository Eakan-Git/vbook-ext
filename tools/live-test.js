// Live test: runs the REAL extension scripts inside a browser tab on metruyenchu.com.vn,
// with a small vBook runtime shim (sync XHR fetch, DOMParser-backed jsoup-like Html, cacheStorage).
// Usage (in a page on the site's origin): window.__VBOOK_SRC = {"config.js": "...", ...}; then eval this file;
// then `vbookLiveTest({ books: 1 })` returns a report. Picks random books from list pages and random chapters.
(function () {
  function wrapColl(nodes) {
    var arr = Array.prototype.slice.call(nodes);
    return {
      size: function () { return arr.length; }, get length() { return arr.length; },
      get: function (i) { return wrapEl(arr[i]); },
      first: function () { return arr.length ? wrapEl(arr[0]) : null; },
      last: function () { return arr.length ? wrapEl(arr[arr.length - 1]) : null; },
      isEmpty: function () { return arr.length === 0; },
      forEach: function (f) { arr.forEach(function (e, i) { f(wrapEl(e), i); }); },
      map: function (f) { return arr.map(function (e, i) { return f(wrapEl(e), i); }); },
      text: function () { return arr.map(function (e) { return e.textContent; }).join(" ").replace(/\s+/g, " ").trim(); },
      html: function () { return arr.map(function (e) { return e.innerHTML; }).join("\n"); },
      attr: function (k) { for (var i = 0; i < arr.length; i++) { var v = arr[i].getAttribute(k); if (v != null) return v; } return ""; },
      remove: function () { arr.forEach(function (e) { e.remove(); }); },
      select: function (css) { var out = []; arr.forEach(function (e) { out = out.concat(Array.prototype.slice.call(qsa(e, css))); }); return wrapColl(out); }
    };
  }
  // jsoup ":has(...)" — modern Chromium supports :has natively.
  function qsa(el, css) { return el.querySelectorAll(css); }
  function wrapEl(el) {
    return {
      select: function (css) { return wrapColl(qsa(el, css)); },
      text: function () { return (el.textContent || "").replace(/\s+/g, " ").trim(); },
      html: function () { return el.innerHTML || ""; },
      attr: function (k) { return el.getAttribute ? (el.getAttribute(k) || "") : ""; },
      remove: function () { el.remove(); }
    };
  }
  var Html = { parse: function (s) { return wrapEl(new DOMParser().parseFromString(String(s), "text/html")); } };

  var stats = { requests: 0, byPath: {} };
  function syncFetch(url, opt) {
    opt = opt || {};
    stats.requests++;
    var p = new URL(url, location.origin).pathname.replace(/\/chuong-.*/, "/chuong-*");
    stats.byPath[p] = (stats.byPath[p] || 0) + 1;
    var x = new XMLHttpRequest();
    var method = opt.method || "GET";
    x.open(method, url, false);
    var h = opt.headers || {};
    Object.keys(h).forEach(function (k) {
      if (!/^(user-agent|referer|accept-language)$/i.test(k)) x.setRequestHeader(k, h[k]);
    });
    var body = null;
    if (opt.body && typeof opt.body === "object") {
      x.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
      body = Object.keys(opt.body).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(opt.body[k]); }).join("&");
    }
    try { x.send(body); } catch (e) { return { status: 504, ok: false, header: function () { return ""; }, text: function () { return ""; }, json: function () { throw e; }, html: function () { return Html.parse(""); } }; }
    var t = x.responseText;
    return {
      status: x.status, ok: x.status >= 200 && x.status < 300, url: x.responseURL,
      header: function (k) { return x.getResponseHeader(k) || ""; },
      text: function () { return t; }, json: function () { return JSON.parse(t); }, html: function () { return Html.parse(t); }
    };
  }
  var store = {};
  var cacheStorage = { getItem: function (k) { return k in store ? store[k] : null; }, setItem: function (k, v) { store[k] = String(v); } };
  var Response = {
    success: function (d, d2) { return JSON.stringify({ code: 0, data: d, data2: d2 }); },
    error: function (m) { return JSON.stringify({ code: 1, data: m }); }
  };
  function sleep(ms) { var end = Date.now() + Math.min(ms, 5000); while (Date.now() < end) {} }

  function run(name) {
    var src = window.__VBOOK_SRC;
    var code = src[name].replace(/load\(['"]([^'"]+)['"]\);?/g, function (_, f) { return src[f] || ""; });
    var args = Array.prototype.slice.call(arguments, 1);
    var fn = new Function("fetch", "Html", "Response", "cacheStorage", "sleep", "__args", code + "\n;return execute.apply(null, __args);");
    return JSON.parse(fn(syncFetch, Html, Response, cacheStorage, sleep, args));
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function pause() { sleep(800); }

  window.vbookLiveTest = function (o) {
    o = o || {};
    var report = { books: [], problems: [] };
    var lists = ["/danh-sach/truyen-full", "/danh-sach/truyen-hot", "/danh-sach/truyen-tien-hiep-hay", "/danh-sach/truyen-ngon-tinh-hay"];
    var list = run("search.js", pick(lists), String(1 + Math.floor(Math.random() * 5)));
    if (list.code !== 0 || !list.data.length) { report.problems.push("list failed: " + JSON.stringify(list).slice(0, 200)); return report; }
    var books = o.urls || [];
    while (books.length < (o.books || 1)) { var b = pick(list.data).link; if (books.indexOf(b) < 0) books.push(b); }

    books.forEach(function (bookUrl) {
      var r = { url: bookUrl, chapters: [] };
      report.books.push(r);
      var d = run("detail.js", bookUrl); pause();
      if (d.code !== 0) { report.problems.push(bookUrl + " detail: " + d.data); return; }
      r.name = d.data.name; r.author = d.data.author; r.cover = !!d.data.cover; r.detail = d.data.detail;
      var expected = parseInt((/Số chương: (\d+)/.exec(d.data.detail) || [])[1] || "0", 10);
      var t = run("toc.js", bookUrl); pause();
      if (t.code !== 0) { report.problems.push(bookUrl + " toc: " + t.data); return; }
      var toc = t.data;
      r.toc = toc.length; r.expected = expected;
      r.placeholders = toc.filter(function (c) { return c.url.indexOf("vbgoto") >= 0; }).length;
      if (expected && toc.length !== expected) report.problems.push(bookUrl + " toc " + toc.length + " != " + expected);
      var urls = {}; toc.forEach(function (c) { urls[c.url] = 1; });
      if (Object.keys(urls).length !== toc.length) report.problems.push(bookUrl + " duplicate toc urls");

      // random chapters: first, a random one, one past 400 if any, last
      var idx = [0, Math.floor(Math.random() * toc.length)];
      if (toc.length > 401) idx.push(400 + Math.floor(Math.random() * (toc.length - 401)));
      idx.push(toc.length - 1);
      idx.forEach(function (i) {
        var c = run("chap.js", toc[i].url); pause();
        var html = c.code === 0 ? String(c.data) : "";
        var paras = (html.match(/<p>/g) || []).length;
        var textLen = html.replace(/<[^>]+>/g, "").length;
        var row = { n: i + 1, ok: c.code === 0, title: c.data2 || toc[i].name, paras: paras, chars: textLen,
                    viaGoto: toc[i].url.indexOf("vbgoto") >= 0, sample: html.replace(/<[^>]+>/g, " ").slice(0, 80) };
        r.chapters.push(row);
        var locked = /bị trang nguồn khóa/.test(html);
        if (!row.ok) report.problems.push(bookUrl + " ch" + row.n + ": " + c.data);
        else if (!locked && (paras < 5 || textLen < 1500)) report.problems.push(bookUrl + " ch" + row.n + " looks short: " + paras + " paras, " + textLen + " chars");
      });
    });
    report.requests = stats.requests; report.byPath = stats.byPath;
    return report;
  };
})();
