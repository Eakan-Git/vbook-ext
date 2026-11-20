load('config.js');

function infoValue(doc, label) {
    var val = "";
    doc.select(".book-info-text li").forEach(function (li) {
        var b = firstEl(li.select("b"));
        if (!val && b && b.text().indexOf(label) !== -1) {
            val = li.text().replace(b.text(), "").replace(/^\s*:\s*/, "").trim();
        }
    });
    return val;
}

function execute(url) {
    var bookUrl = bookUrlOf(url);
    var res = http(bookUrl);
    if (!res.ok) return Response.error("HTTP " + res.status);
    var doc = res.html();

    var nameEl = firstEl(doc.select("h1[itemprop=name]")) || firstEl(doc.select("h1"));
    var coverEl = firstEl(doc.select(".book-info-pic img"));
    var cover = coverEl ? coverEl.attr("src") : "";
    if (cover && cover.indexOf("http") !== 0) cover = BASE_URL + cover;

    var authorEl = firstEl(doc.select("a[itemprop=author], .book-info-text a[href*='/tac-gia/']"));
    var status = doc.select(".label-status").text().trim();
    var chapters = infoValue(doc, "Số chương");

    var genres = [];
    doc.select(".li--genres a[href*='/the-loai/']").forEach(function (a) {
        genres.push({ title: a.text().trim(), input: pathOf(a.attr("href")).replace(/\/$/, ""), script: "search.js" });
    });

    var detail = [];
    if (authorEl) detail.push("Tác giả: " + authorEl.text().trim());
    if (genres.length) detail.push("Thể loại: " + genres.map(function (g) { return g.title; }).join(", "));
    if (chapters) detail.push("Số chương: " + chapters);
    if (status) detail.push("Trạng thái: " + status);

    return Response.success({
        name: nameEl ? nameEl.text().trim() : slugOf(bookUrl),
        author: authorEl ? authorEl.text().trim() : "",
        cover: cover,
        description: doc.select("#gioithieu").text().trim(),
        detail: detail.join("<br>"),
        url: bookUrl,
        host: BASE_URL,
        type: "novel",
        format: "novel",
        ongoing: !/full|hoàn/i.test(status),
        genres: genres
    });
}
