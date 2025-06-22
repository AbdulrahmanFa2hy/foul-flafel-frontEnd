/**
 * Modern Printing Service for QZ Tray with Arabic Support
 * Uses HTML printing approach instead of raw ESC/POS for better Arabic text handling
 * Based on research from QZ Tray documentation and community discussions
 */

class PrintingService {
  constructor() {
    this.qzInstance = null;
    this.isQZConnected = false;

    // Default receipt settings
    this.defaultSettings = {
      storeName: "Foul & Falafel Restaurant",
      storeNameAr: "مطعم الفول والفلافل",
      storeAddress: "King Fahd Street, Riyadh",
      storeAddressAr: "شارع الملك فهد، الرياض",
      storePhone: "011-456-7890",
      storePhoneAr: "٠١١-٤٥٦-٧٨٩٠",
      taxNumber: "300-456-789",
      taxNumberAr: "٣٠٠-٤٥٦-٧٨٩",
      footerMessage: "Thank you for your visit!",
      footerMessageAr: "شكراً لزيارتكم!",
    };
  }

  /**
   * Initialize QZ Tray connection
   */
  async initializeQZ() {
    try {
      if (typeof window.qz === "undefined") {
        throw new Error("QZ Tray is not installed or not loaded");
      }

      this.qzInstance = window.qz;

      if (!this.qzInstance.websocket.isActive()) {
        await this.qzInstance.websocket.connect();
        console.log("✅ QZ Tray connected successfully");
      }

      this.isQZConnected = true;
      return true;
    } catch (error) {
      console.error("❌ QZ Tray initialization failed:", error);
      this.isQZConnected = false;
      throw error;
    }
  }

  /**
   * Get list of available printers
   */
  async getPrinters() {
    try {
      if (!this.isQZConnected) {
        await this.initializeQZ();
      }

      const printers = await this.qzInstance.printers.find();
      console.log("📄 Available printers:", printers);
      return printers;
    } catch (error) {
      console.error("❌ Failed to get printers:", error);
      throw error;
    }
  }

  /**
   * Test printer connection
   */
  async testPrint(printerName = null) {
    try {
      if (!printerName) {
        const printers = await this.getPrinters();
        if (printers.length === 0) {
          throw new Error("No printers found");
        }
        printerName = printers[0];
      }

      const testData = {
        orderNumber: "TEST-001",
        cashier: "Test User",
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

      await this.printReceipt(testData, printerName);
      console.log("✅ Test print completed successfully");
      return true;
    } catch (error) {
      console.error("❌ Test print failed:", error);
      throw error;
    }
  }

  /**
   * Print receipt using HTML approach (recommended for Arabic text)
   */
  async printReceipt(orderData, printerName = null) {
    try {
      if (!this.isQZConnected) {
        await this.initializeQZ();
      }

      if (!printerName) {
        const printers = await this.getPrinters();
        if (printers.length === 0) {
          throw new Error("No printers found");
        }
        printerName = printers[0];
      }

      // Generate HTML receipt
      const htmlContent = this.generateReceiptHTML(orderData);

      // Create QZ config for HTML printing
      const config = this.qzInstance.configs.create(printerName, {
        colorType: "blackwhite",
        units: "in",
        size: {
          width: 3.15, // 80mm thermal paper
          height: 11.0,
        },
        margins: { top: 0.1, right: 0.1, bottom: 0.1, left: 0.1 },
        orientation: "portrait",
      });

      // Create print data using HTML
      const printData = [
        {
          type: "pixel",
          format: "html",
          flavor: "plain",
          data: htmlContent,
        },
      ];

      // Send to printer
      await this.qzInstance.print(config, printData);
      console.log("✅ Receipt printed successfully using HTML method");
      return true;
    } catch (error) {
      console.error("❌ Print failed:", error);
      throw error;
    }
  }

  /**
   * Generate HTML receipt with proper Arabic support
   */
  generateReceiptHTML(orderData) {
    const settings = this.getReceiptSettings();
    const now = new Date();

    // Convert numbers to Arabic numerals if needed
    const arabicNumerals = this.convertToArabicNumerals;

    const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Noto Sans Arabic', Arial, sans-serif;
                font-size: 11px;
                line-height: 1.2;
                color: #000;
                background: #fff;
                width: 80mm;
                margin: 0 auto;
                padding: 2mm;
                direction: rtl;
                text-align: right;
            }
            
            .header {
                text-align: center;
                border-bottom: 1px dashed #000;
                padding-bottom: 5mm;
                margin-bottom: 3mm;
            }
            
            .store-name {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 2mm;
            }
            
            .store-name-ar {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 3mm;
                direction: rtl;
            }
            
            .store-info {
                font-size: 10px;
                line-height: 1.3;
            }
            
            .order-info {
                margin: 3mm 0;
                font-size: 10px;
            }
            
            .items-section {
                margin: 3mm 0;
                width: 100%;
            }
            
            .items-header {
                border-bottom: 2px solid #000;
                margin-bottom: 2mm;
            }
            
            .header-row-ar,
            .header-row-en {
                display: flex;
                justify-content: space-between;
                font-weight: bold;
                padding: 1mm 0;
                font-size: 9px;
            }
            
            .header-row-ar {
                direction: rtl;
                text-align: right;
            }
            
            .header-row-en {
                direction: ltr;
                text-align: left;
                color: #666;
                font-size: 8px;
            }
            
            .item-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 2mm 0;
                border-bottom: 1px dotted #ccc;
                direction: rtl;
            }
            
