// =============================================
// Google Apps Script — ระบบ e-Form จัดซื้อจัดจ้าง กฟภ.
// Version 2.0  |  สร้างเอกสาร Google Docs อัตโนมัติ
// =============================================
// วิธีใช้:
//   1. เปิด Google Sheets ใหม่
//   2. Extensions → Apps Script → วาง code นี้
//   3. กำหนดค่า CONFIG ด้านล่าง
//   4. Deploy → New deployment → Web app
//      Execute as: Me | Who has access: Anyone
//   5. คัดลอก Web App URL ไปใส่ในแอป
// =============================================

var CONFIG = {
  SHEET_ID   : '',          // ← ใส่ Google Sheets ID (จาก URL)
  SHEET_NAME : 'งานจัดซื้อ',
  DOCS_FOLDER: '',          // ← ใส่ Google Drive Folder ID (ถ้าต้องการ)
  ORG_NAME   : 'การไฟฟ้าส่วนภูมิภาค',
  ORG_BRANCH : '',          // ← ชื่อสาขา เช่น กฟภ.ชุมแพ
};

// ──────────────────────────────────────────────
//  HTTP HANDLERS
// ──────────────────────────────────────────────

function doGet(e) {
  var action = e.parameter.action || 'getJobs';
  try {
    if (action === 'getJobs')     return respond(getJobs());
    if (action === 'getJob')      return respond(getJobById(e.parameter.id));
    if (action === 'ping')        return respond({ok:true, msg:'Online'});
  } catch(err) {
    return respond({ok:false, msg: err.toString()});
  }
}

function doPost(e) {
  try {
    var data   = JSON.parse(e.postData.contents);
    var action = data.action;
    if (action === 'saveJob')   return respond(saveJob(data));
    if (action === 'deleteJob') return respond(deleteJobById(data.id));
    if (action === 'createDoc') return respond(createDocument(data));
    return respond({ok:false, msg:'Unknown action: ' + action});
  } catch(err) {
    return respond({ok:false, msg: err.toString()});
  }
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ──────────────────────────────────────────────
//  GOOGLE SHEETS — บันทึก / โหลด / ลบ งาน
// ──────────────────────────────────────────────

function getSheet() {
  var id = CONFIG.SHEET_ID ||
           PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) {
    // สร้าง Sheet ใน Spreadsheet ปัจจุบัน
    return SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(CONFIG.SHEET_NAME) ||
      SpreadsheetApp.getActiveSpreadsheet()
        .insertSheet(CONFIG.SHEET_NAME);
  }
  var ss    = SpreadsheetApp.openById(id);
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }
  return sheet;
}

var HEADERS = [
  'id','docno','subject','f1_type','status',
  'form1_json','form2_json','form3_json',
  'created_at','updated_at','doc_url'
];

function ensureHeaders(sheet) {
  var first = sheet.getRange(1,1,1,HEADERS.length).getValues()[0];
  if (!first[0]) {
    sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,HEADERS.length)
      .setBackground('#6B2C8F').setFontColor('#ffffff')
      .setFontWeight('bold');
  }
}

function saveJob(data) {
  var sheet = getSheet();
  ensureHeaders(sheet);
  var now   = new Date().toISOString();
  var id    = data.id || 'job_' + Date.now();
  var rows  = sheet.getDataRange().getValues();

  var rowData = [
    id,
    data.docno   || '',
    data.subject || '',
    data.f1_type || 'buy',
    data.status  || 'draft',
    JSON.stringify(data.forms && data.forms.form1 ? data.forms.form1 : {}),
    JSON.stringify(data.forms && data.forms.form2 ? data.forms.form2 : {}),
    JSON.stringify(data.forms && data.forms.form3 ? data.forms.form3 : {}),
    data.created_at || now,
    now,
    data.doc_url || ''
  ];

  // หาแถวที่มี id ตรงกัน (เริ่ม row 2)
  var found = -1;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) { found = i + 1; break; }
  }
  if (found > 0) {
    sheet.getRange(found, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return {ok:true, id:id, msg:'บันทึกแล้ว'};
}

function getJobs() {
  var sheet = getSheet();
  ensureHeaders(sheet);
  var rows  = sheet.getDataRange().getValues();
  if (rows.length < 2) return {ok:true, jobs:[]};
  var jobs  = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    jobs.push({
      id         : r[0],
      docno      : r[1],
      subject    : r[2],
      f1_type    : r[3],
      status     : r[4],
      forms      : {
        form1: safeJSON(r[5]),
        form2: safeJSON(r[6]),
        form3: safeJSON(r[7])
      },
      created_at : r[8],
      updated_at : r[9],
      doc_url    : r[10]
    });
  }
  return {ok:true, jobs:jobs};
}

