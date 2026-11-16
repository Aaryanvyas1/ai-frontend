// Tiny, safe renderer for the bot's replies. Escapes all HTML first, then
// supports paragraphs, bullet and numbered lists, bold, inline code and tables.
(function () {
  function esc(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function inline(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    return s;
  }

  const TABLE_ROW = /^\s*\|.*\|\s*$/;
  const BULLET = /^\s*[-*•]\s+/;
  const NUMBER = /^\s*\d+[.)]\s+/;
  const HEADING = /^\s*#{1,6}\s+/;

  function cells(row) {
    return row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  }

  function isSeparator(row) {
    const c = cells(row);
    return c.length > 0 && c.every((x) => /^:?-{2,}:?$/.test(x));
  }

  function table(rows) {
    let head = null;
    let body = rows;
    if (rows.length > 1 && isSeparator(rows[1])) {
      head = cells(rows[0]);
      body = rows.slice(2);
    } else {
      body = rows.filter((r) => !isSeparator(r));
    }
    let h = '<div class="tbl"><table>';
    if (head) h += "<thead><tr>" + head.map((c) => "<th>" + inline(c) + "</th>").join("") + "</tr></thead>";
    h += "<tbody>" + body.map((r) => "<tr>" + cells(r).map((c) => "<td>" + inline(c) + "</td>").join("") + "</tr>").join("") + "</tbody>";
    return h + "</table></div>";
  }

  function render(md) {
    const lines = String(md || "").replace(/\r/g, "").split("\n");
    let html = "";
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }

      if (TABLE_ROW.test(line)) {
        const rows = [];
        while (i < lines.length && TABLE_ROW.test(lines[i])) rows.push(lines[i++]);
        html += table(rows);
        continue;
      }
      if (BULLET.test(line)) {
        const items = [];
        while (i < lines.length && BULLET.test(lines[i])) items.push(lines[i++].replace(BULLET, ""));
        html += "<ul>" + items.map((t) => "<li>" + inline(t) + "</li>").join("") + "</ul>";
        continue;
      }
      if (NUMBER.test(line)) {
        const items = [];
        while (i < lines.length && NUMBER.test(lines[i])) items.push(lines[i++].replace(NUMBER, ""));
        html += "<ol>" + items.map((t) => "<li>" + inline(t) + "</li>").join("") + "</ol>";
        continue;
      }
      if (HEADING.test(line)) {
        html += "<p><strong>" + inline(line.replace(HEADING, "")) + "</strong></p>";
        i++;
        continue;
      }
      const para = [];
      while (
        i < lines.length && lines[i].trim() &&
        !TABLE_ROW.test(lines[i]) && !BULLET.test(lines[i]) && !NUMBER.test(lines[i]) && !HEADING.test(lines[i])
      ) para.push(lines[i++]);
      html += "<p>" + para.map(inline).join("<br>") + "</p>";
    }
    return html;
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { render };
  else window.renderMarkdown = render;
})();
