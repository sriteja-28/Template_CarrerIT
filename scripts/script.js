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
function saveHeaderTitleToDB(headerTitle) {
    openDB(function (db) {
        const transaction = db.transaction(['titledb'], 'readwrite');
        const titleStore = transaction.objectStore('titledb');

        // Check if the title exists and update it
        const getRequest = titleStore.get(1); // Assuming 1 is the key for the title

        getRequest.onsuccess = function () {
            if (getRequest.result) {
                // Update the existing record
                titleStore.put({ id: 1, title: headerTitle }).onsuccess = function () {
                    console.log("Header title updated successfully.");
                };
            } else {
                // Create a new record
                titleStore.put({ id: 1, title: headerTitle }).onsuccess = function () {
                    console.log("Header title saved successfully.");
                };
            }
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
        const getRequest = titleStore.get(1); // Get the title with id 1

        getRequest.onsuccess = function (event) {
            if (getRequest.result) {
                callback(getRequest.result.title);
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

// // Initialize empty array for companies
// let companies = [];
// let isHeaderTitleSubmitted = false;


// // Render the list of companies
// function renderCompanyList() {
//     const companyList = document.getElementById('companyList');
//     companyList.innerHTML = ''; // Clear previous list

//     companies.forEach((company, index) => {
//         const companyElement = document.createElement('div');
//         companyElement.classList.add('col-md-3', 'position-relative'); // Each company takes 1/4 of a row

//         companyElement.innerHTML = `
//             <div class="company">
//                 <div class="company-content">
//                     <img src="${company.logo}" alt="Logo of ${company.name}" onerror="this.onerror=null; this.src='default-image.png';">
//                     <p class="title">${company.name}</p>
//                 </div>
//                 ${company.technologies ? `
//                     <div class="technologies">
//                         <p><strong>Technologies:</strong> ${company.technologies}</p>
//                     </div>
//                 ` : ''}
//                 <button class="btn btn-danger delete-btn" onclick="deleteCompany(${index})" aria-label="Delete ${company.name}">X</button>
//             </div>
//         `;
//         companyElement.setAttribute('data-index', index); // Optional: Store the index for later reference
//         companyList.appendChild(companyElement);
//     });

//     // Initialize Sortable.js
//     new Sortable(companyList, {
//         animation: 150,
//         onEnd: function (event) {
//             // Update the companies array based on the new order
//             const movedItem = companies.splice(event.oldIndex, 1)[0]; // Remove the item from the old position
//             companies.splice(event.newIndex, 0, movedItem); // Insert it at the new position
//             renderCompanyList(); // Re-render the company list to reflect the new order
//         }
//     });
// }


// // Handle deleting a company
// function deleteCompany(index) {
//     if (confirm('Are you sure you want to delete this company?')) {
//         companies.splice(index, 1); // Remove company from the array
//         renderCompanyList(); // Re-render the company list
//     }
// }

//!Processing the rendering

//!working almost
let companies = [];
let selectedCompanyIndex = null;
let clickCount = 0;  // For tracking triple click

// Function to render the list of companies
function renderCompanyList() {
    const companyList = document.getElementById('companyList');
    companyList.innerHTML = ''; // Clear the existing list

    companies.forEach((company, index) => {
        const companyElement = document.createElement('div');
        companyElement.classList.add('col-md-3', 'position-relative'); // Each company takes 1/4 of a row

        companyElement.innerHTML = `
            <div class="company">
                <div class="company-content">
                    <img id="logoPreview-${index}" src="${company.logo}" alt="Logo of ${company.name}" onerror="this.onerror=null; this.src='default-image.png';">
                    <p class="title">${company.name}</p>
                </div>
                ${company.technologies ? `
                        <div class="technologies">
                            <p><strong>Technologies:</strong> ${company.technologies}</p>
                        </div>` : `<div class="technologies" style="visibility: hidden;">
                            <p><strong>Technologies:</strong> ${company.technologies}</p>
                        </div>`}
                <button class="btn btn-danger delete-btn" onclick="deleteCompany(${index})">X</button>
            </div>
        `;
        companyList.appendChild(companyElement);
        companyElement.setAttribute('data-index', index);

        // Add triple-click event to allow editing the company
        companyElement.addEventListener('click', () => handleDoubleClick(company, index));

    });
    // Initialize Sortable.js
    new Sortable(companyList, {
        animation: 150,
        onEnd: function (event) {
            // Update the companies array based on the new order
            const movedItem = companies.splice(event.oldIndex, 1)[0]; // Remove the item from the old position
            companies.splice(event.newIndex, 0, movedItem); // Insert it at the new position
            renderCompanyList(); // Re-render the company list to reflect the new order
        }
    });
}

// Function to handle image upload and get a data URL

function uploadImage(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    if (file) {
        reader.readAsDataURL(file); // Read file as data URL

        reader.onload = function (e) {
            if (selectedCompanyIndex !== null) {
                const logoPreview = document.getElementById(`logoPreview-${selectedCompanyIndex}`);

                // Check if the logoPreview element exists before setting its src
                if (logoPreview) {
                    logoPreview.src = e.target.result; // Set the logo preview to the data URL
                } else {
                    console.error(`Logo preview element for company ${selectedCompanyIndex} not found!`);
                }
            } else {
               // console.error('No company is selected for logo upload.');
            }
        };
    } else {
        console.error('No file selected.');
    }
}



// Function to populate the form fields for editing

function populateFormFields(company, index) {
    document.getElementById('companyName').value = company.name;
    document.getElementById('technologies').value = company.technologies;

    selectedCompanyIndex = index; // Track the index of the company being edited

    // Get the logo preview element
    const logoPreview = document.getElementById(`logoPreview-${index}`);

    // Ensure the logo exists and is a valid URL or data URL
    if (company.logo && company.logo.startsWith('data:image/') || company.logo.startsWith('http')) {
        logoPreview.src = company.logo; // Show the existing logo
    } else {
        logoPreview.src = './images/draganddrop.webp'; // Default if no valid logo
    }

    // Show update button, hide add button
    document.getElementById('addCompanyBtn').style.display = 'none';
    document.getElementById('updateCompanyBtn').style.display = 'block';
}





// Function to handle form submission for adding/updating companies
function handleFormSubmit(event) {
    event.preventDefault(); // Prevent form submission

    const name = document.getElementById('companyName').value;
    const technologies = document.getElementById('technologies').value;

    // Check if a new logo has been uploaded
    const logoPreview = document.getElementById(`logoPreview-${selectedCompanyIndex}`);
    const logo = logoPreview ? logoPreview.src : './images/draganddrop.webp'; // Use the data URL from the preview as the logo

    if (selectedCompanyIndex !== null) {
        // Edit existing company
        companies[selectedCompanyIndex] = { name, logo, technologies };
        selectedCompanyIndex = null;
    } else {
        // Add new company
        companies.push({ name, logo, technologies });
    }

    document.getElementById('companyForm').reset(); // Clear the form
    logoPreview.src = './images/draganddrop.webp'; // Reset logo preview

    // Switch buttons back to "Add Company"
    document.getElementById('addCompanyBtn').style.display = 'block';
    document.getElementById('updateCompanyBtn').style.display = 'none';

    renderCompanyList(); // Re-render the company list
}

// Function to handle updating company
function handleCompanyUpdate() {
    const name = document.getElementById('companyName').value;
    const technologies = document.getElementById('technologies').value;

    // Use the existing logo or the updated one if available
    const logoPreview = document.getElementById(`logoPreview-${selectedCompanyIndex}`);
    const logo = logoPreview ? logoPreview.src : './images/draganddrop.webp'; // Default if not found

    if (!name || !logoPreview) {
        alert("Please fill in all fields.");
        return;
    }

    // Update company details
    companies[selectedCompanyIndex] = { name, logo, technologies };

    // Reset form and buttons
    document.getElementById('companyForm').reset();
    logoPreview.src = './images/draganddrop.webp'; // Reset logo preview
    document.getElementById('addCompanyBtn').style.display = 'block';
    document.getElementById('updateCompanyBtn').style.display = 'none';

    selectedCompanyIndex = null;
    renderCompanyList(); // Re-render the company list
}



function handleDoubleClick(company, index) {
    clickCount++; // Increment click count

    if (clickCount === 2) {
        populateFormFields(company, index); // Populate the form for editing
        clickCount = 0; // Reset click count
    }

    // Reset click count after some delay to detect triple click
    setTimeout(() => {
        // Reset click count if no further clicks are detected
        clickCount = 0;
    }, 1000);
}




document.addEventListener('DOMContentLoaded', function () {
    // Your initialization code like event listeners, form handling, etc.
    document.getElementById('companyForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('updateCompanyBtn').addEventListener('click', handleCompanyUpdate);

    renderCompanyList();  // Initial render of company list
});


// Handle deleting a company
function deleteCompany(index) {
    if (confirm('Are you sure you want to delete this company?')) {
        companies.splice(index, 1); // Remove company from the array
        renderCompanyList(); // Re-render the company list
    }
}





//!end of redering

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


//! Submit and save to IndexedDB -done
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
        companiesSection.innerHTML = ''; // Clear existing content

        const rows = groupCompaniesIntoRows(companies.length);
        let currentIndex = 0;

        rows.forEach(rowCount => {
            // Create a new row
            const row = document.createElement('div');
            row.classList.add('row', 'mb-4'); // Add margin-bottom for spacing between rows

            for (let i = 0; i < rowCount; i++) {
                if (currentIndex >= companies.length) break; // Prevent overflow

                const company = companies[currentIndex];

                // Declare colSize and imgStyle outside of the inner block
                let colSize;
                let imgStyle;

                // Determine the column size and image style based on number of companies
                if (rowCount >= 4 || companies.length > 12) {
                    // If 4 companies or more in the row, reduce size dynamically
                    colSize = 'col-md-3'; // Each company takes 25% width
                    imgStyle = 'style="width:120px !important;height:auto;"'; // Smaller image
                } else {
                    switch (rowCount) {
                        case 1:
                            colSize = 'col-md-12';
                            imgStyle = 'style="width:150px;height:auto;"';
                            break;
                        case 2:
                            colSize = 'col-md-6';
                            imgStyle = 'style="width:150px;height:auto;"';
                            break;
                        case 3:
                            colSize = 'col-md-4';
                            imgStyle = 'style="width:150px;height:auto;"';
                            break;
                    }
                }

                const companyElement = document.createElement('div');
                companyElement.classList.add(colSize, 'mb-3', 'company-item', 'sty12');

                // Center the company if it's the only one in the row
                if (rowCount === 1) {
                    companyElement.classList.add('mx-auto'); // Center horizontally
                }

                companyElement.innerHTML = `
                    <div class="company">
                        <div class="company-content">
                        ${companies.length <= 2 ? `<div class="company-logo-container"><img src="${company.logo}" alt="${company.name}" class="img-fluid company-logo"  style="width:150px;height:auto;" onerror="this.onerror=null; this.src='default-image.png';"></div>
                         `: `<div class="company-logo-container"><img src="${company.logo}" alt="${company.name}" ${imgStyle} class="img-fluid company-logo" onerror="this.onerror=null; this.src='default-image.png';"></div>
                        `}  <p class="title" style='margin-left:10px;'>${company.name}</p>
                        </div>
                        ${company.technologies ? `
                        <div class="technologies">
                            <p><strong>Technologies:</strong> ${company.technologies}</p>
                        </div>` : `<div class="technologies" style="visibility: hidden;">
                            <p><strong>Technologies:</strong> ${company.technologies}</p>
                        </div>`}
                    </div>
                `;
                row.appendChild(companyElement);
                currentIndex++;
            }

            // Center the row if it's not full
            if (rowCount < 4) {
                row.classList.add(`justify-content-center`);
            }

            companiesSection.appendChild(row);
        });

    } else {
        alert("No companies have been added yet. Please add at least one company before submitting.");
    }
});



// Function to group companies into rows based on total number
function groupCompaniesIntoRows(total) {
    const rows = [];
    let remaining = total;

    while (remaining > 0) {
        if (remaining === 12) {
            rows.push(4, 4, 4); // 12 companies: 3 rows of 4
            remaining -= 12;
        } else if (remaining === 11) {
            rows.push(4, 4, 3); // 11 companies: 2 rows of 4, 1 row of 3
            remaining -= 11;
        } else if (remaining === 10) {
            rows.push(4, 4, 2); // 10 companies: 2 rows of 4, 1 row of 2
            remaining -= 10;
        } else if (remaining === 9) {
            rows.push(3, 3, 3); // 9 companies: 3 rows of 3
            remaining -= 9;
        } else if (remaining === 8) {
            // rows.push(4, 4); // 8 companies: 2 rows of 4
            rows.push(3, 3, 2); // 8 companies: 3 rows of 3,3,2
            remaining -= 8;
        } else if (remaining === 7) {
            // rows.push(4, 3); // 7 companies: 1 row of 4, 1 row of 3
            rows.push(3, 2, 2); // 7 companies: 1 row of 4, 1 row of 3
            remaining -= 7;
        } else if (remaining === 6) {
            // rows.push(3, 3); // 6 companies: 2 rows of 3
            rows.push(2, 2, 2); // 6 companies: 2 rows of 3
            remaining -= 6;
        } else if (remaining === 5) {
            // rows.push(3, 2); // 5 companies: 1 row of 3, 1 row of 2
            rows.push(2, 1, 2); // 5 companies: 1 row of 3, 1 row of 2
            remaining -= 5;
        } else if (remaining === 4) {
            rows.push(2, 2); // 4 companies: 2 rows of 2
            remaining -= 4;
        } else if (remaining === 3) {
            rows.push(2, 1); // 3 companies: 1 row of 2, 1 row of 1
            remaining -= 3;
        } else if (remaining === 2) {
            // rows.push(2); // 2 companies: 1 row of 2
            rows.push(1, 1);
            remaining -= 2;
        } else if (remaining === 1) {
            rows.push(1); // 1 company: 1 row of 1
            remaining -= 1;
        } else {
            // Handle cases with more than 12 companies
            rows.push(4); // 4 companies per row for more than 12 companies
            remaining -= 4;
        }
    }

    return rows;
}


//!end of done

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
// function uploadImage(event) {
//     const files = event.target.files;
//     handleFiles(files);
// }


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
