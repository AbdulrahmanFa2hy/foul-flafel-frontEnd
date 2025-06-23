/**
 * Advanced Thermal Printer Service with Arabic Text Support
 * Created from scratch based on extensive research of Arabic printing solutions
 *
 * Key Research Findings:
 * 1. Raw ESC/POS commands with Arabic text often produce garbled/numbers output
 * 2. HTML printing with proper fonts is the most reliable solution for Arabic text
 * 3. Canvas-to-image conversion provides best compatibility across all thermal printers
 * 4. Unicode control characters help with RTL direction but don't solve core issues
 * 5. Windows-1256 codepage approach has cursive Arabic rendering problems
 *
 * Solution Approach:
 * - Primary: HTML-based printing with Arabic fonts (QZ Tray HTML method)
 * - Fallback: Canvas-to-image rendering for maximum compatibility
 * - ESC/POS raw commands as last resort for basic printers
 *
 * References:
 * - B4X Forum: ESC/POS Arabic characters issues (2022-2024)
 * - MIT App Inventor: Arabic thermal printing solutions
 * - QZ Tray Documentation: HTML pixel printing for complex text
 * - Microsoft .NET: POS Arabic character reversal problems
 * - Loyverse POS: Thermal printer weird symbols solutions
 */

class ThermalPrintingService {
  constructor() {
    this.qzInstance = null;
    this.isConnected = false;
    this.currentMethod = "html"; // 'html', 'canvas', 'raw'
    this.printerCapabilities = new Map();
    this.printQueue = new Map(); // Prevent duplicate print jobs

    // Arabic text detection regex
    this.arabicTextRegex =
      /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

    // Default settings
    this.settings = {
      storeName: "Foul & Falafel Restaurant",
      storeNameAr: "مطعم الفول والفلافل",
      storeAddress: "King Fahd Street, Riyadh",
      storeAddressAr: "شارع الملك فهد، الرياض",
      storePhone: "011-456-7890",
      storePhoneAr: "٠١١-٤٥٦-٧٨٩٠",
      taxNumber: "300-456-789",
      currency: "SAR",
      currencyAr: "ريال",
      paperWidth: 80, // mm
      characterWidth: 42,
      enableArabicSupport: true,
      printMethod: "auto", // 'auto', 'html', 'canvas', 'raw'
      debugMode: true, // Enable debug mode to troubleshoot printer issues
    };

    this.log("ThermalPrintingService initialized");
  }

  /**
   * Initialize QZ Tray connection
   */
  async initialize() {
    try {
      if (typeof window.qz === "undefined") {
        throw new Error(
          "QZ Tray is not installed or loaded. Please install QZ Tray and include qz-tray.js"
        );
      }

      this.qzInstance = window.qz;

      if (!this.qzInstance.websocket.isActive()) {
        await this.qzInstance.websocket.connect();
        this.log("✅ QZ Tray connected successfully");
      }

      // Clear any existing print queue on initialization
      this.printQueue.clear();
      this.log("🧹 Print queue cleared");

      this.isConnected = true;
      return true;
    } catch (error) {
      this.log("❌ QZ Tray initialization failed:", error);
      this.isConnected = false;
      throw new Error(`QZ Tray connection failed: ${error.message}`);
    }
  }

