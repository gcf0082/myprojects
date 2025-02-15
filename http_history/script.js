// Sample HTTP request history data
const historyData = [
    {
        id: 1,
        method: 'GET',
        url: 'https://example.com/api/v1/users',
        status: 200,
        size: '1.5KB',
        time: '100ms',
        requestHeaders: `GET /api/v1/users HTTP/1.1
Host: example.com
Accept: application/json
Authorization: Bearer token123`,
        requestBody: '',
        responseHeaders: `HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-cache
Date: Mon, 12 Feb 2025 17:00:00 GMT`,
        responseBody: `[{"id":1,"name":"John Doe"},{"id":2,"name":"Jane Smith"}]`
    },
    {
        id: 2,
        method: 'POST',
        url: 'https://example.com/api/v1/login',
        status: 401,
        size: '800B',
        time: '150ms',
        requestHeaders: `POST /api/v1/login HTTP/1.1
Host: example.com
Content-Type: application/json
Authorization: Basic dGVzdDpwYXNzd29yZA==`,
        requestBody: `{"username":"test","password":"password"}`,
        responseHeaders: `HTTP/1.1 401 Unauthorized
Content-Type: application/json
WWW-Authenticate: Bearer error="invalid_token"`,
        responseBody: `{"error":"Unauthorized","message":"Invalid credentials"}`
    },
    {
        id: 3,
        method: 'PUT',
        url: 'https://example.com/api/v1/users/123',
        status: 204,
        size: '0B',
        time: '200ms',
        requestHeaders: `PUT /api/v1/users/123 HTTP/1.1
Host: example.com
Content-Type: application/json
Authorization: Bearer token123`,
        requestBody: `{"name":"Updated Name"}`,
        responseHeaders: `HTTP/1.1 204 No Content
Content-Length: 0
Date: Mon, 12 Feb 2025 17:00:00 GMT`,
        responseBody: ''
    },
    {
        id: 4,
        method: 'DELETE',
        url: 'https://example.com/api/v1/users/456',
        status: 403,
        size: '400B',
        time: '120ms',
        requestHeaders: `DELETE /api/v1/users/456 HTTP/1.1
Host: example.com
Authorization: Bearer token123`,
        requestBody: '',
        responseHeaders: `HTTP/1.1 403 Forbidden
Content-Type: application/json
Date: Mon, 12 Feb 2025 17:00:00 GMT`,
        responseBody: `{"error":"Forbidden","message":"Insufficient permissions"}`
    }
];

// Function to populate the table
function populateHistoryTable() {
    const tableBody = document.getElementById('historyTable').getElementsByTagName('tbody')[0];
    
    historyData.forEach(item => {
        const row = tableBody.insertRow();
        const statusClass = item.status >= 400 ? 'status-error' : 'status';
        
        row.innerHTML = `
            <td>${item.id}</td>
            <td class="method">${item.method}</td>
            <td>${item.url}</td>
            <td class="${statusClass}">${item.status}</td>
            <td class="size">${item.size}</td>
            <td class="time">${item.time}</td>
        `;
    });
}

let currentFilteredData = [];

// Function to filter data based on current criteria
function filterData() {
    const methodFilter = document.getElementById('filterMethod').value.toUpperCase();
    const statusFilter = document.getElementById('filterStatus').value;
    const urlFilter = document.getElementById('filterUrl').value.toLowerCase();

    return historyData.filter(item => {
        return (!methodFilter || item.method.toUpperCase() === methodFilter) &&
               (!statusFilter || item.status.toString() === statusFilter) &&
               (!urlFilter || item.url.toLowerCase().includes(urlFilter));
    });
}