function getJobById(id) {
  var all = getJobs();
  for (var i=0; i < all.jobs.length; i++) {
    if (all.jobs[i].id === id) return {ok:true, job:all.jobs[i]};
  }
  return {ok:false, msg:'ไม่พบงาน id=' + id};
}

function deleteJobById(id) {
  var sheet = getSheet();
  var rows  = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      sheet.deleteRow(i + 1);
      return {ok:true, msg:'ลบแล้ว'};
    }
  }
  return {ok:false, msg:'ไม่พบงาน'};
}

function safeJSON(str) {
  try { return JSON.parse(str || '{}'); } catch(e) { return {}; }
}

// ──────────────────────────────────────────────
//  GOOGLE DOCS — สร้างเอกสาร PDF / Docs
// ──────────────────────────────────────────────

function createDocument(data) {
  // data: { job_id, form_type (1|2|3), job_data }
  var job      = data.job_data || {};
  var formType = parseInt(data.form_type) || 1;
  var docTitle = getDocTitle(formType, job);
  var body     = buildDocBody(formType, job);

  // สร้าง Google Doc
  var doc  = DocumentApp.create(docTitle);
  var docB = doc.getBody();
  docB.clear();

  // ตั้งค่า page
  var style = {};
  style[DocumentApp.Attribute.MARGIN_TOP]    = 70;  // ~25mm
  style[DocumentApp.Attribute.MARGIN_BOTTOM] = 57;  // ~20mm
  style[DocumentApp.Attribute.MARGIN_LEFT]   = 85;  // ~30mm
  style[DocumentApp.Attribute.MARGIN_RIGHT]  = 57;  // ~20mm
  docB.setAttributes(style);

  // เขียนเนื้อหา
  body.forEach(function(block) {
    if (block.type === 'heading') {
      var p = docB.appendParagraph(block.text);
      p.setHeading(DocumentApp.ParagraphHeading.HEADING2);
      p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      p.setBold(true);
    } else if (block.type === 'paragraph') {
      var p = docB.appendParagraph(block.text || '');
      p.setAlignment(
        block.align === 'center' ? DocumentApp.HorizontalAlignment.CENTER :
        block.align === 'right'  ? DocumentApp.HorizontalAlignment.RIGHT  :
        DocumentApp.HorizontalAlignment.LEFT
      );
      if (block.bold)   p.setBold(true);
      if (block.indent) p.setIndentFirstLine(block.indent);
      if (block.size)   p.setFontSize(block.size);
    } else if (block.type === 'table') {
      buildTable(docB, block.headers, block.rows);
    } else if (block.type === 'spacer') {
      docB.appendParagraph('');
    }
  });

  doc.saveAndClose();

  // ย้ายไป Folder ถ้ากำหนด
  var docUrl = doc.getUrl();
  if (CONFIG.DOCS_FOLDER) {
    try {
      var file   = DriveApp.getFileById(doc.getId());
      var folder = DriveApp.getFolderById(CONFIG.DOCS_FOLDER);
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
    } catch(e) {}
  }

  // อัปเดต URL ใน Sheet
  if (data.job_id) {
    var sheet = getSheet();
    var rows  = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.job_id) {
        sheet.getRange(i+1, 11).setValue(docUrl);
        break;
      }
    }
  }

  return {ok:true, doc_url:docUrl, title:docTitle};
}

function getDocTitle(formType, job) {
  var type  = job.f1_type === 'hire' ? 'จ้าง' : 'ซื้อ';
  var docno = job.docno || '';
  if (formType === 1) return 'รายงานขอ'+type+' '+docno;
  if (formType === 2) return 'ขออนุมัติจัด'+type+' '+docno;
  return 'ตรวจรับงาน '+docno;
}

function buildTable(body, headers, rows) {
  var data = [headers].concat(rows);
  var t    = body.appendTable(data);
  // header row style
  var hr = t.getRow(0);
  for (var c = 0; c < hr.getNumCells(); c++) {
    hr.getCell(c).setBackgroundColor('#F0E8F8').setBold(true);
  }
  return t;
}

function thaiMonth(m) {
  var months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  return months[m] || '';
}