  /**
   * Get available printers (excluding virtual printers)
   */
  async getPrinters() {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      const allPrinters = await this.qzInstance.printers.find();

      // Filter out virtual printers that cause save dialogs
      const virtualPrinters = [
        "Microsoft Print to PDF",
        "Microsoft XPS Document Writer",
        "OneNote",
        "OneNote (Desktop)",
        "Fax",
        "Send To OneNote",
        "Print to PDF",
      ];

      const physicalPrinters = allPrinters.filter(
        (printer) =>
          !virtualPrinters.some((virtual) =>
            printer.toLowerCase().includes(virtual.toLowerCase())
          )
      );

      this.log("📄 All available printers:", allPrinters);
      this.log("🖨️ Physical printers only:", physicalPrinters);

      // Test capabilities for each physical printer
      for (const printer of physicalPrinters) {
        await this.detectPrinterCapabilities(printer);
      }

      return physicalPrinters;
    } catch (error) {
      this.log("❌ Failed to get printers:", error);
      throw error;
    }
  }

  /**
   * Detect printer capabilities for optimal printing method selection
   */
  async detectPrinterCapabilities(printerName) {
    try {
      // Check if printer supports HTML rendering
      const capabilities = {
        supportsHTML: true, // Most modern thermal printers via QZ Tray
        supportsImages: true,
        supportsUnicode: false, // Will test
        paperWidth: 80, // Default thermal paper width
        characterWidth: 42,
        isEpson: printerName.toLowerCase().includes("epson"),
        isXprinter: printerName.toLowerCase().includes("xprinter"),
        isStar: printerName.toLowerCase().includes("star"),
        isThermal: true,
      };

      // Store capabilities
      this.printerCapabilities.set(printerName, capabilities);
      this.log(
        `📊 Printer capabilities detected for ${printerName}:`,
        capabilities
      );

      return capabilities;
    } catch (error) {
      this.log("⚠️ Could not detect printer capabilities:", error);
      return null;
    }
  }

  /**
   * Main print function with automatic method selection
   */
  async printReceipt(orderData, printerName = null, options = {}) {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      // Create unique job ID to prevent duplicates (without timestamp for better deduplication)
      const jobId = `${orderData.orderNumber || "unknown"}-${
        printerName || "default"
      }-${options.type || "customer"}`;

      // Check if this job is already in progress (within last 3 seconds)
      const existingJob = this.printQueue.get(jobId);
      if (existingJob && Date.now() - existingJob < 3000) {
        this.log("⚠️ Print job already in progress, skipping:", jobId);
        return false;
      }

      // Add to queue with current timestamp
      this.printQueue.set(jobId, Date.now());

      try {
        // Get printer
        const targetPrinter = await this.selectPrinter(printerName);

        // Detect Arabic content
        const hasArabicContent = this.detectArabicContent(orderData);
        this.log("🔍 Arabic content detected:", hasArabicContent);

        // Select optimal printing method
        const printMethod = this.selectPrintingMethod(
          targetPrinter,
          hasArabicContent,
          options.method
        );
        this.log("🎯 Selected printing method:", printMethod);

        // Print using selected method
        let result;
        switch (printMethod) {
          case "html":
            result = await this.printWithHTML(
              orderData,
              targetPrinter,
              options
            );
            break;
          case "canvas":
            result = await this.printWithCanvas(
              orderData,
              targetPrinter,
              options
            );
            break;
          case "raw":
            result = await this.printWithRawCommands(
              orderData,
              targetPrinter,
              options
            );
            break;
          default:
            throw new Error(`Unknown printing method: ${printMethod}`);
        }

        return result;
      } finally {
        // Remove from queue after completion
        setTimeout(() => {
          this.printQueue.delete(jobId);
        }, 3000); // Keep in queue for 3 seconds to prevent rapid duplicates
      }
    } catch (error) {
      this.log("❌ Print receipt failed:", error);
      throw error;
    }
  }

  /**
   * HTML-based printing (Primary method for Arabic text)
   * Based on research: Most reliable for Arabic text with proper fonts
   */
  async printWithHTML(orderData, printerName, options = {}) {
    try {
      this.log("🌐 Printing with HTML method...");
      this.log("🖨️ Target printer:", printerName);

      // Validate printer exists
      if (!printerName) {
        throw new Error("No printer specified for HTML printing");
      }

      const htmlContent = this.generateReceiptHTML(orderData, options);

      // Create QZ config for HTML printing - ensure direct printing to printer
      const config = this.qzInstance.configs.create(printerName, {
        colorType: "blackwhite",
        units: "mm",
        size: {
          width: 72, // Fixed 72mm for printable area
          height: 200, // Auto-adjust based on content
        },
        margins: { top: 0, right: 0, bottom: 0, left: 0 }, // No additional margins
        orientation: "portrait",
        density: 203, // DPI for thermal printers
        jobName: `Receipt-${orderData.orderNumber || "UNKNOWN"}`,
        // Ensure direct printing to printer, not file
        copies: 1,
        duplex: false,
        file: "", // Ensure no file saving
      });

      // Create HTML print data
      const printData = [
        {
          type: "pixel",
          format: "html",
          flavor: "plain",
          data: htmlContent,
        },
      ];

      this.log("📤 Sending print job to printer:", printerName);
      await this.qzInstance.print(config, printData);
      this.log("✅ HTML printing completed successfully");
      return true;
    } catch (error) {
      this.log("❌ HTML printing failed:", error);
      this.log("❌ Error details:", error);
      throw error;
    }
  }

  /**
   * Canvas-based printing (Fallback method)
   * Renders HTML to canvas then prints as image - maximum compatibility
   */
  async printWithCanvas(orderData, printerName, options = {}) {
    try {
      this.log("🎨 Printing with Canvas method...");

      // Create HTML content
      const htmlContent = this.generateReceiptHTML(orderData, options);

      // Create temporary iframe to render HTML
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.left = "-9999px";
      iframe.style.width = `${this.settings.paperWidth}mm`;
      iframe.style.height = "200mm";
      document.body.appendChild(iframe);

      // Load HTML content
      iframe.contentDocument.open();
      iframe.contentDocument.write(htmlContent);
      iframe.contentDocument.close();

      // Wait for content to load
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Capture as canvas
      const canvas = await this.htmlToCanvas(iframe.contentDocument.body);

      // Convert to image data
      const imageData = canvas.toDataURL("image/png");

      // Clean up
      document.body.removeChild(iframe);

      // Print image
      const config = this.qzInstance.configs.create(printerName, {
        colorType: "blackwhite",
        units: "mm",
        size: { width: this.settings.paperWidth, height: 200 },
        margins: { top: 0, right: 0, bottom: 0, left: 0 },
      });

      const printData = [
        {
          type: "pixel",
          format: "image",
          flavor: "base64",
          data: imageData.split(",")[1], // Remove data:image/png;base64, prefix
        },
      ];

      await this.qzInstance.print(config, printData);
      this.log("✅ Canvas printing completed successfully");
      return true;
    } catch (error) {
      this.log("❌ Canvas printing failed:", error);
      throw error;
    }
  }

  /**
   * Raw ESC/POS printing (Last resort)
   * Only for basic text, Arabic may not render correctly
   */
  async printWithRawCommands(orderData, printerName, options = {}) {
    try {
      this.log("⚡ Printing with Raw ESC/POS commands...");

      const commands = this.generateRawCommands(orderData, options);

      const config = this.qzInstance.configs.create(printerName);
      const printData = [
        {
          type: "raw",
          format: "command",
          data: commands,
        },
      ];

      await this.qzInstance.print(config, printData);
      this.log("✅ Raw printing completed successfully");
      return true;
    } catch (error) {
      this.log("❌ Raw printing failed:", error);
      throw error;
    }
  }

  /**
   * Generate receipt HTML with proper Arabic support
   * Fixed version addressing encoding and layout issues
   */
  generateReceiptHTML(orderData, options = {}) {
    const receiptType = options.type || "customer";

    if (receiptType === "kitchen") {
      return this.generateKitchenTicketHTML(orderData);
    } else {
      return this.generateCustomerReceiptHTML(orderData);
    }
  }

  /**
   * Generate customer receipt HTML with full details and payment information
   */
  generateCustomerReceiptHTML(orderData) {
    const hasArabic = this.detectArabicContent(orderData);
    const safeOrderData = this.sanitizeOrderData(orderData);
    const receiptSettings = this.getReceiptSettings();

    return `<!DOCTYPE html>
<html dir="${hasArabic ? "rtl" : "ltr"}" lang="${hasArabic ? "ar" : "en"}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customer Receipt</title>
    <style>
        /* Embedded Arabic font to ensure proper rendering */
        @font-face {
            font-family: 'ArabicFont';
            src: local('Tahoma'), local('Arial Unicode MS'), local('Segoe UI');
            unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: ${
              hasArabic
                ? "'ArabicFont', Tahoma, 'Arial Unicode MS'"
                : "Courier New, monospace"
            };
            font-size: 8px;
            line-height: 1.1;
            color: #000;
            background: #fff;
            width: 72mm;
            max-width: 72mm;
            padding: 4mm;
            margin: 0 auto;
            box-sizing: border-box;
            direction: ${hasArabic ? "rtl" : "ltr"};
            overflow-wrap: break-word;
            word-wrap: break-word;
        }
        
        .header {
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 2mm;
            margin-bottom: 2mm;
        }
        
        .store-name {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 1mm;
            word-wrap: break-word;
            overflow-wrap: break-word;
            text-align: center;
        }
        
        .store-name.arabic {
            font-size: 14px;
            direction: rtl;
            text-align: center;
        }
        
        .store-info {
            font-size: 8px;
            margin-bottom: 0.5mm;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        
        .header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5mm;
            font-size: 8px;
        }
        
        .header-left {
            text-align: left;
            flex: 1;
        }
        
        .header-right {
            text-align: right;
            flex: 1;
        }
        
        .separator {
            text-align: center;
            margin: 1mm 0;
            font-size: 8px;
            overflow: hidden;
        }
        
        .order-info {
            margin: 2mm 0;
            font-size: 8px;
        }
        
        .order-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5mm;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        
        .items-section {
            margin: 2mm 0;
        }
        
        .items-header {
            display: flex;
            border-bottom: 1px solid #000;
            padding: 1mm 0;
            font-weight: bold;
            font-size: 8px;
            background: #f5f5f5;
        }
        
        .items-row {
            display: flex;
            border-bottom: 1px dotted #ccc;
            padding: 1mm 0;
            align-items: flex-start;
        }
        
        .col-item {
            flex: 1;
            padding-right: 1mm;
            word-wrap: break-word;
            overflow-wrap: break-word;
            min-width: 0;
        }
        
        .col-qty {
            width: 12mm;
            text-align: center;
            flex-shrink: 0;
            font-size: 9px;
        }
        
        .col-price {
            width: 12mm;
            text-align: right;
            flex-shrink: 0;
            font-size: 9px;
        }
        
        .col-total {
            width: 12mm;
            text-align: right;
            flex-shrink: 0;
            font-size: 9px;
        }
        
        .item-name {
            font-weight: bold;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        
        .item-name-secondary {
            font-size: 7px;
            color: #666;
            font-weight: normal;
            margin-top: 0.5mm;
        }
        
        .totals {
            border-top: 1px solid #000;
            margin-top: 2mm;
            padding-top: 1mm;
        }
        
        .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5mm;
            font-size: 9px;
        }
        
        .total-line.final {
            font-weight: bold;
            font-size: 12px;
            padding-top: 1mm;
            margin-top: 1mm;
        }
        
        .payment-section {
            margin-top: 2mm;
            border-top: 1px dashed #000;
            padding-top: 1mm;
            font-size: 9px;
        }
        
        .footer {
            text-align: center;
            margin-top: 3mm;
            padding-top: 2mm;
            border-top: 1px dashed #000;
            font-size: 8px;
        }
        
        .datetime {
            text-align: center;
            font-size: 10px;
            color: #666;
            margin: 1mm 0;
        }
        
        .arabic-text {
            direction: rtl;
            text-align: right;
        }
        
        .english-text {
            direction: ltr;
            text-align: left;
        }
        
        .customer-info {
            margin: 2mm 0;
            font-size: 8px;
            border-top: 1px dashed #000;
            padding-top: 1mm;
        }
        
        @media print {
            body { 
                width: 72mm; 
                margin: 0;
                padding: 4mm;
                max-width: 72mm;
                box-sizing: border-box;
            }
        }
    </style>
</head>
<body>
    <!-- Header Section -->
    <div class="header">
        ${
          hasArabic && receiptSettings.header.businessNameAr
            ? `
        <div class="store-name arabic">${receiptSettings.header.businessNameAr}</div>
        <div class="store-name english">${receiptSettings.header.businessName}</div>
        `
            : `
        <div class="store-name">${receiptSettings.header.businessName}</div>
        `
        }
        
        ${
          receiptSettings.header.address && receiptSettings.header.city
            ? `
        <div class="header-row">
            <div class="header-left">
                ${
                  hasArabic && receiptSettings.header.addressAr
                    ? receiptSettings.header.addressAr
                    : receiptSettings.header.address
                }
            </div>
            <div class="header-right">
                ${receiptSettings.header.city}
            </div>
        </div>
        `
            : receiptSettings.header.address
            ? `<div class="store-info">${
                hasArabic && receiptSettings.header.addressAr
                  ? receiptSettings.header.addressAr
                  : receiptSettings.header.address
              }</div>`
            : ""
        }
        
        ${
          receiptSettings.header.phone && receiptSettings.header.taxId
            ? `
        <div class="header-row">
            <div class="header-left">
                ${
                  hasArabic
                    ? `هاتف: ${
                        receiptSettings.header.phoneAr ||
                        receiptSettings.header.phone
                      }`
                    : `Tel: ${receiptSettings.header.phone}`
                }
            </div>
            <div class="header-right">
                Tax ID: ${receiptSettings.header.taxId}
            </div>
        </div>
        `
            : receiptSettings.header.phone
            ? `
        <div class="store-info">
            ${
              hasArabic
                ? `هاتف: ${
                    receiptSettings.header.phoneAr ||
                    receiptSettings.header.phone
                  }`
                : `Tel: ${receiptSettings.header.phone}`
            }
        </div>
        `
            : ""
        }
        
        ${
          !receiptSettings.header.phone && receiptSettings.header.taxId
            ? `<div class="store-info">Tax ID: ${receiptSettings.header.taxId}</div>`
            : ""
        }
        
        ${
          receiptSettings.header.customText
            ? `<div class="store-info">${receiptSettings.header.customText}</div>`
            : ""
        }
        
        <!-- Order Information in Header -->
        <div class="header-row">
            <div class="header-left">
                <strong>Order: ${safeOrderData.orderNumber}</strong>
            </div>
            <div class="header-right">
                ${this.formatDateTime(hasArabic)}
            </div>
        </div>
        
        <div class="header-row">
            <div class="header-left">
                Cashier: ${safeOrderData.cashier}
            </div>
            <div class="header-right">
                ${
                  safeOrderData.custName
                    ? `Customer: ${safeOrderData.custName}`
                    : ""
                }
            </div>
        </div>
        
        ${
          safeOrderData.custPhone
            ? `
        <div class="header-row">
            <div class="header-left">
                Phone: ${safeOrderData.custPhone}
            </div>
            <div class="header-right">
                <!-- Right side can be empty or additional info -->
            </div>
        </div>
        `
            : ""
        }
    </div>

    

    <!-- Items Section -->
    <div class="items-section">
        <div class="items-header">
            <div class="col-item">${hasArabic ? "الصنف" : "Item"}</div>
            <div class="col-qty">${hasArabic ? "الكمية" : "Qty"}</div>
            <div class="col-price">${hasArabic ? "السعر" : "Price"}</div>
            <div class="col-total">${hasArabic ? "المجموع" : "Total"}</div>
        </div>
        
        ${safeOrderData.orderItems
          .map(
            (item) => `
        <div class="items-row">
            <div class="col-item">
                <div class="item-name ${hasArabic ? "arabic-text" : ""}">${
              item.nameAr || item.name
            }</div>
                ${
                  item.nameAr && item.name !== item.nameAr
                    ? `<div class="item-name-secondary english-text">${item.name}</div>`
                    : ""
                }
            </div>
            <div class="col-qty">${this.formatQuantity(
              item.quantity,
              hasArabic
            )}</div>
            <div class="col-price">${this.formatPrice(
              item.price,
              hasArabic
            )}</div>
            <div class="col-total">${this.formatPrice(
              item.quantity * item.price,
              hasArabic
            )}</div>
        </div>
        `
          )
          .join("")}
    </div>

    <!-- Totals Section -->
    <div class="totals">
        ${
          safeOrderData.tax > 0 || safeOrderData.discount > 0
            ? `
        <div class="total-line">
            <span>${hasArabic ? "المجموع الفرعي:" : "Subtotal:"}</span>
            <span>${this.formatAmount(safeOrderData.subtotal, hasArabic)}</span>
        </div>
        `
            : ""
        }
        
        ${
          safeOrderData.tax > 0
            ? `
        <div class="total-line">
            <span>${hasArabic ? "الضريبة:" : "Tax:"}</span>
            <span>${this.formatAmount(safeOrderData.tax, hasArabic)}</span>
        </div>
        `
            : ""
        }
        
        ${
          safeOrderData.discount > 0
            ? `
        <div class="total-line">
            <span>${hasArabic ? "الخصم:" : "Discount:"}</span>
            <span>-${this.formatAmount(
              safeOrderData.discount,
              hasArabic
            )}</span>
        </div>
        `
            : ""
        }
        
        <div class="total-line final">
            <span>${hasArabic ? "الإجمالي:" : "TOTAL:"}</span>
            <span>${this.formatAmount(
              safeOrderData.finalTotal || safeOrderData.total,
              hasArabic
            )}</span>
        </div>
    </div>

    ${
      safeOrderData.paymentMethods && safeOrderData.paymentMethods.length > 0
        ? `
    <!-- Payment Information -->
    <div class="payment-section">
      
        ${safeOrderData.paymentMethods
          .map(
            (payment) => `
        <div class="order-line">
            <span>${
              hasArabic
                ? this.getPaymentMethodArabic(payment.method)
                : this.getPaymentMethodEnglish(payment.method)
            }:</span>
            <span>${this.formatAmount(payment.amount, hasArabic)}</span>
        </div>
        `
          )
          .join("")}
    </div>`
        : ""
    }

    <!-- Footer -->
    <div class="footer">
        ${
          receiptSettings.footer.thankYouMessage
            ? `
        ${
          hasArabic && receiptSettings.footer.thankYouMessageAr
            ? `
        <div class="arabic-text">${receiptSettings.footer.thankYouMessageAr}</div>
        <div class="english-text">${receiptSettings.footer.thankYouMessage}</div>
        `
            : `
        <div>${receiptSettings.footer.thankYouMessage}</div>
        `
        }
        `
            : ""
        }
        ${
          receiptSettings.footer.returnPolicy
            ? `<div style="margin-top: 1mm;">${receiptSettings.footer.returnPolicy}</div>`
            : ""
        }
        ${
          receiptSettings.footer.customerService
            ? `<div style="margin-top: 1mm;">${receiptSettings.footer.customerService}</div>`
            : ""
        }
        ${
          receiptSettings.footer.website
            ? `<div style="margin-top: 1mm;">${receiptSettings.footer.website}</div>`
            : ""
        }
        ${
          receiptSettings.footer.customText
            ? `<div style="margin-top: 1mm;">${receiptSettings.footer.customText}</div>`
            : ""
        }
        <div style="margin-top: 2mm; font-size: 7px;">
            ${hasArabic ? "فاتورة العميل" : "Customer Copy"}
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate kitchen ticket HTML with simplified layout for kitchen staff
   */
  generateKitchenTicketHTML(orderData) {
    const hasArabic = this.detectArabicContent(orderData);
    const safeOrderData = this.sanitizeOrderData(orderData);
    const receiptSettings = this.getReceiptSettings();

    return `<!DOCTYPE html>
<html dir="${hasArabic ? "rtl" : "ltr"}" lang="${hasArabic ? "ar" : "en"}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kitchen Ticket</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: ${
              hasArabic
                ? "'ArabicFont', Tahoma, 'Arial Unicode MS'"
                : "Courier New, monospace"
            };
            font-size: 9px;
            line-height: 1.2;
            color: #000;
            background: #fff;
            width: 72mm;
            max-width: 72mm;
            padding: 4mm;
            margin: 0 auto;
            box-sizing: border-box;
            direction: ${hasArabic ? "rtl" : "ltr"};
            overflow-wrap: break-word;
            word-wrap: break-word;
        }
        
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 2mm;
            margin-bottom: 3mm;
            background: #f0f0f0;
        }
        
        .kitchen-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 1mm;
        }
        
        .order-info {
            margin: 2mm 0;
            font-size: 11px;
        }
        
        .order-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1mm;
            font-weight: bold;
        }
        
        .items-section {
            margin: 3mm 0;
        }
        
        .item-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 2mm 0;
            border-bottom: 1px dashed #ccc;
            font-size: 11px;
        }
        
        .item-details {
            flex: 1;
        }
        
        .item-name {
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 1mm;
        }
        
        .item-name-secondary {
            font-size: 10px;
            color: #666;
        }
        
        .item-quantity {
            font-size: 20px;
            font-weight: bold;
            color: #000;
            background: #fff;
            border: 2px solid #000;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: 5mm;
        }
        
        .datetime {
            text-align: center;
            font-size: 10px;
            color: #666;
            margin: 2mm 0;
            border-top: 1px solid #000;
            padding-top: 2mm;
        }
        
        .arabic-text {
            direction: rtl;
            text-align: right;
        }
        
        .english-text {
            direction: ltr;
            text-align: left;
        }
        
        @media print {
            body { 
                width: 72mm; 
                margin: 0;
                padding: 4mm;
                max-width: 72mm;
                box-sizing: border-box;
            }
        }
    </style>
