// Printing Service for Thermal Printers with QZ Tray Integration
// Enhanced with Arabic text support using CP864 codepage and proper character encoding
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

    // ESC/POS Commands with Arabic support
    this.commands = {
      INIT: this.ESC + "@",
      // Arabic codepage selection (CP864 - Arabic)
      SET_ARABIC_CODEPAGE: this.ESC + "t" + String.fromCharCode(21), // CP864
      SET_UTF8_CODEPAGE: this.ESC + "t" + String.fromCharCode(65), // UTF-8 codepage
      // Alternative Arabic codepage (CP1256 - Windows Arabic)
      SET_WINDOWS_ARABIC: this.ESC + "t" + String.fromCharCode(22), // CP1256
      // Character set selection for Arabic
      SELECT_ARABIC_CHARSET: this.ESC + "R" + String.fromCharCode(13), // Arabic character set
      // International character set
      SET_INTERNATIONAL_CHARSET: this.ESC + "R" + String.fromCharCode(0),
      ALIGN_LEFT: this.ESC + "a" + String.fromCharCode(0),
      ALIGN_CENTER: this.ESC + "a" + String.fromCharCode(1),
      ALIGN_RIGHT: this.ESC + "a" + String.fromCharCode(2),
      BOLD_ON: this.ESC + "E" + String.fromCharCode(1),
      BOLD_OFF: this.ESC + "E" + String.fromCharCode(0),
      UNDERLINE_ON: this.ESC + "-" + String.fromCharCode(1),
      UNDERLINE_OFF: this.ESC + "-" + String.fromCharCode(0),
      DOUBLE_HEIGHT_ON: this.ESC + "!" + String.fromCharCode(16),
      DOUBLE_HEIGHT_OFF: this.ESC + "!" + String.fromCharCode(0),
      CUT_PAPER:
        this.GS + "V" + String.fromCharCode(65) + String.fromCharCode(3),
      FEED_LINES: (lines) => this.ESC + "d" + String.fromCharCode(lines),
      DRAWER_KICK:
        this.ESC +
        "p" +
        String.fromCharCode(0) +
        String.fromCharCode(25) +
        String.fromCharCode(250),
      // Text direction for RTL languages like Arabic
      SET_RTL_MODE: this.ESC + "{" + String.fromCharCode(1),
      SET_LTR_MODE: this.ESC + "{" + String.fromCharCode(0),
    };

    // Supported printer models
    this.supportedModels = {
      "RP-D10": {
        manufacturer: "SII",
        paperWidth: 80,
        charactersPerLine: 48,
        supportsGraphics: true,
        connectionTypes: ["USB", "LAN", "QZ"],
      },
      "RP-F10": {
        manufacturer: "SII",
        paperWidth: 80,
        charactersPerLine: 48,
        supportsGraphics: true,
        connectionTypes: ["USB", "LAN", "QZ"],
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

  // Convert string to proper encoding for Arabic printing
  stringToBytes(str, useArabicEncoding = false) {
    try {
      if (useArabicEncoding) {
        // For Arabic text, try different encoding approaches
        return this.encodeArabicText(str);
      } else {
        // Use TextEncoder for UTF-8 encoding
        const encoder = new TextEncoder();
        return encoder.encode(str);
      }
    } catch (error) {
      console.error("Encoding error:", error);
      // Fallback to simple character code conversion
      return new Uint8Array(str.split("").map((char) => char.charCodeAt(0)));
    }
  }

  // Enhanced Arabic text encoding
  encodeArabicText(text) {
    try {
      // Method 1: Try UTF-8 encoding first
      const encoder = new TextEncoder();
      const utf8Bytes = encoder.encode(text);

      // Check if the text contains Arabic characters
      const hasArabic =
        /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
          text
        );

      if (hasArabic) {
        // Method 2: Convert to CP864 encoding for Arabic thermal printers
        return this.convertToCP864(text);
      }

      return utf8Bytes;
    } catch (error) {
      console.error("Arabic encoding error:", error);
      // Fallback: character by character conversion
      return this.fallbackArabicEncoding(text);
    }
  }

  // Convert text to CP864 (Arabic codepage) for thermal printers
  convertToCP864(text) {
    // CP864 character mapping for Arabic characters
    const cp864Map = {
      // Arabic letters mapping to CP864
      ا: 0xc7,
      ب: 0xc8,
      ت: 0xc9,
      ث: 0xca,
      ج: 0xcb,
      ح: 0xcc,
      خ: 0xcd,
      د: 0xce,
      ذ: 0xcf,
      ر: 0xd0,
      ز: 0xd1,
      س: 0xd2,
      ش: 0xd3,
      ص: 0xd4,
      ض: 0xd5,
      ط: 0xd6,
      ظ: 0xd7,
      ع: 0xd8,
      غ: 0xd9,
      ف: 0xda,
      ق: 0xdb,
      ك: 0xdc,
      ل: 0xdd,
      م: 0xde,
      ن: 0xdf,
      ه: 0xe0,
      و: 0xe1,
      ي: 0xe2,
      ة: 0xe3,
      ى: 0xe4,
      إ: 0xe5,
      أ: 0xe6,
      آ: 0xe7,
      ؤ: 0xe8,
      ئ: 0xe9,
      // Arabic numerals
      "٠": 0xf0,
      "١": 0xf1,
      "٢": 0xf2,
      "٣": 0xf3,
      "٤": 0xf4,
      "٥": 0xf5,
      "٦": 0xf6,
      "٧": 0xf7,
      "٨": 0xf8,
      "٩": 0xf9,
      // Common Arabic punctuation
      "،": 0xa1,
      "؍": 0xa2,
      "؎": 0xa3,
      "؏": 0xa4,
      "؟": 0xbf,
    };

    const bytes = [];
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (cp864Map[char]) {
        bytes.push(cp864Map[char]);
      } else if (char.charCodeAt(0) < 128) {
        // ASCII characters remain the same
        bytes.push(char.charCodeAt(0));
      } else {
        // Unknown Arabic character, try to find closest match or use replacement
        bytes.push(0x3f); // '?' character as fallback
      }
    }

    return new Uint8Array(bytes);
  }

  // Fallback Arabic encoding method
  fallbackArabicEncoding(text) {
    const bytes = [];
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const code = char.charCodeAt(0);

      if (code < 128) {
        // ASCII characters
        bytes.push(code);
      } else if (code >= 0x0600 && code <= 0x06ff) {
        // Arabic Unicode block - convert to printable range
        bytes.push(0xc0 + ((code - 0x0600) % 64));
      } else {
        // Other characters - use UTF-8 bytes
        const utf8 = new TextEncoder().encode(char);
        bytes.push(...utf8);
      }
    }

    return new Uint8Array(bytes);
  }

  // Enhanced text preparation for Arabic printing
  prepareTextForPrinting(text, isArabic = false) {
    if (!text) return "";

    // Normalize Unicode text
    let processedText = text.normalize("NFC");

    // Check if text contains Arabic characters
    const hasArabic =
      /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
        processedText
      );

    if (hasArabic || isArabic) {
      // Apply Arabic text processing
      processedText = this.processArabicText(processedText);
    }

    return processedText;
  }

  // Process Arabic text for proper display
  processArabicText(text) {
    // Remove problematic characters that might cause issues
    let processed = text.replace(/[\u200C-\u200F\u202A-\u202E]/g, ""); // Remove RTL/LTR marks

    // Ensure proper Arabic letter forms (this is a simplified approach)
    // For full Arabic text shaping, you would need a proper Arabic text shaping library
    processed = processed.replace(/\u0628\u064E/g, "بَ"); // Example of composite character handling

    return processed;
  }

  // Detect if text contains Arabic characters
  containsArabic(text) {
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

  // Generate ESC/POS commands for customer receipt with Arabic support
  generateCustomerReceiptCommands(orderData) {
    const receiptSettings = this.getReceiptSettings();
    const now = new Date();
    const paperWidth = 48;

    let commands = this.commands.INIT; // Initialize printer

    // Set Arabic codepage and character set for Arabic support
    commands += this.commands.SET_ARABIC_CODEPAGE;
    commands += this.commands.SELECT_ARABIC_CHARSET;
    commands += this.commands.SET_INTERNATIONAL_CHARSET;

    // Check if any text contains Arabic characters
    const hasArabicContent = this.checkForArabicContent(
      orderData,
      receiptSettings
    );

    if (hasArabicContent) {
      // Enable RTL mode for Arabic text
      commands += this.commands.SET_RTL_MODE;
    }

    // Business name centered and bold (only if provided)
    if (receiptSettings.header.businessName.trim()) {
      commands += this.commands.ALIGN_CENTER;
      commands += this.commands.BOLD_ON;
      commands += this.commands.DOUBLE_HEIGHT_ON;
      const businessName = this.prepareTextForPrinting(
        receiptSettings.header.businessName,
        this.containsArabic(receiptSettings.header.businessName)
      );
      commands += businessName + this.CTL_LF;
      commands += this.commands.DOUBLE_HEIGHT_OFF;
      commands += this.commands.BOLD_OFF;
      commands += this.commands.ALIGN_LEFT;
    }

    // Header information with Arabic support
    const headerItems = [];
    if (receiptSettings.header.address.trim())
      headerItems.push(
        this.prepareTextForPrinting(receiptSettings.header.address, true)
      );
    if (receiptSettings.header.city.trim())
      headerItems.push(
        this.prepareTextForPrinting(receiptSettings.header.city, true)
      );
    if (receiptSettings.header.phone.trim())
      headerItems.push(receiptSettings.header.phone);
    if (receiptSettings.header.taxId.trim())
      headerItems.push(receiptSettings.header.taxId);
    if (receiptSettings.header.customText.trim())
      headerItems.push(
        this.prepareTextForPrinting(receiptSettings.header.customText, true)
      );

    // Display header items
    for (let i = 0; i < headerItems.length; i += 2) {
      const left = headerItems[i] || "";
      const right = headerItems[i + 1] || "";
      if (left || right) {
        commands += this.formatLine(left, right, paperWidth) + this.CTL_LF;
      }
    }

    // Cashier name (if available and enabled)
    if (orderData.cashier && receiptSettings.display?.showCashierName) {
      commands += this.commands.ALIGN_CENTER;
      const cashierText = `Served by: ${this.prepareTextForPrinting(
        orderData.cashier,
        true
      )}`;
      commands += cashierText + this.CTL_LF;
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

    // Customer Data Section (if available) with Arabic support
    if (orderData.custName || orderData.custPhone || orderData.custAddress) {
      commands += this.commands.ALIGN_CENTER;
      commands += this.commands.BOLD_ON;
      commands += "CUSTOMER DATA" + this.CTL_LF;
      commands += this.commands.BOLD_OFF;
      commands += this.commands.ALIGN_LEFT;
      commands += "-".repeat(paperWidth) + this.CTL_LF;

      if (orderData.custName) {
        const customerName = this.prepareTextForPrinting(
          orderData.custName,
          true
        );
        commands += this.formatLine("Name:", customerName) + this.CTL_LF;
      }
      if (orderData.custPhone) {
        commands +=
          this.formatLine("Phone:", orderData.custPhone) + this.CTL_LF;
      }
      if (orderData.custAddress) {
        const customerAddress = this.prepareTextForPrinting(
          orderData.custAddress,
          true
        );
        commands += this.formatLine("Address:", customerAddress) + this.CTL_LF;
      }

      commands += this.CTL_LF;
      commands += "-".repeat(paperWidth) + this.CTL_LF;
    }

    // Order items with Arabic support
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

        // Process item name for Arabic support
        const processedItemName = this.prepareTextForPrinting(itemName, true);
        const itemLine = `${item.quantity}x ${processedItemName}`;
        commands +=
          this.formatLine(itemLine, `$${itemTotal.toFixed(2)}`, paperWidth) +
          this.CTL_LF;
      }
    });

    commands += this.CTL_LF;
    commands += "-".repeat(paperWidth) + this.CTL_LF;

    // Calculate totals
    const discountPercent = orderData.discount || 0;
    const taxPercent = orderData.tax || 0;
    let finalTotal = subtotal;

    // Apply discount if exists
    if (discountPercent > 0) {
      const discountAmount = (subtotal * discountPercent) / 100;
      finalTotal -= discountAmount;
      commands +=
        this.formatLine(
          `DISCOUNT (${discountPercent}%)`,
          `-$${discountAmount.toFixed(2)}`,
          paperWidth
        ) + this.CTL_LF;
    }

    // Apply tax if exists
    if (taxPercent > 0) {
      const taxAmount = (finalTotal * taxPercent) / 100;
      finalTotal += taxAmount;
      commands +=
        this.formatLine(
          `TAX (${taxPercent}%)`,
          `$${taxAmount.toFixed(2)}`,
          paperWidth
        ) + this.CTL_LF;
    }

    // Total amount
    const displayTotal =
      orderData.finalTotal || orderData.totalPrice || finalTotal;
    commands += this.commands.BOLD_ON;
    commands +=
      this.formatLine(
        "TOTAL AMOUNT",
        `$${displayTotal.toFixed(2)}`,
        paperWidth
      ) + this.CTL_LF;
    commands += this.commands.BOLD_OFF;

    // Payment methods
    if (orderData.paymentMethods?.length > 0) {
      orderData.paymentMethods.forEach((payment) => {
        commands +=
          this.formatLine(
            payment.method.toUpperCase(),
            `$${payment.amount.toFixed(2)}`,
            paperWidth
          ) + this.CTL_LF;
      });
    } else if (orderData.isPaid) {
      commands +=
        this.formatLine("CASH", `$${displayTotal.toFixed(2)}`, paperWidth) +
        this.CTL_LF;
    }

    commands += this.CTL_LF;

    // Footer information with Arabic support
    const footerItems = [];
    if (receiptSettings.footer.thankYouMessage.trim())
      footerItems.push(
        this.prepareTextForPrinting(
          receiptSettings.footer.thankYouMessage,
          true
        )
      );
    if (receiptSettings.footer.returnPolicy.trim())
      footerItems.push(
        this.prepareTextForPrinting(receiptSettings.footer.returnPolicy, true)
      );
    if (receiptSettings.footer.customerService.trim())
      footerItems.push(
        this.prepareTextForPrinting(
          receiptSettings.footer.customerService,
          true
        )
      );
    if (receiptSettings.footer.website.trim())
      footerItems.push(receiptSettings.footer.website);
    if (receiptSettings.footer.customText.trim())
      footerItems.push(
        this.prepareTextForPrinting(receiptSettings.footer.customText, true)
      );

    if (footerItems.length > 0) {
      commands += this.commands.ALIGN_CENTER;
      footerItems.forEach((item) => {
        commands += item + this.CTL_LF;
      });
      commands += this.commands.ALIGN_LEFT;
      commands += this.CTL_LF;
    }

    // Reset to LTR mode if Arabic was used
    if (hasArabicContent) {
      commands += this.commands.SET_LTR_MODE;
    }

    // Feed paper and cut
    commands += this.commands.FEED_LINES(3);
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

  // Generate ESC/POS commands for kitchen ticket with Arabic support
  generateKitchenTicketCommands(orderData) {
    const now = new Date();
    const paperWidth = 48;

    let commands = this.commands.INIT; // Initialize printer

    // Set Arabic codepage and character set for Arabic support
    commands += this.commands.SET_ARABIC_CODEPAGE;
    commands += this.commands.SELECT_ARABIC_CHARSET;
    commands += this.commands.SET_INTERNATIONAL_CHARSET;

    // Check if any content contains Arabic text
    const hasArabicContent = this.checkKitchenArabicContent(orderData);

    if (hasArabicContent) {
      // Enable RTL mode for Arabic text
      commands += this.commands.SET_RTL_MODE;
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
      const customerName = this.prepareTextForPrinting(
        orderData.customer,
        true
      );
      commands += this.formatLine("Customer:", customerName) + this.CTL_LF;
    }
    commands += this.CTL_LF;

    // Items to prepare with Arabic support
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

        // Process item name for Arabic support
        const processedItemName = this.prepareTextForPrinting(itemName, true);

        commands += this.commands.BOLD_ON;
        commands += `${item.quantity}x ${processedItemName}` + this.CTL_LF;
        commands += this.commands.BOLD_OFF;

        if (item.notes || item.modifications) {
          const notes = this.prepareTextForPrinting(
            item.notes || item.modifications,
            true
          );
          commands += `   Notes: ${notes}` + this.CTL_LF;
        }
        commands += this.CTL_LF;
      }
    });

    commands += "-".repeat(paperWidth) + this.CTL_LF;

    // Reset to LTR mode if Arabic was used
    if (hasArabicContent) {
      commands += this.commands.SET_LTR_MODE;
    }

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

  // Enhanced QZ Tray printing with Arabic support
  async printViaQZTray(printerConfig, commands) {
    try {
      if (!this.isQZConnected) {
        await this.checkQZConnection();
      }

      if (!this.isQZConnected || !window.qz) {
        throw new Error("QZ Tray is not connected or available");
      }

      // Create print configuration with Arabic support
      const config = window.qz.configs.create(
        printerConfig.name || printerConfig.qzPrinterName
      );

      // Convert commands to proper byte array for Arabic support
      let printData;
      const hasArabic = this.containsArabic(commands);

      if (hasArabic || printerConfig.supportArabic !== false) {
        // Use Arabic-encoded bytes for printing
        printData = this.stringToBytes(commands, true);
      } else {
        // Use standard UTF-8 encoding
        printData = this.stringToBytes(commands, false);
      }

      // Create print data - QZ Tray expects byte arrays for raw printing
      const data = [
        {
          type: "raw",
          format: "plain",
          data: printData, // Use byte array instead of string
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

  // Main printing method - prioritizes QZ Tray, then falls back to other methods
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

    // Remove common ESC/POS commands using String.fromCharCode
    const ESC = String.fromCharCode(27);
    const GS = String.fromCharCode(29);

    // Remove ESC/POS commands
    text = text.replace(new RegExp(ESC + "@", "g"), ""); // INIT
    text = text.replace(new RegExp(ESC + "[aE!-]", "g"), ""); // Alignment, bold, etc.
    text = text.replace(new RegExp(GS + "d\\d", "g"), ""); // Feed lines
    text = text.replace(new RegExp(GS + ".*?", "g"), ""); // Other GS commands

    // Remove control characters but keep line feeds - simplified approach
    text = text
      .split("")
      .filter((char) => {
        const code = char.charCodeAt(0);
        // Keep printable characters, line feeds, and carriage returns
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
            <title>Receipt Preview</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 14px; 
                line-height: 1.3;
                margin: 20px;
                padding: 20px;
                background: #f5f5f5;
              }
              .receipt {
                background: white;
                padding: 20px;
                max-width: 400px;
                margin: 0 auto;
                border: 1px solid #ddd;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              ${formattedContent}
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

  // Test print function
  async testPrint(printerConfig) {
    const testCommands = this.generateTestPrintCommands(printerConfig);
    return await this.sendToPrinter(printerConfig, testCommands);
  }

  // Generate test print commands with Arabic text
  generateTestPrintCommands(printerConfig) {
    const now = new Date();

    let commands = this.commands.INIT;

    // Set Arabic codepage for test
    commands += this.commands.SET_ARABIC_CODEPAGE;
    commands += this.commands.SELECT_ARABIC_CHARSET;
    commands += this.commands.SET_INTERNATIONAL_CHARSET;

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

    // Test Arabic text printing
    commands += this.commands.ALIGN_CENTER;
    commands += "Arabic Test:" + this.CTL_LF;

    // Test basic Arabic text
    const arabicTest = "مرحبا بكم"; // "Welcome" in Arabic
    const processedArabic = this.prepareTextForPrinting(arabicTest, true);
    commands += processedArabic + this.CTL_LF;

    // Test Arabic numbers
    const arabicNumbers = "١٢٣٤٥"; // Arabic-Indic numerals
    commands += arabicNumbers + this.CTL_LF;

    commands += this.commands.ALIGN_LEFT;
    commands += this.CTL_LF;

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

  // QZ Tray specific methods

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
        // Check if QZ Tray is running by attempting to get version
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

  /**
   * Initialize QZ Tray with proper certificate handling and domain trust
   */
  async initializeQZ() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = new Promise((resolve) => {
      const initAsync = async () => {
        try {
          // Check if QZ Tray is available
          if (typeof window.qz === "undefined") {
            console.warn(
              "QZ Tray is not loaded. Make sure QZ Tray is installed and running."
            );
            resolve(false);
            return;
          }

          // Set up certificate promise for QZ Tray authentication
          await this.setupQZCertificate();

          // Set up signature promise for message signing
          await this.setupQZSignature();

          // Attempt to connect to QZ Tray
          if (!this.isQZConnected) {
            await this.checkQZConnection();
          }

          // Check if current domain is trusted
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

  /**
   * Set up QZ Tray certificate for secure communication
   */
  async setupQZCertificate() {
    return new Promise((resolve) => {
      window.qz.security.setCertificatePromise((resolve) => {
        // For development, we'll use a demo certificate approach
        // In production, you should have a proper certificate from QZ Industries

        // Check if we have a stored certificate
        const storedCert = localStorage.getItem("qz_certificate");
        if (storedCert) {
          resolve(storedCert);
          return;
        }

        // Demo certificate content (this would be your actual certificate in production)
        const demoCertificate = `-----BEGIN CERTIFICATE-----
MIIC...demo certificate content...
-----END CERTIFICATE-----`;

        // Store and resolve the certificate
        localStorage.setItem("qz_certificate", demoCertificate);
        resolve(demoCertificate);
      });
      resolve();
    });
  }

  /**
   * Set up QZ Tray signature for message authentication
   */
  async setupQZSignature() {
    return new Promise((resolve) => {
      // Set signature algorithm (SHA512 for QZ Tray 2.1+)
      if (window.qz.security.setSignatureAlgorithm) {
        window.qz.security.setSignatureAlgorithm("SHA512");
      }

      window.qz.security.setSignaturePromise((toSign) => {
        return (resolve, reject) => {
          // For demo purposes, we'll create a simple signature
          // In production, this should be handled by your backend
          try {
            // Simple demo signature - in production this should call your backend
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

  /**
   * Ensure current domain is trusted by QZ Tray
   */
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
        console.log("📋 To trust this domain in QZ Tray:");
        console.log("1. Open QZ Tray system tray icon");
        console.log("2. Go to Advanced > Site Manager");
        console.log('3. Click the "+" button to add a new site');
        console.log(`4. Add: ${window.location.protocol}//${currentDomain}`);
        console.log('5. Check "Allow" and "Remember this decision"');

        // Show user-friendly notification
        this.showDomainTrustInstructions();
      }
    } catch (error) {
      console.error("Error checking domain trust:", error);
    }
  }

  /**
   * Show instructions for trusting the domain in QZ Tray
   */
  showDomainTrustInstructions() {
    // Create a notification or modal to guide the user
    const notification = document.createElement("div");
    notification.className = "qz-trust-notification";
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f97316;
        color: white;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 400px;
        font-family: system-ui;
      ">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <strong>QZ Tray Setup Required</strong>
        </div>
        <p style="margin: 0 0 12px 0; font-size: 14px;">
          To enable automatic printing, please trust this website in QZ Tray:
        </p>
        <ol style="margin: 0; padding-left: 20px; font-size: 13px;">
          <li>Right-click QZ Tray icon in system tray</li>
          <li>Select "Advanced" → "Site Manager"</li>
          <li>Click "+" to add new site</li>
          <li>Enter: <code style="background: rgba(255,255,255,0.2); padding: 2px 4px; border-radius: 3px;">${window.location.origin}</code></li>
          <li>Check "Allow" and "Remember this decision"</li>
        </ol>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 12px;
          font-size: 12px;
        ">Got it!</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 15 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 15000);
  }

  /**
   * Get setup instructions for QZ Tray
   */
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
      ],
    };
  }
}

// Export singleton instance
export const printingService = new PrintingService();
export default printingService;
