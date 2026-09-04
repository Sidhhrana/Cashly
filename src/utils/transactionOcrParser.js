/**
 * Cashly 3.0 - Transaction OCR & Rule-Based Parser Utility
 * 
 * Features:
 * - Canvas preprocessing (grayscale, dark mode inversion, high-contrast thresholding)
 * - Tesseract.js OCR integration with progress tracking
 * - Multi-transaction screenshot parsing (Apple Pay, Google Pay, Banking apps, statements)
 * - Zero-latency Direct Text / Bank SMS parser
 * - Intelligent Merchant & Category mapping
 */

import { createWorker } from 'tesseract.js';

// Keyword rules for intelligent category mapping
export const CATEGORY_KEYWORDS = {
  food: [
    'starbucks', 'mcdonald', 'burger', 'cafe', 'restaurant', 'doordash', 'uber eats',
    'coffee', 'food', 'bakery', 'chipotle', 'subway', 'pizza', 'dink', 'drink', 'diner',
    'bar', 'taco', 'kfc', 'dominos', 'swiggy', 'zomato', 'eat', 'bistro', 'shake shack',
    'dunkin', 'panera', 'sweetgreen', 'wendy', 'wendys', 'cfa', 'chick-fil-a', 'pub',
    'kitchen', 'grill', 'noodle', 'sushi', 'tea', 'bakery', 'bottle'
  ],
  transport: [
    'uber', 'lyft', 'train', 'transit', 'gas', 'fuel', 'chevron', 'shell', 'metro',
    'parking', 'flight', 'airline', 'cab', 'taxi', 'ola', 'bp', 'exxon', 'mobil',
    'amtrak', 'delta', 'united', 'texaco', 'valero', 'speedway', 'speedway', 'sunoco',
    'marathon', 'subway transit', 'toll', 'tollway', 'airways', 'indigo', 'emirates'
  ],
  shopping: [
    'amazon', 'target', 'walmart', 'apple store', 'ebay', 'clothes', 'nike', 'zara',
    'store', 'mall', 'adidas', 'h&m', 'best buy', 'ikea', 'costco', 'nordstrom',
    'sephora', 'flipkart', 'myntra', 'market', 'groceries', 'supermarket', 'kroger',
    'aliexpress', 'etsy', 'gap', 'uniqlo', 'sam\'s club', 'home depot', 'lowes'
  ],
  entertainment: [
    'netflix', 'cinema', 'spotify', 'movie', 'hulu', 'disney', 'ticket', 'steam',
    'playstation', 'gaming', 'xbox', 'amc', 'theater', 'nintendo', 'twitch', 'hbo',
    'prime video', 'apple tv', 'paramount', 'peacock', 'imax', 'regal', 'concert'
  ],
  bills: [
    'electric', 'water', 'power', 'energy', 'telecom', 'verizon', 'at&t', 't-mobile',
    'bill', 'pg&e', 'spectrum', 'comcast', 'xfinity', 'utilities', 'gas bill', 'insurance',
    'geico', 'progressive', 'state farm', 'allstate'
  ],
  utilities: [
    'wifi', 'internet', 'broadband', 'utility', 'fiber', 'airtel', 'jio'
  ],
  health: [
    'pharmacy', 'hospital', 'clinic', 'doctor', 'cvs', 'walgreens', 'dental', 'health',
    'medicine', 'medical', 'prescription', 'apollo', 'dentist', 'optometry', 'urgent care',
    'labcorp', 'quest diagnostics'
  ],
  education: [
    'udemy', 'coursera', 'books', 'tuition', 'university', 'school', 'college', 'academy',
    'course', 'chegg', 'edx', 'textbook', 'campus'
  ],
  subscriptions: [
    'subscription', 'monthly', 'icloud', 'patreon', 'adobe', 'youtube premium', 'sub',
    'membership', 'openai', 'chatgpt', 'github', 'notion', 'figma', 'canva', 'medium',
    'dropbox', 'google one', 'microsoft 365'
  ],
  salary: [
    'salary', 'payroll', 'bonus', 'dividend', 'interest', 'deposit', 'stipend', 'wages',
    'direct dep', 'direct deposit', 'earning', 'paycheck'
  ]
};