            .col-total {
                width: 20%;
                text-align: center;
                font-weight: bold;
            }
            
            .col-price {
                width: 18%;
                text-align: center;
            }
            
            .col-qty {
                width: 12%;
                text-align: center;
            }
            
            .col-item {
                width: 50%;
                text-align: right;
                direction: rtl;
            }
            
            .item-name-ar {
                font-weight: bold;
                font-size: 11px;
                margin-bottom: 1mm;
                direction: rtl;
                text-align: right;
            }
            
            .item-name-en {
                font-size: 8px;
                color: #666;
                direction: ltr;
                text-align: left;
            }
            
            .totals {
                border-top: 1px dashed #000;
                padding-top: 3mm;
                margin-top: 3mm;
            }
            
            .total-row {
                display: flex;
                justify-content: space-between;
                padding: 1mm 0;
                font-size: 10px;
            }
            
            .total-row.final {
                font-weight: bold;
                font-size: 12px;
                border-top: 1px solid #000;
                padding-top: 2mm;
                margin-top: 2mm;
            }
            
            .footer {
                text-align: center;
                margin-top: 5mm;
                padding-top: 3mm;
                border-top: 1px dashed #000;
                font-size: 10px;
            }
            
            .footer-ar {
                font-weight: bold;
                margin-bottom: 2mm;
                direction: rtl;
            }
            
            .datetime {
                text-align: center;
                font-size: 9px;
                color: #666;
                margin: 2mm 0;
            }
            
            .qr-code {
                text-align: center;
                margin: 3mm 0;
            }
            
