const DB_NAME = 'CompanyDatabase';
const DB_VERSION = 4; // Incremented version to ensure the upgrade process

// Function to handle database setup and object store creation
function openDB(callback) {
    const dbRequest = indexedDB.open(DB_NAME, DB_VERSION);

    dbRequest.onupgradeneeded = function (event) {
        const db = event.target.result;

        // Create or upgrade the object store for companies
        if (!db.objectStoreNames.contains('companies')) {
            const companyStore = db.createObjectStore('companies', { keyPath: 'name' });
            // No need to create an index for 'name' since it's the keyPath
        }

        // Create or upgrade the object store for header title
        if (!db.objectStoreNames.contains('titledb')) {
            const titleStore = db.createObjectStore('titledb', { keyPath: 'id' });
            // No need to create an index for 'id' since it's the keyPath
        }
    };

    dbRequest.onsuccess = function (event) {
        const db = event.target.result;
        callback(db);
    };

    dbRequest.onerror = function (event) {
        console.error("Database error:", event.target.errorCode);
    };
}

// Function to save header title to IndexedDB
function saveHeaderTitleToDB(headerTitle, id = Date.now()) {
    openDB(function (db) {
        const transaction = db.transaction(['titledb'], 'readwrite');
        const titleStore = transaction.objectStore('titledb');

        titleStore.put({ id: id, title: headerTitle }).onsuccess = function () {
            console.log("Header title saved successfully.");
        };

        transaction.oncomplete = function () {
            console.log("Header title transaction completed.");
        };

        transaction.onerror = function (event) {
            console.error("Transaction error while saving header title:", event.target.errorCode);
        };
    });
}

// Function to save companies and header title to IndexedDB
function saveDataToDB(headerTitle, companies) {
    openDB(function (db) {
        const transaction = db.transaction(['companies', 'titledb'], 'readwrite');

        // Save companies
        const companyStore = transaction.objectStore('companies');
        companies.forEach(company => {
            if (company.name) {
                companyStore.put(company); // Update or add company
            } else {
                console.error("Company missing 'name' key:", company);
            }
        });

        // Save header title
        saveHeaderTitleToDB(headerTitle); // This will handle its own transaction and error

        transaction.oncomplete = function () {
            console.log("Companies and header title saved successfully.");
        };

        transaction.onerror = function (event) {
            console.error("Transaction error while saving data:", event.target.errorCode);
        };
    });
}

// Function to get the most recent header title from IndexedDB
function getHeaderTitleFromDB(callback) {
    openDB(function (db) {
        const transaction = db.transaction(['titledb'], 'readonly');
        const titleStore = transaction.objectStore('titledb');
        const getRequest = titleStore.openCursor(null, 'prev'); // Get the most recent header title

        getRequest.onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor) {
                callback(cursor.value.title);
            } else {
                callback(''); // No header title found
            }
        };

        getRequest.onerror = function (event) {
            console.error("Failed to retrieve header title:", event.target.errorCode);
            callback(''); // Return empty string in case of error
        };
    });
}

// Function to get saved companies from IndexedDB
function getCompaniesFromDB(callback) {
    openDB(function (db) {
        const transaction = db.transaction(['companies'], 'readonly');
        const companyStore = transaction.objectStore('companies');
        const companiesRequest = companyStore.getAll();

        companiesRequest.onsuccess = function () {
            callback(companiesRequest.result || []);
        };

        companiesRequest.onerror = function (event) {
            console.error("Failed to retrieve companies:", event.target.errorCode);
            callback([]);
        };
    });
}


// Event listener for header submission
document.getElementById('submitBtn').addEventListener('click', function (e) {
    e.preventDefault();
    const headerText = document.getElementById('headerTitle').value.trim();
    if (!headerText) {
        alert("Please enter a header title.");
        return;
    }
    // Update displayed header
    document.getElementById('hTxt').innerText = headerText;
    document.getElementById('headerTitle').disabled = true;
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('editBtn').style.display = 'inline-block';

    // Save the header title to IndexedDB
    saveHeaderTitleToDB(headerText);

    // Mark the header title as submitted
    isHeaderTitleSubmitted = true;
});

// Edit header title
document.getElementById('editBtn').addEventListener('click', function () {
    document.getElementById('headerTitle').disabled = false;
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('editBtn').style.display = 'none';
});

// Initialize empty array for companies
let companies = [];
let isHeaderTitleSubmitted = false;

// Render the list of companies
function renderCompanyList() {
    const companyList = document.getElementById('companyList');
    companyList.innerHTML = ''; // Clear previous list

    companies.forEach((company, index) => {
        const companyElement = document.createElement('div');
        companyElement.classList.add('col-md-3'); // Each company takes 1/4 of a row
        companyElement.classList.add('position-relative');

        companyElement.innerHTML = `
            <div class="company">
                <div class="company-content">
                    <img src="${company.logo}" alt="${company.name}" onerror="this.onerror=null; this.src='default-image.png';">
                    <p class="title">${company.name}</p>
                </div>
                ${company.technologies ? `
                    <div class="technologies">
                        <p><strong>Technologies:</strong> ${company.technologies}</p>
                    </div>
                ` : ''}
                <!-- Delete button in the top-left corner -->
                <button class="btn btn-danger delete-btn" onclick="deleteCompany(${index})">X</button>
            </div>
        `;
        companyList.appendChild(companyElement);
    });
}

// Handle deleting a company
function deleteCompany(index) {
    if (confirm('Are you sure you want to delete this company?')) {
        companies.splice(index, 1); // Remove company from the array
        renderCompanyList(); // Re-render the company list
    }
}