function formatThaiDate(iso) {
  if (!iso) return '';
  var parts = iso.split('-');
  if (parts.length < 3) return iso;
  var d = parseInt(parts[2]);
  var m = parseInt(parts[1]) - 1;
  var y = parseInt(parts[0]) + 543;
  return d + ' ' + thaiMonth(m) + ' ' + y;
}

function fmtMoney(n) {
  return (parseFloat(n)||0).toLocaleString('th-TH',
    {minimumFractionDigits:2, maximumFractionDigits:2});
}

// ──────────────────────────────────────────────
//  สร้างเนื้อหาเอกสาร แต่ละ Form
// ──────────────────────────────────────────────

function buildDocBody(formType, job) {
  if (formType === 1) return buildForm1Body(job);
  if (formType === 2) return buildForm2Body(job);
  return buildForm3Body(job);
}

function buildForm1Body(job) {
  var f1   = (job.forms && job.forms.form1) ? job.forms.form1 : job;
  var type = (f1.f1_type || job.f1_type) === 'hire' ? 'จ้าง' : 'ซื้อ';
  var items = f1.items || [];
  var sub=0, vat=0, total=0;
  items.forEach(function(it){sub+=(it.qty||1)*(it.price||0);});
  vat   = parseFloat((sub*0.07).toFixed(2));
  total = parseFloat((sub+vat).toFixed(2));

  var itemRows = items.map(function(it,i){
    return [
      String(i+1),
      it.desc || '',
      String(it.qty || 1),
      fmtMoney(it.price),
      fmtMoney((it.qty||1)*(it.price||0))
    ];
  });

  var blocks = [
    // หัวกระดาษ
    {type:'paragraph', text: CONFIG.ORG_NAME+(CONFIG.ORG_BRANCH?' '+CONFIG.ORG_BRANCH:''), align:'center', bold:true, size:18},
    {type:'spacer'},
    // จาก/ถึง/เลขที่/วันที่
    {type:'paragraph', text:'จาก  ' + (f1.f1_from||'')+'                             ถึง  '+(f1.f1_to||'')},
    {type:'paragraph', text:'เลขที่  ' + (f1.f1_docno||'')+'                    วันที่  '+formatThaiDate(f1.f1_date||'')},
    {type:'paragraph', text:'เรื่อง   รายงานขอ'+type+'  '+(f1.f1_subject||'')},
    {type:'spacer'},
    {type:'paragraph', text:'เรียน   '+(f1.f1_attention||'')},
    {type:'spacer'},
    {type:'paragraph',
     text:'         ด้วย '+(f1.f1_dept||'')
          +' มีความประสงค์จะรายงานขอ'+type
          +(f1.f1_subject?' '+f1.f1_subject:'')
          +' โดยวิธีเฉพาะเจาะจง ตามพระราชบัญญัติการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. ๒๕๖๐ ตามมาตรา ๕๖(๒)(ข) จำนวน '
          +items.length+' รายการ ซึ่งมีรายละเอียดดังต่อไปนี้'},
    {type:'spacer'},
    // ข้อ 1
    {type:'paragraph', text:'๑.  เหตุผลความจำเป็นที่ต้องจัด'+type, bold:true},
    {type:'paragraph', text:'     '+(f1.f1_reason||'..........................................................................................................')},
    {type:'spacer'},
    // ข้อ 2 ตาราง
    {type:'paragraph', text:'๒.  รายละเอียดของพัสดุที่จะ'+type, bold:true},
    {type:'table',
     headers:['ที่','รายการ','จำนวน','ราคาต่อหน่วย','ราคารวม'],
     rows: itemRows.concat([
       ['','','','รวมเป็นเงิน',fmtMoney(sub)],
       ['','','','ภาษีมูลค่าเพิ่ม ๗%',fmtMoney(vat)],
       ['','','','จำนวนเงินรวมทั้งสิ้น',fmtMoney(total)]
     ])},
    {type:'spacer'},
    // ข้อ 3-5
    {type:'paragraph', text:'๓.  ราคากลาง', bold:true},
    {type:'paragraph', text:'     '+(f1.f1_market_source ? 'ราคาที่ได้มาจาก'+f1.f1_market_source : 'ราคาที่ได้มาจากการสืบราคาจากท้องตลาด')
          +' '+(f1.f1_market_price?fmtMoney(f1.f1_market_price)+' บาท':'')},
    {type:'spacer'},
    {type:'paragraph', text:'๔.  วงเงินงบประมาณ', bold:true},
    {type:'paragraph', text:'     วงเงินงบประมาณในการจัดซื้อ รวมเป็นเงิน '
          +(f1.f1_budget?fmtMoney(f1.f1_budget)+' บาท ':' บาท ')
          +'ภาษีมูลค่าเพิ่ม ๗% เป็นเงิน '+(f1.f1_vat_amt?fmtMoney(f1.f1_vat_amt)+' บาท ':' บาท ')
          +'รวมเป็นเงินทั้งสิ้น '+(f1.f1_total_budget?fmtMoney(f1.f1_total_budget)+' บาท ':' บาท ')
          +'โดยเบิกจากงบประมาณที่ได้รับจัดสรร '+(f1.f1_budget_type||'')
          +' รหัสบัญชี '+(f1.f1_account_code||'')
          +' ศูนย์ต้นทุน '+(f1.f1_cost_center||'')},
    {type:'spacer'},
    {type:'paragraph', text:'๕.  กำหนดส่งมอบ ภายใน '+(f1.f1_delivery_days||'')
          +' วัน นับถัดจากวันลงนามในใบสั่ง'+type, bold:false},
    {type:'spacer'},
    // ข้อ 6-8 (หน้า 2)
    {type:'paragraph', text:'๖.  วิธีการจัดซื้อจัดจ้างและเหตุผล', bold:true},
    {type:'paragraph', text:'     พิจารณาเห็นสมควรดำเนินการจัดซื้อจัดจ้างโดยวิธีเฉพาะเจาะจง ตามพระราชบัญญัติการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. ๒๕๖๐ ตามมาตรา ๕๖(๒)(ข) เนื่องจากการจัดซื้อจัดจ้างครั้งนี้มีราคาไม่เกิน ๕๐๐,๐๐๐ บาท'},
    {type:'spacer'},
    {type:'paragraph', text:'๗.  หลักเกณฑ์การพิจารณาคัดเลือกข้อเสนอ', bold:true},
    {type:'paragraph', text:'     การพิจารณาคัดเลือกข้อเสนอโดยใช้เกณฑ์ราคา'},
    {type:'spacer'},
    {type:'paragraph', text:'๘.  ข้อเสนออื่น ๆ', bold:true},
    {type:'paragraph', text:'     ๘.๑ เห็นสมควรให้เจ้าหน้าที่ โดย '+(f1.f1_officer||'')
          +' ตำแหน่ง '+(f1.f1_officer_pos||'')+' เป็นผู้ติดต่อตกลงราคากับผู้ขาย/ผู้รับจ้างโดยตรง'},
    {type:'paragraph', text:'     ๘.๒ แต่งตั้งคณะกรรมการตรวจรับพัสดุ/ผู้ตรวจรับพัสดุ ดังนี้'},
    {type:'paragraph', text:'          ๘.๒.๑  '+(f1.f1_com1_name||'...................')+'  ตำแหน่ง '+(f1.f1_com1_pos||'...................')+'  กรรมการ'},
    {type:'paragraph', text:'          ๘.๒.๒  '+(f1.f1_com2_name||'...................')+'  ตำแหน่ง '+(f1.f1_com2_pos||'...................')+'  กรรมการ'},
    {type:'paragraph', text:'          ๘.๒.๓  '+(f1.f1_com3_name||'...................')+'  ตำแหน่ง '+(f1.f1_com3_pos||'...................')+'  กรรมการ'},
    {type:'paragraph', text:'     ทั้งนี้เป็นอำนาจของ '+(f1.f1_auth_pos||'')
          +' ตามคำสั่งเลขที่ '+(f1.f1_auth_order||'')
          +' ลงวันที่ '+formatThaiDate(f1.f1_auth_date||'')},
    {type:'spacer'},
    {type:'paragraph', text:'     จึงเรียนมาเพื่อโปรดพิจารณา หากเห็นชอบขอได้โปรดอนุมัติให้ดำเนินการจัด'+type+'โดยวิธีเฉพาะเจาะจงตามมาตรา ๕๖(๒)(ข)'},
    {type:'spacer'},
    {type:'spacer'},
    // ลายเซ็น
    {type:'paragraph', text:'('+( f1.f1_signer||'')+')', align:'center'},
    {type:'paragraph', text:(f1.f1_signer_pos||''), align:'center'},
    {type:'spacer'},
    {type:'paragraph', text:'แผนก '+(f1.f1_dept_sign||'')+'   โทร. '+(f1.f1_phone||'')}
  ];
  return blocks;
}

