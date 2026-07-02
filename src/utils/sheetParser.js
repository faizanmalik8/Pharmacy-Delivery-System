import Papa from 'papaparse';

/**
 * Fetches and parses the published Google Sheet CSV and converts it back
 * to the hierarchical format required by the application.
 */
export async function fetchCatalogFromGoogleSheets() {
  // If you deployed the Google Apps Script, put its URL here:
  const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
  const sheetId = import.meta.env.VITE_GOOGLE_SHEET_ID;
  
  if (scriptUrl) {
    return await fetchFromAppsScript(scriptUrl);
  } else if (sheetId) {
    return await fetchFromCsvExport(sheetId);
  } else {
    throw new Error("Missing Configuration: Please set VITE_GOOGLE_SCRIPT_URL or VITE_GOOGLE_SHEET_ID in your .env file.");
  }
}

async function fetchFromAppsScript(scriptUrl) {
  try {
    const response = await fetch(scriptUrl);
    
    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}.`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(`Google Script Error: ${result.error}`);
    }
    
    let hafizRows = [];
    let otherRows = [];
    
    if (Array.isArray(result.data)) {
      hafizRows = result.data;
    } else if (result.data && result.data.hafizPharmacy) {
      hafizRows = result.data.hafizPharmacy;
      otherRows = result.data.otherItems || [];
    }
    
    return transformMultipleTabs(hafizRows, otherRows);
    
  } catch (error) {
    console.error("Apps Script Fetch Error:", error);
    if (error.message.includes('Failed to fetch')) {
      throw new Error("Network Error: 'Failed to fetch'. This usually means the Google Apps Script URL is incorrect, your internet is down, or CORS is not configured correctly in the script.");
    }
    throw error;
  }
}

async function fetchFromCsvExport(sheetId) {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

  try {
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}.`);
    }
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const hierarchicalData = transformCsvToJson(results.data);
            resolve(hierarchicalData);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(new Error(`CSV Parsing Error: ${error.message}`));
        }
      });
    });
  } catch (error) {
    console.error("CSV Fetch Error:", error);
    // Best practice exception handling for "Failed to fetch" in browsers
    if (error.message.includes('Failed to fetch')) {
      throw new Error("Network Error: 'Failed to fetch'. This happens when the Google Sheet is NOT completely public ('Anyone with the link can view'). Google redirects private sheets to a login page, which blocks the browser with a CORS error.");
    }
    throw error;
  }
}

/**
 * Transforms data from both tabs and structures it with Medicines as a group.
 */
function transformMultipleTabs(hafizRows, otherRows) {
  const medicinesCategories = transformCsvToJson(hafizRows);
  
  const otherCategoriesMap = new Map();

  otherRows.forEach(row => {
    // Generate a string or numeric ID, fallback to 'Uncategorized' if missing
    const rawCategoryId = row['Category ID']?.trim();
    const categoryId = rawCategoryId ? `other_${rawCategoryId}` : `other_cat_${row['Category Name']}`;
    const categoryName = row['Category Name']?.trim() || 'Uncategorized';
    
    const productId = row['Product ID']?.trim();
    const productName = row['Product Name']?.trim();
    const sku = row['SKU']?.trim();
    const price = parseFloat(row['Price'] || '0');
    const availableStr = (row['Available'] || '').toUpperCase().trim();
    const available = availableStr === 'YES';
    const imageUrl = row['Image URL']?.trim() || '';
    const description = row['Description']?.trim() || '';
    
    if (!productId || !sku) return;

    if (!otherCategoriesMap.has(categoryId)) {
      otherCategoriesMap.set(categoryId, {
        categoryId: categoryId, 
        categoryName: categoryName,
        medicinesMap: new Map()
      });
    }

    const category = otherCategoriesMap.get(categoryId);

    if (!category.medicinesMap.has(productId)) {
      category.medicinesMap.set(productId, {
        medicineId: productId, // Map product ID to medicineId for UI compatibility
        name: productName,
        formula: '', // Not applicable
        imageUrl: imageUrl,
        description: description,
        variants: []
      });
    }

    const product = category.medicinesMap.get(productId);

    product.variants.push({
      sku: sku,
      strength: '',
      packaging: '1 pc', // Default packaging
      price: price,
      available: available
    });
  });

  const otherCategories = Array.from(otherCategoriesMap.values()).map(cat => ({
    categoryId: cat.categoryId,
    categoryName: cat.categoryName,
    medicines: Array.from(cat.medicinesMap.values())
  }));

  const finalArray = [];
  
  if (medicinesCategories.length > 0) {
    finalArray.push({
      categoryId: 999999,
      categoryName: 'Medicines',
      isGroup: true,
      subCategories: medicinesCategories,
      medicines: [] // Main group has subcategories, not direct medicines
    });
  }

  finalArray.push(...otherCategories);

  return finalArray;
}

