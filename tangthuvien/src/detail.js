load('config.js');

function execute(url) {
    var slug = slugOf(url);
    var bookUrl = BASE_URL + "/books/" + slug;
    var res = http(bookUrl);
    if (!res.ok) return Response.error("HTTP " + res.status);
    var doc = res.html();

    var main = firstEl(doc.select("main")) || doc;
    var nameEl = firstEl(main.select("h1"));
    var name = nameEl ? nameEl.text().trim() : slug;

    var cover = "";
    var coverImg = firstEl(doc.select("img[src*=\"/covers/\"]"));
    if (coverImg) cover = coverImg.attr("src");

    var authorEl = firstEl(doc.select("a[href*=\"author=\"]"));
    var author = authorEl ? authorEl.text().trim() : "";

    // Genres: tag links inside <main> only (the site header has its own tag nav).
    var genres = [];
    var seen = {};
    main.select("a[href*=\"tag=\"]").forEach(function (a) {
        var t = a.text().trim();
        if (t && !seen[t]) { seen[t] = true; genres.push({ title: t, input: "/?tag=" + encodeURIComponent(t), script: "list.js" }); }
    });

    // Description: the longest paragraph in main.
    var description = "";
    main.select("p").forEach(function (p) {
        var t = p.text().trim();
        if (t.length > description.length) description = t;
    });

    var bodyText = main.text();
    var ongoing = !/Hoàn thành/i.test(bodyText);
    var cm = /(\d[\d.,]*)\s*chương/i.exec(bodyText);

    var detail = [];
    if (author) detail.push("Tác giả: " + author);
    if (genres.length) detail.push("Thể loại: " + genres.map(function (g) { return g.title; }).join(", "));
    if (cm) detail.push("Số chương: " + cm[1]);
    detail.push("Trạng thái: " + (ongoing ? "Đang ra" : "Hoàn thành"));

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detail.join("<br>"),
        url: bookUrl,
        host: BASE_URL,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres
    });
}
