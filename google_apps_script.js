function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet1 = ss.getSheetByName('HafizPharmacy');
    var sheet2 = ss.getSheetByName('OtherItems');
    
    if (!sheet1 || !sheet2) {
      return ContentService.createTextOutput(JSON.stringify({
        error: "One or both sheets not found. Check sheet names."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    function getSheetData(sheet) {
      var data = sheet.getDataRange().getValues();
      if (data.length < 2) return [];
      var headers = data[0];
      var rows = data.slice(1);
      
      return rows.map(function(row) {
        var obj = {};
        headers.forEach(function(header, index) {
          obj[header] = row[index];
        });
        return obj;
      });
    }

    var result1 = getSheetData(sheet1);
    var result2 = getSheetData(sheet2);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: {
        hafizPharmacy: result1,
        otherItems: result2
      }
    }))
    .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}