// Known merchants list for precise extraction from noisy strings
export const KNOWN_MERCHANTS = [
  "Starbucks", "McDonald's", "Burger King", "Chipotle", "Subway", "Domino's",
  "Pizza Hut", "KFC", "Taco Bell", "Dunkin'", "Shake Shack", "In-N-Out", "DoorDash",
  "Uber Eats", "Grubhub", "Swiggy", "Zomato", "Sweetgreen", "Panera Bread", "Trader Joe's",
  "Whole Foods", "Uber", "Lyft", "Shell", "Chevron", "Exxon", "BP", "Mobil", "Texaco",
  "Amazon", "Target", "Walmart", "Apple Store", "Apple", "Best Buy", "Costco", "Home Depot",
  "Nike", "Zara", "H&M", "Adidas", "IKEA", "eBay", "Etsy", "Sephora", "Nordstrom",
  "Netflix", "Spotify", "Hulu", "Disney+", "Disney+ Hotstar", "Disney", "HBO Max", "Max",
  "YouTube", "Steam", "PlayStation", "Xbox", "AMC Theatres", "Twitch", "Nintendo",
  "Pacific Gas & Electric", "ConEd", "Verizon", "AT&T", "T-Mobile", "Comcast", "Xfinity", "Spectrum",
  "CVS Pharmacy", "Walgreens", "Rite Aid", "Apollo Pharmacy",
  "Udemy", "Coursera", "Chegg",
  "iCloud", "Patreon", "Adobe", "OpenAI", "ChatGPT", "GitHub", "Google One"
];

const MONTHS_MAP = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11
};

/**
 * Canvas Pre-processing:
 * Converts input image to high-contrast grayscale with dark-mode color inversion
 * and contrast enhancement to drastically improve OCR character recognition.
 * 
 * @param {File|Blob|string|HTMLImageElement} imageInput 
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function preprocessImageToCanvas(imageInput) {
  let img;

  if (typeof window !== 'undefined' && imageInput instanceof HTMLImageElement) {
    img = imageInput;
  } else {
    img = new Image();
    const objectUrl = typeof imageInput === 'string' ? imageInput : URL.createObjectURL(imageInput);
    img.src = objectUrl;

    await new Promise((resolve, reject) => {
      img.onload = () => {
        if (typeof imageInput !== 'string') {
          URL.revokeObjectURL(objectUrl);
        }
        resolve();
      };
      img.onerror = reject;
    });
  }

  // Scale optimization for OCR:
  // Screenshots < 1200px width (typical mobile resolution) are upscaled 1.5x-2x for crisp text
  // Excessively large screenshots (> 2000px) are scaled down to 1800px for speed
  let { naturalWidth: width, naturalHeight: height } = img;
  if (!width || !height) {
    width = img.width || 1200;
    height = img.height || 1600;
  }

  let targetWidth = width;
  let targetHeight = height;

  if (width < 1200) {
    const scale = Math.min(2.2, 1400 / width);
    targetWidth = Math.round(width * scale);
    targetHeight = Math.round(height * scale);
  } else if (width > 2000) {
    const scale = 1800 / width;
    targetWidth = 1800;
    targetHeight = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw scaled image
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imageData.data;
  const totalPixels = data.length / 4;

  // Step 1: Sample average brightness across pixels to detect dark mode
  let brightnessSum = 0;
  const sampleStep = Math.max(1, Math.floor(totalPixels / 20000));
  let sampledCount = 0;

  for (let i = 0; i < data.length; i += 4 * sampleStep) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    brightnessSum += (0.299 * r + 0.587 * g + 0.114 * b);
    sampledCount++;
  }

  const avgBrightness = sampledCount > 0 ? brightnessSum / sampledCount : 128;
  const isDarkMode = avgBrightness < 115; // Common in iOS Dark Mode & dark banking themes

  // Step 2: Apply Grayscale, Dark Mode Inversion & Contrast Stretching
  // Tesseract OCR achieves highest accuracy on dark text over white/light backgrounds.
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Grayscale luminance
    let gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // Invert dark mode screenshots so text is dark on white
    if (isDarkMode) {
      gray = 255 - gray;
    }

    // High contrast stretch (boost separation of character strokes from background)
    // Values closer to white stay white; values closer to black get darkened
    if (gray > 175) {
      gray = 255;
    } else if (gray < 85) {
      gray = Math.max(0, gray * 0.5);
    } else {
      // Contrast steepening in midtones
      gray = Math.round(((gray - 85) / 90) * 255);
    }

    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
    // alpha remains intact
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Intelligent Category Detection based on Merchant and Context Keywords
 */