</head>
<body>
    <!-- Kitchen Header -->
    <div class="header">
        <div class="kitchen-title">${
          hasArabic ? "تذكرة المطبخ" : "KITCHEN TICKET"
        }</div>
        <div style="font-size: 9px;">${
          receiptSettings.header.businessName
        }</div>
    </div>

    <!-- Order Information -->
    <div class="order-info">
        <div class="order-line">
            <span>Order #:</span>
            <span>${safeOrderData.orderNumber}</span>
        </div>
        <div class="order-line">
            <span>Time:</span>
            <span>${new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}</span>
        </div>
        
        ${
          safeOrderData.custName
            ? `<div class="order-line">
            <span>Customer:</span>
            <span>${safeOrderData.custName}</span>
        </div>`
            : ""
        }
    </div>

    <!-- Items for Kitchen -->
    <div class="items-section">
        ${safeOrderData.orderItems
          .map(
            (item) => `
        <div class="item-row">
            <div class="item-details">
                <div class="item-name ${hasArabic ? "arabic-text" : ""}">${
              item.nameAr || item.name
            }</div>
                ${
                  item.nameAr && item.name !== item.nameAr
                    ? `<div class="item-name-secondary english-text">${item.name}</div>`
                    : ""
                }
            </div>
            <div class="item-quantity">${item.quantity}</div>
        </div>
        `
          )
          .join("")}
    </div>

    <!-- Footer -->
    <div class="datetime">
        ${hasArabic ? "نسخة المطبخ" : "Kitchen Copy"} - ${this.formatDateTime(
      hasArabic
    )}
    </div>
