load('config.js');

// One API call returns every chapter: { chapters: [{ chapterNumber, title }] }.
// chapterNumber maps directly to /books/<slug>/chapters/<chapterNumber>.
function execute(url) {
    var slug = slugOf(url);
    var j = getJson(BASE_URL + "/api/novels/" + slug + "/chapters");
    if (!j || !j.chapters) return Response.error("Không tải được mục lục");
    var base = BASE_URL + "/books/" + slug + "/chapters/";
    var chapters = j.chapters.map(function (c) {
        return { name: c.title || ("Chương " + c.chapterNumber), url: base + c.chapterNumber, host: BASE_URL };
    });
    if (chapters.length === 0) return Response.error("Mục lục trống");
    return Response.success(chapters);
}