// Handle adding a new company
document.getElementById('addCompanyBtn').addEventListener('click', function () {
    const companyName = document.getElementById('companyName').value.trim();
    const companyLogoInput = document.getElementById('companyLogo');
    const technologies = document.getElementById('technologies').value.trim();

    if (companyName === '') {
        alert("Company name is required.");
        return;
    }

    if (companyLogoInput.files.length === 0) {
        alert("Company logo is required.");
        return;
    }

    const existingCompany = companies.find(company => company.name === companyName);
    if (existingCompany) {
        alert("Company with this name already exists in the list.");
        return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(companyLogoInput.files[0]);
    reader.onload = function (event) {
        const companyLogo = event.target.result; // Base64-encoded image

        const newCompany = {
            name: companyName,
            logo: companyLogo,
            technologies: technologies
        };

        companies.push(newCompany);
        renderCompanyList();
        document.getElementById('companyForm').reset();

        // After adding the company, reset the image preview
        resetImagePreview();
    };
});

// Reset the image preview
function resetImagePreview() {
    const dropzone = document.getElementById('dropzone');
    const defaultImageSrc = './images/draganddrop.webp';

    // Reset the dropzone to the default image
    dropzone.innerHTML = `<img src="${defaultImageSrc}" alt="" width="100%" height="100%">`;

    // Clear the file input field
    document.getElementById('companyLogo').value = '';
}


// Preview button logic
document.getElementById('previewBtn').addEventListener('click', function () {
    // Ensure that the header title is submitted before proceeding to preview
    if (!isHeaderTitleSubmitted) {
        const headerTitle = document.getElementById('headerTitle').value.trim();
        if (!headerTitle) {
            alert("Please enter a header title before Preview.");
            return;
        }
        // Mark header title as submitted
        isHeaderTitleSubmitted = true;
    }

    // Get the header title from IndexedDB or from the form
    getHeaderTitleFromDB(function (headerTitleFromDB) {
        const currentHeaderTitle = document.getElementById('headerTitle').value.trim() || headerTitleFromDB;

        // Validation: Ensure both header title and companies are present before preview
        if (!currentHeaderTitle) {
            alert("Please enter a header title before Preview.");
            return;
        }

        if (companies.length === 0) {
            alert("Please add at least one company before previewing.");
            return;
        }

        // Open preview window and pass the necessary data
        const previewWindow = window.open('preview.html', '_blank');
        previewWindow.onload = function () {
            previewWindow.postMessage({
                type: 'populatePreview',
                headerTitle: currentHeaderTitle,
                companies: companies
            }, '*');
        };
    });
});


// Submit and save to IndexedDB
document.getElementById('submitFormBtn').addEventListener('click', function () {
    if (!isHeaderTitleSubmitted) {
        const headerTitle = document.getElementById('headerTitle').value.trim();
        if (!headerTitle) {
            alert("Please enter a header title before final submission.");
            return;
        }
        isHeaderTitleSubmitted = true;
    }

    if (companies.length > 0) {
        saveDataToDB(document.getElementById('headerTitle').value.trim(), companies);

        document.getElementById('formSection').style.display = 'none';
        const companiesSection = document.getElementById('companiesSection');
        companiesSection.innerHTML = '';

        companies.forEach(company => {
            const companyElement = document.createElement('div');
            companyElement.classList.add('col-md-3');

            companyElement.innerHTML = `
                <div class="company">
                    <div class="company-content">
                        <img src="${company.logo}" alt="${company.name}" onerror="this.onerror=null; this.src='default-image.png';">
                        <p class="title">${company.name}</p>
                    </div>
                    ${company.technologies ? `
                    <div class="technologies">
                        <p><strong>Technologies:</strong> ${company.technologies}</p>
                    </div>
                    ` : ''}
                </div>
            `;

            companiesSection.appendChild(companyElement);
        });
    } else {
        alert("No companies have been added yet. Please add at least one company before submitting.");
    }
});

// Handle drag and drop
function allowDrop(ev) {
    ev.preventDefault();
}

function drop(ev) {
    ev.preventDefault();
    const files = ev.dataTransfer.files;
    if (files.length > 0) {
        handleFiles(files);
    } else {
        // Handle image dragged from a browser (e.g., Google Images)
        const imageUrl = ev.dataTransfer.getData("text/html");
        const src = extractImageSrcFromHTML(imageUrl);
        if (src) {
            replaceImage(src);
        }
    }
}

// Extract image URL from HTML string (e.g., Google Images drag-and-drop)
function extractImageSrcFromHTML(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const imgElement = tempDiv.querySelector('img');
    return imgElement ? imgElement.src : null;
}

// Upload image from the file input
function uploadImage(event) {
    const files = event.target.files;
    handleFiles(files);
}

// Handle files (dragged or uploaded)
function handleFiles(files) {
    for (let file of files) {
        if (file.type.startsWith("image/")) {
            displayImage(file);
            break; // Only display the first image and stop
        }
    }
}

// Handle copy-paste images
document.addEventListener('paste', (event) => {
    const items = event.clipboardData.items;
    for (let item of items) {
        if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            displayImage(file);
        }
    }
});

// Display the image in the dropzone (replace old image)
function displayImage(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        replaceImage(event.target.result);
    };
    reader.readAsDataURL(file);
}

// Replace the current image in the dropzone
function replaceImage(src) {
    const dropzone = document.getElementById('dropzone');
    dropzone.innerHTML = ''; // Clear any existing images

    // Create and append new image
    const imgElement = document.createElement('img');
    imgElement.src = src;
    dropzone.appendChild(imgElement);
}