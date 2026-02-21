// ===== Google Sheets API Configuration =====

const CONFIG = {
    // Your NEW Google Sheets API Key
    API_KEY: 'AIzaSyCMSRgTrWtBbfpqob8ahgdq4z9LZAwB_N0',

    // Your Google Spreadsheet ID
    SPREADSHEET_ID: '1M_k3p_o76a3tmpBVC64QnvNrt2DOwNsvr5xRG9N5Y_o',

    // Sheet names (must match tab names exactly)
    SHEETS: {
        PRODUCTS: 'Products',
        GALLERY: 'Surgery_Gallery'
    },

    // Column mappings for Products sheet
    PRODUCT_COLUMNS: {
        IMAGE_1: 'image_url_1',
        IMAGE_2: 'image_url_2',
        IMAGE_3: 'image_url_3',
        NAME: 'product_name',
        DESCRIPTION: 'basic_description',
        DIMENSIONS: 'frame_dimensions',
        COLOR: 'frame_color',
        WEIGHT: 'frame_weight',
        BRAND: 'brand_name',
        AGE_RANGE: 'age_range',
        SHAPE: 'frame_shape',
        MATERIAL: 'material_type'
    },

    // Column mappings for Surgery Gallery sheet
    GALLERY_COLUMNS: {
        IMAGE: 'image_url',
        NAME: 'surgery_name',
        DESCRIPTION: 'description',
        CATEGORY: 'category'
    },

    // Number of preview items on homepage
    PREVIEW_LIMIT: {
        PRODUCTS: 3,
        GALLERY: 3
    }
};

// Google Sheets API endpoint
const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';