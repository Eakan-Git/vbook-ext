var BASE_URL = "https://tangthuvien.thaomocvn.com";
var UA = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";

function normalizeUrl(url) {
    url = String(url || "");
    if (url.indexOf("http") !== 0) url = BASE_URL + (url.charAt(0) === "/" ? "" : "/") + url;
    return url.replace(/^(?:https?:\/\/)?(?:www\.)?[^:\/\n?#]+/i, BASE_URL);
}

function pathOf(url) {
    return normalizeUrl(url).substring(BASE_URL.length).replace(/[#?].*$/, "") || "/";
}

// "/books/<slug>" or "/books/<slug>/chapters/<n>" -> "<slug>"
function slugOf(url) {
    var m = /\/books\/([^\/?#]+)/.exec(pathOf(url));
    return m ? m[1] : "";
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
    options.headers = headers;
    if (!options.timeout) options.timeout = 30000;

    var wait = 1500;
    var res = null;
    for (var attempt = 1; attempt <= 4; attempt++) {
        res = fetch(url, options);
        var st = Number(res.status);
        if (res.ok) return res;
        if (st !== 429 && st !== 503 && (st < 500 || st > 599)) return res;
        var ra = parseInt(String(res.header("retry-after") || ""), 10);
        sleep(ra > 0 ? Math.min(ra * 1000, 60000) : wait);
        wait = Math.min(wait * 2, 20000);
    }
    return res;
}

function getJson(url) {
    var res = http(url, { headers: { "Accept": "application/json" } });
    if (!res.ok) return null;
    try { return res.json(); } catch (e) { return null; }
}

function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Map an /api/novels result object to a vBook list item.
function novelToItem(n) {
    var chaps = n.totalChapters ? (n.totalChapters + " chương") : "";
    var desc = [n.author, chaps].filter(function (x) { return x; }).join(" • ");
    return {
        name: n.title,
        link: BASE_URL + "/books/" + n.id,
        cover: n.coverImage || "",
        description: desc,
        tag: (n.tags && n.tags.length) ? n.tags[0] : "",
        host: BASE_URL
    };
}

// Parse book cards (cover anchors) from a server-rendered list/tag page.
function parseCards(doc) {
    var seen = {};
    var items = [];
    doc.select("a[href^=\"/books/\"]").forEach(function (a) {
        var href = a.attr("href");
        if (!/^\/books\/[^\/?#]+$/.test(href) || seen[href]) return;
        var img = firstEl(a.select("img"));
        if (!img) return; // only the cover anchor carries the <img alt=title>
        var name = img.attr("alt");
        if (!name) return;
        seen[href] = true;
        var status = "";
        a.select("span").forEach(function (sp) {
            var t = sp.text().trim();
            if (!status && /^(Đang ra|Hoàn thành)$/i.test(t)) status = t;
        });
        items.push({
            name: name,
            link: BASE_URL + href,
            cover: img.attr("src") || img.attr("data-src") || "",
            description: "",
            tag: status,
            host: BASE_URL
        });
    });
    return items;
}
