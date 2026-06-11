const fs = require('fs');
const path = require('path');

const srcDataPath = path.join(__dirname, 'src', 'data', 'medicines_catalog_complete.json');
const rootDataPath = path.join(__dirname, 'medicines_catalog_complete.json');

function updatePrices(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  const rawData = fs.readFileSync(filePath, 'utf8');
  const catalog = JSON.parse(rawData);

  catalog.forEach(category => {
    category.medicines.forEach(medicine => {
      medicine.variants.forEach(variant => {
        if (variant.price) {
          variant.price = Math.round(variant.price * 280);
        }
      });
    });
  });

  fs.writeFileSync(filePath, JSON.stringify(catalog, null, 2));
  console.log(`Updated prices in ${filePath}`);
}

updatePrices(srcDataPath);
updatePrices(rootDataPath);