/**
 * Transforms flat CSV rows into the hierarchical Category -> Medicine -> Variant structure
 */
function transformCsvToJson(rows) {
  const categoriesMap = new Map();

  rows.forEach(row => {
    // 1. Extract raw values, falling back to empty string if missing
    const categoryId = parseInt(row['Category ID'] || '0', 10);
    const categoryName = row['Category Name']?.trim() || 'Uncategorized';
    
    const medicineId = row['Medicine ID']?.trim();
    const medicineName = row['Medicine Name']?.trim();
    const formula = row['Formula']?.trim();
    const description = row['Description']?.trim() || '';
    const imageUrl = row['Image URL']?.trim() || '';
    
    const sku = row['SKU']?.trim();
    const strength = row['Strength']?.trim() || '';
    const packageType = row['Package Type']?.trim() || '';
    const packageSize = row['Package Size']?.trim() || '';
    const unit = row['Unit']?.trim() || '';
    const price = parseFloat(row['Price'] || '0');
    
    // Parse boolean "YES" or "NO" (case insensitive)
    const availableStr = (row['Available'] || '').toUpperCase().trim();
    const available = availableStr === 'YES';

    // Format packaging back to what the UI might expect, e.g., "strip (10s)"
    // Or keep them separate if the UI was updated. Let's combine them for backward compatibility with App.jsx
    let packaging = packageType;
    if (packageSize && unit) {
      packaging = `${packageType.toLowerCase()} (${packageSize}${unit === 'tablets/capsules' || unit === 'tablets' ? 's' : unit})`;
    } else if (packageSize) {
      packaging = `${packageType.toLowerCase()} (${packageSize})`;
    } else {
      packaging = packageType.toLowerCase();
    }

    if (!categoryId || !medicineId || !sku) {
      // Skip invalid rows
      return;
    }

    // 2. Build Category
    if (!categoriesMap.has(categoryId)) {
      categoriesMap.set(categoryId, {
        categoryId: categoryId,
        categoryName: categoryName,
        medicinesMap: new Map() // temporary map to group medicines
      });
    }

    const category = categoriesMap.get(categoryId);

    // 3. Build Medicine
    if (!category.medicinesMap.has(medicineId)) {
      category.medicinesMap.set(medicineId, {
        medicineId: medicineId,
        name: medicineName,
        formula: formula,
        imageUrl: imageUrl,
        description: description,
        variants: []
      });
    }

    const medicine = category.medicinesMap.get(medicineId);

    // 4. Add Variant
    medicine.variants.push({
      sku: sku,
      strength: strength,
      packaging: packaging,
      price: price,
      available: available
    });
  });

  // 5. Convert Maps back to Arrays
  const finalArray = Array.from(categoriesMap.values()).map(cat => ({
    categoryId: cat.categoryId,
    categoryName: cat.categoryName,
    medicines: Array.from(cat.medicinesMap.values())
  }));

  return finalArray;
}
