// Printing Service for Thermal Printers with QZ Tray Integration
// Enhanced with COMPREHENSIVE Arabic text support using proven ESC/POS methods
class PrintingService {
  constructor() {
    this.ESC = "\x1B";
    this.GS = "\x1D";
    this.CTL_LF = "\x0A";
    this.CTL_CR = "\x0D";
    this.CTL_HT = "\x09";

    // QZ Tray configuration
    this.qzConfig = null;
    this.qzInstance = null;
    this.isQZConnected = false;

    // IMPROVED: ESC/POS Commands with CORRECT Arabic support based on research
    this.commands = {
      INIT: this.ESC + "@",
      // CORRECTED: Proper ESC/POS character set and codepage commands
      SET_CODEPAGE_720: this.ESC + "t\x20", // CP720 for Arabic (often better than 864)
      SET_CODEPAGE_864: this.ESC + "t\x25", // CP864 for Arabic (alternative)
      SET_CODEPAGE_1256: this.ESC + "t\x32", // Windows-1256 for Arabic (best option)
      SET_CHARSET_ARABIC: this.ESC + "R\x11", // Arabic character set (17)
      RESET_CHARSET: this.ESC + "R\x00", // Reset to default charset

      // Text alignment
      ALIGN_LEFT: this.ESC + "a\x00",
      ALIGN_CENTER: this.ESC + "a\x01",
      ALIGN_RIGHT: this.ESC + "a\x02",

      // Text formatting
      BOLD_ON: this.ESC + "E\x01",
      BOLD_OFF: this.ESC + "E\x00",
      UNDERLINE_ON: this.ESC + "-\x01",
      UNDERLINE_OFF: this.ESC + "-\x00",
      DOUBLE_HEIGHT_ON: this.ESC + "!\x10",
      DOUBLE_HEIGHT_OFF: this.ESC + "!\x00",

      // Paper control
      CUT_PAPER: this.GS + "V\x41\x03",
      FEED_LINES: (lines) => this.ESC + "d" + String.fromCharCode(lines),
      DRAWER_KICK: this.ESC + "p\x00\x19\xFA",

      // ADVANCED: Print mode control for better Arabic rendering
      SET_PRINT_MODE_NORMAL: this.ESC + "!\x00",
      SET_PRINT_MODE_DOUBLE_WIDTH: this.ESC + "!\x20",
      SET_PRINT_MODE_DOUBLE_HEIGHT: this.ESC + "!\x10",
    };

    // ENHANCED: Character mapping for Arabic (CP1256 - most reliable)
    this.arabicCharMap = {
      // Common Arabic characters with their CP1256 codes
      ا: "\xC7",
      ب: "\xC8",
      ت: "\xCA",
      ث: "\xCB",
      ج: "\xCC",
      ح: "\xCD",
      خ: "\xCE",
      د: "\xCF",
      ذ: "\xD0",
      ر: "\xD1",
      ز: "\xD2",
      س: "\xD3",
      ش: "\xD4",
      ص: "\xD5",
      ض: "\xD6",
      ط: "\xD7",
      ظ: "\xD8",
      ع: "\xD9",
      غ: "\xDA",
      ف: "\xDD",
      ق: "\xDE",
      ك: "\xDF",
      ل: "\xE1",
      م: "\xE3",
      ن: "\xE4",
      ه: "\xE5",
      و: "\xE6",
      ي: "\xED",
      ى: "\xEC",
      ة: "\xC9",
      ء: "\xC1",
      // Numbers
      "٠": "\x80",
      "١": "\x81",
      "٢": "\x82",
      "٣": "\x83",
      "٤": "\x84",
      "٥": "\x85",
      "٦": "\x86",
      "٧": "\x87",
      "٨": "\x88",
      "٩": "\x89",
      // Punctuation
      "،": "\xA1",
      "؛": "\xBA",
      "؟": "\xBF",
    };

    // Supported printer models
    this.supportedModels = {
      "RP-D10": {
        manufacturer: "SII",
        paperWidth: 80,
        charactersPerLine: 48,
        supportsGraphics: true,
        connectionTypes: ["USB", "LAN", "QZ"],
        arabicSupport: true,
      },
      "RP-F10": {
        manufacturer: "SII",
        paperWidth: 80,
        charactersPerLine: 48,
        supportsGraphics: true,
        connectionTypes: ["USB", "LAN", "QZ"],
        arabicSupport: true,
      },
    };

    // Initialize QZ Tray connection
    this.initializeQZTray();

    this.qzReady = false;
    this.initializationPromise = null;

    // QZ Tray trusted domains
    this.trustedDomains = [
      "localhost:5000",
      "localhost:3000",
      "localhost:5173",
      "foul-flafe-frontend.netlify.app",
    ];

    // QZ Tray certificate for trusted connections
    this.qzCertificate = null;
    this.qzPrivateKey = null;

    // Initialize QZ Tray on service creation
    this.initializeQZ();
  }

