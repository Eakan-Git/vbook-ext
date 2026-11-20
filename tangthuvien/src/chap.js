load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    var res = http(url);
    if (!res.ok) return Response.error("HTTP " + res.status);
    var doc = res.html();

    var art = firstEl(doc.select("article"));
    if (!art) return Response.error("Không tìm thấy nội dung chương");

    var title = art.select("h1").text().trim();
    // The first inner div is the title/word-count header (has a bottom border); drop it.
    art.select("div.border-b").remove();
    art.select("script, style, ins, iframe, noscript").remove();

    var out = [];
    art.select("p").forEach(function (p) {
        var t = p.text().trim();
        if (t) out.push("<p>" + esc(t) + "</p>");
    });
    if (out.length === 0) return Response.error("Nội dung chương trống");
    return Response.success(out.join("\n"), title);
}