            @media print {
                body { width: 80mm; }
                .no-print { display: none; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="store-name-ar">${
              settings.storeNameAr || "مطعم الفول والفلافل"
            }</div>
            <div class="store-name">${
              settings.storeName || "Foul & Falafel Restaurant"
            }</div>
            <div class="store-info">
                <div>${
                  settings.storeAddressAr || "شارع الملك فهد، الرياض"
                }</div>
                <div>${
                  settings.storeAddress || "King Fahd Street, Riyadh"
                }</div>
                <div>هاتف: ${settings.storePhoneAr || "٠١١-٤٥٦-٧٨٩٠"}</div>
                <div>Tel: ${settings.storePhone || "011-456-7890"}</div>
                <div>الرقم الضريبي: ${
                  settings.taxNumberAr || "٣٠٠-٤٥٦-٧٨٩"
                }</div>
                <div>Tax No: ${settings.taxNumber || "300-456-789"}</div>
            </div>
        </div>

        <div class="order-info">
            <div>رقم الطلب: ${arabicNumerals(
              orderData.orderNumber || "N/A"
            )}</div>
            <div>Order: ${orderData.orderNumber || "N/A"}</div>
            <div>الكاشير: ${
              orderData.cashierAr || orderData.cashier || "غير محدد"
            }</div>
            <div>Cashier: ${orderData.cashier || "N/A"}</div>
        </div>

        <div class="datetime">
            <div>${this.formatDateTimeArabic(now)}</div>
            <div>${now.toLocaleString("en-US")}</div>
        </div>

        <!-- Improved Arabic Items Section -->
        <div class="items-section">
            <div class="items-header">
                <div class="header-row-ar">
                    <span class="col-total">المجموع</span>
                    <span class="col-price">السعر</span>
                    <span class="col-qty">الكمية</span>
                    <span class="col-item">الصنف</span>
                </div>
                <div class="header-row-en">
                    <span class="col-total">Total</span>
                    <span class="col-price">Price</span>
                    <span class="col-qty">Qty</span>
                    <span class="col-item">Item</span>
                </div>
            </div>
            
            <div class="items-list">
                ${
                  orderData.orderItems
                    ?.map(
                      (item) => `
                    <div class="item-row">
                        <span class="col-total">${arabicNumerals(
                          (item.quantity * item.price).toFixed(2)
                        )}</span>
                        <span class="col-price">${arabicNumerals(
                          item.price.toFixed(2)
                        )}</span>
                        <span class="col-qty">${arabicNumerals(
                          String(item.quantity)
                        )}</span>
                        <span class="col-item">
                            <div class="item-name-ar">${
                              item.nameAr || item.name
                            }</div>
                            <div class="item-name-en">${item.name}</div>
                        </span>
                    </div>
                `
                    )
                    .join("") || ""
                }
            </div>
        </div>

        <div class="totals">
            <div class="total-row">
                <span>المجموع الفرعي:</span>
                <span>${arabicNumerals(
                  (orderData.subtotal || 0).toFixed(2)
                )} ريال</span>
            </div>
            <div class="total-row">
                <span>Subtotal:</span>
                <span>SAR ${(orderData.subtotal || 0).toFixed(2)}</span>
            </div>
            
            <div class="total-row">
                <span>الضريبة (${arabicNumerals(
                  orderData.taxRate || 15
                )}%):</span>
                <span>${arabicNumerals(
                  (orderData.tax || 0).toFixed(2)
                )} ريال</span>
            </div>
            <div class="total-row">
                <span>Tax (${orderData.taxRate || 15}%):</span>
                <span>SAR ${(orderData.tax || 0).toFixed(2)}</span>
            </div>
            
            ${
              orderData.discount
                ? `
            <div class="total-row">
                <span>الخصم:</span>
                <span>-${arabicNumerals(
                  orderData.discount.toFixed(2)
                )} ريال</span>
            </div>
            <div class="total-row">
                <span>Discount:</span>
                <span>-SAR ${orderData.discount.toFixed(2)}</span>
            </div>
            `
                : ""
            }
            
            <div class="total-row final">
                <span>الإجمالي:</span>
                <span>${arabicNumerals(
                  (orderData.total || 0).toFixed(2)
                )} ريال</span>
            </div>
            <div class="total-row final">
                <span>TOTAL:</span>
                <span>SAR ${(orderData.total || 0).toFixed(2)}</span>
            </div>
        </div>

        <div class="footer">
            <div class="footer-ar">${
              settings.footerMessageAr || "شكراً لزيارتكم!"
            }</div>
            <div>${settings.footerMessage || "Thank you for your visit!"}</div>
            <div class="datetime">${now.toLocaleDateString(
              "ar-SA"
            )} - ${now.toLocaleTimeString("ar-SA")}</div>
        </div>
    </body>
    </html>
    `;

    return html;
  }

  /**
   * Convert Western numerals to Arabic numerals
   */
  convertToArabicNumerals(text) {
    if (typeof text !== "string") {
      text = String(text);
    }

    const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    return text.replace(/[0-9]/g, (match) => arabicNumerals[parseInt(match)]);
  }

  /**
   * Format date and time in Arabic
   */
  formatDateTimeArabic(date) {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };

    return date.toLocaleDateString("ar-SA", options);
  }

  /**
   * Get receipt settings from localStorage or use defaults
   */
  getReceiptSettings() {
    try {
      const stored = localStorage.getItem("receiptSettings");
      return stored
        ? { ...this.defaultSettings, ...JSON.parse(stored) }
        : this.defaultSettings;
    } catch (error) {
      console.warn("Failed to load receipt settings:", error);
      return this.defaultSettings;
    }
  }

  /**
   * Save receipt settings to localStorage
   */
  saveReceiptSettings(settings) {
    try {
      const merged = { ...this.defaultSettings, ...settings };
      localStorage.setItem("receiptSettings", JSON.stringify(merged));
      return true;
    } catch (error) {
      console.error("Failed to save receipt settings:", error);
      return false;
    }
  }

  /**
   * Print Arabic test receipt
   */
  async printArabicTest(printerName = null) {
    try {
      const testData = {
        orderNumber: "AR-001",
        cashier: "أحمد محمد",
        cashierAr: "أحمد محمد",
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
            price: 8.5,
          },
          {
            name: "Arabic Bread",
            nameAr: "خبز عربي",
            quantity: 3,
            price: 2.0,
          },
        ],
        subtotal: 44.5,
        taxRate: 15,
        tax: 6.68,
        total: 51.18,
      };

      await this.printReceipt(testData, printerName);
      console.log("✅ Arabic test receipt printed successfully");
      return true;
    } catch (error) {
      console.error("❌ Arabic test print failed:", error);
      throw error;
    }
  }

  /**
   * Disconnect from QZ Tray
   */
  async disconnect() {
    try {
      if (this.qzInstance && this.qzInstance.websocket.isActive()) {
        await this.qzInstance.websocket.disconnect();
        console.log("📱 QZ Tray disconnected");
      }
      this.isQZConnected = false;
    } catch (error) {
      console.error("❌ Failed to disconnect QZ Tray:", error);
    }
  }

  /**
   * Get printer status
   */
  async getPrinterStatus(printerName) {
    try {
      if (!this.isQZConnected) {
        await this.initializeQZ();
      }

      const status = await this.qzInstance.printers.getStatus(printerName);
      console.log(`📊 Printer ${printerName} status:`, status);
      return status;
    } catch (error) {
      console.error("❌ Failed to get printer status:", error);
      throw error;
    }
  }

  /**
   * Preview receipt HTML (for testing)
   */
  previewReceipt(orderData) {
    const html = this.generateReceiptHTML(orderData);
    const newWindow = window.open("", "_blank", "width=400,height=600");
    newWindow.document.write(html);
    newWindow.document.close();
  }

  /**
   * Print customer receipt - Required by cashier page
   */
  async printCustomerReceipt(orderData, printerName = null) {
    try {
      console.log("🧾 Printing customer receipt...", orderData);
      return await this.printReceipt(orderData, printerName);
    } catch (error) {
      console.error("❌ Customer receipt printing failed:", error);
      throw error;
    }
  }

  /**
   * Print kitchen ticket - Required by cashier page
   */
  async printKitchenTicket(orderData, printerName = null) {
    try {
      console.log("🍽️ Printing kitchen ticket...", orderData);

      // Generate kitchen-specific HTML
      const kitchenHTML = this.generateKitchenTicketHTML(orderData);

      // Use HTML printing for kitchen ticket
      if (!this.qzInstance) {
        await this.initializeQZ();
      }

      const printers = await this.getPrinters();
      const targetPrinter = printerName || printers[0];

      if (!targetPrinter) {
        throw new Error("No printer available for kitchen ticket");
      }

      const config = this.qzInstance.configs.create(targetPrinter, {
        colorType: "blackwhite",
        units: "in",
        size: { width: 3.15, height: 8.0 },
        margins: { top: 0.1, right: 0.1, bottom: 0.1, left: 0.1 },
        orientation: "portrait",
      });

      const printData = [
        {
          type: "pixel",
          format: "html",
          flavor: "plain",
          data: kitchenHTML,
        },
      ];

      await this.qzInstance.print(config, printData);
      console.log("✅ Kitchen ticket printed successfully");
      return true;
    } catch (error) {
      console.error("❌ Kitchen ticket printing failed:", error);
      throw error;
    }
  }

  /**
   * Print both customer receipt and kitchen ticket - Required by cashier page
   */
  async printBothReceipts(
    orderData,
    customerPrinter = null,
    kitchenPrinter = null
  ) {
    try {
      console.log("🖨️ Printing both receipts...", orderData);

      const results = await Promise.allSettled([
        this.printCustomerReceipt(orderData, customerPrinter),
        this.printKitchenTicket(orderData, kitchenPrinter),
      ]);

      const customerResult = results[0];
      const kitchenResult = results[1];

      // Check results
      if (customerResult.status === "rejected") {
        console.error("Customer receipt failed:", customerResult.reason);
      }
      if (kitchenResult.status === "rejected") {
        console.error("Kitchen ticket failed:", kitchenResult.reason);
      }

      const success =
        customerResult.status === "fulfilled" &&
        kitchenResult.status === "fulfilled";

      if (success) {
        console.log("✅ Both receipts printed successfully");
        return true;
      } else {
        throw new Error("One or both receipts failed to print");
      }
    } catch (error) {
      console.error("❌ Printing both receipts failed:", error);
      throw error;
    }
  }

  /**
   * Generate kitchen ticket HTML
   */
  generateKitchenTicketHTML(orderData) {
    const now = new Date();

    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');
            
            body {
                font-family: 'Noto Sans Arabic', Arial, sans-serif;
                font-size: 14px;
                line-height: 1.3;
                color: #000;
                background: #fff;
                width: 80mm;
                margin: 0 auto;
                padding: 3mm;
                direction: rtl;
            }
            
            .header {
                text-align: center;
                border-bottom: 2px solid #000;
                padding-bottom: 3mm;
                margin-bottom: 3mm;
            }
            
            .kitchen-title {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 2mm;
            }
            
            .order-info {
                font-size: 12px;
                margin: 2mm 0;
            }
            
            .items-list {
                margin: 3mm 0;
            }
            
            .kitchen-item {
                padding: 2mm 0;
                border-bottom: 1px dashed #ccc;
            }
            
            .kitchen-item-name {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 1mm;
            }
            
            .kitchen-item-qty {
                font-size: 14px;
                color: #666;
            }
            
            .kitchen-item-notes {
                font-size: 12px;
                color: #888;
                margin-top: 1mm;
            }
            
            .footer {
                text-align: center;
                margin-top: 5mm;
                padding-top: 3mm;
                border-top: 1px solid #000;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="kitchen-title">🍽️ تذكرة المطبخ</div>
            <div class="kitchen-title">KITCHEN TICKET</div>
        </div>

        <div class="order-info">
            <div><strong>رقم الطلب:</strong> ${
              orderData.orderNumber || "N/A"
            }</div>
            <div><strong>Order No:</strong> ${
              orderData.orderNumber || "N/A"
            }</div>
            <div><strong>الوقت:</strong> ${this.formatDateTimeArabic(now)}</div>
            <div><strong>Time:</strong> ${now.toLocaleString()}</div>
        </div>

        <div class="items-list">
            ${(orderData.orderItems || [])
              .map(
                (item) => `
                <div class="kitchen-item">
                    <div class="kitchen-item-name">${
                      item.nameAr || item.name
                    }</div>
                    <div class="kitchen-item-name">${item.name}</div>
                    <div class="kitchen-item-qty">الكمية: ${this.convertToArabicNumerals(
                      item.quantity.toString()
                    )} | Qty: ${item.quantity}</div>
                    ${
                      item.notes
                        ? `<div class="kitchen-item-notes">ملاحظات: ${item.notes}</div>`
                        : ""
                    }
                </div>
            `
              )
              .join("")}
        </div>

        <div class="footer">
            <div>💫 حضّر بعناية - Prepare with care</div>
            <div>${now.toLocaleString()}</div>
        </div>
    </body>
    </html>
    `;
  }
}

// Export the service
const printingService = new PrintingService();
export default printingService;
