import { useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import { exportProjectToExcel, exportToCSV } from "../lib/exportService";

export default function ExportPage({ projectName }: { projectName?: string }) {
  const [loading, setLoading] = useState(false);

  const handleExportExcel = async () => {
    setLoading(true);
    try {
      // بيانات تجريبية
      const data: any = [
        { name: "القطعة 1", width: 100, height: 50, quantity: 2 },
        { name: "القطعة 2", width: 80, height: 60, quantity: 1 },
      ];

      // @ts-ignore
      await exportProjectToExcel(projectName || 'Project', data);
      alert("✅ تم التصدير بنجاح!");
    } catch (error) {
      console.error("خطأ:", error);
      alert("❌ حدث خطأ في التصدير");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const data = [
        { name: "القطعة 1", width: 100, height: 50, quantity: 2 },
        { name: "القطعة 2", width: 80, height: 60, quantity: 1 },
      ];

      // @ts-ignore
      exportToCSV(data, projectName);
      alert("✅ تم التصدير بنجاح!");
    } catch (error) {
      console.error("خطأ:", error);
      alert("❌ حدث خطأ في التصدير");
    }
  };

  return (
    <div className="p-6">
      {loading && <LoadingSpinner />}

      <h1 className="text-2xl font-bold mb-6">تصدير المشروع: {projectName}</h1>

      <div className="space-y-4">
        <button
          onClick={handleExportExcel}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          📥 تصدير إلى Excel
        </button>

        <button
          onClick={handleExportCSV}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          📥 تصدير إلى CSV
        </button>
      </div>
    </div>
  );
}