export function matchCategory(text, type = 'expense') {
  const lower = (text || '').toLowerCase();

  for (const [catId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return catId;
      }
    }
  }

  // Fallback defaults
  if (type === 'income') return 'other_income';
  return 'shopping';
}

/**
 * Date Parser:
 * Converts various date formats into standard ISO string:
 * - "Today", "Yesterday"
 * - "Sep 4", "September 2", "04/09/2026", "2026-09-01", "04-Sep-2026", "4 Sep"
 */
export function parseDate(str) {
  if (!str) return new Date().toISOString();
  const lower = str.toLowerCase().trim();
  const now = new Date();

  if (lower.includes('today')) {
    return now.toISOString();
  }
  if (lower.includes('yesterday')) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d.toISOString();
  }

  // 1. ISO YYYY-MM-DD
  const isoMatch = str.match(/\b(20\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    const d = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]), 12, 0, 0);
    return d.toISOString();
  }

  // 2. DD-MM-YYYY or DD/MM/YYYY
  const ddmmyyyy = str.match(/\b(0?[1-9]|[12]\d|3[01])[-/](0?[1-9]|1[0-2])[-/](20\d{2}|\d{2})\b/);
  if (ddmmyyyy) {
    let year = Number(ddmmyyyy[3]);
    if (year < 100) year += 2000;
    const d = new Date(year, Number(ddmmyyyy[2]) - 1, Number(ddmmyyyy[1]), 12, 0, 0);
    return d.toISOString();
  }

  // 3. Month Day: "Sep 4", "September 04, 2026"
  const monthDayMatch = str.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[.,\s]+([0-3]?\d)(?:[,\s]+(20\d{2}|\d{2}))?\b/i);
  if (monthDayMatch) {
    const month = MONTHS_MAP[monthDayMatch[1].toLowerCase()];
    const day = Number(monthDayMatch[2]);
    let year = monthDayMatch[3] ? Number(monthDayMatch[3]) : now.getFullYear();
    if (year < 100) year += 2000;
    const d = new Date(year, month, day, 12, 0, 0);
    return d.toISOString();
  }

  // 4. Day Month: "04-Sep", "04-Sep-2026", "4 Sep 2026"
  const dayMonthMatch = str.match(/\b([0-3]?\d)[-\s]+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:[-\s]+(20\d{2}|\d{2}))?\b/i);
  if (dayMonthMatch) {
    const day = Number(dayMonthMatch[1]);
    const month = MONTHS_MAP[dayMonthMatch[2].toLowerCase()];
    let year = dayMonthMatch[3] ? Number(dayMonthMatch[3]) : now.getFullYear();
    if (year < 100) year += 2000;
    const d = new Date(year, month, day, 12, 0, 0);
    return d.toISOString();
  }

  return now.toISOString();
}

