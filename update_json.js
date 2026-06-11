const fs = require('fs');
const path = require('path');

const rootJsonPath = path.join(__dirname, 'medicines_catalog_complete.json');
const srcJsonPath = path.join(__dirname, 'src', 'data', 'medicines_catalog_complete.json');

function updateJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const updatedData = data.map(category => {
      const updatedMedicines = category.medicines.map(med => {
        if (!('imageUrl' in med)) {
          return { ...med, imageUrl: "" };
        }
        return med;
      });
      return { ...category, medicines: updatedMedicines };
    });
    
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), 'utf8');
    console.log(`Successfully updated ${filePath}`);
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
}

updateJson(rootJsonPath);
updateJson(srcJsonPath);
