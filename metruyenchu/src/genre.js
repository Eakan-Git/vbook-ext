load('config.js');

function execute() {
    var res = http(BASE_URL + "/");
    if (!res.ok) return Response.error("HTTP " + res.status);
    var doc = res.html();
    var seen = {};
    var genres = [];
    doc.select("a[href*='/the-loai/']").forEach(function (a) {
        var p = pathOf(a.attr("href")).replace(/\/$/, "");
        var title = a.text().trim();
        if (!title || seen[p]) return;
        seen[p] = true;
        genres.push({ title: title, input: p, script: "search.js" });
    });
    return Response.success(genres);
}
