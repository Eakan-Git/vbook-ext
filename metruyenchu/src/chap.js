load('config.js');

function getToken(slug, refresh) {
    var key = "mtc:token:" + slug;
    if (!refresh) {
        var t = "";
        try { t = cacheStorage.getItem(key) || ""; } catch (e) {}
        if (t) return t;
    }
    var res = http(BASE_URL + "/" + slug);
    if (!res.ok) return "";
    var tok = res.html().select("input[name=__RequestVerificationToken]").attr("value");
    if (tok) { try { cacheStorage.setItem(key, tok); } catch (e) {} }
    return tok;
}

// The site's own "Tìm chương" form: POST /get/goto -> {"result":true,"url":"/slug/chuong-n-token"}
function gotoChapter(slug, n, bid) {
    for (var attempt = 0; attempt < 2; attempt++) {
        var tok = getToken(slug, attempt > 0);
        if (!tok) return "";
        var res = http(BASE_URL + "/get/goto", {
            method: "POST",
            headers: { "X-Requested-With": "XMLHttpRequest", "Referer": BASE_URL + "/" + slug },
            body: { "__RequestVerificationToken": tok, "bid": bid, "blink": slug, "id": String(n) }
        });
        if (res.ok) {
            try {
                var j = res.json();
                if (j && j.result && j.url) return normalizeUrl(String(j.url));
            } catch (e) {}
        }
    }
    return "";
}

// Fallback: walk "Chương tiếp" links from the nearest chapter whose URL is known.
function walkTo(slug, n) {
    for (var k = n - 1; k >= 1 && k >= n - 30; k--) {
        var u = knownChapter(slug, k);
        if (!u) continue;
        for (var i = k; i < n; i++) {
            var r = http(u);
            if (!r.ok) return "";
            var nx = firstEl(r.html().select("a.next"));
            if (!nx || /disabled/.test(nx.attr("class"))) return "";
            u = normalizeUrl(nx.attr("href"));
            if (!CHAP_RE.test(pathOf(u))) return "";
            rememberChapter(slug, i + 1, u);
        }
        return u;
    }
    return "";
}

function execute(url) {
    var path = pathOf(url);
    var g = GOTO_RE.exec(path);
    if (g) {
        var slug0 = g[1], n0 = parseInt(g[2], 10);
        var real = knownChapter(slug0, n0) || gotoChapter(slug0, n0, g[3]) || walkTo(slug0, n0);
        if (!real) return Response.error("Không tìm được link chương " + n0);
        rememberChapter(slug0, n0, real);
        url = real;
    } else {
        url = normalizeUrl(url);
    }

    var res = http(url);
    if (!res.ok) return Response.error("HTTP " + res.status);
    var doc = res.html();

    var title = doc.select("h2.current-chapter").text().trim();

    // Cache the next chapter's real URL so sequential reading/downloading needs no extra request.
    var m = CHAP_RE.exec(pathOf(url));
    var next = firstEl(doc.select("a.next"));
    if (m && next && !/disabled/.test(next.attr("class"))) {
        var nextUrl = normalizeUrl(next.attr("href"));
        if (CHAP_RE.test(pathOf(nextUrl))) rememberChapter(m[1], parseInt(m[2], 10) + 1, nextUrl);
    }

    if (doc.select("#formcode").size() > 0) {
        return Response.success(
            "<p><i>Chương này bị trang nguồn khóa (yêu cầu nhập mã xác nhận). " +
            "Hãy mở chương trong trình duyệt để mở khóa, rồi tải lại chương.</i></p>", title);
    }

    var body = firstEl(doc.select(".truyen"));
    if (!body) return Response.error("Không tìm thấy nội dung chương");
    body.select("script, style, ins, iframe, noscript, .ads").remove();

    var out = [];
    body.select("p").forEach(function (p) {
        var t = p.text().trim();
        if (t && !JUNK_RE.test(t)) out.push("<p>" + esc(t) + "</p>");
    });
    var html = out.length ? out.join("\n") : body.html();
    if (!html || !String(html).trim()) return Response.error("Nội dung chương trống");
    return Response.success(html, title);
}
