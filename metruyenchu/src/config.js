var BASE_URL = "https://metruyenchu.com.vn";

var UA = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";
var NON_BOOK_RE = /^\/(the-loai|danh-sach|tac-gia|search|tim-kiem|get|media|theme|images|img)(\/|$)/;
var JUNK_RE = /(metruyenchu(vn)?\.(com|vn)|bạn có thể dùng phím mũi tên)/i;

function normalizeUrl(url) {
    url = String(url || "");
    if (url.indexOf("http") !== 0) url = BASE_URL + (url.charAt(0) === "/" ? "" : "/") + url;
    return url.replace(/^(?:https?:\/\/)?(?:www\.)?[^:\/\n?#]+/i, BASE_URL);
}

function pathOf(url) {
    return normalizeUrl(url).substring(BASE_URL.length) || "/";
}

// "/<slug>/..." -> "<slug>"
function slugOf(url) {
    var m = /^\/([A-Za-z0-9-]+)/.exec(pathOf(url));
    return m ? m[1] : "";
}

function bookUrlOf(url) {
    return BASE_URL + "/" + slugOf(url);
}

function firstEl(els) {
    if (!els || els.size() === 0) return null;
    return els.get(0);
}

// GET/POST with backoff on rate limiting (429) and transient 5xx / network errors.
function http(url, options) {
    options = options || {};
    var headers = options.headers || {};
    if (!headers["User-Agent"]) headers["User-Agent"] = UA;
    if (!headers["Referer"]) headers["Referer"] = BASE_URL + "/";
    headers["Accept-Language"] = "vi-VN,vi;q=0.9";
    options.headers = headers;
    if (!options.timeout) options.timeout = 30000;

    var wait = 2000;
    var res = null;
    for (var attempt = 1; attempt <= 4; attempt++) {
        res = fetch(url, options);
        var st = Number(res.status);
        if (res.ok) return res;
        if (st !== 429 && st !== 504 && (st < 500 || st > 599)) return res;
        var ra = parseInt(String(res.header("retry-after") || ""), 10);
        sleep(ra > 0 ? Math.min(ra * 1000, 60000) : wait);
        wait = Math.min(wait * 2, 30000);
    }
    return res;
}

function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Book list on /search, /danh-sach/*, /the-loai/* pages: <h3><a href="/slug">Title</a></h3>
// plus an <a href="/slug"><img ...></a> cover link.
function parseBookList(doc) {
    var root = firstEl(doc.select(".mainCol")) || doc;
    var covers = {};
    root.select("a[href]:has(img)").forEach(function (a) {
        var p = pathOf(a.attr("href"));
        var img = firstEl(a.select("img"));
        if (!img || covers[p]) return;
        var src = img.attr("data-original") || img.attr("data-src") || img.attr("src");
        if (src) covers[p] = src.indexOf("http") === 0 ? src : BASE_URL + src;
    });
    var seen = {};
    var items = [];
    root.select("h3 a[href]").forEach(function (a) {
        var p = pathOf(a.attr("href")).replace(/\/$/, "");
        if (!/^\/[A-Za-z0-9-]+$/.test(p) || NON_BOOK_RE.test(p) || seen[p]) return;
        var name = a.text().trim();
        if (!name) return;
        seen[p] = true;
        items.push({
            name: name,
            link: BASE_URL + p,
            cover: covers[p] || covers[p + "/"] || (BASE_URL + "/media/book" + p + ".jpg"),
            description: "",
            host: BASE_URL
        });
    });
    return items;
}

// ---- chapter URL resolution -------------------------------------------------------
// Real chapter URLs carry a random token (/slug/chuong-401-AbC123...). The site's list
// endpoint only serves the first 400, so later TOC entries use a placeholder URL
// "/slug/chuong-<n>?vbgoto=<bookId>" which chap.js resolves to the real URL.
var CHAP_RE = /^\/([A-Za-z0-9-]+)\/chuong-(\d+)-[A-Za-z0-9]+$/;
var GOTO_RE = /^\/([A-Za-z0-9-]+)\/chuong-(\d+)\?vbgoto=(\d+)$/;

function cacheKey(slug, n) {
    return "mtc:" + slug + ":" + n;
}

function rememberChapter(slug, n, url) {
    try { cacheStorage.setItem(cacheKey(slug, n), url); } catch (e) {}
}

function knownChapter(slug, n) {
    try { return cacheStorage.getItem(cacheKey(slug, n)) || ""; } catch (e) { return ""; }
}

function hasPage(doc, page) {
    return doc.select("a[href*='page=" + page + "']").size() > 0;
}