function buildForm2Body(job) {
  var f2   = (job.forms && job.forms.form2) ? job.forms.form2 : job;
  var f1   = (job.forms && job.forms.form1) ? job.forms.form1 : {};
  var type = (f1.f1_type || job.f1_type) === 'hire' ? 'จ้าง' : 'ซื้อ';
  var items = f2.items || [];
  var sub=0,vat=0,total=0;
  items.forEach(function(it){sub+=(it.qty||1)*(it.price||0);});
  vat=parseFloat((sub*0.07).toFixed(2)); total=sub+vat;

  var itemRows = items.map(function(it,i){
    return [String(i+1), it.desc||'', String(it.qty||1),
            it.unit||'', fmtMoney(it.price), fmtMoney((it.qty||1)*(it.price||0))];
  });

  return [
    {type:'paragraph', text:CONFIG.ORG_NAME+(CONFIG.ORG_BRANCH?' '+CONFIG.ORG_BRANCH:''), align:'center', bold:true, size:18},
    {type:'spacer'},
    {type:'paragraph', text:'จาก  '+(f2.f2_from||'')+'                    ถึง  '+(f2.f2_to||'')},
    {type:'paragraph', text:'เลขที่  '+(f2.f2_docno||'')+'              วันที่  '+formatThaiDate(f2.f2_date||'')},
    {type:'paragraph', text:'เรื่อง   ขออนุมัติจัด'+type+'  '+(f1.f1_subject||f2.f2_subject||'')},
    {type:'spacer'},
    {type:'paragraph', text:'เรียน   '+(f2.f2_to||'')},
    {type:'spacer'},
    {type:'paragraph', text:'     ตามที่ '+(f2.f2_ref_dept||'')
          +' ได้อนุมัติให้จัด'+type+' '+(f1.f1_subject||f2.f2_subject||'')
          +' โดยวิธีเฉพาะเจาะจง ตามมาตรา ๕๖(๒)(ข) โดยมีรายละเอียดดังนี้'},
    {type:'spacer'},
    {type:'table',
     headers:['ที่','รายการ','จำนวน','หน่วย','ราคาต่อหน่วย','รวมเป็นเงิน'],
     rows: itemRows.concat([
       ['','','','','รวมเป็นเงิน',fmtMoney(sub)],
       ['','','','','ภาษีมูลค่าเพิ่ม ๗%',fmtMoney(vat)],
       ['','','','','รวมทั้งสิ้น',fmtMoney(total)]
     ])},
    {type:'spacer'},
    {type:'paragraph', text:'     เห็นควรจัด'+type+' โดยวิธีเฉพาะเจาะจงจาก '+(f2.f2_vendor||'')
          +' สถานที่ '+(f2.f2_quote_no||'')},
    {type:'spacer'},
    {type:'paragraph', text:'     จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ'},
    {type:'spacer'},{type:'spacer'},
    {type:'paragraph', text:'('+( f2.f2_signer||'')+')', align:'center'},
    {type:'paragraph', text:(f2.f2_signer_pos||''), align:'center'},
    {type:'spacer'},
    {type:'paragraph', text:'                                        อนุมัติและลงนามแล้ว', align:'right'},
    {type:'spacer'},
    {type:'paragraph', text:'                                        ('+( f2.f2_approver||'')+')','align':'right'},
    {type:'paragraph', text:'                                        '+(f2.f2_approver_pos||''), align:'right'},
    {type:'spacer'},
    {type:'paragraph', text:'แผนก '+(f2.f2_dept||'')+'   โทร. '+(f2.f2_phone||'')}
  ];
}