/**
 * Robust Amount Extractor:
 * Extracts amounts with support for $, €, £, ₹, Rs, INR, USD, EUR, GBP,
 * signed values (-$45.20, +$2,500.00, -12.50), European commas (45,20 €),
 * and avoids misidentifying date digits.
 */
export function extractAmount(text) {
  if (!text) return null;

  const currencyPatterns = [
    // Symbol first with sign: -$45.20 or - $45.20 or +$2,500.00
    /([+-])\s*([$€£₹]|Rs\.?|INR|USD|EUR|GBP)\s*([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i,
    // Symbol first with optional sign: $15.99, ₹1,250, Rs. 149.00, USD 85.00, INR 50,000.00
    /([$€£₹]|Rs\.?|INR|USD|EUR|GBP)\s*([+-])?\s*([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i,
    // Amount first, then currency: 340.00 INR, 45.20 USD, 50.00 €
    /([+-])?\s*([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)\s*([$€£₹]|Rs\.?|INR|USD|EUR|GBP)\b/i,
    // European comma decimals: 45,20 € or -12,50 EUR
    /([+-])?\s*([0-9]+,[0-9]{2})\s*([$€£₹]|EUR|USD)?/i,
    // Keyword followed by amount: charged $15.99, debited by 1250.00
    /(?:amount|amt|charged|debited(?:\s+for|\s+by)?|credited(?:\s+for|\s+by)?|spent|paid)\s*:?\s*([$€£₹]|Rs\.?|INR|USD|EUR|GBP)?\s*([+-])?\s*([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i
  ];

  for (const pat of currencyPatterns) {
    const m = text.match(pat);
    if (m) {
      let sign = null;
      let numStr = null;
      for (let i = 1; i < m.length; i++) {
        const g = m[i];
        if (!g) continue;
        if (g === '-' || g === '+') sign = g;
        else if (/^[0-9,.]+$/.test(g) && /[0-9]/.test(g)) {
          numStr = g;
        }
      }
      if (numStr) {
        // Handle European comma decimal
        if (numStr.includes(',') && !numStr.includes('.')) {
          const parts = numStr.split(',');
          if (parts.length === 2 && parts[1].length <= 2) {
            numStr = parts[0] + '.' + parts[1];
          } else {
            numStr = numStr.replace(/,/g, '');
          }
        } else {
          numStr = numStr.replace(/,/g, '');
        }

        const val = parseFloat(numStr);
        if (!isNaN(val) && val > 0) {
          return { amount: val, sign, raw: m[0] };
        }
      }
    }
  }

  // Fallback for screenshot lines where currency symbol might be missing (e.g. "-12.50" or "+3500.00"):
  const fallbackSigned = text.match(/(?:^|\s)([+-])\s*([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{2}))(?:\s|$)/);
  if (fallbackSigned) {
    const clean = fallbackSigned[2].replace(/,/g, '');
    const val = parseFloat(clean);
    if (!isNaN(val) && val > 0) {
      return { amount: val, sign: fallbackSigned[1], raw: fallbackSigned[0] };
    }
  }

  // Fallback standalone decimal: "45.20"
  const fallbackDecimal = text.match(/(?:^|\s)([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})(?:\s|$)/);
  if (fallbackDecimal) {
    const clean = fallbackDecimal[1].replace(/,/g, '');
    const val = parseFloat(clean);
    if (!isNaN(val) && val > 0) {
      return { amount: val, sign: null, raw: fallbackDecimal[0] };
    }
  }

  return null;
}

/**
 * Transaction Type Detection:
 * 'expense' (debit, paid, sent, -) vs 'income' (credit, received, deposit, refund, +)
 */
export function extractType(text, sign) {
  if (sign === '+') return 'income';
  if (sign === '-') return 'expense';

  const lower = (text || '').toLowerCase();
  const incomeKeywords = [
    'credit', 'credited', 'received', 'deposit', 'deposited', 'refund',
    'cashback', 'salary', 'payroll', 'bonus', 'dividend', 'interest', 'transfer from'
  ];
  for (const ik of incomeKeywords) {
    if (lower.includes(ik)) return 'income';
  }

  const expenseKeywords = [
    'debit', 'debited', 'paid', 'sent', 'spent', 'purchase', 'charge',
    'charged', 'withdraw', 'transfer to'
  ];
  for (const ek of expenseKeywords) {
    if (lower.includes(ek)) return 'expense';
  }

  return 'expense';
}

/**
 * Merchant / Payee / "Where Spent" Extractor:
 * Extracts entity name using known merchant dictionary + regex patterns
 */
export function extractMerchant(text) {
  if (!text) return 'Transaction';

  // 1. Check known merchant dictionary (highest priority)
  for (const m of KNOWN_MERCHANTS) {
    const escaped = m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const reg = new RegExp('\\b' + escaped + '\\b', 'i');
    if (reg.test(text)) {
      return m;
    }
  }

  // 2. Pattern-based extraction from SMS / statements
  const patterns = [
    /(?:paid\s+(?:to\s+)?|to|at|for|towards|merchant:?|done at|spent at|charged at)\s+([A-Za-z0-9&.'\- ]+?)(?:\s+on|\s+at|\s+ref|\s+using|\s+via|\s+ending|\s+from|\s+dated|\s+card|\s*\.|\s*$)/i,
    /(?:from|by|received from)\s+([A-Za-z0-9&.'\- ]+?)(?:\s+on|\s+via|\s+ref|\s+dated|\s+for|\s*\.|\s*$)/i,
    /(?:ref(?:und)?|info|memo|towards)\s*:?\s*([A-Za-z0-9&.'\- ]+)/i
  ];

  for (const p of patterns) {
    const match = text.match(p);
    if (match && match[1]) {
      let candidate = match[1].trim()
        .replace(/^(the|a|an)\s+/i, '')
        .replace(/^(vpa|upi|ref|txn|a\/c|card)\s+/i, '')
        .trim();

      // Avoid capturing currency or account amounts as merchant
      if (!/(?:[$€£₹]|rs|inr|usd|eur|gbp|\d{3,})/i.test(candidate) && candidate.length >= 3) {
        if (!/^(account|bank|card|ending|credited|debited|amount|total)$/i.test(candidate)) {
          return candidate;
        }
      }
    }
  }

  return 'Transaction';
}

/**
 * Check if a text line is mobile OS status bar or screen header noise
 */
function isNoiseLine(line) {
  const l = line.trim().toLowerCase();
  if (!l || l.length <= 1) return true;

  // System status icons/text
  if (/^(?:\d{1,2}:\d{2}(?:\s*[ap]m)?|\d{1,3}%|lte|5g|4g|wifi|volte)$/i.test(l)) return true;

  // Screen UI navigation headers
  const noiseWords = [
    'transactions', 'recent transactions', 'activity', 'recent activity',
    'search', 'done', 'cancel', 'back', 'edit', 'see all', 'view all',
    'wallet', 'apple pay', 'google pay', 'balance', 'current balance',
    'available balance', 'credit limit', 'statement', 'cards', 'accounts',
    'home', 'history', 'transaction history', 'monthly summary'
  ];
  if (noiseWords.includes(l)) return true;
  if (/^(completed|pending|success|failed|declined|cleared)$/i.test(l)) return true;

  return false;
}

/**
 * Decode trailing amount from mobile transaction history lines.
 * Handles:
 * - Direct amounts with currency: ₹557.16, Rs 40, $20, 106 INR
 * - Decimals with artifact prefix: 3557.16 -> 557.16
 * - Six digits without decimal point (e.g. 355716 -> 557.16 where 3 is ₹ and .16 was lost by OCR)
 * - Two/Three digits prefixed with corrupted Indian Rupee glyph (₹ -> 3, 2, R, X, z, Z, ?, >)
 *   e.g. 340 -> 40, 235 -> 35, 320 -> 20, 2106 -> 106, 380 -> 80, 350 -> 50
 * - Clean integers: 35, 40, 50, 100, 1250
 */
export function decodeTrailingAmount(rawToken) {
  if (!rawToken) return null;
  let s = rawToken.trim();
  s = s.replace(/^[$€£₹]|Rs\.?|INR/i, '').trim();
  s = s.replace(/^[RXzZ?>]/, '');

  // 1. Explicit decimal: e.g. 557.16 or 3557.16
  if (s.includes('.')) {
    if (/^[32]\d{3,}\.\d{2}$/.test(s)) {
      s = s.slice(1);
    }
    const val = parseFloat(s);
    if (!isNaN(val) && val > 0) return val;
  }

  // 2. Six digits like 355716 (corrupted ₹ + 557.16 where decimal point was missed by OCR)
  if (/^[32]\d{5}$/.test(s)) {
    const digits = s.slice(1);
    const withDec = digits.slice(0, -2) + '.' + digits.slice(-2);
    return parseFloat(withDec);
  }

  // 3. Indian Rupee symbol prefix 3 or 2 before 2-3 digit integer: e.g. 340 -> 40, 235 -> 35, 320 -> 20, 2106 -> 106, 380 -> 80, 350 -> 50
  if (/^[32](\d{2,3})$/.test(s)) {
    return parseFloat(s.slice(1));
  }

  // 4. Clean integer or decimal: e.g. 35, 40, 50, 100, 1250
  const cleanNum = parseFloat(s);
  if (!isNaN(cleanNum) && cleanNum > 0) return cleanNum;

  return null;
}

/**
 * Mobile Transaction Feed Parser (Google Pay, PhonePe, Paytm, UPI, Apple Pay)
 */
export function parseMobileTransactionFeed(rawLines) {
  const results = [];
  const DATE_REGEX = /today|yesterday|\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b|\b\d{1,2}[/-]\d{1,2}\b/i;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (DATE_REGEX.test(line)) {
      // Find preceding transaction line (within 1-2 lines back)
      let txLine = '';
      for (let j = i - 1; j >= Math.max(0, i - 2); j--) {
        if (!DATE_REGEX.test(rawLines[j]) && !isNoiseLine(rawLines[j])) {
          txLine = rawLines[j];
          break;
        }
      }
      if (!txLine) continue;

      // Clean avatar glyph noise from start (e.g. "A Amazon Pay on Delivery 355716", "™ Mr Narender Nanwani 340")
      let cleanTx = txLine.replace(/^[A-Za-z0-9™®©|~_()&+\-]{1,3}\s+(?=[A-Za-z])/, '').trim();

      // Extract amount from end
      const match = cleanTx.match(/(?:[$€£₹]|Rs\.?|INR)?\s*([0-9.,]+|[RXzZ?>32]\d{1,5}(?:\.\d{1,2})?)$/i);
      if (match) {
        const amt = decodeTrailingAmount(match[1]);
        const merchant = cleanTx.replace(match[0], '').trim();
        if (amt && merchant.length >= 2) {
          const type = extractType(cleanTx, null);
          const categoryId = matchCategory(merchant + ' ' + cleanTx, type);
          const date = parseDate(line);

          results.push({
            id: `ocr-${Date.now()}-${results.length}-${Math.random().toString(36).substring(2, 6)}`,
            amount: amt,
            type,
            categoryId,
            whereSpent: merchant,
            note: `${merchant} • ${line}`,
            date,
            confidence: 0.95
          });
        }
      }
    }
  }

  return results;
}

/**
 * Multi-Line Transaction Screenshot Parser:
 * Processes raw OCR text into individual transactions.
 */
export function parseTransactionText(rawText) {
  if (!rawText || !rawText.trim()) return [];

  const rawLines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => !isNoiseLine(l));
  const results = [];

  // Strategy 0: Mobile Transaction Feed (Google Pay, PhonePe, Paytm, UPI, Apple Pay)
  const feedResults = parseMobileTransactionFeed(rawLines);
  if (feedResults.length >= 2) {
    return feedResults;
  }

  // Find all lines that contain currency amounts
  const amountIndices = [];
  rawLines.forEach((line, idx) => {
    const amt = extractAmount(line);
    if (amt) {
      amountIndices.push({ idx, amt, line });
    }
  });

  // If feed had 1 item and no structured amounts, return the feed item
  if (amountIndices.length === 0 && feedResults.length > 0) {
    return feedResults;
  }

  // If no structured amounts found on individual lines, fallback to SMS/free-text mode
  if (amountIndices.length === 0) {
    return parseDirectTextOrSms(rawText);
  }

  // Strategy A: Table / Single-Line Transactions (e.g. "09/04/2026 NETFLIX.COM -$15.99")
  let singleLineCount = 0;
  for (const { line, amt } of amountIndices) {
    const withoutAmount = line.replace(amt.raw, '').trim();
    if (withoutAmount.length >= 3) singleLineCount++;
  }

  if (singleLineCount >= amountIndices.length * 0.7 && amountIndices.length > 1) {
    for (const { line, amt } of amountIndices) {
      const type = extractType(line, amt.sign);
      const date = parseDate(line);
      let merchant = extractMerchant(line);

      if (merchant === 'Transaction') {
        // Strip amount and date from line to reveal merchant description
        let cleanDesc = line.replace(amt.raw, '').replace(/\b(?:20\d{2}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/](?:20\d{2}|\d{2}))\b/g, '').trim();
        merchant = cleanDesc.length >= 3 ? cleanDesc.substring(0, 28) : 'Transaction';
      }

      const categoryId = matchCategory(merchant + ' ' + line, type);

      results.push({
        id: `ocr-${Date.now()}-${results.length}-${Math.random().toString(36).substring(2, 6)}`,
        amount: amt.amount,
        type,
        categoryId,
        whereSpent: merchant,
        note: line.substring(0, 60),
        date,
        confidence: merchant !== 'Transaction' ? 0.95 : 0.85
      });
    }
    return results;
  }

  // Strategy B: Mobile Card / Block Mode (Apple Pay, Google Pay, Banking Feed)
  // Each transaction consists of 2-4 lines:
  // [Merchant] -> [Date/Status] -> [Amount] -> [Completed]
  let lastUsedIdx = -1;

  for (let i = 0; i < amountIndices.length; i++) {
    const { idx: amtIdx, amt, line: amtLine } = amountIndices[i];

    let merchantCandidate = '';
    let dateCandidate = '';

    // Check preceding lines (idx - 1, idx - 2)
    for (let offset = -1; offset >= -2; offset--) {
      const checkIdx = amtIdx + offset;
      if (checkIdx > lastUsedIdx && checkIdx >= 0) {
        const candidateLine = rawLines[checkIdx];
        if (extractAmount(candidateLine)) continue;

        const hasDate = /today|yesterday|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}[/-]\d{1,2})\b/i.test(candidateLine);
        if (hasDate && !dateCandidate) {
          dateCandidate = candidateLine;
        } else if (!merchantCandidate) {
          merchantCandidate = candidateLine;
        }
      }
    }

    // Check succeeding lines if still missing merchant or date
    if (!merchantCandidate && amtIdx + 1 < rawLines.length) {
      const nextLine = rawLines[amtIdx + 1];
      if (!extractAmount(nextLine) && !/^(completed|pending|success)$/i.test(nextLine)) {
        merchantCandidate = nextLine;
      }
    }

    if (!dateCandidate && amtIdx + 1 < rawLines.length) {
      const nextLine = rawLines[amtIdx + 1];
      if (/today|yesterday|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}[/-]\d{1,2})\b/i.test(nextLine)) {
        dateCandidate = nextLine;
      }
    }

    let finalMerchant = merchantCandidate ? extractMerchant(merchantCandidate) : 'Transaction';
    if (finalMerchant === 'Transaction' && merchantCandidate) {
      finalMerchant = merchantCandidate.replace(/[•|].*$/, '').trim();
    }

    const fullContext = `${merchantCandidate} ${dateCandidate} ${amtLine}`;
    const type = extractType(fullContext, amt.sign);
    const categoryId = matchCategory(finalMerchant + ' ' + fullContext, type);
    const date = parseDate(dateCandidate || amtLine);

    results.push({
      id: `ocr-${Date.now()}-${results.length}-${Math.random().toString(36).substring(2, 6)}`,
      amount: amt.amount,
      type,
      categoryId,
      whereSpent: finalMerchant,
      note: (merchantCandidate || finalMerchant) + (dateCandidate ? ` • ${dateCandidate}` : ''),
      date,
      confidence: finalMerchant !== 'Transaction' ? 0.95 : 0.8
    });

    lastUsedIdx = amtIdx;
  }

  return results;
}

/**
 * Direct Text / Bank SMS Parser:
 * Instant zero-latency processing for raw pasted text, bank SMS, or transaction alerts.
 */
export function parseDirectTextOrSms(text) {
  if (!text || !text.trim()) return [];

  const lines = text.split(/\r?\n|(?<=[.!?])\s+(?=[A-Z0-9])/).map(l => l.trim()).filter(Boolean);
  const results = [];

  for (const line of lines) {
    const amtInfo = extractAmount(line);
    if (!amtInfo) continue;

    const type = extractType(line, amtInfo.sign);
    let whereSpent = extractMerchant(line);

    // If still fallback "Transaction", extract from "as Salary" or "Ref: Refund"
    if (whereSpent === 'Transaction') {
      const altMatch = line.match(/(?:as|ref:?|for)\s+([A-Za-z0-9&.'\- ]{3,25})/i);
      if (altMatch && altMatch[1]) {
        whereSpent = altMatch[1].trim();
      }
    }

    const categoryId = matchCategory(whereSpent + ' ' + line, type);
    const date = parseDate(line);

    results.push({
      id: `sms-${Date.now()}-${results.length}-${Math.random().toString(36).substring(2, 6)}`,
      amount: amtInfo.amount,
      type,
      categoryId,
      whereSpent,
      note: line.length > 60 ? line.substring(0, 57) + '...' : line,
      date,
      confidence: whereSpent !== 'Transaction' ? 0.95 : 0.8
    });
  }

  return results;
}

/**
 * High-Level OCR Runner:
 * Preprocesses image canvas, runs Tesseract.js character recognition with progress callbacks,
 * and parses output into ready-to-import Cashly transactions.
 * 
 * @param {File|Blob|string|HTMLImageElement} imageSource 
 * @param {Function} [onProgress] - Optional callback (percent: number) => void
 * @returns {Promise<{ transactions: Array, rawText: string }>}
 */
export async function recognizeTransactionScreenshot(imageSource, onProgress) {
  // Step 1: Pre-process canvas
  if (onProgress) onProgress(5);
  const canvas = await preprocessImageToCanvas(imageSource);
  if (onProgress) onProgress(15);

  // Step 2: Initialize Tesseract worker
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        // Map Tesseract 0..1 progress to 20%..95% range
        const pct = 20 + Math.round((m.progress || 0) * 75);
        onProgress(Math.min(95, pct));
      }
    }
  });

  try {
    const ret = await worker.recognize(canvas);
    const rawText = ret?.data?.text || '';

    if (onProgress) onProgress(100);

    const transactions = parseTransactionText(rawText);
    return { transactions, rawText };
  } finally {
    // Terminate worker to free memory
    await worker.terminate();
  }
}
