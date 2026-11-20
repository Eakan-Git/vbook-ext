function execute() {
    return Response.success([
        { title: "Truyện Hot", input: "/danh-sach/truyen-hot", script: "search.js" },
        { title: "Truyện Full", input: "/danh-sach/truyen-full", script: "search.js" },
        { title: "Tiên Hiệp", input: "/danh-sach/truyen-tien-hiep-hay", script: "search.js" },
        { title: "Kiếm Hiệp", input: "/danh-sach/truyen-kiem-hiep-hay", script: "search.js" },
        { title: "Ngôn Tình", input: "/danh-sach/truyen-ngon-tinh-hay", script: "search.js" }
    ]);
}
