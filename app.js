/**
 * Wi-Fi QR Generator - Professional PWA Engine
 * Developed by Waseem Asif
 * Pure Vanilla JavaScript - No Frameworks - 100% Offline Capable
 */

// ----------------------------------------------------
// 1. Service Worker Registration (Relative Path for GitHub Pages)
// ----------------------------------------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { scope: './' })
      .then((reg) => {
        console.log('PWA Service Worker active:', reg.scope);
      })
      .catch((err) => {
        console.warn('Service Worker registration skipped:', err);
      });
  });
}

// ----------------------------------------------------
// 2. High-Performance Pure JavaScript QR Code Engine
// ----------------------------------------------------
(function () {
  function QR8bitByte(data) {
    this.mode = 4;
    this.data = data;
  }
  QR8bitByte.prototype = {
    getLength: function () {
      return this.data.length;
    },
    write: function (buffer) {
      for (var i = 0; i < this.data.length; i++) {
        buffer.put(this.data.charCodeAt(i), 8);
      }
    }
  };

  var QRMath = {
    glog: function (n) {
      if (n < 1) throw new Error("glog(" + n + ")");
      return QRMath.LOG_TABLE[n];
    },
    gexp: function (n) {
      while (n < 0) n += 255;
      while (n >= 256) n -= 255;
      return QRMath.EXP_TABLE[n];
    },
    EXP_TABLE: new Array(256),
    LOG_TABLE: new Array(256)
  };
  for (var i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
  for (var i = 8; i < 256; i++)
    QRMath.EXP_TABLE[i] =
      QRMath.EXP_TABLE[i - 4] ^
      QRMath.EXP_TABLE[i - 5] ^
      QRMath.EXP_TABLE[i - 6] ^
      QRMath.EXP_TABLE[i - 8];
  for (var i = 0; i < 255; i++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;

  function QRPolynomial(num, shift) {
    if (num.length === undefined) throw new Error(num.length + "/" + shift);
    var offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (var i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
  }
  QRPolynomial.prototype = {
    get: function (index) {
      return this.num[index];
    },
    getLength: function () {
      return this.num.length;
    },
    multiply: function (e) {
      var num = new Array(this.getLength() + e.getLength() - 1);
      for (var i = 0; i < this.getLength(); i++) {
        for (var j = 0; j < e.getLength(); j++) {
          num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
        }
      }
      return new QRPolynomial(num, 0);
    },
    mod: function (e) {
      if (this.getLength() - e.getLength() < 0) return this;
      var ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
      var num = new Array(this.getLength());
      for (var i = 0; i < this.getLength(); i++) num[i] = this.get(i);
      for (var i = 0; i < e.getLength(); i++) {
        num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
      }
      return new QRPolynomial(num, 0).mod(e);
    }
  };

  function QRRSBlock(totalCount, dataCount) {
    this.totalCount = totalCount;
    this.dataCount = dataCount;
  }
  QRRSBlock.RS_BLOCK_TABLE = [
    [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
    [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
    [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
    [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
    [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
    [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15],
    [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14],
    [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15],
    [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13],
    [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16]
  ];
  QRRSBlock.getRSBlocks = function (typeNumber, errorCorrectLevel) {
    var rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
    if (rsBlock === undefined) {
      throw new Error("bad rs block @ typeNumber:" + typeNumber + "/errorCorrectLevel:" + errorCorrectLevel);
    }
    var length = rsBlock.length / 3;
    var list = [];
    for (var i = 0; i < length; i++) {
      var count = rsBlock[i * 3 + 0];
      var totalCount = rsBlock[i * 3 + 1];
      var dataCount = rsBlock[i * 3 + 2];
      for (var j = 0; j < count; j++) {
        list.push(new QRRSBlock(totalCount, dataCount));
      }
    }
    return list;
  };
  QRRSBlock.getRsBlockTable = function (typeNumber, errorCorrectLevel) {
    switch (errorCorrectLevel) {
      case 1: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0]; // L
      case 0: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1]; // M
      case 3: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2]; // Q
      case 2: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3]; // H
      default: return undefined;
    }
  };

  function QRBitBuffer() {
    this.buffer = [];
    this.length = 0;
  }
  QRBitBuffer.prototype = {
    get: function (index) {
      var bufIndex = Math.floor(index / 8);
      return ((this.buffer[bufIndex] >>> (7 - (index % 8))) & 1) === 1;
    },
    put: function (num, length) {
      for (var i = 0; i < length; i++) {
        this.putBit(((num >>> (length - i - 1)) & 1) === 1);
      }
    },
    putBit: function (bit) {
      var bufIndex = Math.floor(this.length / 8);
      if (this.buffer.length <= bufIndex) this.buffer.push(0);
      if (bit) this.buffer[bufIndex] |= 0x80 >>> (this.length % 8);
      this.length++;
    }
  };

  var QRUtil = {
    PATTERN_POSITION_TABLE: [
      [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
      [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54]
    ],
    G15: (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
    G18: (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0),
    G15_MASK: (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1),
    getBCHTypeInfo: function (data) {
      var d = data << 10;
      while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
        d ^= QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15));
      }
      return ((data << 10) | d) ^ QRUtil.G15_MASK;
    },
    getBCHDigit: function (data) {
      var digit = 0;
      while (data !== 0) {
        digit++;
        data >>>= 1;
      }
      return digit;
    },
    getPatternPosition: function (typeNumber) {
      return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1] || [];
    },
    getMask: function (maskPattern, i, j) {
      switch (maskPattern) {
        case 0: return (i + j) % 2 === 0;
        case 1: return i % 2 === 0;
        case 2: return j % 3 === 0;
        case 3: return (i + j) % 3 === 0;
        case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
        case 5: return ((i * j) % 2) + ((i * j) % 3) === 0;
        case 6: return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0;
        case 7: return (((i * j) % 3) + ((i + j) % 2)) % 2 === 0;
        default: throw new Error("bad maskPattern:" + maskPattern);
      }
    },
    getErrorCorrectPolynomial: function (errorCorrectLength) {
      var a = new QRPolynomial([1], 0);
      for (var i = 0; i < errorCorrectLength; i++) {
        a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
      }
      return a;
    },
    getLengthInBits: function (mode, type) {
      if (1 <= type && type < 10) {
        switch (mode) {
          case 1: return 10;
          case 2: return 9;
          case 4: return 8;
          case 8: return 8;
          default: throw new Error("mode:" + mode);
        }
      } else {
        return 16;
      }
    },
    getLostPoint: function (qrCode) {
      var moduleCount = qrCode.getModuleCount();
      var lostPoint = 0;
      for (var row = 0; row < moduleCount; row++) {
        for (var col = 0; col < moduleCount; col++) {
          var sameCount = 0;
          var dark = qrCode.isDark(row, col);
          for (var r = -1; r <= 1; r++) {
            if (row + r < 0 || moduleCount <= row + r) continue;
            for (var c = -1; c <= 1; c++) {
              if (col + c < 0 || moduleCount <= col + c) continue;
              if (r === 0 && c === 0) continue;
              if (dark === qrCode.isDark(row + r, col + c)) sameCount++;
            }
          }
          if (sameCount > 5) lostPoint += 3 + sameCount - 5;
        }
      }
      return lostPoint;
    }
  };

  function QRCodeModel(typeNumber, errorCorrectLevel) {
    this.typeNumber = typeNumber;
    this.errorCorrectLevel = errorCorrectLevel;
    this.modules = null;
    this.moduleCount = 0;
    this.dataCache = null;
    this.dataList = [];
  }
  QRCodeModel.prototype = {
    addData: function (data) {
      var newData = new QR8bitByte(data);
      this.dataList.push(newData);
      this.dataCache = null;
    },
    isDark: function (row, col) {
      if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
        throw new Error(row + "," + col);
      }
      return this.modules[row][col];
    },
    getModuleCount: function () {
      return this.moduleCount;
    },
    make: function () {
      if (this.typeNumber < 1) {
        var typeNumber = 1;
        for (typeNumber = 1; typeNumber < 10; typeNumber++) {
          var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, this.errorCorrectLevel);
          var totalDataCount = 0;
          for (var i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;
          var length = 0;
          for (var i = 0; i < this.dataList.length; i++) length += this.dataList[i].getLength();
          if (length <= totalDataCount - 3) break;
        }
        this.typeNumber = typeNumber;
      }
      this.makeImpl(false, this.getBestMaskPattern());
    },
    makeImpl: function (test, maskPattern) {
      this.moduleCount = this.typeNumber * 4 + 17;
      this.modules = new Array(this.moduleCount);
      for (var row = 0; row < this.moduleCount; row++) {
        this.modules[row] = new Array(this.moduleCount);
        for (var col = 0; col < this.moduleCount; col++) this.modules[row][col] = null;
      }
      this.setupPositionProbePattern(0, 0);
      this.setupPositionProbePattern(this.moduleCount - 7, 0);
      this.setupPositionProbePattern(0, this.moduleCount - 7);
      this.setupPositionAdjustPattern();
      this.setupTimingPattern();
      this.setupTypeInfo(test, maskPattern);
      this.mapData(this.createData(), maskPattern);
    },
    setupPositionProbePattern: function (row, col) {
      for (var r = -1; r <= 7; r++) {
        if (row + r <= -1 || this.moduleCount <= row + r) continue;
        for (var c = -1; c <= 7; c++) {
          if (col + c <= -1 || this.moduleCount <= col + c) continue;
          if (
            (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
            (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
            (2 <= r && r <= 4 && 2 <= c && c <= 4)
          ) {
            this.modules[row + r][col + c] = true;
          } else {
            this.modules[row + r][col + c] = false;
          }
        }
      }
    },
    getBestMaskPattern: function () {
      var minLostPoint = 0;
      var pattern = 0;
      for (var i = 0; i < 8; i++) {
        this.makeImpl(true, i);
        var lostPoint = QRUtil.getLostPoint(this);
        if (i === 0 || minLostPoint > lostPoint) {
          minLostPoint = lostPoint;
          pattern = i;
        }
      }
      return pattern;
    },
    setupTimingPattern: function () {
      for (var r = 8; r < this.moduleCount - 8; r++) {
        if (this.modules[r][6] !== null) continue;
        this.modules[r][6] = r % 2 === 0;
      }
      for (var c = 8; c < this.moduleCount - 8; c++) {
        if (this.modules[6][c] !== null) continue;
        this.modules[6][c] = c % 2 === 0;
      }
    },
    setupPositionAdjustPattern: function () {
      var pos = QRUtil.getPatternPosition(this.typeNumber);
      for (var i = 0; i < pos.length; i++) {
        for (var j = 0; j < pos.length; j++) {
          var row = pos[i];
          var col = pos[j];
          if (this.modules[row][col] !== null) continue;
          for (var r = -2; r <= 2; r++) {
            for (var c = -2; c <= 2; c++) {
              if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
                this.modules[row + r][col + c] = true;
              } else {
                this.modules[row + r][col + c] = false;
              }
            }
          }
        }
      }
    },
    setupTypeInfo: function (test, maskPattern) {
      var data = (this.errorCorrectLevel << 3) | maskPattern;
      var bits = QRUtil.getBCHTypeInfo(data);
      for (var i = 0; i < 15; i++) {
        var mod = !test && ((bits >> i) & 1) === 1;
        if (i < 6) this.modules[i][8] = mod;
        else if (i < 8) this.modules[i + 1][8] = mod;
        else this.modules[this.moduleCount - 15 + i][8] = mod;
      }
      for (var i = 0; i < 15; i++) {
        var mod = !test && ((bits >> i) & 1) === 1;
        if (i < 8) this.modules[8][this.moduleCount - i - 1] = mod;
        else if (i < 9) this.modules[8][15 - i - 1 + 1] = mod;
        else this.modules[8][15 - i - 1] = mod;
      }
      this.modules[this.moduleCount - 8][8] = !test;
    },
    mapData: function (data, maskPattern) {
      var inc = -1;
      var row = this.moduleCount - 1;
      var bitIndex = 7;
      var byteIndex = 0;
      for (var col = this.moduleCount - 1; col > 0; col -= 2) {
        if (col === 6) col--;
        while (true) {
          for (var c = 0; c < 2; c++) {
            if (this.modules[row][col - c] === null) {
              var dark = false;
              if (byteIndex < data.length) {
                dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
              }
              var mask = QRUtil.getMask(maskPattern, row, col - c);
              if (mask) dark = !dark;
              this.modules[row][col - c] = dark;
              bitIndex--;
              if (bitIndex === -1) {
                byteIndex++;
                bitIndex = 7;
              }
            }
          }
          row += inc;
          if (row < 0 || this.moduleCount <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    },
    createData: function () {
      var rsBlocks = QRRSBlock.getRSBlocks(this.typeNumber, this.errorCorrectLevel);
      var buffer = new QRBitBuffer();
      for (var i = 0; i < this.dataList.length; i++) {
        var data = this.dataList[i];
        buffer.put(data.mode, 4);
        buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, this.typeNumber));
        data.write(buffer);
      }
      var totalDataCount = 0;
      for (var i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;
      if (buffer.length + 4 <= totalDataCount * 8) buffer.put(0, 4);
      while (buffer.length % 8 !== 0) buffer.putBit(false);
      while (true) {
        if (buffer.length >= totalDataCount * 8) break;
        buffer.put(0xec, 8);
        if (buffer.length >= totalDataCount * 8) break;
        buffer.put(0x11, 8);
      }
      return this.createBytes(buffer, rsBlocks);
    },
    createBytes: function (buffer, rsBlocks) {
      var offset = 0;
      var maxDcCount = 0;
      var maxEcCount = 0;
      var dcdata = new Array(rsBlocks.length);
      var ecdata = new Array(rsBlocks.length);
      for (var r = 0; r < rsBlocks.length; r++) {
        var dcCount = rsBlocks[r].dataCount;
        var ecCount = rsBlocks[r].totalCount - dcCount;
        maxDcCount = Math.max(maxDcCount, dcCount);
        maxEcCount = Math.max(maxEcCount, ecCount);
        dcdata[r] = new Array(dcCount);
        for (var i = 0; i < dcdata[r].length; i++) {
          dcdata[r][i] = 0xff & buffer.buffer[i + offset];
        }
        offset += dcCount;
        var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
        var rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
        var modPoly = rawPoly.mod(rsPoly);
        ecdata[r] = new Array(rsPoly.getLength() - 1);
        for (var i = 0; i < ecdata[r].length; i++) {
          var modIndex = i + modPoly.getLength() - ecdata[r].length;
          ecdata[r][i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
        }
      }
      var totalCodeCount = 0;
      for (var i = 0; i < rsBlocks.length; i++) totalCodeCount += rsBlocks[i].totalCount;
      var data = new Array(totalCodeCount);
      var index = 0;
      for (var i = 0; i < maxDcCount; i++) {
        for (var r = 0; r < rsBlocks.length; r++) {
          if (i < dcdata[r].length) data[index++] = dcdata[r][i];
        }
      }
      for (var i = 0; i < maxEcCount; i++) {
        for (var r = 0; r < rsBlocks.length; r++) {
          if (i < ecdata[r].length) data[index++] = ecdata[r][i];
        }
      }
      return data;
    }
  };

  // Expose global draw function supporting custom colors, error correction, and margins
  window.drawQRCodeToCanvas = function (text, canvas, options) {
    options = options || {};
    var size = options.size || 300;
    var margin = options.margin !== undefined ? options.margin : 4;
    var colorDark = options.colorDark || '#0f172a';
    var colorLight = options.colorLight || '#ffffff';
    
    // Map EC levels: L=1, M=0, Q=3, H=2
    var ecLevel = 0;
    if (options.ecLevel === 'L') ecLevel = 1;
    else if (options.ecLevel === 'M') ecLevel = 0;
    else if (options.ecLevel === 'Q') ecLevel = 3;
    else if (options.ecLevel === 'H') ecLevel = 2;

    var qr = new QRCodeModel(0, ecLevel);
    qr.addData(text);
    qr.make();

    var moduleCount = qr.getModuleCount();
    var cellScale = Math.floor((size - margin * 2 * 2) / moduleCount);
    if (cellScale < 2) cellScale = 2;
    var actualSize = cellScale * moduleCount + margin * 2;

    canvas.width = actualSize;
    canvas.height = actualSize;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Background
    ctx.fillStyle = colorLight;
    ctx.fillRect(0, 0, actualSize, actualSize);

    // Draw Dark Modules
    ctx.fillStyle = colorDark;
    for (var row = 0; row < moduleCount; row++) {
      for (var col = 0; col < moduleCount; col++) {
        if (qr.isDark(row, col)) {
          ctx.fillRect(margin + col * cellScale, margin + row * cellScale, cellScale, cellScale);
        }
      }
    }
    return actualSize;
  };
})();

// ----------------------------------------------------
// 3. Application State & DOM Bindings
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Form inputs
  const form = document.getElementById('wifiForm');
  const ssidInput = document.getElementById('ssidInput');
  const passwordInput = document.getElementById('passwordInput');
  const passwordContainer = document.getElementById('passwordContainer');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const copyPasswordBtn = document.getElementById('copyPasswordBtn');
  const securitySelect = document.getElementById('securitySelect');
  const hiddenCheckbox = document.getElementById('hiddenCheckbox');
  const generateBtn = document.getElementById('generateBtn');
  const resetBtn = document.getElementById('resetBtn');

  // Professional Settings inputs
  const qrColorSelect = document.getElementById('qrColorSelect');
  const qrEcSelect = document.getElementById('qrEcSelect');
  const qrSizeSelect = document.getElementById('qrSizeSelect');
  const autoUpdateToggle = document.getElementById('autoUpdateToggle');

  // QR Output elements
  const qrOutputSection = document.getElementById('qrOutputSection');
  const emptyPrompt = document.getElementById('emptyPrompt');
  const qrCanvas = document.getElementById('qrCanvas');
  const downloadBtn = document.getElementById('downloadBtn');
  const printBtn = document.getElementById('printBtn');
  const copyStringBtn = document.getElementById('copyStringBtn');
  const rawStringText = document.getElementById('rawStringText');
  const networkSummary = document.getElementById('networkSummary');
  const toast = document.getElementById('toast');

  // PWA & Connectivity elements
  const installAppBtn = document.getElementById('installAppBtn');
  const offlineBadge = document.getElementById('offlineBadge');

  let deferredInstallPrompt = null;
  let currentWifiString = '';
  let currentSSID = '';
  let currentSecurity = 'WPA';
  let currentPassword = '';

  // ----------------------------------------------------
  // 4. Online / Offline Monitoring
  // ----------------------------------------------------
  function checkConnectivity() {
    if (navigator.onLine) {
      if (offlineBadge) offlineBadge.classList.add('hidden');
    } else {
      if (offlineBadge) offlineBadge.classList.remove('hidden');
    }
  }
  window.addEventListener('online', checkConnectivity);
  window.addEventListener('offline', checkConnectivity);
  checkConnectivity();

  // ----------------------------------------------------
  // 5. PWA Install Prompt
  // ----------------------------------------------------
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (installAppBtn) installAppBtn.classList.remove('hidden');
  });

  if (installAppBtn) {
    installAppBtn.addEventListener('click', async () => {
      if (!deferredInstallPrompt) {
        showToast('App is ready for home screen or already installed.');
        return;
      }
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        showToast('Thank you for installing Wi-Fi QR Generator!');
        installAppBtn.classList.add('hidden');
      }
      deferredInstallPrompt = null;
    });
  }

  window.addEventListener('appinstalled', () => {
    if (installAppBtn) installAppBtn.classList.add('hidden');
    showToast('Installed successfully!');
  });

  // ----------------------------------------------------
  // 6. Security & Password Handling
  // ----------------------------------------------------
  function handleSecurityChange() {
    const isNone = securitySelect.value === 'nopass';
    if (isNone) {
      passwordInput.value = '';
      passwordInput.disabled = true;
      passwordInput.required = false;
      passwordContainer.classList.add('opacity-40', 'pointer-events-none');
    } else {
      passwordInput.disabled = false;
      passwordInput.required = true;
      passwordContainer.classList.remove('opacity-40', 'pointer-events-none');
    }
    triggerAutoUpdate();
  }
  securitySelect.addEventListener('change', handleSecurityChange);

  // Toggle Password Visibility
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePasswordBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      
      const eyeIcon = togglePasswordBtn.querySelector('.eye-icon');
      const eyeSlashIcon = togglePasswordBtn.querySelector('.eye-slash-icon');
      if (eyeIcon && eyeSlashIcon) {
        if (isPassword) {
          eyeIcon.classList.add('hidden');
          eyeSlashIcon.classList.remove('hidden');
        } else {
          eyeIcon.classList.remove('hidden');
          eyeSlashIcon.classList.add('hidden');
        }
      }
    });
  }

  // Quick Copy Password
  if (copyPasswordBtn) {
    copyPasswordBtn.addEventListener('click', () => {
      const pass = passwordInput.value;
      if (!pass) {
        showToast('No password entered yet');
        return;
      }
      copyToClipboard(pass, 'Password copied to clipboard!');
    });
  }

  // ----------------------------------------------------
  // 7. Auto-Update on Live Typing
  // ----------------------------------------------------
  function triggerAutoUpdate() {
    if (autoUpdateToggle && autoUpdateToggle.checked && ssidInput.value.trim().length > 0) {
      generateQRCode(false);
    }
  }

  ssidInput.addEventListener('input', triggerAutoUpdate);
  passwordInput.addEventListener('input', triggerAutoUpdate);
  hiddenCheckbox.addEventListener('change', triggerAutoUpdate);
  if (qrColorSelect) qrColorSelect.addEventListener('change', () => generateQRCode(false));
  if (qrEcSelect) qrEcSelect.addEventListener('change', () => generateQRCode(false));
  if (qrSizeSelect) qrSizeSelect.addEventListener('change', () => generateQRCode(false));

  // ----------------------------------------------------
  // 8. Escape Special Wi-Fi Characters (ZXing standard)
  // ----------------------------------------------------
  function escapeWifiString(text) {
    if (!text) return '';
    return text.replace(/([\\;,":])/g, '\\$1');
  }

  // ----------------------------------------------------
  // 9. Toast Notification Helper
  // ----------------------------------------------------
  let toastTimer = null;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('opacity-0', 'pointer-events-none');
    toast.classList.add('opacity-100');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('opacity-100');
      toast.classList.add('opacity-0', 'pointer-events-none');
    }, 2800);
  }

  function copyToClipboard(text, successMsg) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMsg);
      }).catch(() => {
        fallbackCopy(text, successMsg);
      });
    } else {
      fallbackCopy(text, successMsg);
    }
  }

  function fallbackCopy(text, successMsg) {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    tempInput.style.position = 'fixed';
    tempInput.style.opacity = '0';
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      showToast(successMsg);
    } catch (e) {
      showToast('Copied payload');
    }
    document.body.removeChild(tempInput);
  }

  // ----------------------------------------------------
  // 10. QR Code Generation
  // ----------------------------------------------------
  function generateQRCode(notify = true) {
    const ssid = ssidInput.value.trim();
    const security = securitySelect.value;
    const password = passwordInput.value;
    const isHidden = hiddenCheckbox.checked;

    if (!ssid) {
      if (notify) {
        ssidInput.focus();
        showToast('Please enter the Network Name (SSID)');
      }
      return;
    }

    if (security !== 'nopass' && !password) {
      if (notify) {
        passwordInput.focus();
        showToast('Please enter the Wi-Fi password');
      }
      return;
    }

    // Standard Wi-Fi QR format:
    // WIFI:T:[Security];S:[SSID];P:[Password];H:[Hidden];;
    const escapedSSID = escapeWifiString(ssid);
    const escapedPassword = security === 'nopass' ? '' : escapeWifiString(password);
    const hiddenStr = isHidden ? 'true' : 'false';

    currentWifiString = `WIFI:T:${security};S:${escapedSSID};P:${escapedPassword};H:${hiddenStr};;`;
    currentSSID = ssid;
    currentSecurity = security;
    currentPassword = password;

    const chosenColor = qrColorSelect ? qrColorSelect.value : '#0f172a';
    const chosenEc = qrEcSelect ? qrEcSelect.value : 'M';
    const chosenSize = qrSizeSelect ? parseInt(qrSizeSelect.value, 10) : 320;

    try {
      window.drawQRCodeToCanvas(currentWifiString, qrCanvas, {
        size: chosenSize,
        margin: 4,
        colorDark: chosenColor,
        colorLight: '#ffffff',
        ecLevel: chosenEc
      });

      // Update UI preview
      if (rawStringText) {
        rawStringText.textContent = currentWifiString;
      }

      if (networkSummary) {
        const secLabel = security === 'WPA' ? 'WPA/WPA2/WPA3' : security === 'WEP' ? 'WEP' : 'None (Open Network)';
        networkSummary.innerHTML = `
          <div class="summary-row">
            <span class="summary-label">Network Name (SSID):</span>
            <span class="summary-value" dir="ltr"><strong>${escapeHtml(ssid)}</strong></span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Security:</span>
            <span class="summary-value">${secLabel}</span>
          </div>
          ${security !== 'nopass' ? `
          <div class="summary-row">
            <span class="summary-label">Password:</span>
            <span class="summary-value" dir="ltr"><code>${escapeHtml(password)}</code></span>
          </div>` : ''}
          <div class="summary-row">
            <span class="summary-label">Hidden Network:</span>
            <span class="summary-value">${isHidden ? 'Yes' : 'No'}</span>
          </div>
        `;
      }

      if (emptyPrompt) emptyPrompt.classList.add('hidden');
      if (qrOutputSection) {
        qrOutputSection.classList.remove('hidden');
        if (notify) {
          qrOutputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }

      if (notify) showToast('Wi-Fi QR Code generated!');
    } catch (err) {
      console.error('QR Generation error:', err);
      if (notify) showToast('Error generating QR code. Check input fields.');
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    generateQRCode(true);
  });

  generateBtn.addEventListener('click', (e) => {
    e.preventDefault();
    generateQRCode(true);
  });

  // ----------------------------------------------------
  // 11. Download High-Resolution Branded PNG Card
  // ----------------------------------------------------
  downloadBtn.addEventListener('click', () => {
    if (!qrCanvas || !currentWifiString) {
      showToast('Generate a QR code first');
      return;
    }

    try {
      const dlCanvas = document.createElement('canvas');
      const ctx = dlCanvas.getContext('2d');
      const padding = 40;
      const headerHeight = 70;
      const footerHeight = 90;
      const qrW = qrCanvas.width;
      const qrH = qrCanvas.height;

      dlCanvas.width = qrW + padding * 2;
      dlCanvas.height = qrH + headerHeight + footerHeight + padding;

      // Card Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, dlCanvas.width, dlCanvas.height);

      // Border outline
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.strokeRect(4, 4, dlCanvas.width - 8, dlCanvas.height - 8);

      // Header Bar
      ctx.fillStyle = '#0b5ed7';
      ctx.fillRect(4, 4, dlCanvas.width - 8, headerHeight);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Wi-Fi Access Pass', dlCanvas.width / 2, 38);

      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#e0edff';
      ctx.fillText('Scan with mobile camera to connect', dlCanvas.width / 2, 58);

      // Draw QR Canvas
      ctx.drawImage(qrCanvas, padding, headerHeight + 20);

      // Network Details Footer
      const footerY = headerHeight + qrH + 40;
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(currentSSID, dlCanvas.width / 2, footerY);

      if (currentPassword && currentSecurity !== 'nopass') {
        ctx.fillStyle = '#475569';
        ctx.font = '13px system-ui, -apple-system, sans-serif';
        ctx.fillText('Password: ' + currentPassword, dlCanvas.width / 2, footerY + 24);
      }

      // Professional Credit
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px system-ui, -apple-system, sans-serif';
      ctx.fillText('Developed By Waseem Asif', dlCanvas.width / 2, footerY + 46);

      const link = document.createElement('a');
      const safeName = (currentSSID || 'wifi').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `wifi-${safeName}-qr.png`;
      link.href = dlCanvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Downloaded High-Res PNG card!');
    } catch (err) {
      console.error('Download error:', err);
      // Fallback direct canvas download
      const link = document.createElement('a');
      link.download = `wifi-qr.png`;
      link.href = qrCanvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  });

  // ----------------------------------------------------
  // 12. Reset Functionality
  // ----------------------------------------------------
  resetBtn.addEventListener('click', () => {
    form.reset();
    handleSecurityChange();
    currentWifiString = '';
    currentSSID = '';
    currentPassword = '';

    const ctx = qrCanvas.getContext('2d');
    ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);

    if (qrOutputSection) qrOutputSection.classList.add('hidden');
    if (emptyPrompt) emptyPrompt.classList.remove('hidden');

    if (rawStringText) rawStringText.textContent = '';
    if (networkSummary) networkSummary.innerHTML = '';

    ssidInput.focus();
    showToast('Form reset successfully.');
  });

  // ----------------------------------------------------
  // 13. Copy Payload String
  // ----------------------------------------------------
  if (copyStringBtn) {
    copyStringBtn.addEventListener('click', () => {
      if (!currentWifiString) return;
      copyToClipboard(currentWifiString, 'Wi-Fi string copied to clipboard!');
    });
  }

  // ----------------------------------------------------
  // 14. Print Desk Tent Card
  // ----------------------------------------------------
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Initialize security state
  handleSecurityChange();
});