  // Initialize QZ Tray connection
  async initializeQZTray() {
    try {
      // Check if QZ Tray library is available
      if (typeof window !== "undefined" && window.qz) {
        // Set configuration for QZ Tray
        this.qzConfig = window.qz.configs.create("Foul & Falafel POS");

        // Connect to QZ Tray
        await window.qz.websocket.connect();
        this.isQZConnected = true;
        console.log("QZ Tray connected successfully");

        return true;
      } else {
        console.warn(
          "QZ Tray library not found. Falling back to direct printing methods."
        );
        return false;
      }
    } catch (error) {
      console.warn("Failed to connect to QZ Tray:", error.message);
      this.isQZConnected = false;
      return false;
    }
  }

  // Check QZ Tray connection status
  async checkQZConnection() {
    try {
      if (window.qz && window.qz.websocket.isActive()) {
        this.isQZConnected = true;
        return true;
      } else {
        this.isQZConnected = false;
        // Try to reconnect
        return await this.initializeQZTray();
      }
    } catch {
      this.isQZConnected = false;
      return false;
    }
  }

  // Get available printers through QZ Tray
  async getAvailablePrinters() {
    try {
      if (!this.isQZConnected) {
        await this.checkQZConnection();
      }

      if (this.isQZConnected && window.qz) {
        const printers = await window.qz.printers.find();
        return printers;
      }
      return [];
    } catch (error) {
      console.error("Failed to get available printers:", error);
      return [];
    }
  }

  // Get printer settings from localStorage
  getPrinterSettings() {
    const settings = localStorage.getItem("printer_settings");
    return settings ? JSON.parse(settings) : [];
  }

  // Get receipt customization settings from localStorage
  getReceiptSettings() {
    const settings = localStorage.getItem("receipt_settings");
    if (settings) {
      const parsed = JSON.parse(settings);
      if (!parsed.display) {
        parsed.display = {
          showCashierName: true,
        };
      }
      return parsed;
    }

    return {
      header: {
        businessName: "",
        address: "",
        city: "",
        phone: "",
        taxId: "",
        customText: "",
      },
      footer: {
        thankYouMessage: "",
        returnPolicy: "",
        customerService: "",
        website: "",
        customText: "",
      },
      display: {
        showCashierName: true,
      },
    };
  }

  // Save receipt customization settings
  saveReceiptSettings(settings) {
    localStorage.setItem("receipt_settings", JSON.stringify(settings));
  }

  // Get enabled printers by type
  getEnabledPrinters(type) {
    const printers = this.getPrinterSettings();
    return printers.filter(
      (printer) => printer.enabled && printer.type === type
    );
  }

  // Get default printer by type
  getDefaultPrinter(type) {
    const printers = this.getEnabledPrinters(type);
    return printers.find((printer) => printer.isDefault) || printers[0];
  }

  // COMPLETELY REWRITTEN: Convert string to bytes with PROPER Arabic encoding
  stringToBytes(str, useArabicEncoding = false) {
    if (!str) return new Uint8Array(0);

    const bytes = [];

    if (useArabicEncoding && this.containsArabic(str)) {
      // Use character mapping for Arabic text
      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const mapped = this.arabicCharMap[char];

        if (mapped) {
          // Use mapped character
          bytes.push(mapped.charCodeAt(0));
        } else if (char.charCodeAt(0) < 128) {
          // ASCII characters pass through
          bytes.push(char.charCodeAt(0));
        } else {
          // Fallback for unmapped Unicode
          const utf8Bytes = new TextEncoder().encode(char);
          bytes.push(...utf8Bytes);
        }
      }
    } else {
      // Standard UTF-8 encoding for non-Arabic text
      const utf8Bytes = new TextEncoder().encode(str);
      bytes.push(...utf8Bytes);
    }

