load('config.js');

function collect(els, slug, byNum) {
    var added = 0;
    els.forEach(function (a) {
        var p = pathOf(a.attr("href"));
        var m = CHAP_RE.exec(p);
        if (!m || m[1] !== slug) return;
        var n = parseInt(m[2], 10);
        if (byNum[n]) return;
        byNum[n] = { name: a.text().trim() || ("Chương " + n), url: BASE_URL + p };
        added++;
    });
    return added;
}

function execute(url) {
    var bookUrl = bookUrlOf(url);
    var slug = slugOf(bookUrl);
    var res = http(bookUrl);
    if (!res.ok) return Response.error("HTTP " + res.status);
    var doc = res.html();

    var bid = doc.select("input[name=bid]").attr("value");
    var total = 0;
    doc.select(".book-info-text li").forEach(function (li) {
        var m = /Số chương\s*:?\s*([\d.]+)/.exec(li.text());
        if (m) total = parseInt(m[1].replace(/\./g, ""), 10);
    });

    var byNum = {};
    var firstPage = doc.select("#chapter-list a[href]");
    collect(firstPage, slug, byNum);
    collect(doc.select(".new-chap a[href], a[href]:has(.btn_truyen)"), slug, byNum);

    // /get/listchap/<bid>?page=N — the server only serves pages 1..4 and silently
    // returns page 1 for anything higher, so stop as soon as a page repeats page 1.
    if (bid) {
        var firstHref = firstPage.size() > 0 ? pathOf(firstPage.get(0).attr("href")) : "";
        var maxPages = Math.max(1, Math.ceil(total / 100));
        for (var page = 2; page <= maxPages; page++) {
            var r = http(BASE_URL + "/get/listchap/" + bid + "?page=" + page, {
                headers: { "X-Requested-With": "XMLHttpRequest", "Referer": bookUrl }
            });
            if (!r.ok) break;
            var data;
            try { data = r.json().data; } catch (e) { break; }
            if (!data) break;
            var links = Html.parse(String(data)).select("a[href]");
            if (links.size() === 0) break;
            if (firstHref && pathOf(links.get(0).attr("href")) === firstHref) break;
            if (collect(links, slug, byNum) === 0) break;
        }
    }

    var maxKnown = 0;
    for (var k in byNum) {
        var kn = parseInt(k, 10);
        if (kn > maxKnown) maxKnown = kn;
    }
    if (total < maxKnown) total = maxKnown;
    if (total === 0) return Response.error("Không tìm thấy chương nào");

    var chapters = [];
    for (var n = 1; n <= total; n++) {
        var c = byNum[n];
        if (c) {
            rememberChapter(slug, n, c.url);
            chapters.push({ name: c.name, url: c.url, host: BASE_URL });
        } else {
            chapters.push({
                name: "Chương " + n,
                url: BASE_URL + "/" + slug + "/chuong-" + n + "?vbgoto=" + (bid || "0"),
                host: BASE_URL
            });
        }
    }
    return Response.success(chapters);
}
