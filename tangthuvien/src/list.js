load('config.js');

// Browses a server-rendered tag/home page. `query` is a path like "/?tag=..." or "/".
// Pages of 20; follow pagination with &page=N.
function execute(query, page) {
    query = String(query || "/");
    var p = parseInt(page || "1", 10) || 1;
    var sep = query.indexOf("?") >= 0 ? "&" : "?";
    var url = BASE_URL + query + sep + "page=" + p;
    var res = http(url);
    if (!res.ok) return Response.error("HTTP " + res.status);
    var items = parseCards(res.html());
    // 20 per page on this site; fewer means the last page.
    var next = items.length >= 20 ? String(p + 1) : "";
    return Response.success(items, next);
}
