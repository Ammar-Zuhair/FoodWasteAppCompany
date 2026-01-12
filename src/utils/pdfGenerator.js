import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// تحويل الصورة إلى base64
const imageToBase64 = (imagePath) => {
  return new Promise((resolve, reject) => {
    fetch(imagePath)
      .then((response) => response.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      })
      .catch(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = reject;
        img.src = imagePath;
      });
  });
};

// إنشاء HTML للتقرير
const createReportHTML = (reportData, selectedSections, language, logoBase64) => {
  const periodText =
    language === "ar"
      ? reportData.selectedPeriod === "week"
        ? "أسبوع"
        : reportData.selectedPeriod === "month"
        ? "شهر"
        : reportData.selectedPeriod === "quarter"
        ? "ربع سنوي"
        : "سنة"
      : reportData.selectedPeriod.charAt(0).toUpperCase() + reportData.selectedPeriod.slice(1);

  let html = `
    <!DOCTYPE html>
    <html dir="${language === "ar" ? "rtl" : "ltr"}" lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${language === "ar" ? "تقرير شامل" : "Comprehensive Report"}</title>
      <style>
        @font-face {
          font-family: 'Cairo';
          font-style: normal;
          font-weight: 400;
          font-display: swap;
          src: local('Cairo'), 
               local('Cairo-Regular'),
               local('Segoe UI'),
               local('Tahoma'),
               local('Arial Unicode MS');
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Cairo', 'Segoe UI', 'Tahoma', 'Arial Unicode MS', 'Arial', sans-serif;
          padding: 5mm;
          margin: 0;
          background: #ffffff;
          color: #053F5C;
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          font-feature-settings: "liga" 1, "calt" 1;
          direction: ${language === "ar" ? "rtl" : "ltr"};
          text-align: ${language === "ar" ? "right" : "left"};
          word-spacing: normal;
          letter-spacing: normal;
          width: 200mm;
          min-height: 287mm;
          box-sizing: border-box;
        }
        .header {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-bottom: 8mm;
          padding: 8mm 5mm;
          background: linear-gradient(135deg, #053F5C 0%, #429EBD 100%);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(5, 63, 92, 0.15);
          position: relative;
          overflow: visible;
          min-height: 25mm;
        }
        .logo {
          max-width: 45mm;
          max-height: 22mm;
          object-fit: contain;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
          z-index: 1;
          margin-bottom: 4mm;
        }
        .header-text {
          text-align: center;
          z-index: 1;
          width: 100%;
          overflow: visible;
        }
        .main-title {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 3mm;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
          letter-spacing: 0;
          text-align: center;
          line-height: 1.3;
          word-spacing: normal;
          white-space: normal;
          padding: 0 3mm;
          direction: ${language === "ar" ? "rtl" : "ltr"};
        }
        .subtitle {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.95);
          font-weight: 500;
          background: rgba(255, 255, 255, 0.15);
          padding: 2mm 4mm;
          border-radius: 15px;
          display: inline-block;
          backdrop-filter: blur(10px);
          text-align: center;
          margin-top: 2mm;
        }
        .section {
          margin-bottom: 6mm;
          page-break-inside: avoid !important;
          background: #ffffff;
          padding: 5mm;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(5, 63, 92, 0.08);
          border: 1px solid rgba(66, 158, 189, 0.1);
        }
        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #053F5C;
          margin-bottom: 4mm;
          padding-bottom: 2mm;
          border-bottom: 2px solid;
          border-image: linear-gradient(90deg, #429EBD 0%, #9FE7F5 100%) 1;
          position: relative;
          display: flex;
          align-items: center;
          gap: 3mm;
          direction: ${language === "ar" ? "rtl" : "ltr"};
          text-align: ${language === "ar" ? "right" : "left"};
        }
        .section-title::before {
          content: '';
          width: 2mm;
          height: 8mm;
          background: linear-gradient(135deg, #429EBD 0%, #9FE7F5 100%);
          border-radius: 1mm;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 4mm;
          margin-bottom: 4mm;
        }
        .stat-item {
          background: linear-gradient(135deg, #F0FAFC 0%, #E8F4F8 100%);
          padding: 4mm;
          border-radius: 5px;
          border: 1.5px solid rgba(66, 158, 189, 0.2);
          box-shadow: 0 2px 6px rgba(66, 158, 189, 0.1);
        }
        .stat-label {
          font-size: 10px;
          color: #666;
          margin-bottom: 2mm;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: #053F5C;
          line-height: 1.2;
        }
        .data-list {
          list-style: none;
          padding: 0;
        }
        .data-item {
          padding: 3mm 4mm;
          margin-bottom: 2mm;
          background: linear-gradient(135deg, #F0FAFC 0%, #ffffff 100%);
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid rgba(66, 158, 189, 0.15);
          box-shadow: 0 1px 3px rgba(5, 63, 92, 0.05);
          line-height: 1.4;
        }
        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin-bottom: 4mm;
          font-size: 10px;
          border-radius: 5px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(5, 63, 92, 0.1);
          page-break-inside: avoid !important;
          direction: ${language === "ar" ? "rtl" : "ltr"};
        }
        th {
          background: linear-gradient(135deg, #429EBD 0%, #053F5C 100%);
          color: white;
          padding: 3mm 2.5mm;
          text-align: ${language === "ar" ? "right" : "left"} !important;
          font-weight: 700;
          font-size: 10px;
          border: none;
          direction: ${language === "ar" ? "rtl" : "ltr"} !important;
        }
        td {
          padding: 2.5mm;
          border-bottom: 1px solid rgba(66, 158, 189, 0.1);
          color: #053F5C;
          font-weight: 500;
          background: #ffffff;
          font-size: 9px;
          text-align: ${language === "ar" ? "right" : "left"} !important;
          direction: ${language === "ar" ? "rtl" : "ltr"} !important;
        }
        tr:nth-child(even) td {
          background: linear-gradient(135deg, #F0FAFC 0%, #ffffff 100%);
        }
        .footer {
          margin-top: 8mm;
          padding: 4mm;
          background: linear-gradient(135deg, #F0FAFC 0%, #E8F4F8 100%);
          border-radius: 5px;
          text-align: center;
          font-size: 9px;
          color: #666;
          border-top: 2px solid;
          border-image: linear-gradient(90deg, #429EBD 0%, #9FE7F5 100%) 1;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" class="logo" />` : ""}
        <div class="header-text">
          <h1 class="main-title">${language === "ar" ? "تقرير شامل لتقليل هدر الطعام" : "Comprehensive Report - Food Waste Reduction"}</h1>
          <p class="subtitle">
            ${language === "ar" ? "الفترة:" : "Period:"} ${periodText} | 
            ${language === "ar" ? "تاريخ التقرير:" : "Report Date:"} ${new Date().toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}
          </p>
        </div>
      </div>
  `;

  // الإحصائيات العامة
  if (selectedSections.summary) {
    html += `
      <div class="section">
        <h2 class="section-title">${language === "ar" ? "الإحصائيات العامة" : "General Statistics"}</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">${language === "ar" ? "إجمالي الهدر" : "Total Waste"}</div>
            <div class="stat-value">${reportData.generalStats?.totalWaste?.toLocaleString() || 0} ${language === "ar" ? "كجم" : "kg"}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">${language === "ar" ? "المرتجعات المتوقعة" : "Expected Returns"}</div>
            <div class="stat-value">${reportData.generalStats?.totalReturns?.toLocaleString() || 0}</div>
          </div>
        </div>
      </div>
    `;
  }

  html += `
      <div class="footer">
        <p>© ${new Date().getFullYear()} ${language === "ar" ? "نظام تقليل هدر الطعام" : "Food Waste Reduction System"}</p>
      </div>
    </body>
    </html>
  `;

  return html;
};

// إنشاء PDF منسق
export const generatePDFReport = async (
  reportData,
  selectedSections,
  language,
  logoPath = "/logo.png"
) => {
  let logoBase64 = null;
  try {
    const logoUrl = logoPath.startsWith("/") ? logoPath : `/${logoPath}`;
    logoBase64 = await imageToBase64(logoUrl);
  } catch (error) {
    console.warn("Could not load logo, continuing without it:", error);
  }

  const htmlContent = createReportHTML(reportData, selectedSections, language, logoBase64);

  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.width = "210mm";
  iframe.style.height = "297mm";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  return new Promise((resolve, reject) => {
    iframe.onload = async () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();
        
        iframeDoc.documentElement.setAttribute('dir', language === "ar" ? "rtl" : "ltr");
        iframeDoc.documentElement.setAttribute('lang', language);
        iframeDoc.body.style.direction = language === "ar" ? "rtl" : "ltr";
        iframeDoc.body.style.textAlign = language === "ar" ? "right" : "left";

        await new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });

        const canvas = await html2canvas(iframeDoc.body, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const pageHeight = 297;
        
        let sourceY = 0;
        let pageNumber = 0;
        
        while (sourceY < canvas.height) {
          if (pageNumber > 0) {
            pdf.addPage();
          }
          
          const pageHeightPx = (pageHeight * canvas.width) / imgWidth;
          const pageEndY = Math.min(sourceY + pageHeightPx, canvas.height);
          const pageHeightActual = pageEndY - sourceY;
          
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = pageHeightActual;
          const pageCtx = pageCanvas.getContext('2d');
          
          pageCtx.drawImage(
            canvas,
            0, sourceY, canvas.width, pageHeightActual,
            0, 0, canvas.width, pageHeightActual
          );
          
          const pageImgData = pageCanvas.toDataURL("image/png", 1.0);
          const pageImgHeightMm = (pageHeightActual * imgWidth) / canvas.width;
          
          pdf.addImage(pageImgData, "PNG", 0, 0, imgWidth, pageImgHeightMm);
          
          sourceY = pageEndY;
          pageNumber++;
          
          if (pageNumber > 100) {
            break;
          }
        }

        document.body.removeChild(iframe);

        const fileName = `report-${reportData.selectedPeriod}-${new Date().toISOString().split("T")[0]}.pdf`;
        pdf.save(fileName);
        resolve();
      } catch (error) {
        document.body.removeChild(iframe);
        reject(error);
      }
    };

    iframe.onerror = () => {
      document.body.removeChild(iframe);
      reject(new Error("Failed to load iframe"));
    };

    iframe.src = "about:blank";
  });
};











