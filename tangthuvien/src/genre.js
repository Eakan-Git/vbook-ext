load('config.js');

var GENRES = ["Tiên Hiệp", "Huyền Huyễn", "Kiếm Hiệp", "Tu Chân", "Đô Thị", "Linh Dị",
    "Kinh Dị", "Huyền Bí", "Xuyên Không", "Trọng Sinh", "Hệ Thống", "Lịch Sử",
    "Trinh Thám", "Thần Thoại", "Dị Năng", "Hài Hước"];

function execute() {
    return Response.success(GENRES.map(function (g) {
        return { title: g, input: "/?tag=" + encodeURIComponent(g), script: "list.js" };
    }));
}
