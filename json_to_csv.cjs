const fs = require('fs');

const inputPath = 'src/data/medicines_catalog_complete.json';
const outputPath = 'medicines_catalog.csv';

function escapeCsv(str) {
  if (str === null || str === undefined) return '""';
  const strVal = String(str);
  // If the string contains quotes, commas, or newlines, wrap it in quotes and double the internal quotes
  if (strVal.includes('"') || strVal.includes(',') || strVal.includes('\n')) {
    return `"${strVal.replace(/"/g, '""')}"`;
  }
  return strVal;
}

function parsePackaging(pkg) {
  if (!pkg) return { type: '', size: '', unit: '' };
  
  let type = pkg;
  let size = '1';
  let unit = '';

  const match = pkg.match(/^(.+?)\s*\((.+?)\)$/);
  if (match) {
    type = match[1].trim();
    const qtyStr = match[2].trim();
    // parse out the number and the unit from qtyStr (e.g. "10s", "60ml")
    const qtyMatch = qtyStr.match(/^([\d.]+)([a-zA-Z]*)$/);
    if (qtyMatch) {
      size = qtyMatch[1];
      unit = qtyMatch[2];
      if (unit === 's') unit = 'tablets';
    } else {
      size = qtyStr; // fallback
    }
  } else {
    // e.g. "vial"
    type = pkg;
    size = '1';
    unit = pkg;
  }
  
  // capitalize type
  type = type.charAt(0).toUpperCase() + type.slice(1);
  return { type, size, unit };
}

try {
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

  const headers = [
    'Category ID',
    'Category Name',
    'Medicine ID',
    'Medicine Name',
    'Formula',
    'Description',
    'Image URL',
    'SKU',
    'Strength',
    'Package Type',
    'Package Size',
    'Unit',
    'Price',
    'Available'
  ];

  let csvContent = headers.join(',') + '\n';

  data.forEach(category => {
    category.medicines.forEach(medicine => {
      medicine.variants.forEach(variant => {
        const pkgData = parsePackaging(variant.packaging);
        
        const row = [
          category.categoryId,
          category.categoryName,
          medicine.medicineId,
          medicine.name,
          medicine.formula,
          medicine.description,
          medicine.imageUrl,
          variant.sku,
          variant.strength,
          pkgData.type,
          pkgData.size,
          pkgData.unit,
          variant.price,
          variant.available ? 'TRUE' : 'FALSE'
        ];
        
        csvContent += row.map(escapeCsv).join(',') + '\n';
      });
    });
  });

  fs.writeFileSync(outputPath, csvContent, 'utf8');
  console.log(`Successfully generated ${outputPath}`);

} catch (err) {
  console.error("Error generating CSV:", err);
}
