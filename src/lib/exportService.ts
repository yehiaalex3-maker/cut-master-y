import ExcelJS from 'exceljs';
import Papa from 'papaparse';

export const exportProjectToExcel = async (projectName: string, data: any[]) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Cut List');

  // Add header
  sheet.columns = [
    { header: 'الاسم', key: 'name', width: 20 },
    { header: 'العرض (سم)', key: 'width', width: 15 },
    { header: 'الطول (سم)', key: 'height', width: 15 },
    { header: 'الكمية', key: 'quantity', width: 10 }
  ];

  // Add data rows
  data.forEach((item) => {
    sheet.addRow({
      name: item.name,
      width: item.width,
      height: item.height,
      quantity: item.quantity
    });
  });

  // Export
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName || 'export'}.xlsx`;
  a.click();
  
  window.URL.revokeObjectURL(url);
};

export const exportToCSV = (data: any[], projectName: string) => {
  const csv = Papa.unparse(data);
  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8' }); // BOM for Arabic support
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName || 'export'}.csv`;
  a.click();
  
  window.URL.revokeObjectURL(url);
};
