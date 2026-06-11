const fs = require('fs');
const path = require('path');

const srcDataPath = path.join(__dirname, 'src', 'data', 'medicines_catalog_complete.json');
const rootDataPath = path.join(__dirname, 'medicines_catalog_complete.json');

const descriptions = [
  "This medication is highly effective for its intended therapeutic use. Please consult your healthcare provider or our pharmacist for personalized dosing instructions and potential interactions.",
  "A trusted formula designed to provide fast and reliable relief. Ensure you follow the prescribed strength and packaging details carefully.",
  "Premium quality medicine manufactured under strict pharmaceutical guidelines. Keep out of reach of children and store in a cool, dry place.",
  "Clinically proven to manage symptoms effectively. Recommended by healthcare professionals worldwide. Always read the label before use."
];

function updateCatalog(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  const rawData = fs.readFileSync(filePath, 'utf8');
  const catalog = JSON.parse(rawData);

  catalog.forEach(category => {
    category.medicines.forEach((medicine, i) => {
      // Assign a random description from the array to simulate diverse data
      if (!medicine.description) {
        medicine.description = `${medicine.name} (${medicine.formula}) belongs to the ${category.categoryName} category. ` + descriptions[i % descriptions.length];
      }

      medicine.variants.forEach(variant => {
        // Reduce prices randomly between 10 and 500
        variant.price = Math.floor(Math.random() * (500 - 10 + 1)) + 10;
      });
    });
  });

  fs.writeFileSync(filePath, JSON.stringify(catalog, null, 2));
  console.log(`Updated catalog in ${filePath}`);
}

updateCatalog(srcDataPath);
updateCatalog(rootDataPath);