function buildForm3Body(job) {
  var f3 = (job.forms && job.forms.form3) ? job.forms.form3 : job;
  var f1 = (job.forms && job.forms.form1) ? job.forms.form1 : {};
  var type = (f1.f1_type || job.f1_type) === 'hire' ? 'จ้าง' : 'ซื้อ';
  return [
    {type:'paragraph', text:CONFIG.ORG_NAME+(CONFIG.ORG_BRANCH?' '+CONFIG.ORG_BRANCH:''), align:'center', bold:true, size:18},
    {type:'spacer'},
    {type:'paragraph', text:'จาก  คณะกรรมการตรวจรับ                ถึง  '+(f3.f3_to||'')},
    {type:'paragraph', text:'เลขที่  '+(f3.f3_docno||'')+'              วันที่  '+formatThaiDate(f3.f3_date||'')},
    {type:'paragraph', text:'เรื่อง   '+(f3.f3_subject || 'การตรวจรับ'+type+' '+(f1.f1_subject||''))},
    {type:'spacer'},
    {type:'paragraph', text:'เรียน   '+(f3.f3_to||'')},
    {type:'spacer'},
    {type:'paragraph', text:'     ตามที่ '+(f3.f3_attention||'')
          +' ได้อนุมัติให้จัด'+type+' '+(f3.f3_item_desc||f1.f1_subject||'')
          +' จาก '+(f3.f3_vendor||'')
          +' รวมเป็นเงินทั้งสิ้น '+fmtMoney(f3.f3_amount||0)+' บาท'},
    {type:'spacer'},
    {type:'paragraph', text:'     คณะกรรมการฯ ได้ตรวจสอบและรับมอบ'+type+'ดังกล่าว เรียบร้อยแล้ว จึงเรียนเพื่อโปรดดำเนินการต่อไป'},
    {type:'spacer'},{type:'spacer'},
    {type:'paragraph', text:'ลงชื่อ  ('+( f3.f3_chair||'')+')', align:'center'},
    {type:'paragraph', text:(f3.f3_chair_pos||''), align:'center'},
    {type:'paragraph', text:'กรรมการ', align:'center'},
    {type:'spacer'},
    {type:'paragraph', text:'ลงชื่อ  ('+( f3.f3_com1||'')+')', align:'center'},
    {type:'paragraph', text:(f3.f3_com1_pos||''), align:'center'},
    {type:'paragraph', text:'กรรมการ', align:'center'},
    {type:'spacer'},
    {type:'paragraph', text:'ลงชื่อ  ('+( f3.f3_com2||'')+')', align:'center'},
    {type:'paragraph', text:(f3.f3_com2_pos||''), align:'center'},
    {type:'paragraph', text:'กรรมการ', align:'center'},
    {type:'spacer'},
    {type:'paragraph', text:'แผนก '+(f3.f3_dept_sign||'')+'   โทร. '+(f3.f3_phone||'')}
  ];
}