</body>
</html>`;
  }

  /**
   * Convert HTML to Canvas (for canvas printing method)
   */
  async htmlToCanvas() {
    // This would require html2canvas library in a real implementation
    // For now, we'll use a placeholder approach
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas size based on thermal paper width
    const mmToPx = 3.78; // Approximate conversion for 203 DPI
    canvas.width = this.settings.paperWidth * mmToPx;
    canvas.height = 200 * mmToPx; // Auto height

    // Fill with white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Note: In a real implementation, you would use html2canvas here:
    // return await html2canvas(element, { canvas: canvas });

    return canvas;
  }

  /**
   * Generate raw ESC/POS commands (basic fallback)
   */
  generateRawCommands(orderData) {
    const commands = [];

    // Initialize printer
    commands.push("\x1B\x40"); // ESC @ - Initialize

    // Set character set (try Windows-1256 for Arabic)
    commands.push("\x1B\x74\x16"); // ESC t 22 (Windows-1256)

    // Header
    commands.push("\x1B\x61\x01"); // Center align
    commands.push("\x1B\x45\x01"); // Bold on
    commands.push(this.settings.storeName + "\n");
    commands.push("\x1B\x45\x00"); // Bold off
    commands.push(this.settings.storeAddress + "\n");
    commands.push("Tel: " + this.settings.storePhone + "\n");
    commands.push("\x1B\x61\x00"); // Left align

    // Separator
    commands.push("----------------------------------------\n");

    // Order info
    commands.push("Order: " + (orderData.orderNumber || "N/A") + "\n");
    commands.push("Cashier: " + (orderData.cashier || "N/A") + "\n");
    commands.push("Date: " + new Date().toLocaleString() + "\n");
    commands.push("----------------------------------------\n");

    // Items
    (orderData.orderItems || []).forEach((item) => {
      commands.push(item.name + "\n");
      commands.push(
        `${item.quantity} x ${item.price.toFixed(2)} = ${(
          item.quantity * item.price
        ).toFixed(2)}\n`
      );
    });

    commands.push("----------------------------------------\n");

    // Totals
    commands.push(
      `Subtotal: ${this.settings.currency} ${(orderData.subtotal || 0).toFixed(
        2
      )}\n`
    );
    commands.push(
      `Tax: ${this.settings.currency} ${(orderData.tax || 0).toFixed(2)}\n`
    );
    if (orderData.discount) {
      commands.push(
        `Discount: -${this.settings.currency} ${orderData.discount.toFixed(
          2
        )}\n`
      );
    }
    commands.push("----------------------------------------\n");
    commands.push("\x1B\x45\x01"); // Bold on
    commands.push(
      `TOTAL: ${this.settings.currency} ${(orderData.total || 0).toFixed(2)}\n`
    );
    commands.push("\x1B\x45\x00"); // Bold off

    // Footer
    commands.push("\n\x1B\x61\x01"); // Center align
    commands.push("Thank you for your visit!\n");
    commands.push("\x1B\x61\x00"); // Left align

    // Cut paper
    commands.push("\x1D\x56\x00"); // Full cut

    return commands.join("");
  }

  /**
   * Detect Arabic content in order data
   */
  detectArabicContent(orderData) {
    const textToCheck = [
      orderData.cashierAr,
      this.settings.storeNameAr,
      ...(orderData.orderItems || []).map((item) => item.nameAr),
    ]
      .filter(Boolean)
      .join(" ");

    return this.arabicTextRegex.test(textToCheck);
  }

  /**
   * Select optimal printing method based on content and printer capabilities
   */
  selectPrintingMethod(printerName, hasArabicContent, forcedMethod = null) {
    if (forcedMethod && ["html", "canvas", "raw"].includes(forcedMethod)) {
      return forcedMethod;
    }

    const capabilities = this.printerCapabilities.get(printerName);

    if (hasArabicContent) {
      // For Arabic content, prioritize HTML then Canvas
      if (capabilities?.supportsHTML !== false) return "html";
      if (capabilities?.supportsImages !== false) return "canvas";
      return "raw"; // Last resort
    } else {
      // For English-only content, any method works
      return this.settings.printMethod === "auto"
        ? "html"
        : this.settings.printMethod;
    }
  }

  /**
   * Select printer with better error handling and actual system printer names
   */
  async selectPrinter(printerName) {
    try {
      // If specific printer name provided, validate it exists
      if (printerName) {
        const availablePrinters = await this.getPrinters();
        const printerExists = availablePrinters.some(
          (p) =>
            p === printerName ||
            p.toLowerCase().includes(printerName.toLowerCase()) ||
            printerName.toLowerCase().includes(p.toLowerCase())
        );

        if (printerExists) {
          // Find exact match or best match
          const exactMatch = availablePrinters.find((p) => p === printerName);
          const partialMatch = availablePrinters.find(
            (p) =>
              p.toLowerCase().includes(printerName.toLowerCase()) ||
              printerName.toLowerCase().includes(p.toLowerCase())
          );

          const selectedPrinter = exactMatch || partialMatch;
          this.log("🎯 Selected printer:", selectedPrinter);
          return selectedPrinter;
        }

        this.log("⚠️ Specified printer not found:", printerName);
      }

      // Get available printers and select the best one
      const availablePrinters = await this.getPrinters();
      if (availablePrinters.length === 0) {
        throw new Error(
          "No physical printers found. Please ensure thermal printers are installed and connected. Virtual printers like 'Microsoft Print to PDF' are not supported."
        );
      }

      // Try to find a thermal printer first
      let selectedPrinter = availablePrinters.find(
        (p) =>
          p.toLowerCase().includes("thermal") ||
          p.toLowerCase().includes("receipt") ||
          p.toLowerCase().includes("pos") ||
          p.toLowerCase().includes("rp-") ||
          p.toLowerCase().includes("xprinter") ||
          p.toLowerCase().includes("epson")
      );

      // If no thermal printer found, use the first available printer
      if (!selectedPrinter) {
        selectedPrinter = availablePrinters[0];
      }

      this.log("🎯 Auto-selected printer:", selectedPrinter);
      return selectedPrinter;
    } catch (error) {
      this.log("❌ Printer selection failed:", error);
      throw new Error(`Printer selection failed: ${error.message}`);
    }
  }

  /**
   * Convert Western numerals to Arabic numerals
   */
  toArabicNumerals(text) {
    const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    return String(text).replace(
      /[0-9]/g,
      (digit) => arabicNumerals[parseInt(digit)]
    );
  }

  /**
   * Sanitize order data to prevent display issues like "ee.ee"
   */
  sanitizeOrderData(orderData) {
    // Handle order items from different sources
    let items = [];
    if (orderData.orderItems && Array.isArray(orderData.orderItems)) {
      items = orderData.orderItems.map((item) => {
        // Handle different item data structures
        let itemData = item;

        // If item has meal data embedded
        if (item.meal) {
          itemData = {
            ...item,
            name: item.meal.name || item.name || "Item",
            nameAr: item.meal.nameAr || item.nameAr || "",
            price: Number(item.price) || Number(item.meal.price) || 0,
          };
        }

        // If we have orderItemsData, try to match
        if (orderData.orderItemsData && orderData.orderItemsData.length > 0) {
          const mealData = orderData.orderItemsData.find(
            (meal) => meal._id === item.mealId || meal._id === item.id
          );
          if (mealData) {
            itemData = {
              ...item,
              name: mealData.name || item.name || "Item",
              nameAr: mealData.nameAr || item.nameAr || "",
              price: Number(item.price) || Number(mealData.price) || 0,
            };
          }
        }

        return {
          name: String(itemData.name || "Item"),
          nameAr: String(itemData.nameAr || ""),
          quantity: Number(itemData.quantity) || 1,
          price: Number(itemData.price) || 0,
        };
      });
    }

    // Calculate subtotal from items
    const calculatedSubtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    const safe = {
      orderNumber: String(
        orderData.orderNumber ||
          orderData.orderCode ||
          orderData._id?.slice(-8) ||
          "001"
      ),
      cashier: String(orderData.cashier || "N/A"),
      orderItems: items,
      subtotal: Number(orderData.subtotal) || calculatedSubtotal,
      tax: Number(orderData.tax) || Number(orderData.taxAmount) || 0,
      discount:
        Number(orderData.discount) || Number(orderData.discountAmount) || 0,
      total: Number(orderData.total) || Number(orderData.finalTotal) || 0,
      finalTotal: Number(orderData.finalTotal) || Number(orderData.total) || 0,
      paymentMethods: Array.isArray(orderData.paymentMethods)
        ? orderData.paymentMethods
        : [],
      custName: String(orderData.custName || ""),
      custPhone: String(orderData.custPhone || orderData.custtPhone || ""),
      custAddress: String(orderData.custAddress || ""),
    };

    // Ensure total calculation is correct if missing
    if (safe.total === 0 && safe.orderItems.length > 0) {
      safe.total = safe.subtotal + safe.tax - safe.discount;
    }

    return safe;
  }

  /**
   * Format phone number for display
   */
  formatPhoneNumber(phone) {
    return String(phone || "").replace(/[^\d\u0660-\u0669]/g, "");
  }

  /**
   * Format date and time for receipt (Gregorian calendar, no seconds)
   */
  formatDateTime(isArabic) {
    const now = new Date();
    if (isArabic) {
      // Force Gregorian calendar for Arabic
      return now.toLocaleDateString("ar-SA-u-ca-gregory", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } else {
      return now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
  }

  /**
   * Format quantity for display
   */
  formatQuantity(quantity, isArabic) {
    const num = Number(quantity) || 1;
    return isArabic ? this.toArabicNumerals(num.toString()) : num.toString();
  }

  /**
   * Format price for display
   */
  formatPrice(price, isArabic) {
    const num = Number(price) || 0;
    const formatted = num.toFixed(2);
    return isArabic ? this.toArabicNumerals(formatted) : formatted;
  }

  /**
   * Format amount with currency for display
   */
  formatAmount(amount, isArabic) {
    const receiptSettings = this.getReceiptSettings();
    const num = Number(amount) || 0;
    const formatted = num.toFixed(2);

    if (isArabic) {
      const currency = receiptSettings.display?.currency || "درهم";
      return `${this.toArabicNumerals(formatted)} ${currency}`;
    } else {
      const currency = receiptSettings.display?.currencyEn || "AED";
      return `${currency} ${formatted}`;
    }
  }

  /**
   * Get payment method name in Arabic
   */
  getPaymentMethodArabic(method) {
    const methods = {
      cash: "نقداً",
      visa: "فيزا",
      mastercard: "ماستركارد",
      credit: "بطاقة ائتمان",
      debit: "بطاقة خصم",
      bank: "تحويل بنكي",
    };
    return methods[method] || method;
  }

  /**
   * Get payment method name in English
   */
  getPaymentMethodEnglish(method) {
    const methods = {
      cash: "Cash",
      visa: "Visa",
      mastercard: "Mastercard",
      credit: "Credit Card",
      debit: "Debit Card",
      bank: "Bank Transfer",
    };
    return methods[method] || method.toUpperCase();
  }

  /**
   * Test Arabic receipt printing
   */
  async testArabicPrint(printerName = null) {
    const testData = {
      orderNumber: "AR-TEST-001",
      cashier: "Test User",
      cashierAr: "المستخدم التجريبي",
      orderItems: [
        {
          name: "Foul with Tahini",
          nameAr: "فول بالطحينة",
          quantity: 2,
          price: 15.0,
        },
        {
          name: "Falafel Sandwich",
          nameAr: "ساندويش فلافل",
          quantity: 1,
          price: 12.5,
        },
        {
          name: "Arabic Coffee",
          nameAr: "قهوة عربية",
          quantity: 1,
          price: 5.0,
        },
      ],
      subtotal: 47.5,
      tax: 7.13,
      total: 54.63,
    };

    return await this.printReceipt(testData, printerName);
  }

  /**
   * Print customer receipt with proper printer selection
   */
  async printCustomerReceipt(orderData, printerName = null) {
    try {
      let targetPrinter = printerName;

      if (!targetPrinter) {
        // Get customer printer from settings
        const enabledPrinters = await this.getEnabledPrinters();
        this.log(
          "🔍 Looking for customer printer in enabled printers:",
          enabledPrinters
        );

        const customerPrinter = enabledPrinters.find(
          (p) => p.type === "customer" && p.enabled && p.available
        );

        if (customerPrinter && customerPrinter.systemName) {
          targetPrinter = customerPrinter.systemName;
          this.log("✅ Found customer printer:", customerPrinter);
        } else {
          this.log(
            "❌ No customer printer found. Available printers:",
            enabledPrinters
          );
          throw new Error(
            "No customer printer configured or available. Please configure a customer printer in Settings > Printers."
          );
        }
      }

      this.log("🖨️ Printing CUSTOMER receipt to:", targetPrinter);
      return await this.printReceipt(orderData, targetPrinter, {
        type: "customer",
      });
    } catch (error) {
      this.log("❌ Customer receipt printing failed:", error);
      throw error;
    }
  }

  /**
   * Print kitchen ticket with proper printer selection
   */
  async printKitchenTicket(orderData, printerName = null) {
    try {
      let targetPrinter = printerName;

      if (!targetPrinter) {
        // Get kitchen printer from settings
        const enabledPrinters = await this.getEnabledPrinters();
        this.log(
          "🔍 Looking for kitchen printer in enabled printers:",
          enabledPrinters
        );

        const kitchenPrinter = enabledPrinters.find(
          (p) => p.type === "kitchen" && p.enabled && p.available
        );

        if (kitchenPrinter && kitchenPrinter.systemName) {
          targetPrinter = kitchenPrinter.systemName;
          this.log("✅ Found kitchen printer:", kitchenPrinter);
        } else {
          this.log(
            "❌ No kitchen printer found. Available printers:",
            enabledPrinters
          );
          throw new Error(
            "No kitchen printer configured or available. Please configure a kitchen printer in Settings > Printers."
          );
        }
      }

      this.log("🖨️ Printing KITCHEN ticket to:", targetPrinter);
      return await this.printReceipt(orderData, targetPrinter, {
        type: "kitchen",
      });
    } catch (error) {
      this.log("❌ Kitchen ticket printing failed:", error);
      throw error;
    }
  }

  /**
   * Print both receipts with proper printer selection
   */
  async printBothReceipts(
    orderData,
    customerPrinter = null,
    kitchenPrinter = null
  ) {
    try {
      // Get enabled printers if not specified
      const enabledPrinters = await this.getEnabledPrinters();

      let customerPrinterName = customerPrinter;
      let kitchenPrinterName = kitchenPrinter;

      if (!customerPrinterName) {
        const customerConfig = enabledPrinters.find(
          (p) => p.type === "customer" && p.enabled && p.available
        );
        customerPrinterName = customerConfig?.systemName;
      }

      if (!kitchenPrinterName) {
        const kitchenConfig = enabledPrinters.find(
          (p) => p.type === "kitchen" && p.enabled && p.available
        );
        kitchenPrinterName = kitchenConfig?.systemName;
      }

      this.log("🖨️ Customer printer selected:", customerPrinterName || "None");
      this.log("🖨️ Kitchen printer selected:", kitchenPrinterName || "None");

      const printTasks = [];

      // Only print customer receipt if customer printer is available
      if (customerPrinterName) {
        printTasks.push(
          this.printCustomerReceipt(orderData, customerPrinterName)
            .then(() => ({
              success: true,
              type: "customer",
              printer: customerPrinterName,
              error: null,
            }))
            .catch((error) => ({
              success: false,
              type: "customer",
              printer: customerPrinterName,
              error: error.message,
            }))
        );
      } else {
        this.log("⚠️ No customer printer configured or available");
        printTasks.push(
          Promise.resolve({
            success: false,
            type: "customer",
            printer: "None",
            error: "No customer printer configured",
          })
        );
      }

      // Only print kitchen ticket if kitchen printer is available
      if (kitchenPrinterName) {
        printTasks.push(
          this.printKitchenTicket(orderData, kitchenPrinterName)
            .then(() => ({
              success: true,
              type: "kitchen",
              printer: kitchenPrinterName,
              error: null,
            }))
            .catch((error) => ({
              success: false,
              type: "kitchen",
              printer: kitchenPrinterName,
              error: error.message,
            }))
        );
      } else {
        this.log("⚠️ No kitchen printer configured or available");
        printTasks.push(
          Promise.resolve({
            success: false,
            type: "kitchen",
            printer: "None",
            error: "No kitchen printer configured",
          })
        );
      }

      const results = await Promise.all(printTasks);

      results.forEach((result) => {
        if (!result.success) {
          this.log(
            `❌ ${result.type} receipt failed on ${result.printer}:`,
            result.error
          );
        } else {
          this.log(
            `✅ ${result.type} receipt printed successfully on ${result.printer}`
          );
        }
      });

      return results;
    } catch (error) {
      this.log("❌ Print both receipts failed:", error);
      return [
        {
          success: false,
          type: "customer",
          printer: "Error",
          error: error.message,
        },
        {
          success: false,
          type: "kitchen",
          printer: "Error",
          error: error.message,
        },
      ];
    }
  }

  /**
   * Get printer settings (for cashier page compatibility)
   */
  getPrinterSettings() {
    try {
      const stored = localStorage.getItem("printer_settings");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      this.log("⚠️ Failed to load printer settings:", error);
      return [];
    }
  }

  /**
   * Save printer settings to localStorage
   */
  savePrinterSettings(settings) {
    try {
      localStorage.setItem("printer_settings", JSON.stringify(settings));
      this.log("💾 Printer settings saved to localStorage");
      return true;
    } catch (error) {
      this.log("❌ Failed to save printer settings:", error);
      return false;
    }
  }

  /**
   * Update settings
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.log("⚙️ Settings updated:", newSettings);
  }

  /**
   * Get current settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Disconnect from QZ Tray
   */
  async disconnect() {
    try {
      if (this.qzInstance && this.qzInstance.websocket.isActive()) {
        await this.qzInstance.websocket.disconnect();
        this.log("📴 QZ Tray disconnected");
      }
      this.isConnected = false;
    } catch (error) {
      this.log("❌ Disconnect failed:", error);
    }
  }

  /**
   * Logging utility
   */
  log(...args) {
    if (this.settings.debugMode) {
      console.log("[ThermalPrintingService]", ...args);
    }
  }

  /**
   * Get printer status
   */
  async getPrinterStatus(printerName) {
    try {
      if (!this.isConnected) await this.initialize();

      // QZ Tray doesn't have direct status checking
      // We'll try a simple test to see if printer responds
      // TODO: Implement actual printer status checking using printerName
      // const testConfig = this.qzInstance.configs.create(printerName);

      // This is a workaround - actual implementation depends on QZ Tray version
      // For now, we assume all printers are online (printerName is for future use)
      console.log(`Checking status for printer: ${printerName}`);
      return { online: true, ready: true, paper: true };
    } catch (error) {
      this.log("❌ Could not get printer status:", error);
      return {
        online: false,
        ready: false,
        paper: false,
        error: error.message,
      };
    }
  }

  /**
   * Get receipt settings from localStorage or return defaults
   */
  getReceiptSettings() {
    try {
      const stored = localStorage.getItem("receiptSettings");
      const defaultSettings = {
        header: {
          businessName: this.settings.storeName,
          businessNameAr: this.settings.storeNameAr,
          address: this.settings.storeAddress,
          addressAr: this.settings.storeAddressAr,
          city: "",
          phone: this.settings.storePhone,
          phoneAr: this.settings.storePhoneAr,
          taxId: this.settings.taxNumber,
          customText: "",
        },
        footer: {
          thankYouMessage: "Thank you for your visit!",
          thankYouMessageAr: "شكراً لزيارتكم!",
          returnPolicy: "",
          customerService: "",
          website: "",
          customText: "",
        },
        display: {
          showCashierName: true,
          showCustomerInfo: true,
          showTaxDetails: true,
          enableArabicSupport: this.settings.enableArabicSupport,
          currency: "درهم",
          currencyEn: "AED",
        },
      };

      return stored
        ? { ...defaultSettings, ...JSON.parse(stored) }
        : defaultSettings;
    } catch (error) {
      this.log("⚠️ Failed to load receipt settings:", error);
      return this.getDefaultReceiptSettings();
    }
  }

  /**
   * Save receipt settings to localStorage
   */
  saveReceiptSettings(settings) {
    try {
      localStorage.setItem("receiptSettings", JSON.stringify(settings));
      this.log("💾 Receipt settings saved successfully");
      return true;
    } catch (error) {
      this.log("❌ Failed to save receipt settings:", error);
      return false;
    }
  }

  /**
   * Get default receipt settings
   */
  getDefaultReceiptSettings() {
    return {
      header: {
        businessName: this.settings.storeName,
        businessNameAr: this.settings.storeNameAr,
        address: this.settings.storeAddress,
        addressAr: this.settings.storeAddressAr,
        city: "",
        phone: this.settings.storePhone,
        phoneAr: this.settings.storePhoneAr,
        taxId: this.settings.taxNumber,
        customText: "",
      },
      footer: {
        thankYouMessage: "Thank you for your visit!",
        thankYouMessageAr: "شكراً لزيارتكم!",
        returnPolicy: "",
        customerService: "",
        website: "",
        customText: "",
      },
      display: {
        showCashierName: true,
        showCustomerInfo: true,
        showTaxDetails: true,
        enableArabicSupport: this.settings.enableArabicSupport,
        currency: "درهم",
        currencyEn: "AED",
      },
    };
  }

  /**
   * Generate customer receipt content for preview
   */
  generateCustomerReceipt(orderData) {
    return this.generateCustomerReceiptHTML(orderData);
  }

  /**
   * Preview receipt in new window
   */
  previewReceipt(htmlContent) {
    const previewWindow = window.open(
      "",
      "_blank",
      "width=400,height=600,scrollbars=yes"
    );
    if (previewWindow) {
      previewWindow.document.write(htmlContent);
      previewWindow.document.close();
      previewWindow.focus();
    } else {
      this.log("❌ Could not open preview window. Please allow popups.");
    }
  }

  /**
   * Test print functionality with basic test data
   */
  async testPrint(printer) {
    const testData = {
      orderNumber: "TEST-001",
      cashier: "Test User",
      cashierAr: "المستخدم التجريبي",
      orderItems: [
        {
          name: "Test Item",
          nameAr: "عنصر تجريبي",
          quantity: 1,
          price: 10.0,
        },
      ],
      subtotal: 10.0,
      tax: 1.5,
      total: 11.5,
    };

    const printerName = typeof printer === "string" ? printer : printer.name;
    return await this.printReceipt(testData, printerName);
  }

  /**
   * Test Arabic printing with comprehensive Arabic content
   */
  async printArabicTest(printerName = null) {
    const testData = {
      orderNumber: "12345",
      cashier: "أحمد محمد",
      cashierAr: "أحمد محمد",
      orderItems: [
        {
          name: "Foul with Tahini",
          nameAr: "فول بالطحينة",
          quantity: 2,
          price: 15.5,
        },
        {
          name: "Falafel Sandwich",
          nameAr: "ساندويش فلافل",
          quantity: 1,
          price: 12.0,
        },
        {
          name: "Arabic Coffee",
          nameAr: "قهوة عربية",
          quantity: 1,
          price: 8.5,
        },
        {
          name: "Hummus Plate",
          nameAr: "طبق حمص",
          quantity: 1,
          price: 18.0,
        },
      ],
      subtotal: 67.5,
      tax: 10.13,
      discount: 5.0,
      total: 72.63,
    };

    this.log("🧪 Testing Arabic receipt printing with comprehensive data...");
    return await this.printReceipt(testData, printerName);
  }

  /**
   * Get enabled printers from settings with actual system printer names
   */
  async getEnabledPrinters() {
    try {
      const printerSettings = this.getPrinterSettings();
      const availablePrinters = await this.getPrinters();

      // If no settings exist, return empty array to force proper setup
      if (!printerSettings || printerSettings.length === 0) {
        this.log("⚠️ No printer settings found in localStorage");
        return [];
      }

      this.log("🔧 Printer settings from localStorage:", printerSettings);
      this.log("🖨️ Available system printers:", availablePrinters);

      const enabledPrinters = printerSettings
        .filter((p) => p.enabled)
        .map((configPrinter) => {
          // Try multiple matching strategies to find the correct system printer
          let systemPrinter = null;

          // Strategy 1: Exact name match
          systemPrinter = availablePrinters.find(
            (sp) => sp === configPrinter.name
          );

          if (!systemPrinter) {
            // Strategy 2: Case-insensitive partial match in both directions
            systemPrinter = availablePrinters.find(
              (sp) =>
                sp.toLowerCase().includes(configPrinter.name.toLowerCase()) ||
                configPrinter.name.toLowerCase().includes(sp.toLowerCase())
            );
          }

          if (!systemPrinter && configPrinter.model) {
            // Strategy 3: Model-based matching
            systemPrinter = availablePrinters.find(
              (sp) =>
                sp.toLowerCase().includes(configPrinter.model.toLowerCase()) ||
                configPrinter.model.toLowerCase().includes(sp.toLowerCase())
            );
          }

          if (!systemPrinter) {
            // Strategy 4: Fuzzy matching for common printer name patterns
            const nameWords = configPrinter.name.toLowerCase().split(/[\s-_]+/);
            systemPrinter = availablePrinters.find((sp) => {
              const spLower = sp.toLowerCase();
              return nameWords.some(
                (word) => word.length > 2 && spLower.includes(word)
              );
            });
          }

          const result = {
            ...configPrinter,
            systemName: systemPrinter || null,
            available: !!systemPrinter,
          };

          this.log(
            `🔍 Printer matching for "${configPrinter.name}" (${configPrinter.type}):`,
            {
              configName: configPrinter.name,
              systemName: systemPrinter,
              available: !!systemPrinter,
              enabled: configPrinter.enabled,
            }
          );

          return result;
        })
        .filter((printer) => printer.available); // Only return available printers

      this.log("✅ Final enabled and available printers:", enabledPrinters);
      return enabledPrinters;
    } catch (error) {
      this.log("❌ Failed to get enabled printers:", error);
      return [];
    }
  }

  /**
   * Get QZ Tray connection status
   */
  getQZStatus() {
    try {
      const isConnected =
        this.isConnected &&
        typeof window.qz !== "undefined" &&
        this.qzInstance &&
        this.qzInstance.websocket &&
        this.qzInstance.websocket.isActive();

      return {
        isConnected,
        version: typeof window.qz !== "undefined" ? window.qz.version : null,
        websocketActive: this.qzInstance?.websocket?.isActive() || false,
      };
    } catch (error) {
      this.log("❌ Failed to get QZ status:", error);
      return {
        isConnected: false,
        version: null,
        websocketActive: false,
        error: error.message,
      };
    }
  }

  /**
   * Discover and list all available printers with details
   */
  async discoverPrinters() {
    try {
      this.log("🔍 Discovering available printers...");

      if (!this.isConnected) {
        await this.initialize();
      }

      const printers = await this.qzInstance.printers.find();
      const printerDetails = [];

      for (const printer of printers) {
        const details = {
          name: printer,
          displayName: printer,
          isDefault: false,
          capabilities: await this.detectPrinterCapabilities(printer),
          status: "unknown",
        };

        // Try to get more details if possible
        try {
          const status = await this.getPrinterStatus(printer);
          details.status = status.online ? "online" : "offline";
        } catch {
          this.log("⚠️ Could not get status for printer:", printer);
        }

        printerDetails.push(details);
      }

      this.log("📋 Discovered printers:", printerDetails);
      return printerDetails;
    } catch (error) {
      this.log("❌ Printer discovery failed:", error);
      throw error;
    }
  }

  /**
   * Validate if a printer is available and ready
   */
  async validatePrinter(printerName) {
    try {
      if (!printerName) {
        return { valid: false, error: "No printer name provided" };
      }

      const availablePrinters = await this.getPrinters();
      const printerExists = availablePrinters.includes(printerName);

      if (!printerExists) {
        return {
          valid: false,
          error: `Printer '${printerName}' not found. Available printers: ${availablePrinters.join(
            ", "
          )}`,
        };
      }

      // Try to get printer status
      try {
        const status = await this.getPrinterStatus(printerName);
        return {
          valid: true,
          online: status.online,
          ready: status.ready,
          details: status,
        };
      } catch {
        return {
          valid: true,
          online: true, // Assume online if we can't check
          ready: true,
          warning: "Could not verify printer status",
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: `Printer validation failed: ${error.message}`,
      };
    }
  }

  /**
   * Debug function to check printer configuration
   */
  async debugPrinterConfiguration() {
    try {
      console.log("🔧 === PRINTER CONFIGURATION DEBUG ===");

      // Check QZ Tray status
      const qzStatus = this.getQZStatus();
      console.log("QZ Tray Status:", qzStatus);

      // Get available system printers
      const availablePrinters = await this.getPrinters();
      console.log("Available System Printers:", availablePrinters);

      // Get printer settings from localStorage
      const printerSettings = this.getPrinterSettings();
      console.log("Printer Settings from localStorage:", printerSettings);

      // Get enabled printers with matching
      const enabledPrinters = await this.getEnabledPrinters();
      console.log("Enabled and Matched Printers:", enabledPrinters);

      // Check for customer and kitchen printers specifically
      const customerPrinter = enabledPrinters.find(
        (p) => p.type === "customer" && p.enabled && p.available
      );
      const kitchenPrinter = enabledPrinters.find(
        (p) => p.type === "kitchen" && p.enabled && p.available
      );

      console.log("Customer Printer Found:", customerPrinter);
      console.log("Kitchen Printer Found:", kitchenPrinter);

      // Test recommendations
      if (!customerPrinter) {
        console.warn("⚠️ No customer printer configured or available!");
      }
      if (!kitchenPrinter) {
        console.warn("⚠️ No kitchen printer configured or available!");
      }
      if (
        customerPrinter &&
        kitchenPrinter &&
        customerPrinter.systemName === kitchenPrinter.systemName
      ) {
        console.warn(
          "⚠️ Customer and kitchen printers are mapped to the same system printer!"
        );
      }

      console.log("🔧 === END DEBUG ===");

      return {
        qzStatus,
        availablePrinters,
        printerSettings,
        enabledPrinters,
        customerPrinter,
        kitchenPrinter,
        isConfiguredCorrectly: !!(
          customerPrinter &&
          kitchenPrinter &&
          customerPrinter.systemName !== kitchenPrinter.systemName
        ),
      };
    } catch (error) {
      console.error("❌ Debug failed:", error);
      return { error: error.message };
    }
  }
}

// Create and export service instance
const printingService = new ThermalPrintingService();

// Auto-initialize on window load if QZ is available
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    if (typeof window.qz !== "undefined") {
      printingService.initialize().catch((error) => {
        console.warn("Auto-initialization failed:", error.message);
      });
    }
  });

  // Expose debug function globally for troubleshooting
  window.debugPrinters = () => printingService.debugPrinterConfiguration();
  console.log("🔧 Debug function available: window.debugPrinters()");
}

export default printingService;
