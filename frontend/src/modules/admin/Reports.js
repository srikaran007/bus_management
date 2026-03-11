import React from "react";

const reportData = {
  "Bus Usage Report": [
    {
      busNumber: "TN-45-BM-101",
      route: "North Loop",
      tripsToday: 6,
      usagePercent: "87%"
    },
    {
      busNumber: "TN-45-BM-114",
      route: "City Connector",
      tripsToday: 5,
      usagePercent: "78%"
    }
  ],
  "Student Allocation Report": [
    {
      studentName: "Riya Sharma",
      registerNumber: "22CS1042",
      route: "North Loop",
      busNumber: "TN-45-BM-101",
      boardingPoint: "Library Stop"
    },
    {
      studentName: "Arjun Nair",
      registerNumber: "21ME0871",
      route: "City Connector",
      busNumber: "TN-45-BM-114",
      boardingPoint: "Railway Station"
    }
  ],
  "Driver Activity Report": [
    {
      driverName: "Arun Kumar",
      licenseNumber: "DL-2022-45888",
      assignedBus: "TN-45-BM-101",
      status: "On Duty"
    },
    {
      driverName: "Meena R",
      licenseNumber: "DL-2021-99211",
      assignedBus: "TN-45-BM-114",
      status: "Completed Shift"
    }
  ],
  "Daily Entry/Exit Logs": [
    {
      busNumber: "TN-45-BM-101",
      route: "North Loop",
      entryTime: "08:10 AM",
      exitTime: "04:50 PM",
      status: "Left Campus"
    },
    {
      busNumber: "TN-45-BM-125",
      route: "South Shuttle",
      entryTime: "08:35 AM",
      exitTime: "--",
      status: "Inside Campus"
    }
  ]
};

const reports = [
  {
    name: "Bus Usage Report",
    description: "Trips completed and utilization per bus."
  },
  {
    name: "Student Allocation Report",
    description: "Student-to-bus mapping by route and boarding point."
  },
  {
    name: "Driver Activity Report",
    description: "Driver assignment and current activity status."
  },
  {
    name: "Daily Entry/Exit Logs",
    description: "Daily campus movement logs for each bus."
  }
];

const toTitleCase = (value) =>
  value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();

const makeCsv = (rows) => {
  if (!rows.length) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const headerRow = headers.map(toTitleCase).join(",");
  const dataRows = rows.map((row) =>
    headers
      .map((header) => {
        const safeValue = String(row[header] ?? "").replace(/"/g, '""');
        return `"${safeValue}"`;
      })
      .join(",")
  );

  return [headerRow, ...dataRows].join("\n");
};

const triggerDownload = (content, fileName, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(downloadUrl);
};

function Reports() {
  const handleExportExcel = (reportName) => {
    const rows = reportData[reportName] || [];
    const csv = makeCsv(rows);
    const fileName = `${reportName.replaceAll(" ", "_").toLowerCase()}.csv`;
    triggerDownload(csv, fileName, "text/csv;charset=utf-8;");
  };

  const handleExportPdf = (reportName) => {
    const rows = reportData[reportName] || [];
    const headers = rows.length ? Object.keys(rows[0]) : [];

    const tableHeaderHtml = headers.map((header) => `<th>${toTitleCase(header)}</th>`).join("");
    const tableRowsHtml = rows
      .map(
        (row) =>
          `<tr>${headers.map((header) => `<td>${row[header] ?? ""}</td>`).join("")}</tr>`
      )
      .join("");

    const printWindow = window.open("", "_blank", "width=900,height=650");
    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${reportName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { margin: 0 0 12px; }
            p { margin: 0 0 16px; color: #475569; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background: #f1f5f9; }
          </style>
        </head>
        <body>
          <h1>${reportName}</h1>
          <p>Generated from Admin Reports module.</p>
          <table>
            <thead><tr>${tableHeaderHtml}</tr></thead>
            <tbody>${tableRowsHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Reports</h1>
        <p>Download operational reports in PDF or Excel format.</p>
      </section>

      <section className="content-grid">
        {reports.map((report) => (
          <article className="panel" key={report.name}>
            <header className="panel-header">
              <h3>{report.name}</h3>
              <span>{report.description}</span>
            </header>
            <div className="bus-form-actions report-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleExportPdf(report.name)}
              >
                Export PDF
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleExportExcel(report.name)}
              >
                Export Excel
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default Reports;
