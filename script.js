// ===== Main JavaScript for Vision Care Centre Website =====

// Utility Functions
const Utils = {
    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Debounce function for search
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Show loading state
    showLoading(container) {
        container.innerHTML = '<div class="loading">Loading...</div>';
    },

    // Show error state
    showError(container, message) {
        container.innerHTML = `<div class="error-message">${message}</div>`;
    },

    // Format currency (if needed for future pricing)
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    }
};

// Google Sheets API Service
class GoogleSheetsService {
    constructor() {
        this.apiKey = CONFIG.API_KEY;
        this.spreadsheetId = CONFIG.SPREADSHEET_ID;
        this.baseURL = `${SHEETS_API_BASE}/${this.spreadsheetId}/values`;
    }

    async fetchData(sheetName) {
        try {
            const url = `${this.baseURL}/${sheetName}?key=${this.apiKey}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message);
            }
            
            return this.parseSheetData(data.values, sheetName);
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }

    parseSheetData(values, sheetName) {
        if (!values || values.length === 0) {
            return [];
        }

        const headers = values[0];
        const rows = values.slice(1);

        return rows.map(row => {
            const item = {};
            headers.forEach((header, index) => {
                const key = header.trim().toLowerCase().replace(/\s+/g, '_');
                item[key] = row[index] || '';
            });
            return item;
        });
    }
}

// Product Manager
class ProductManager {
    constructor() {
        this.service = new GoogleSheetsService();
        this.products = [];
        this.filteredProducts = [];
    }

    async loadProducts() {
        try {
            this.products = await this.service.fetchData(CONFIG.SHEETS.PRODUCTS);
            this.filteredProducts = [...this.products];
            return this.products;
        } catch (error) {
            console.error('Failed to load products:', error);
            return [];
        }
    }

    getProductsForPreview(limit = CONFIG.PREVIEW_LIMIT.PRODUCTS) {
        return this.filteredProducts.slice(0, limit);
    }

    getProductById(id) {
        return this.filteredProducts.find(product => product.id === id);
    }

    searchProducts(query) {
        if (!query) {
            this.filteredProducts = [...this.products];
            return this.filteredProducts;
        }

        const searchQuery = query.toLowerCase();
        this.filteredProducts = this.products.filter(product => 
            product[CONFIG.PRODUCT_COLUMNS.NAME]?.toLowerCase().includes(searchQuery) ||
            product[CONFIG.PRODUCT_COLUMNS.DESCRIPTION]?.toLowerCase().includes(searchQuery) ||
            product[CONFIG.PRODUCT_COLUMNS.BRAND]?.toLowerCase().includes(searchQuery) ||
            product[CONFIG.PRODUCT_COLUMNS.SHAPE]?.toLowerCase().includes(searchQuery) ||
            product[CONFIG.PRODUCT_COLUMNS.MATERIAL]?.toLowerCase().includes(searchQuery)
        );
        
        return this.filteredProducts;
    }
}

// Gallery Manager
class GalleryManager {
    constructor() {
        this.service = new GoogleSheetsService();
        this.galleryItems = [];
    }

    async loadGallery() {
        try {
            this.galleryItems = await this.service.fetchData(CONFIG.SHEETS.GALLERY);
            return this.galleryItems;
        } catch (error) {
            console.error('Failed to load gallery:', error);
            return [];
        }
    }

    getGalleryForPreview(limit = CONFIG.PREVIEW_LIMIT.GALLERY) {
        return this.galleryItems.slice(0, limit);
    }

    getGalleryById(id) {
        return this.galleryItems.find(item => item.id === id);
    }

    filterByCategory(category) {
        if (!category) return this.galleryItems;
        return this.galleryItems.filter(item => 
            item[CONFIG.GALLERY_COLUMNS.CATEGORY]?.toLowerCase() === category.toLowerCase()
        );
    }
}

// UI Renderer
class UI {
    constructor() {
        this.productManager = new ProductManager();
        this.galleryManager = new GalleryManager();
    }

    // Render Products
    renderProducts(container, products) {
        if (!products || products.length === 0) {
            container.innerHTML = '<div class="no-results">No products found.</div>';
            return;
        }

        const html = products.map((product, index) => {
            const images = this.getProductImages(product);
            const mainImage = images[0] || 'https://via.placeholder.com/300x250?text=No+Image';
            
            return `
                <div class="product-card" onclick="goToProduct(${index})">
                    <div class="product-image">
                        <img src="${mainImage}" alt="${product[CONFIG.PRODUCT_COLUMNS.NAME] || 'Product'}">
                    </div>
                    <div class="product-info">
                        <h3>${product[CONFIG.PRODUCT_COLUMNS.NAME] || 'Product Name'}</h3>
                        <p>${product[CONFIG.PRODUCT_COLUMNS.DESCRIPTION] || 'No description available.'}</p>
                        ${product[CONFIG.PRODUCT_COLUMNS.BRAND] ? `<span class="product-brand">${product[CONFIG.PRODUCT_COLUMNS.BRAND]}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
        // Store products data globally for navigation
        window.productsData = products;
    }

    // Render Gallery
    renderGallery(container, items) {
        if (!items || items.length === 0) {
            container.innerHTML = '<div class="no-results">No gallery items found.</div>';
            return;
        }

        const html = items.map((item, index) => {
            const imageUrl = item[CONFIG.GALLERY_COLUMNS.IMAGE] || 'https://via.placeholder.com/300x250?text=No+Image';
            
            return `
                <div class="gallery-card" onclick="goToSurgery(${index})">
                    <div class="gallery-image">
                        <img src="${imageUrl}" alt="${item[CONFIG.GALLERY_COLUMNS.NAME] || 'Gallery Item'}">
                    </div>
                    <div class="gallery-info">
                        <h3>${item[CONFIG.GALLERY_COLUMNS.NAME] || 'Gallery Item'}</h3>
                        <p>${item[CONFIG.GALLERY_COLUMNS.DESCRIPTION] || 'No description available.'}</p>
                        ${item[CONFIG.GALLERY_COLUMNS.CATEGORY] ? `<p class="category-badge">${item[CONFIG.GALLERY_COLUMNS.CATEGORY]}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
        // Store gallery data globally for navigation
        window.galleryData = items;
    }

    // Product Modal
    openProductModal(productId) {
        const product = this.productManager.getProductById(productId);
        if (!product) return;

        const modal = document.getElementById('product-modal');
        const modalContent = modal.querySelector('.modal-content');
        
        const images = this.getProductImages(product);
        
        modalContent.innerHTML = `
            <span class="close-modal">&times;</span>
            <div class="modal-body">
                <div class="modal-images">
                    <div class="main-image">
                        <img id="modal-main-image" src="${images[0] || 'https://via.placeholder.com/400x400?text=No+Image'}" alt="${product[CONFIG.PRODUCT_COLUMNS.NAME] || 'Product'}">
                    </div>
                    <div class="thumbnail-images" id="modal-thumbnails">
                        ${images.map((img, index) => `
                            <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="ui.changeProductImage('${img}', ${index})">
                                <img src="${img}" alt="Product image ${index + 1}">
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-details">
                    <h2>${product[CONFIG.PRODUCT_COLUMNS.NAME] || 'Product Name'}</h2>
                    <p id="modal-basic-description" class="modal-description">${product[CONFIG.PRODUCT_COLUMNS.DESCRIPTION] || 'No description available.'}</p>
                    
                    <div class="product-specs">
                        <h3>Specifications</h3>
                        <div class="spec-item">
                            <span class="spec-label"><i class="fas fa-ruler"></i> Dimensions:</span>
                            <span id="modal-dimensions" class="spec-value">${product[CONFIG.PRODUCT_COLUMNS.DIMENSIONS] || 'Not specified'}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label"><i class="fas fa-palette"></i> Color:</span>
                            <span id="modal-color" class="spec-value">${product[CONFIG.PRODUCT_COLUMNS.COLOR] || 'Not specified'}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label"><i class="fas fa-weight"></i> Weight:</span>
                            <span id="modal-weight" class="spec-value">${product[CONFIG.PRODUCT_COLUMNS.WEIGHT] || 'Not specified'}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label"><i class="fas fa-tag"></i> Brand:</span>
                            <span id="modal-brand" class="spec-value">${product[CONFIG.PRODUCT_COLUMNS.BRAND] || 'Not specified'}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label"><i class="fas fa-users"></i> Age Range:</span>
                            <span id="modal-age-range" class="spec-value">${product[CONFIG.PRODUCT_COLUMNS.AGE_RANGE] || 'Not specified'}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label"><i class="fas fa-shapes"></i> Frame Shape:</span>
                            <span id="modal-shape" class="spec-value">${product[CONFIG.PRODUCT_COLUMNS.SHAPE] || 'Not specified'}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label"><i class="fas fa-cube"></i> Material:</span>
                            <span id="modal-material" class="spec-value">${product[CONFIG.PRODUCT_COLUMNS.MATERIAL] || 'Not specified'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });

        // Close modal when clicking close button
        modal.querySelector('.close-modal').addEventListener('click', () => {
            this.closeModal(modal);
        });
    }

    // Gallery Modal
    openGalleryModal(itemId) {
        const item = this.galleryManager.getGalleryById(itemId);
        if (!item) return;

        const modal = document.getElementById('gallery-modal');
        const modalContent = modal.querySelector('.modal-content');
        
        const imageUrl = item[CONFIG.GALLERY_COLUMNS.IMAGE] || 'https://via.placeholder.com/500x500?text=No+Image';
        
        modalContent.innerHTML = `
            <span class="close-modal">&times;</span>
            <div class="modal-body gallery-modal-body">
                <div class="gallery-modal-image">
                    <img id="gallery-modal-image" src="${imageUrl}" alt="${item[CONFIG.GALLERY_COLUMNS.NAME] || 'Gallery Item'}">
                </div>
                <div class="gallery-modal-details">
                    <h2 id="gallery-modal-title">${item[CONFIG.GALLERY_COLUMNS.NAME] || 'Gallery Item'}</h2>
                    <p id="gallery-modal-category" class="category-badge">${item[CONFIG.GALLERY_COLUMNS.CATEGORY] || 'Uncategorized'}</p>
                    <p id="gallery-modal-description" class="modal-description">${item[CONFIG.GALLERY_COLUMNS.DESCRIPTION] || 'No description available.'}</p>
                </div>
            </div>
        `;

        modal.classList.add('active');
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });

        // Close modal when clicking close button
        modal.querySelector('.close-modal').addEventListener('click', () => {
            this.closeModal(modal);
        });
    }

    // Change product image
    changeProductImage(imageUrl, index) {
        const mainImage = document.getElementById('modal-main-image');
        const thumbnails = document.querySelectorAll('.thumbnail');
        
        if (mainImage) {
            mainImage.src = imageUrl;
        }
        
        thumbnails.forEach((thumb, i) => {
            if (i === index) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });
    }

    // Close modal
    closeModal(modal) {
        modal.classList.remove('active');
    }

    // Get product images
    getProductImages(product) {
        const images = [];
        const imageFields = [
            CONFIG.PRODUCT_COLUMNS.IMAGE_1,
            CONFIG.PRODUCT_COLUMNS.IMAGE_2,
            CONFIG.PRODUCT_COLUMNS.IMAGE_3
        ];

        imageFields.forEach(field => {
            if (product[field] && product[field].trim()) {
                images.push(product[field].trim());
            }
        });

        return images.length > 0 ? images : ['https://via.placeholder.com/300x250?text=No+Image'];
    }
}

// Contact Form Handler
class ContactForm {
    constructor() {
        this.form = document.getElementById('contact-form');
        this.messageDiv = document.getElementById('form-message');
        
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };

        // Basic validation
        if (!this.validateForm(data)) {
            return;
        }

        try {
            this.showLoading('Sending message...');
            
            // Here you would typically send the form data to your server
            // For now, we'll simulate a successful submission
            await this.simulateSubmission();
            
            this.showSuccess('Thank you! Your message has been sent successfully.');
            this.form.reset();
            
        } catch (error) {
            this.showError('Sorry, there was an error sending your message. Please try again.');
        }
    }

    validateForm(data) {
        if (!data.name || !data.email || !data.subject || !data.message) {
            this.showError('Please fill in all required fields.');
            return false;
        }

        if (!this.isValidEmail(data.email)) {
            this.showError('Please enter a valid email address.');
            return false;
        }

        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[\s@]+@[\s@]+\.[\s@]+$/;
        return emailRegex.test(email);
    }

    showLoading(message) {
        this.messageDiv.className = 'form-message';
        this.messageDiv.textContent = message;
    }

    showSuccess(message) {
        this.messageDiv.className = 'form-message success';
        this.messageDiv.textContent = message;
    }

    showError(message) {
        this.messageDiv.className = 'form-message error';
        this.messageDiv.textContent = message;
    }

    async simulateSubmission() {
        // Simulate API call delay
        return new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// Mobile Navigation
class MobileNav {
    constructor() {
        this.hamburger = document.querySelector('.hamburger');
        this.navMenu = document.querySelector('.nav-menu');
        
        if (this.hamburger && this.navMenu) {
            this.hamburger.addEventListener('click', this.toggleNav.bind(this));
        }
    }

    toggleNav() {
        this.navMenu.classList.toggle('active');
        this.hamburger.classList.toggle('active');
    }
}

// Initialize Application
class App {
    constructor() {
        this.ui = new UI();
        this.contactForm = new ContactForm();
        this.mobileNav = new MobileNav();
        
        // Make UI available globally for onclick handlers
        window.ui = this.ui;
        
        this.init();
    }

    async init() {
        try {
            // Load data
            await Promise.all([
                this.ui.productManager.loadProducts(),
                this.ui.galleryManager.loadGallery()
            ]);

            // Render home page previews
            this.renderHomePreviews();

            // Render full pages if on products or gallery pages
            if (window.location.pathname.includes('products.html')) {
                this.renderProductsPage();
            } else if (window.location.pathname.includes('gallery.html')) {
                this.renderGalleryPage();
            }

        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showErrorToUser('Failed to load data. Please check your internet connection and try again.');
        }
    }

    renderHomePreviews() {
        // Render featured products
        const featuredProductsContainer = document.getElementById('featured-products');
        if (featuredProductsContainer) {
            const featuredProducts = this.ui.productManager.getProductsForPreview();
            this.ui.renderProducts(featuredProductsContainer, featuredProducts);
        }

        // Render featured gallery
        const featuredGalleryContainer = document.getElementById('featured-gallery');
        if (featuredGalleryContainer) {
            const featuredGallery = this.ui.galleryManager.getGalleryForPreview();
            this.ui.renderGallery(featuredGalleryContainer, featuredGallery);
        }
    }

    renderProductsPage() {
        const productsContainer = document.getElementById('products-container');
        if (productsContainer) {
            const allProducts = this.ui.productManager.filteredProducts;
            this.ui.renderProducts(productsContainer, allProducts);
        }
    }

    renderGalleryPage() {
        const galleryContainer = document.getElementById('gallery-container');
        if (galleryContainer) {
            const allGallery = this.ui.galleryManager.galleryItems;
            this.ui.renderGallery(galleryContainer, allGallery);
        }
    }

    showErrorToUser(message) {
        // Create a global error message element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'global-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--error-color);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            z-index: 3000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// ===== Detail Page Navigation (from additions) =====

// Navigate to product detail page
function goToProduct(index) {
    const products = window.productsData;
    if (products && products[index]) {
        sessionStorage.setItem('selectedProduct', JSON.stringify(products[index]));
        window.location.href = 'product-details.html';
    }
}

// Navigate to surgery detail page
function goToSurgery(index) {
    const gallery = window.galleryData;
    if (gallery && gallery[index]) {
        sessionStorage.setItem('selectedSurgery', JSON.stringify(gallery[index]));
        window.location.href = 'surgery-details.html';
    }
}

// Render product details on product-details.html
function renderProductDetails() {
    const container = document.getElementById('details-container');
    if (!container || !window.location.pathname.includes('product-details.html')) return;

    const data = JSON.parse(sessionStorage.getItem('selectedProduct'));
    if (!data) {
        container.innerHTML = '<div class="no-results">No product selected. <a href="products.html">Browse Products</a></div>';
        return;
    }

    // Update page title
    const titleEl = document.getElementById('detail-page-title');
    if (titleEl) titleEl.textContent = data[CONFIG.PRODUCT_COLUMNS.NAME] || 'Product Details';
    document.title = (data[CONFIG.PRODUCT_COLUMNS.NAME] || 'Product') + ' - Upadhyay Vision Care Centre';

    // Collect images
    const images = [data[CONFIG.PRODUCT_COLUMNS.IMAGE_1], data[CONFIG.PRODUCT_COLUMNS.IMAGE_2], data[CONFIG.PRODUCT_COLUMNS.IMAGE_3]].filter(img => img && img.trim());
    const mainImage = images[0] || 'https://via.placeholder.com/600x400?text=No+Image';
    const productName = data[CONFIG.PRODUCT_COLUMNS.NAME] || 'Product';
    const whatsappMsg = encodeURIComponent('I am interested in ' + productName);

    container.innerHTML = `
        <div class="detail-grid">
            <div class="detail-images">
                <div class="detail-main-image">
                    <img id="detail-main-img" src="${mainImage}" alt="${productName}">
                </div>
                ${images.length > 1 ? `
                <div class="detail-thumbnails">
                    ${images.map((img, i) => `
                        <div class="thumbnail ${i === 0 ? 'active' : ''}" onclick="changeDetailImage('${img}', ${i})">
                            <img src="${img}" alt="Image ${i + 1}">
                        </div>
                    `).join('')}
                </div>` : ''}
            </div>
            <div class="detail-info">
                <h2>${productName}</h2>
                <p class="detail-description">${data[CONFIG.PRODUCT_COLUMNS.DESCRIPTION] || 'No description available.'}</p>
                
                <div class="product-specs">
                    <h3>Specifications</h3>
                    <div class="spec-item">
                        <span class="spec-label"><i class="fas fa-tag"></i> Brand</span>
                        <span class="spec-value">${data[CONFIG.PRODUCT_COLUMNS.BRAND] || 'N/A'}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label"><i class="fas fa-ruler"></i> Dimensions</span>
                        <span class="spec-value">${data[CONFIG.PRODUCT_COLUMNS.DIMENSIONS] || 'N/A'}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label"><i class="fas fa-palette"></i> Color</span>
                        <span class="spec-value">${data[CONFIG.PRODUCT_COLUMNS.COLOR] || 'N/A'}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label"><i class="fas fa-weight"></i> Weight</span>
                        <span class="spec-value">${data[CONFIG.PRODUCT_COLUMNS.WEIGHT] || 'N/A'}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label"><i class="fas fa-users"></i> Age Range</span>
                        <span class="spec-value">${data[CONFIG.PRODUCT_COLUMNS.AGE_RANGE] || 'N/A'}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label"><i class="fas fa-shapes"></i> Shape</span>
                        <span class="spec-value">${data[CONFIG.PRODUCT_COLUMNS.SHAPE] || 'N/A'}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label"><i class="fas fa-cube"></i> Material</span>
                        <span class="spec-value">${data[CONFIG.PRODUCT_COLUMNS.MATERIAL] || 'N/A'}</span>
                    </div>
                </div>

                <div class="detail-actions">
                    <a href="https://wa.me/917055502333?text=${whatsappMsg}" target="_blank" class="btn-whatsapp">
                        <i class="fab fa-whatsapp"></i> Book on WhatsApp
                    </a>
                    <a href="tel:+917055502333" class="btn-call">
                        <i class="fas fa-phone"></i> Call Us
                    </a>
                </div>
            </div>
        </div>
    `;
}

// Render surgery details on surgery-details.html
function renderSurgeryDetails() {
    const container = document.getElementById('details-container');
    if (!container || !window.location.pathname.includes('surgery-details.html')) return;

    const data = JSON.parse(sessionStorage.getItem('selectedSurgery'));
    if (!data) {
        container.innerHTML = '<div class="no-results">No surgery selected. <a href="gallery.html">Browse Gallery</a></div>';
        return;
    }

    const titleEl = document.getElementById('detail-page-title');
    if (titleEl) titleEl.textContent = data[CONFIG.GALLERY_COLUMNS.NAME] || 'Surgery Details';
    document.title = (data[CONFIG.GALLERY_COLUMNS.NAME] || 'Surgery') + ' - Upadhyay Vision Care Centre';

    const imageUrl = data[CONFIG.GALLERY_COLUMNS.IMAGE] || 'https://via.placeholder.com/600x400?text=No+Image';
    const surgeryName = data[CONFIG.GALLERY_COLUMNS.NAME] || 'Surgery';
    const whatsappMsg = encodeURIComponent('Consultation for ' + surgeryName);

    container.innerHTML = `
        <div class="detail-grid">
            <div class="detail-images">
                <div class="detail-main-image">
                    <img src="${imageUrl}" alt="${surgeryName}">
                </div>
            </div>
            <div class="detail-info">
                <h2>${surgeryName}</h2>
                ${data[CONFIG.GALLERY_COLUMNS.CATEGORY] ? `<span class="category-badge">${data[CONFIG.GALLERY_COLUMNS.CATEGORY]}</span>` : ''}
                <p class="detail-description">${data[CONFIG.GALLERY_COLUMNS.DESCRIPTION] || 'No description available.'}</p>
                
                <div class="detail-actions">
                    <a href="https://wa.me/917055502333?text=${whatsappMsg}" target="_blank" class="btn-whatsapp">
                        <i class="fab fa-whatsapp"></i> Book Consultation
                    </a>
                    <a href="tel:+917055502333" class="btn-call">
                        <i class="fas fa-phone"></i> Call Us
                    </a>
                </div>
            </div>
        </div>
    `;
}

// Change detail page image (thumbnail click)
function changeDetailImage(imageUrl, index) {
    const mainImg = document.getElementById('detail-main-img');
    if (mainImg) mainImg.src = imageUrl;
    document.querySelectorAll('.detail-thumbnails .thumbnail').forEach((t, i) => {
        t.classList.toggle('active', i === index);
    });
}

// ===== PWA Service Worker Registration =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered:', reg.scope))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}

// ===== Floating Book Appointment Button =====
function createAppointmentFAB() {
    // Create the FAB button
    const fab = document.createElement('button');
    fab.className = 'appointment-fab';
    fab.setAttribute('aria-label', 'Book Appointment');
    fab.innerHTML = '<i class="fas fa-calendar-check"></i><span>Book Now</span>';
    document.body.appendChild(fab);

    // Create appointment modal (available on all pages)
    const modal = document.createElement('div');
    modal.id = 'appointment-modal';
    modal.className = 'appt-modal';
    modal.innerHTML = `
        <div class="appt-modal-content">
            <div class="appt-modal-header">
                <h2><i class="fas fa-calendar-check"></i> Book Appointment</h2>
                <button class="appt-close" aria-label="Close">&times;</button>
            </div>
            <form id="globalAppointmentForm" class="appt-form">
                <div class="appt-field">
                    <label><i class="fas fa-user"></i> Full Name</label>
                    <input type="text" name="name" placeholder="Your full name" required>
                </div>
                <div class="appt-field">
                    <label><i class="fas fa-phone"></i> Phone Number</label>
                    <input type="tel" name="phone" placeholder="Your phone number" required>
                </div>
                <div class="appt-field">
                    <label><i class="fas fa-calendar"></i> Preferred Date</label>
                    <input type="date" name="date" required>
                </div>
                <div class="appt-field">
                    <label><i class="fas fa-stethoscope"></i> Service</label>
                    <select name="service" required>
                        <option value="">Select Service</option>
                        <option value="eye-test">Eye Test</option>
                        <option value="lasik">LASIK Consultation</option>
                        <option value="cataract">Cataract Checkup</option>
                        <option value="glasses">Glasses Fitting</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <button type="submit" class="appt-submit">
                    <i class="fab fa-whatsapp"></i> Confirm via WhatsApp
                </button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    // FAB click opens modal
    fab.addEventListener('click', () => {
        modal.classList.add('active');
    });

    // Close modal
    modal.querySelector('.appt-close').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    // Form submit → WhatsApp
    modal.querySelector('#globalAppointmentForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const name = form.name.value;
        const phone = form.phone.value;
        const date = form.date.value;
        const service = form.service.options[form.service.selectedIndex].text;
        const msg = `Hi, I'd like to book an appointment.\nName: ${name}\nPhone: ${phone}\nDate: ${date}\nService: ${service}`;
        window.open('https://wa.me/917055502333?text=' + encodeURIComponent(msg), '_blank');
        modal.classList.remove('active');
        form.reset();
    });
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
    renderProductDetails();
    renderSurgeryDetails();
    createAppointmentFAB();
});
