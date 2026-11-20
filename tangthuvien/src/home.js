function execute() {
    function tag(t) { return "/?tag=" + encodeURIComponent(t); }
    return Response.success([
        { title: "Đề Cử", input: "/", script: "list.js" },
        { title: "Tiên Hiệp", input: tag("Tiên Hiệp"), script: "list.js" },
        { title: "Huyền Huyễn", input: tag("Huyền Huyễn"), script: "list.js" },
        { title: "Kiếm Hiệp", input: tag("Kiếm Hiệp"), script: "list.js" },
        { title: "Đô Thị", input: tag("Đô Thị"), script: "list.js" },
        { title: "Linh Dị", input: tag("Linh Dị"), script: "list.js" }
    ]);
}
