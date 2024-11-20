const DB_NAME = 'CompanyDatabase';
const DB_VERSION = 4; 
function openDB(callback) {
    const dbRequest = indexedDB.open(DB_NAME, DB_VERSION);

    dbRequest.onupgradeneeded = function (event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('companies')) {
            const companyStore = db.createObjectStore('companies', { keyPath: 'name' });
        }
        if (!db.objectStoreNames.contains('titledb')) {
            const titleStore = db.createObjectStore('titledb', { keyPath: 'id' });
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

function saveHeaderTitleToDB(headerTitle) {
    openDB(function (db) {
        const transaction = db.transaction(['titledb'], 'readwrite');
        const titleStore = transaction.objectStore('titledb');
        const getRequest = titleStore.get(1);

        getRequest.onsuccess = function () {
            if (getRequest.result) {
                titleStore.put({ id: 1, title: headerTitle }).onsuccess = function () {
                    console.log("Header title updated successfully.");
                };
            } else {
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

function saveDataToDB(headerTitle, companies) {
    openDB(function (db) {
        const transaction = db.transaction(['companies', 'titledb'], 'readwrite');
        const companyStore = transaction.objectStore('companies');
        companies.forEach(company => {
            if (company.name) {
                companyStore.put(company);
            } else {
                console.error("Company missing 'name' key:", company);
            }
        });
        saveHeaderTitleToDB(headerTitle); 

        transaction.oncomplete = function () {
            console.log("Companies and header title saved successfully.");
        };

        transaction.onerror = function (event) {
            console.error("Transaction error while saving data:", event.target.errorCode);
        };
    });
}

function getHeaderTitleFromDB(callback) {
    openDB(function (db) {
        const transaction = db.transaction(['titledb'], 'readonly');
        const titleStore = transaction.objectStore('titledb');
        const getRequest = titleStore.get(1);

        getRequest.onsuccess = function (event) {
            if (getRequest.result) {
                callback(getRequest.result.title);
            } else {
                callback('');
            }
        };

        getRequest.onerror = function (event) {
            console.error("Failed to retrieve header title:", event.target.errorCode);
            callback('');
        };
    });
}
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
document.getElementById('submitBtn').addEventListener('click', function (e) {
    e.preventDefault();
    const headerText = document.getElementById('headerTitle').value.trim();
    if (!headerText) {
        alert("Please enter a header title.");
        return;
    }
    document.getElementById('hTxt').innerText = headerText;
    document.getElementById('headerTitle').disabled = true;
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('editBtn').style.display = 'inline-block';
    saveHeaderTitleToDB(headerText);
    isHeaderTitleSubmitted = true;
});
document.getElementById('editBtn').addEventListener('click', function () {
    document.getElementById('headerTitle').disabled = false;
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('editBtn').style.display = 'none';
});


let companies = [];
let selectedCompanyIndex = null;
let clickCount = 0; 
function renderCompanyList() {
    const companyList = document.getElementById('companyList');
    companyList.innerHTML = '';

    companies.forEach((company, index) => {
        const companyElement = document.createElement('div');
        companyElement.classList.add('col-md-3', 'position-relative');

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
        companyElement.addEventListener('click', () => handleDoubleClick(company, index));

    });
    new Sortable(companyList, {
        animation: 150,
        onEnd: function (event) {
            const movedItem = companies.splice(event.oldIndex, 1)[0];
            companies.splice(event.newIndex, 0, movedItem); 
            renderCompanyList();
        }
    });
}


function uploadImage(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    if (file) {
        reader.readAsDataURL(file);

        reader.onload = function (e) {
            if (selectedCompanyIndex !== null) {
                const logoPreview = document.getElementById(`logoPreview-${selectedCompanyIndex}`);

                if (logoPreview) {
                    logoPreview.src = e.target.result;
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

function populateFormFields(company, index) {
    document.getElementById('companyName').value = company.name;
    document.getElementById('technologies').value = company.technologies;

    selectedCompanyIndex = index; 
    const logoPreview = document.getElementById(`logoPreview-${index}`);
    if (company.logo && company.logo.startsWith('data:image/') || company.logo.startsWith('http')) {
        logoPreview.src = company.logo;
    } else {
        logoPreview.src = './images/draganddrop.webp';
    }
    document.getElementById('addCompanyBtn').style.display = 'none';
    document.getElementById('updateCompanyBtn').style.display = 'block';
}
function handleFormSubmit(event) {
    event.preventDefault();

    const name = document.getElementById('companyName').value;
    const technologies = document.getElementById('technologies').value;
    const logoPreview = document.getElementById(`logoPreview-${selectedCompanyIndex}`);
    const logo = logoPreview ? logoPreview.src : './images/draganddrop.webp';

    if (selectedCompanyIndex !== null) {
        companies[selectedCompanyIndex] = { name, logo, technologies };
        selectedCompanyIndex = null;
    } else {
        companies.push({ name, logo, technologies });
    }

    document.getElementById('companyForm').reset();
    logoPreview.src = './images/draganddrop.webp'; 
    document.getElementById('addCompanyBtn').style.display = 'block';
    document.getElementById('updateCompanyBtn').style.display = 'none';

    renderCompanyList(); 
}

function handleCompanyUpdate() {
    const name = document.getElementById('companyName').value;
    const technologies = document.getElementById('technologies').value;
    const logoPreview = document.getElementById(`logoPreview-${selectedCompanyIndex}`);
    const logo = logoPreview ? logoPreview.src : './images/draganddrop.webp'; 

    if (!name || !logoPreview) {
        alert("Please fill in all fields.");
        return;
    }
    companies[selectedCompanyIndex] = { name, logo, technologies };
    document.getElementById('companyForm').reset();
    logoPreview.src = './images/draganddrop.webp'; 
    document.getElementById('addCompanyBtn').style.display = 'block';
    document.getElementById('updateCompanyBtn').style.display = 'none';

    selectedCompanyIndex = null;
    renderCompanyList(); 
}



function handleDoubleClick(company, index) {
    clickCount++; 

    if (clickCount === 2) {
        populateFormFields(company, index); 
        clickCount = 0; 
    }
    setTimeout(() => {
        clickCount = 0;
    }, 1000);
}




document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('companyForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('updateCompanyBtn').addEventListener('click', handleCompanyUpdate);

    renderCompanyList();
});
function deleteCompany(index) {
    if (confirm('Are you sure you want to delete this company?')) {
        companies.splice(index, 1); 
        renderCompanyList(); 
    }
}


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
        const companyLogo = event.target.result;

        const newCompany = {
            name: companyName,
            logo: companyLogo,
            technologies: technologies
        };

        companies.push(newCompany);
        renderCompanyList();
        document.getElementById('companyForm').reset();
        resetImagePreview();
    };
});

function resetImagePreview() {
    const dropzone = document.getElementById('dropzone');
    const defaultImageSrc = './images/draganddrop.webp';
    dropzone.innerHTML = `<img src="${defaultImageSrc}" alt="" width="100%" height="100%">`;

    document.getElementById('companyLogo').value = '';
}

document.getElementById('previewBtn').addEventListener('click', function () {
    if (!isHeaderTitleSubmitted) {
        const headerTitle = document.getElementById('headerTitle').value.trim();
        if (!headerTitle) {
            alert("Please enter a header title before Preview.");
            return;
        }
        isHeaderTitleSubmitted = true;
    }
    getHeaderTitleFromDB(function (headerTitleFromDB) {
        const currentHeaderTitle = document.getElementById('headerTitle').value.trim() || headerTitleFromDB;

        if (!currentHeaderTitle) {
            alert("Please enter a header title before Preview.");
            return;
        }

        if (companies.length === 0) {
            alert("Please add at least one company before previewing.");
            return;
        }
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

        const rows = groupCompaniesIntoRows(companies.length);
        let currentIndex = 0;

        rows.forEach(rowCount => {
            const row = document.createElement('div');
            row.classList.add('row', 'mb-4'); 
            for (let i = 0; i < rowCount; i++) {
                if (currentIndex >= companies.length) break;

                const company = companies[currentIndex];
                let colSize;
                let imgStyle;
                if (rowCount >= 4 || companies.length > 12) {
                    colSize = 'col-md-3';
                    imgStyle = 'style="width:120px !important;height:auto;"'; 
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
                if (rowCount === 1) {
                    companyElement.classList.add('mx-auto');
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
            if (rowCount < 4) {
                row.classList.add(`justify-content-center`);
            }

            companiesSection.appendChild(row);
        });

    } else {
        alert("No companies have been added yet. Please add at least one company before submitting.");
    }
});

function groupCompaniesIntoRows(total) {
    const rows = [];
    let remaining = total;

    while (remaining > 0) {
        if (remaining === 12) {
            rows.push(4, 4, 4); 
            remaining -= 12;
        } else if (remaining === 11) {
            rows.push(4, 4, 3); 
            remaining -= 11;
        } else if (remaining === 10) {
            rows.push(4, 4, 2); 
            remaining -= 10;
        } else if (remaining === 9) {
            rows.push(3, 3, 3);
            remaining -= 9;
        } else if (remaining === 8) {
            rows.push(3, 3, 2);
            remaining -= 8;
        } else if (remaining === 7) {
            rows.push(3, 2, 2);
            remaining -= 7;
        } else if (remaining === 6) {
            rows.push(2, 2, 2); 
            remaining -= 6;
        } else if (remaining === 5) {
            rows.push(2, 1, 2); 
            remaining -= 5;
        } else if (remaining === 4) {
            rows.push(2, 2);
            remaining -= 4;
        } else if (remaining === 3) {
            rows.push(2, 1); 
            remaining -= 3;
        } else if (remaining === 2) {
            rows.push(1, 1);
            remaining -= 2;
        } else if (remaining === 1) {
            rows.push(1); 
            remaining -= 1;
        } else {
            rows.push(4);
            remaining -= 4;
        }
    }

    return rows;
}

function allowDrop(ev) {
    ev.preventDefault();
}
function drop(ev) {
    ev.preventDefault();
    const files = ev.dataTransfer.files;
    if (files.length > 0) {
        handleFiles(files);
    } else {
        const imageUrl = ev.dataTransfer.getData("text/html");
        const src = extractImageSrcFromHTML(imageUrl);
        if (src) {
            replaceImage(src);
        }
    }
}

function extractImageSrcFromHTML(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const imgElement = tempDiv.querySelector('img');
    return imgElement ? imgElement.src : null;
}

function handleFiles(files) {
    for (let file of files) {
        if (file.type.startsWith("image/")) {
            displayImage(file);
            break;
        }
    }
}
document.addEventListener('paste', (event) => {
    const items = event.clipboardData.items;
    for (let item of items) {
        if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            displayImage(file);
        }
    }
});
function displayImage(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        replaceImage(event.target.result);
    };
    reader.readAsDataURL(file);
}
function replaceImage(src) {
    const dropzone = document.getElementById('dropzone');
    dropzone.innerHTML = ''; 

    const imgElement = document.createElement('img');
    imgElement.src = src;
    dropzone.appendChild(imgElement);
}
