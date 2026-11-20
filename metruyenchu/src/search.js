load('config.js');

// Serves both search (query = keyword) and list tabs/genres (query = "/danh-sach/..." or "/the-loai/...").
function execute(query, page) {
    query = String(query || "");
    var p = parseInt(page || "1", 10) || 1;
    var url;
    if (query.charAt(0) === "/") {
        url = BASE_URL + query + "?page=" + p;
    } else {
        url = BASE_URL + "/search?q=" + encodeURIComponent(query) + "&page=" + p;
    }
    var res = http(url);
    if (!res.ok) return Response.error("HTTP " + res.status);
    var doc = res.html();
    var items = parseBookList(doc);
    var next = items.length > 0 && hasPage(doc, p + 1) ? String(p + 1) : "";
    return Response.success(items, next);
}
