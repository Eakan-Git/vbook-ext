load('config.js');

// The search API returns up to ~50 matches in one call, so there is no paging.
function execute(query, page) {
    query = String(query || "");
    if (page) return Response.success([], "");
    var j = getJson(BASE_URL + "/api/novels?search=" + encodeURIComponent(query));
    if (!j || !j.novels) return Response.error("Không tải được kết quả tìm kiếm");
    return Response.success(j.novels.map(novelToItem), "");
}