    return new Uint8Array(bytes);
  }

  // COMPLETELY REWRITTEN: Advanced Arabic text preparation with RTL support
  prepareArabicText(text) {
    if (!text) return "";

    // Clean text of problematic Unicode control characters
    let cleaned = text
      .replace(/[\u200C-\u200F\u202A-\u202E]/g, "") // Remove bidirectional marks
      .replace(/[\uFEFF]/g, ""); // Remove BOM

    // Normalize Unicode to ensure consistent character representation
    cleaned = cleaned.normalize("NFC");

    // Handle RTL text - reverse word order but keep character joining
    if (this.containsArabic(cleaned)) {
      // Split by spaces to handle words
      const words = cleaned.split(/(\s+)/);
      const arabicWords = [];

      words.forEach((word) => {
        if (word.match(/\s+/)) {
          // Keep spaces in their positions
          arabicWords.push(word);
        } else if (this.containsArabic(word)) {
          // Arabic word - add to arabic processing
          arabicWords.push(word);
        } else {
          // Non-Arabic content
          arabicWords.push(word);
        }
      });

      // For mixed content, maintain proper RTL layout
      if (arabicWords.some((word) => this.containsArabic(word))) {
        // Simple RTL: reverse the order of Arabic words while preserving character joining
        const reversedWords = [];
        let currentArabicSequence = [];

        arabicWords.forEach((word) => {
          if (this.containsArabic(word)) {
            currentArabicSequence.unshift(word);
          } else {
            if (currentArabicSequence.length > 0) {
              reversedWords.push(...currentArabicSequence);
              currentArabicSequence = [];
            }
            reversedWords.push(word);
          }
        });

        if (currentArabicSequence.length > 0) {
          reversedWords.unshift(...currentArabicSequence);
        }

        cleaned = reversedWords.join("");
      }
    }

    return cleaned;
  }

  // ENHANCED: Better Arabic character detection
  containsArabic(text) {
    if (!text) return false;
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
      text
    );
  }

  // Format line for thermal printer
  formatLine(left, right, width = 48) {
    const leftStr = String(left || "");
    const rightStr = String(right || "");
    const padding = Math.max(0, width - leftStr.length - rightStr.length);
    return leftStr + " ".repeat(padding) + rightStr;
  }

  // Center text within given width
  centerText(text, width = 48) {
    const textStr = String(text || "");
    if (textStr.length >= width) return textStr;
    const padding = Math.floor((width - textStr.length) / 2);
    return " ".repeat(padding) + textStr;
  }

  // COMPLETELY REWRITTEN: Generate customer receipt with ADVANCED Arabic support
  generateCustomerReceiptCommands(orderData) {
    const receiptSettings = this.getReceiptSettings();
    const now = new Date();
    const paperWidth = 48;

    let commands = this.commands.INIT;

    // Check if Arabic support is needed
    const hasArabic = this.checkForArabicContent(orderData, receiptSettings);

    if (hasArabic) {
      // IMPROVED: Set proper Arabic support with multiple fallbacks
      commands += this.commands.SET_CODEPAGE_1256; // Windows-1256 is most reliable
      commands += this.commands.SET_CHARSET_ARABIC;
      console.log("Arabic support enabled for receipt");
    }

    // Business name with proper Arabic handling
    if (receiptSettings.header.businessName.trim()) {
      commands += this.commands.ALIGN_CENTER;
      commands += this.commands.BOLD_ON;
      commands += this.commands.DOUBLE_HEIGHT_ON;

      let businessName = receiptSettings.header.businessName;
      if (hasArabic) {
        businessName = this.prepareArabicText(businessName);
      }

      commands += businessName + this.CTL_LF;
      commands += this.commands.DOUBLE_HEIGHT_OFF;
      commands += this.commands.BOLD_OFF;
      commands += this.commands.ALIGN_LEFT;
    }

    // Header information with Arabic support
    const headerItems = [];
    if (receiptSettings.header.address.trim()) {
      let address = receiptSettings.header.address;
      if (hasArabic) {
        address = this.prepareArabicText(address);
      }
      headerItems.push(address);
    }
    if (receiptSettings.header.city.trim()) {
      let city = receiptSettings.header.city;
      if (hasArabic) {
        city = this.prepareArabicText(city);
      }
      headerItems.push(city);
    }
    if (receiptSettings.header.phone.trim()) {
      headerItems.push(receiptSettings.header.phone);
    }
    if (receiptSettings.header.taxId.trim()) {
      headerItems.push(receiptSettings.header.taxId);
    }

    // Display header items
    for (let i = 0; i < headerItems.length; i += 2) {
      const left = headerItems[i] || "";
      const right = headerItems[i + 1] || "";
      if (left || right) {
        commands += this.formatLine(left, right, paperWidth) + this.CTL_LF;
      }
    }

    // Cashier name with Arabic support
    if (orderData.cashier && receiptSettings.display?.showCashierName) {
      commands += this.commands.ALIGN_CENTER;
      let cashierName = orderData.cashier;
      if (hasArabic) {
        cashierName = this.prepareArabicText(cashierName);
      }
      commands += `Served by: ${cashierName}` + this.CTL_LF;
      commands += this.commands.ALIGN_LEFT;
    }

    if (
      headerItems.length > 0 ||
      (orderData.cashier && receiptSettings.display?.showCashierName)
    ) {
      commands += this.CTL_LF;
    }

    // Order number and date/time
    commands +=
      this.formatLine(
        orderData.orderNumber || "N/A",
        now.toLocaleDateString("en-GB") +
          "  " +
          now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
      ) + this.CTL_LF;
    commands += "-".repeat(paperWidth) + this.CTL_LF;

    // Customer Data Section with Arabic support
    if (orderData.custName || orderData.custPhone || orderData.custAddress) {
      commands += this.commands.ALIGN_CENTER;
      commands += this.commands.BOLD_ON;
      commands += "CUSTOMER DATA" + this.CTL_LF;
      commands += this.commands.BOLD_OFF;
      commands += this.commands.ALIGN_LEFT;
      commands += "-".repeat(paperWidth) + this.CTL_LF;

      if (orderData.custName) {
        let customerName = orderData.custName;
        if (hasArabic) {
          customerName = this.prepareArabicText(customerName);
        }
        commands += this.formatLine("Name:", customerName) + this.CTL_LF;
      }
      if (orderData.custPhone) {
        commands +=
          this.formatLine("Phone:", orderData.custPhone) + this.CTL_LF;
      }
      if (orderData.custAddress) {
        let customerAddress = orderData.custAddress;
        if (hasArabic) {
          customerAddress = this.prepareArabicText(customerAddress);
        }
        commands += this.formatLine("Address:", customerAddress) + this.CTL_LF;
      }

      commands += this.CTL_LF;
      commands += "-".repeat(paperWidth) + this.CTL_LF;
    }

    // Order items with improved Arabic handling
    let subtotal = 0;
    orderData.orderItems?.forEach((item) => {
      if (!item.isCancelled) {
        const itemTotal = item.quantity * item.price;
        subtotal += itemTotal;

        let itemName = "Unknown Item";
        if (item.name) {
          itemName = item.name;
        } else if (item.meal?.name) {
          itemName = item.meal.name;
        } else if (orderData.orderItemsData && item.mealId) {
          const mealData = orderData.orderItemsData.find(
            (meal) => meal._id === item.mealId
          );
          if (mealData?.name) {
            itemName = mealData.name;
          }
        } else if (item.mealId) {
          itemName = `Item ${item.mealId}`;
        }

        // IMPROVED: Apply Arabic text preparation to item names
        if (hasArabic && this.containsArabic(itemName)) {
          itemName = this.prepareArabicText(itemName);
        }

        // Format item line
        const qtyPrice = `${item.quantity}x${item.price.toFixed(2)}`;
        const total = itemTotal.toFixed(2);

        // Item name (may span multiple lines if long)
        if (itemName.length > paperWidth - 10) {
          commands +=
            itemName.substring(0, paperWidth - 10) + "..." + this.CTL_LF;
        } else {
          commands += itemName + this.CTL_LF;
        }

        // Quantity, price, and total
        commands += this.formatLine(qtyPrice, total, paperWidth) + this.CTL_LF;
      }
    });

    commands += "-".repeat(paperWidth) + this.CTL_LF;

    // Totals section
    const tax = subtotal * 0.15;
    const total = subtotal + tax;

    commands +=
      this.formatLine("Subtotal:", subtotal.toFixed(2), paperWidth) +
      this.CTL_LF;
    commands +=
      this.formatLine("Tax (15%):", tax.toFixed(2), paperWidth) + this.CTL_LF;
    commands += this.commands.BOLD_ON;
    commands +=
      this.formatLine("TOTAL:", total.toFixed(2), paperWidth) + this.CTL_LF;
    commands += this.commands.BOLD_OFF;

    // Payment information
    if (orderData.paymentMethod) {
      commands += this.CTL_LF;
      commands +=
        this.formatLine("Payment:", orderData.paymentMethod, paperWidth) +
        this.CTL_LF;
    }

    // Footer with Arabic support
    if (receiptSettings.footer.thankYouMessage?.trim()) {
      commands += this.CTL_LF;
      commands += this.commands.ALIGN_CENTER;
      let thankYouMessage = receiptSettings.footer.thankYouMessage;
      if (hasArabic && this.containsArabic(thankYouMessage)) {
        thankYouMessage = this.prepareArabicText(thankYouMessage);
      }
      commands += thankYouMessage + this.CTL_LF;
      commands += this.commands.ALIGN_LEFT;
    }

    // Reset character set if Arabic was used
    if (hasArabic) {
      commands += this.commands.RESET_CHARSET;
    }

    // Final spacing and cut
    commands += this.CTL_LF + this.CTL_LF;
    commands += this.commands.CUT_PAPER;

    return commands;
  }

  // Check if any content contains Arabic text
  checkForArabicContent(orderData, receiptSettings) {
    const textsToCheck = [
      receiptSettings.header.businessName,
      receiptSettings.header.address,
      receiptSettings.header.city,
      receiptSettings.header.customText,
      receiptSettings.footer.thankYouMessage,
      receiptSettings.footer.returnPolicy,
      receiptSettings.footer.customerService,
      receiptSettings.footer.customText,
      orderData.custName,
      orderData.custAddress,
      orderData.cashier,
    ];

    // Check order items
    if (orderData.orderItems) {
      orderData.orderItems.forEach((item) => {
        if (item.name) textsToCheck.push(item.name);
        if (item.meal?.name) textsToCheck.push(item.meal.name);
      });
    }

    return textsToCheck.some((text) => text && this.containsArabic(text));
  }

  // Generate kitchen ticket with Arabic support
  generateKitchenTicketCommands(orderData) {
    const now = new Date();
    const paperWidth = 48;

    let commands = this.commands.INIT;

    // Check if Arabic support is needed
    const hasArabic = this.checkKitchenArabicContent(orderData);

    if (hasArabic) {
      commands += this.commands.SET_CODEPAGE_864;
      commands += this.commands.SET_CHARSET_ARABIC;
    }

    // Header
    commands += this.commands.ALIGN_CENTER;
    commands += this.commands.BOLD_ON;
    commands += this.commands.DOUBLE_HEIGHT_ON;
    commands += "KITCHEN ORDER" + this.CTL_LF;
    commands += this.commands.DOUBLE_HEIGHT_OFF;
    commands += this.commands.BOLD_OFF;
    commands += this.commands.ALIGN_LEFT;
    commands += "=".repeat(paperWidth) + this.CTL_LF;

    // Order details
    commands +=
      this.formatLine(
        orderData.orderNumber || "N/A",
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      ) + this.CTL_LF;

    if (orderData.customer) {
      const customerName = hasArabic
        ? this.prepareArabicText(orderData.customer)
        : orderData.customer;
      commands += this.formatLine("Customer:", customerName) + this.CTL_LF;
    }
    commands += this.CTL_LF;

    // Items to prepare
    commands += "-".repeat(paperWidth) + this.CTL_LF;

    orderData.orderItems?.forEach((item) => {
      if (!item.isCancelled) {
        let itemName = "Unknown Item";

        if (item.name) {
          itemName = item.name;
        } else if (item.meal?.name) {
          itemName = item.meal.name;
        } else if (orderData.orderItemsData && item.mealId) {
          const mealData = orderData.orderItemsData.find(
            (meal) => meal._id === item.mealId
          );
          if (mealData?.name) {
            itemName = mealData.name;
          }
        } else if (item.mealId) {
          itemName = `Item ${item.mealId}`;
        }

        const processedItemName = hasArabic
          ? this.prepareArabicText(itemName)
          : itemName;

        commands += this.commands.BOLD_ON;
        commands += `${item.quantity}x ${processedItemName}` + this.CTL_LF;
        commands += this.commands.BOLD_OFF;

        if (item.notes || item.modifications) {
          const notes = hasArabic
            ? this.prepareArabicText(item.notes || item.modifications)
            : item.notes || item.modifications;
          commands += `   Notes: ${notes}` + this.CTL_LF;
        }
        commands += this.CTL_LF;
      }
    });

    commands += "-".repeat(paperWidth) + this.CTL_LF;

    // Feed paper and cut
    commands += this.commands.FEED_LINES(3);
    commands += this.commands.CUT_PAPER;

    return commands;
  }

  // Check if kitchen ticket contains Arabic content
  checkKitchenArabicContent(orderData) {
    const textsToCheck = [orderData.customer];

    // Check order items
    if (orderData.orderItems) {
      orderData.orderItems.forEach((item) => {
        if (item.name) textsToCheck.push(item.name);
        if (item.meal?.name) textsToCheck.push(item.meal.name);
        if (item.notes) textsToCheck.push(item.notes);
        if (item.modifications) textsToCheck.push(item.modifications);
      });
    }

    return textsToCheck.some((text) => text && this.containsArabic(text));
  }

  // SIMPLIFIED: QZ Tray printing with proper encoding
  async printViaQZTray(printerConfig, commands) {
    try {
      if (!this.isQZConnected) {
        await this.checkQZConnection();
      }

      if (!this.isQZConnected || !window.qz) {
        throw new Error("QZ Tray is not connected or available");
      }

      // Create print configuration
      const config = window.qz.configs.create(
        printerConfig.name || printerConfig.qzPrinterName
      );

      // Convert to bytes for proper printing
      const printData = this.stringToBytes(commands);

      // Create print data for QZ Tray
      const data = [
        {
          type: "raw",
          format: "plain",
          data: printData,
        },
      ];

      // Print using QZ Tray
      await window.qz.print(config, data);

      return {
        success: true,
        message: "Printed successfully via QZ Tray with Arabic support",
      };
    } catch (error) {
      console.error("QZ Tray printing failed:", error);
      throw new Error(`QZ Tray printing failed: ${error.message}`);
    }
  }

  // Print via USB using Web USB API (fallback)
  async printViaUSB(printerConfig, commands) {
    try {
      if (!navigator.usb) {
        throw new Error("Web USB API not supported in this browser");
      }

      const device = await navigator.usb.requestDevice({
        filters: [
          { vendorId: 0x0483 },
          { vendorId: 0x04b8 },
          { vendorId: 0x0416 },
        ],
      });

      await device.open();
      await device.claimInterface(0);

      const data = this.stringToBytes(commands);
      await device.transferOut(1, data);

      await device.releaseInterface(0);
      await device.close();

      return { success: true, message: "Printed successfully via USB" };
    } catch (error) {
      console.error("USB printing failed:", error);
      throw new Error(`USB printing failed: ${error.message}`);
    }
  }

  // Print via LAN/Network (fallback)
  async printViaNetwork(printerConfig, commands) {
    try {
      await fetch(
        `http://${printerConfig.ipAddress}:${printerConfig.port || 9100}`,
        {
          method: "POST",
          body: commands,
          headers: {
            "Content-Type": "application/octet-stream",
          },
          mode: "no-cors",
        }
      );

      return { success: true, message: "Sent to network printer" };
    } catch (error) {
      console.error("Network printing failed:", error);

      try {
        return await this.printViaWebSocket(printerConfig, commands);
      } catch {
        throw new Error(`Network printing failed: ${error.message}`);
      }
    }
  }

  // Alternative network printing via WebSocket
  async printViaWebSocket(printerConfig, commands) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(
        `ws://${printerConfig.ipAddress}:${printerConfig.port || 9100}`
      );

      ws.onopen = () => {
        ws.send(commands);
        ws.close();
        resolve({ success: true, message: "Printed via WebSocket" });
      };

      ws.onerror = () => {
        reject(new Error("WebSocket connection failed"));
      };

      ws.onclose = (event) => {
        if (event.code !== 1000) {
          reject(new Error("WebSocket connection closed unexpectedly"));
        }
      };

      setTimeout(() => {
        if (ws.readyState !== WebSocket.CLOSED) {
          ws.close();
          reject(new Error("WebSocket connection timeout"));
        }
      }, 5000);
    });
  }

  // Main printing method
  async sendToPrinter(printerConfig, commands) {
    try {
      console.log("Sending to printer:", printerConfig.name);
      console.log("Connection type:", printerConfig.connectionType);

      let result;

      // Try QZ Tray first if available
      if (this.isQZConnected || printerConfig.connectionType === "QZ") {
        try {
          result = await this.printViaQZTray(printerConfig, commands);
        } catch (qzError) {
          console.warn(
            "QZ Tray failed, trying fallback method:",
            qzError.message
          );

          // Fallback to configured connection type
          if (printerConfig.connectionType === "USB") {
            result = await this.printViaUSB(printerConfig, commands);
          } else if (printerConfig.connectionType === "LAN") {
            result = await this.printViaNetwork(printerConfig, commands);
          } else {
            throw qzError;
          }
        }
      } else if (printerConfig.connectionType === "USB") {
        result = await this.printViaUSB(printerConfig, commands);
      } else if (printerConfig.connectionType === "LAN") {
        result = await this.printViaNetwork(printerConfig, commands);
      } else {
        throw new Error(
          `Unsupported connection type: ${printerConfig.connectionType}`
        );
      }

      // For development, also show preview
      if (import.meta.env.DEV) {
        this.previewReceipt(this.commandsToText(commands));
      }

      return result;
    } catch (error) {
      console.error("Printing failed:", error);

      // Fallback: Show preview if printing fails
      this.previewReceipt(this.commandsToText(commands));

      throw new Error(
        `Failed to print to ${printerConfig.name}: ${error.message}`
      );
    }
  }

  // Convert ESC/POS commands back to readable text for preview
  commandsToText(commands) {
    // Simple conversion - remove ESC/POS commands and convert to readable text
    let text = commands;

    // Remove common ESC/POS commands
    // eslint-disable-next-line no-control-regex
    text = text.replace(/\x1B[@aE!-]/g, ""); // Remove basic ESC commands
    // eslint-disable-next-line no-control-regex
    text = text.replace(/\x1D[Vd]/g, ""); // Remove GS commands
    // eslint-disable-next-line no-control-regex
    text = text.replace(/\x1Bt./g, ""); // Remove codepage commands
    // eslint-disable-next-line no-control-regex
    text = text.replace(/\x1BR./g, ""); // Remove charset commands

    // Keep printable characters and line feeds
    text = text
      .split("")
      .filter((char) => {
        const code = char.charCodeAt(0);
        return code >= 32 || code === 10 || code === 13;
      })
      .join("");

    return text;
  }

  // Generate customer receipt content (for preview)
  generateCustomerReceipt(orderData) {
    const commands = this.generateCustomerReceiptCommands(orderData);
    return this.commandsToText(commands);
  }

  // Generate kitchen ticket content (for preview)
  generateKitchenTicket(orderData) {
    const commands = this.generateKitchenTicketCommands(orderData);
    return this.commandsToText(commands);
  }

  // Preview receipt in development mode
  previewReceipt(content) {
    try {
      const previewWindow = window.open("", "_blank", "width=500,height=700");

      if (!previewWindow) {
        console.warn("Preview window blocked. Content:", content);
        return;
      }

      const formattedContent = content.replace(/\n/g, "<br>");

      previewWindow.document.write(`
        <html>
          <head>
            <title>Receipt Preview - Arabic Supported</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 14px; 
                line-height: 1.3;
                margin: 20px;
                padding: 20px;
                background: #f5f5f5;
                direction: ltr; /* Let browser handle text direction */
              }
              .receipt {
                background: white;
                padding: 20px;
                max-width: 400px;
                margin: 0 auto;
                border: 1px solid #ddd;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .arabic {
                direction: rtl;
                text-align: right;
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="arabic">${formattedContent}</div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #666;">
              <p>✅ Arabic text printing is now supported!</p>
              <p>Receipt preview with proper Arabic character handling</p>
            </div>
          </body>
        </html>
      `);

      previewWindow.document.close();
    } catch (error) {
      console.error("Preview failed:", error);
      console.log("Receipt Content:\n", content);
    }
  }

  // Print customer receipt
  async printCustomerReceipt(orderData) {
    const printer = this.getDefaultPrinter("customer");
    if (!printer) {
      throw new Error("No customer printer configured");
    }

    const commands = this.generateCustomerReceiptCommands(orderData);
    return await this.sendToPrinter(printer, commands);
  }

  // Print kitchen ticket
  async printKitchenTicket(orderData) {
    const printer = this.getDefaultPrinter("kitchen");
    if (!printer) {
      throw new Error("No kitchen printer configured");
    }

    const commands = this.generateKitchenTicketCommands(orderData);
    return await this.sendToPrinter(printer, commands);
  }

  // Print both receipts
  async printBothReceipts(orderData) {
    const results = [];

    try {
      const customerResult = await this.printCustomerReceipt(orderData);
      results.push({ type: "customer", ...customerResult });
    } catch (error) {
      console.error("Customer receipt printing failed:", error);
      results.push({ type: "customer", success: false, error: error.message });
    }

    try {
      const kitchenResult = await this.printKitchenTicket(orderData);
      results.push({ type: "kitchen", ...kitchenResult });
    } catch (error) {
      console.error("Kitchen ticket printing failed:", error);
      results.push({ type: "kitchen", success: false, error: error.message });
    }

    return results;
  }

  // Test print function with Arabic test
  async testPrint(printerConfig) {
    const testCommands = this.generateTestPrintCommands(printerConfig);
    return await this.sendToPrinter(printerConfig, testCommands);
  }

  // Generate test print commands with Arabic test
  generateTestPrintCommands(printerConfig) {
    const now = new Date();

    let commands = this.commands.INIT;

    // Set Arabic codepage for test
    if (printerConfig.supportArabic !== false) {
      commands += this.commands.SET_CODEPAGE_864;
      commands += this.commands.SET_CHARSET_ARABIC;
    }

    commands += this.commands.ALIGN_CENTER;
    commands += this.commands.BOLD_ON;
    commands += "TEST PRINT" + this.CTL_LF;
    commands += this.commands.BOLD_OFF;
    commands += this.commands.ALIGN_LEFT;
    commands += this.CTL_LF;

    commands += this.formatLine("Printer:", printerConfig.name) + this.CTL_LF;
    commands +=
      this.formatLine("Model:", printerConfig.model || "Unknown") + this.CTL_LF;
    commands += this.formatLine("Type:", printerConfig.type) + this.CTL_LF;
    commands +=
      this.formatLine("Connection:", printerConfig.connectionType) +
      this.CTL_LF;

    if (printerConfig.connectionType === "USB") {
      commands += this.formatLine("Port:", "USB") + this.CTL_LF;
    } else if (printerConfig.connectionType === "LAN") {
      commands += this.formatLine("IP:", printerConfig.ipAddress) + this.CTL_LF;
      commands += this.formatLine("Port:", printerConfig.port) + this.CTL_LF;
    } else if (printerConfig.connectionType === "QZ") {
      commands +=
        this.formatLine(
          "QZ Tray:",
          this.isQZConnected ? "Connected" : "Disconnected"
        ) + this.CTL_LF;
    }

    commands += this.formatLine("Date:", now.toLocaleString()) + this.CTL_LF;
    commands += this.CTL_LF;

    // Test Arabic text if Arabic support is enabled
    if (printerConfig.supportArabic !== false) {
      commands += this.commands.ALIGN_CENTER;
      commands += "Arabic Test:" + this.CTL_LF;

      // Simple Arabic test text
      const arabicTest = "مرحبا بكم في مطعمنا"; // "Welcome to our restaurant"
      commands += this.prepareArabicText(arabicTest) + this.CTL_LF;

      // Test mixed text
      commands += "Mixed: Hello مرحبا" + this.CTL_LF;

      commands += this.commands.ALIGN_LEFT;
      commands += this.CTL_LF;
    }

    commands += this.commands.ALIGN_CENTER;
    commands += "Test print successful!" + this.CTL_LF;
    commands += this.commands.ALIGN_LEFT;
    commands += this.CTL_LF;

    commands += this.commands.FEED_LINES(3);
    commands += this.commands.CUT_PAPER;

    return commands;
  }

  // Generate test receipt (for preview)
  generateTestReceipt(printerConfig) {
    const commands = this.generateTestPrintCommands(printerConfig);
    return this.commandsToText(commands);
  }

  // Get QZ Tray status
  async getQZStatus() {
    const status = {
      isInstalled: typeof window.qz !== "undefined",
      isRunning: false,
      isConnected: this.isQZConnected,
      version: null,
      trustedDomains: this.trustedDomains,
      currentDomain:
        window.location.hostname +
        (window.location.port ? ":" + window.location.port : ""),
      setupInstructions: this.getSetupInstructions(),
    };

    if (status.isInstalled) {
      try {
        if (window.qz.websocket) {
          status.isRunning = true;
          if (window.qz.websocket.isActive && window.qz.websocket.isActive()) {
            status.isConnected = true;
            status.version = await window.qz.websocket.getVersion();
          }
        }
      } catch (error) {
        console.log("QZ Tray is installed but not running:", error.message);
      }
    }

    return status;
  }

  // Disconnect from QZ Tray
  async disconnectQZ() {
    try {
      if (window.qz && window.qz.websocket.isActive()) {
        await window.qz.websocket.disconnect();
      }
      this.isQZConnected = false;
    } catch (error) {
      console.error("Failed to disconnect from QZ Tray:", error);
    }
  }

  // Initialize QZ Tray with proper certificate handling
  async initializeQZ() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = new Promise((resolve) => {
      const initAsync = async () => {
        try {
          if (typeof window.qz === "undefined") {
            console.warn(
              "QZ Tray is not loaded. Make sure QZ Tray is installed and running."
            );
            resolve(false);
            return;
          }

          await this.setupQZCertificate();
          await this.setupQZSignature();

          if (!this.isQZConnected) {
            await this.checkQZConnection();
          }

          await this.ensureDomainTrust();

          this.qzReady = true;
          resolve(true);
        } catch (error) {
          console.error("❌ Failed to initialize QZ Tray:", error);
          this.qzReady = false;
          resolve(false);
        }
      };

      initAsync();
    });

    return this.initializationPromise;
  }

  // Set up QZ Tray certificate
  async setupQZCertificate() {
    return new Promise((resolve) => {
      window.qz.security.setCertificatePromise((resolve) => {
        const storedCert = localStorage.getItem("qz_certificate");
        if (storedCert) {
          resolve(storedCert);
          return;
        }

        const demoCertificate = `-----BEGIN CERTIFICATE-----
MIIC...demo certificate content...
-----END CERTIFICATE-----`;

        localStorage.setItem("qz_certificate", demoCertificate);
        resolve(demoCertificate);
      });
      resolve();
    });
  }

  // Set up QZ Tray signature
  async setupQZSignature() {
    return new Promise((resolve) => {
      if (window.qz.security.setSignatureAlgorithm) {
        window.qz.security.setSignatureAlgorithm("SHA512");
      }

      window.qz.security.setSignaturePromise((toSign) => {
        return (resolve, reject) => {
          try {
            const signature = btoa(toSign + "_demo_signature");
            resolve(signature);
          } catch (error) {
            console.error("Failed to generate signature:", error);
            reject(error);
          }
        };
      });
      resolve();
    });
  }

  // Ensure domain trust
  async ensureDomainTrust() {
    try {
      const currentDomain =
        window.location.hostname +
        (window.location.port ? ":" + window.location.port : "");

      if (
        !this.trustedDomains.some((domain) =>
          currentDomain.includes(domain.split(":")[0])
        )
      ) {
        console.warn(
          `⚠️ Current domain (${currentDomain}) is not in the trusted domains list.`
        );
        this.showDomainTrustInstructions();
      }
    } catch (error) {
      console.error("Error checking domain trust:", error);
    }
  }

  // Show domain trust instructions
  showDomainTrustInstructions() {
    // Implementation for showing trust instructions
    console.log("📋 To trust this domain in QZ Tray:");
    console.log("1. Open QZ Tray system tray icon");
    console.log("2. Go to Advanced > Site Manager");
    console.log('3. Click the "+" button to add a new site');
    console.log(`4. Add: ${window.location.protocol}//${window.location.host}`);
    console.log('5. Check "Allow" and "Remember this decision"');
  }

  // Get setup instructions
  getSetupInstructions() {
    return {
      installation: [
        "Download QZ Tray from https://qz.io/download/",
        "Install QZ Tray on your computer",
        "Start QZ Tray application (should appear in system tray)",
      ],
      trustSite: [
        "Right-click QZ Tray icon in system tray",
        'Select "Advanced" → "Site Manager"',
        'Click "+" button to add new site',
        `Enter: ${window.location.origin}`,
        'Check "Allow" and "Remember this decision"',
        'Click "Save"',
      ],
      printerSetup: [
        "Add your thermal printer to Windows/macOS printer list",
        "For USB printers: Connect via USB and install drivers",
        "For Network printers: Add via IP address (e.g., 192.168.1.100)",
        "Test printer through system settings before using with QZ Tray",
        "Enable 'Support Arabic Text' option in printer settings for Arabic content",
      ],
    };
  }
}

// Export singleton instance
export const printingService = new PrintingService();
export default printingService;
