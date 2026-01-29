const ExcelJS = require("exceljs");

const exportAttendanceToExcel = async (records, presetInfo, filters = {}) => {
  const workbook = new ExcelJS.Workbook();

  // Set workbook properties
  workbook.creator = "Attendance Management System";
  workbook.lastModifiedBy = "System";
  workbook.created = new Date();
  workbook.modified = new Date();

  // Create main attendance sheet
  const worksheet = workbook.addWorksheet("Attendance Records");

  // Add header information
  worksheet.mergeCells("A1:G1");
  worksheet.getCell("A1").value = `Attendance Report - ${presetInfo.course}`;
  worksheet.getCell("A1").font = { size: 16, bold: true };
  worksheet.getCell("A1").alignment = { horizontal: "center" };

  worksheet.mergeCells("A2:G2");
  worksheet.getCell("A2").value =
    `Department: ${presetInfo.department} | Batch: ${presetInfo.batch} | Section: ${presetInfo.section || "All"}`;
  worksheet.getCell("A2").font = { size: 12 };
  worksheet.getCell("A2").alignment = { horizontal: "center" };

  worksheet.mergeCells("A3:G3");
  worksheet.getCell("A3").value =
    `Generated on: ${new Date().toLocaleString()}`;
  worksheet.getCell("A3").font = { size: 10, italic: true };
  worksheet.getCell("A3").alignment = { horizontal: "center" };

  // Add empty row
  worksheet.addRow([]);

  // Define columns
  worksheet.columns = [
    { header: "Date", key: "date", width: 15 },
    { header: "Time", key: "time", width: 12 },
    { header: "Student ID", key: "studentNumber", width: 15 },
    { header: "Student Name", key: "studentName", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Section", key: "section", width: 10 },
    { header: "Status", key: "status", width: 12 },
  ];

  // Style the header row
  const headerRow = worksheet.getRow(5);
  headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "366092" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };

  // Add data rows
  records.forEach((record, index) => {
    const row = worksheet.addRow({
      date: record.attendanceDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      }),
      time: record.attendanceTime,
      studentNumber: record.studentNumber,
      studentName: record.studentName,
      email: record.studentEmail,
      section: record.section || "—",
      status: record.status,
    });

    // Alternate row colors
    if (index % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "F8F9FA" },
      };
    }

    // Color code status
    const statusCell = row.getCell("status");
    switch (record.status) {
      case "Present":
        statusCell.font = { color: { argb: "28A745" }, bold: true };
        break;
      case "Late":
        statusCell.font = { color: { argb: "FFC107" }, bold: true };
        break;
      case "Excused":
        statusCell.font = { color: { argb: "17A2B8" }, bold: true };
        break;
    }
  });

  // Add summary sheet
  const summarySheet = workbook.addWorksheet("Summary");

  // Calculate statistics
  const totalRecords = records.length;
  const presentCount = records.filter((r) => r.status === "Present").length;
  const lateCount = records.filter((r) => r.status === "Late").length;
  const excusedCount = records.filter((r) => r.status === "Excused").length;

  const uniqueStudents = [
    ...new Set(records.map((r) => r.studentId.toString())),
  ].length;
  const uniqueDates = [
    ...new Set(records.map((r) => r.attendanceDate.toDateString())),
  ].length;

  // Summary data
  summarySheet.addRow(["Attendance Summary"]);
  summarySheet.addRow([]);
  summarySheet.addRow(["Total Records:", totalRecords]);
  summarySheet.addRow(["Present:", presentCount]);
  summarySheet.addRow(["Late:", lateCount]);
  summarySheet.addRow(["Excused:", excusedCount]);
  summarySheet.addRow([]);
  summarySheet.addRow(["Unique Students:", uniqueStudents]);
  summarySheet.addRow(["Class Sessions:", uniqueDates]);
  summarySheet.addRow([]);
  summarySheet.addRow([
    "Attendance Rate:",
    `${(((presentCount + excusedCount) / totalRecords) * 100).toFixed(2)}%`,
  ]);

  // Style summary sheet
  summarySheet.getCell("A1").font = { size: 14, bold: true };
  summarySheet.columns = [{ width: 20 }, { width: 15 }];

  // Add borders to all cells with data
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 5) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }
  });

  return await workbook.xlsx.writeBuffer();
};

const exportStudentListToExcel = async (students, department, batch) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Student List");

  // Header
  worksheet.mergeCells("A1:E1");
  worksheet.getCell("A1").value = `Student List - ${department} ${batch}`;
  worksheet.getCell("A1").font = { size: 16, bold: true };
  worksheet.getCell("A1").alignment = { horizontal: "center" };

  worksheet.addRow([]);

  // Columns
  worksheet.columns = [
    { header: "Student ID", key: "studentId", width: 15 },
    { header: "Name", key: "name", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Department", key: "department", width: 20 },
    { header: "Batch", key: "batch", width: 15 },
  ];

  // Style header
  const headerRow = worksheet.getRow(3);
  headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "366092" },
  };

  // Add student data
  students.forEach((student) => {
    worksheet.addRow({
      studentId: student.studentId,
      name: student.name,
      email: student.email,
      department: student.department,
      batch: student.batch,
    });
  });

  return await workbook.xlsx.writeBuffer();
};

module.exports = {
  exportAttendanceToExcel,
  exportStudentListToExcel,
};
