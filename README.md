# Career IT Drives Submission Portal

A web application to manage and preview upcoming company drives. Users can add, edit, delete companies, upload logos, and submit a header title. The data is saved in the browser using IndexedDB.

## To visit: https://template-carrer-it.vercel.app/



---

## Features

- Add companies with name, logo, and technologies.
- Edit or delete companies from the list.
- Drag-and-drop or paste images for company logos.
- Save header title and company data in IndexedDB.
- Preview the company list in a new window before final submission.
- Responsive design for desktop and mobile.
- Dynamic print scaling for better print layouts.

---

## Technologies Used

- HTML, CSS, JavaScript
- Bootstrap 5.3
- IndexedDB for browser-based storage
- SortableJS for drag-and-drop company reordering

---

## Installation

1. Clone the repository:
```
git clone <repository-url>
Open index.html in a browser.

No backend setup is required.

Usage
Enter a header title and submit.

Add company details: name, technologies, and logo.

Edit or delete companies as needed.

Click Preview to see how the submitted companies will look.

Click Final Submit to save data permanently in IndexedDB.

File Structure
Template_careerIT
├── index.html          # Main form and company submission
├── preview.html        # Preview of submitted companies
├── scripts/
│   └── script.js       # Main JavaScript logic
├── style.css           # Styles for form, preview, and layout
├── images/             # Logos and background images
└── README.md           # Project documentation

Notes
Data persists in the browser using IndexedDB.
Default fallback images are used if logos fail to load.
Designed for responsive use across desktop and mobile.