// Function to repopulate table with filtered data
function refreshTable() {
    const tableBody = document.getElementById('historyTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';
    
    currentFilteredData = filterData();
    currentFilteredData.forEach(item => {
        const row = tableBody.insertRow();
        const statusClass = item.status >= 400 ? 'status-error' : 'status';
        
        row.innerHTML = `
            <td>${item.id}</td>
            <td class="method">${item.method}</td>
            <td>${item.url}</td>
            <td class="${statusClass}">${item.status}</td>
            <td class="size">${item.size}</td>
            <td class="time">${item.time}</td>
        `;
    });
}

// Column resizing functionality
function setupColumnResizing() {
    const table = document.getElementById('historyTable');
    const headers = table.getElementsByTagName('th');

    Array.from(headers).forEach((header, i) => {
        if (i < headers.length - 1) {
            const handle = document.createElement('div');
            handle.className = 'resize-handle';
            header.appendChild(handle);

            let isResizing = false;
            let startX = 0;
            let startWidth = 0;

            const startResize = (e) => {
                isResizing = true;
                startX = e.clientX;
                startWidth = header.offsetWidth;
                document.body.style.cursor = 'col-resize';
            };

            const doResize = (e) => {
                if (!isResizing) return;
                const newWidth = startWidth + (e.clientX - startX);
                header.style.width = `${newWidth}px`;
            };

            const stopResize = () => {
                isResizing = false;
                document.body.style.cursor = 'default';
            };

            handle.addEventListener('mousedown', startResize);
            window.addEventListener('mousemove', doResize);
            window.addEventListener('mouseup', stopResize);
        }
    });
}

// Vertical resizing functionality
function setupVerticalResize() {
    const verticalHandle = document.getElementById('verticalResizeHandle');
    const tableContainer = document.getElementById('tableContainer');
    const splitContainer = document.getElementById('splitContainer');

    let isResizing = false;
    let startY = 0;
    let startHeight = 0;

    const startResize = (e) => {
        isResizing = true;
        startY = e.clientY;
        startHeight = tableContainer.offsetHeight;
        document.body.style.cursor = 'ns-resize';
    };

    const doResize = (e) => {
        if (!isResizing) return;
        const newHeight = startHeight + (e.clientY - startY);
        tableContainer.style.height = `${newHeight}px`;
        splitContainer.style.height = `calc(100% - ${newHeight + 40}px)`;
    };

    const stopResize = () => {
        isResizing = false;
        document.body.style.cursor = 'default';
    };

    verticalHandle.addEventListener('mousedown', startResize);
    window.addEventListener('mousemove', doResize);
    window.addEventListener('mouseup', stopResize);
}

// Initialize the table when the page loads
document.addEventListener('DOMContentLoaded', () => {
    setupVerticalResize();
    setupColumnResizing();
    // Initialize filters
    document.getElementById('filterMethod').addEventListener('change', refreshTable);
    document.getElementById('filterStatus').addEventListener('input', refreshTable);
    document.getElementById('filterUrl').addEventListener('input', refreshTable);
    
    refreshTable();
    
    // Add click handlers to table rows
    const tableBody = document.getElementById('historyTable').getElementsByTagName('tbody')[0];
    const requestBodyDisplay = document.getElementById('requestBody');
    const responseBodyDisplay = document.getElementById('responseBody');
    
    tableBody.addEventListener('click', (event) => {
        const row = event.target.closest('tr');
        if (row) {
            // Get the corresponding data
            const rowIndex = row.rowIndex - 1; // Subtract 1 for header row
            const data = currentFilteredData[rowIndex];
            
            // Get all display elements
            const requestHeadersDisplay = document.getElementById('requestHeaders');
            const responseHeadersDisplay = document.getElementById('responseHeaders');
            
            // Update the display
            requestHeadersDisplay.textContent = data.requestHeaders;
            requestBodyDisplay.textContent = data.requestBody;
            responseHeadersDisplay.textContent = data.responseHeaders;
            responseBodyDisplay.textContent = data.responseBody;
        }
    });

    // Add resizing functionality
    const splitContainer = document.getElementById('splitContainer');
    const resizeHandle = document.getElementById('resizeHandle');
    const requestPanel = document.getElementById('requestPanel');
    const responsePanel = document.getElementById('responsePanel');

    let isDragging = false;

    const startDrag = () => {
        isDragging = true;
        document.body.style.cursor = 'ew-resize';
    };

    const stopDrag = () => {
        isDragging = false;
        document.body.style.cursor = 'default';
    };

    const doDrag = (e) => {
        if (!isDragging) return;

        const containerWidth = splitContainer.offsetWidth;
        const handleWidth = resizeHandle.offsetWidth;
        const mouseX = e.pageX - splitContainer.getBoundingClientRect().left;

        // Calculate new widths (minimum 150px each)
        const newRequestWidth = Math.max(150, Math.min(mouseX - handleWidth/2, containerWidth - 150 - handleWidth));
        const newResponseWidth = containerWidth - newRequestWidth - handleWidth;

        requestPanel.style.flex = `0 0 ${newRequestWidth}px`;
        responsePanel.style.flex = `0 0 ${newResponseWidth}px`;
    };

    resizeHandle.addEventListener('mousedown', startDrag);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('mousemove', doDrag);
});
