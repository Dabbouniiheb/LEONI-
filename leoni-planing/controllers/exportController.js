const ExcelJS = require("exceljs");
const db = require("../config/db");
const { logAction } = require("../utils/logger");

async function fetchExportRows(filters) {
  const { group_id, user_id, month } = filters;
  const conditions = [];
  const params = [];

  if (group_id) {
    conditions.push("u.group_id = ?");
    params.push(group_id);
  }
  if (user_id) {
    conditions.push("p.user_id = ?");
    params.push(user_id);
  }
  if (month) {
    conditions.push("p.month_key = ?");
    params.push(month);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await db.query(
    `SELECT 
       p.id, 
       u.username, 
       u.matricule, 
       CONCAT(u.first_name, ' ', u.last_name) AS name, 
       DATE_FORMAT(p.date, '%Y-%m-%d') AS date_remote, 
       p.work_hour
     FROM planning p
     JOIN users u ON u.id = p.user_id
     ${whereClause}
     ORDER BY u.first_name, u.last_name, p.date`,
    params
  );
  return rows;
}

exports.exportCsv = async (req, res) => {
  try {
    const rows = await fetchExportRows(req.query);
    const header = ["ID", "User", "Matricule", "Name", "DateRemote", "WorkHour"];
    const escapeCsv = (value) => {
      const str = value == null ? "" : String(value);
      if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
      return str;
    };

    const lines = [header.join(",")];
    rows.forEach((row) => {
      lines.push(
        [
          row.id,
          row.username,
          row.matricule,
          row.name,
          row.date_remote,
          row.work_hour,
        ]
          .map(escapeCsv)
          .join(",")
      );
    });

    const csv = `\uFEFF${lines.join("\n")}`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="leoni-planning-export.csv"'
    );
    await logAction(req.session.user.id, "EXPORT_CSV", `Exported ${rows.length} rows`);
    res.send(csv);
  } catch (err) {
    console.error("CSV Export error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.exportXlsx = async (req, res) => {
  try {
    const rows = await fetchExportRows(req.query);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Planning");
    sheet.columns = [
      { header: "ID", key: "id", width: 8 },
      { header: "User", key: "username", width: 16 },
      { header: "Matricule", key: "matricule", width: 14 },
      { header: "Name", key: "name", width: 24 },
      { header: "DateRemote", key: "date_remote", width: 16 },
      { header: "WorkHour", key: "work_hour", width: 12 },
    ];

    rows.forEach((row) => sheet.addRow(row));
    sheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="leoni-planning-export.xlsx"'
    );

    await logAction(req.session.user.id, "EXPORT_XLSX", `Exported ${rows.length} rows`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("XLSX Export error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