// ──────────────────────────────────────────────
//  TEST FUNCTIONS (รันใน Apps Script Editor)
// ──────────────────────────────────────────────

function TEST_setup() {
  Logger.log('=== SETUP TEST ===');
  var sheet = getSheet();
  ensureHeaders(sheet);
  Logger.log('Sheet ready: ' + sheet.getName());
}

function TEST_saveJob() {
  var result = saveJob({
    id:'test-001', docno:'2568-001',
    subject:'ค่าวัสดุสำนักงาน', f1_type:'buy', status:'draft',
    forms:{
      form1:{f1_from:'แผนกบริหาร',f1_to:'ผู้จัดการ',f1_docno:'2568-001',
             f1_subject:'ค่าวัสดุสำนักงาน',f1_reason:'เพื่อใช้ในการปฏิบัติงาน',
             items:[{desc:'กระดาษ A4',qty:5,price:180,unit:'รีม'}]},
      form2:{}, form3:{}
    }
  });
  Logger.log(JSON.stringify(result));
}

function TEST_createDoc() {
  var result = createDocument({
    form_type: 1,
    job_data: {
      docno:'2568-001', f1_type:'buy',
      forms:{
        form1:{
          f1_from:'แผนกบริหาร', f1_to:'ผู้จัดการ', f1_docno:'2568-001',
          f1_date:'2025-06-15', f1_subject:'ค่าวัสดุสำนักงาน',
          f1_attention:'ผู้จัดการการไฟฟ้าส่วนภูมิภาค',
          f1_reason:'เพื่อใช้ในการปฏิบัติงานประจำปี ๒๕๖๘',
          items:[
            {desc:'กระดาษ A4 80g',qty:5,price:180},
            {desc:'ปากกาลูกลื่น',qty:12,price:25}
          ],
          f1_budget:'1750', f1_delivery_days:'30',
          f1_signer:'นายสมชาย ใจดี', f1_signer_pos:'หัวหน้างานพัสดุ',
          f1_approver:'นายสมศักดิ์ มีทรัพย์', f1_approver_pos:'ผู้จัดการ'
        }
      }
    }
  });
  Logger.log(JSON.stringify(result));
  if (result.ok) Logger.log('Doc URL: ' + result.doc_url);
}
