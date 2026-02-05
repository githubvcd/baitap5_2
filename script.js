const API_URL = 'https://api.escuelajs.co/api/v1/products';
let products = [];
let filteredProducts = [];
let currentPage = 1;
let sortDir = { title: 1, price: 1 };

// 1. Fetch Data
async function fetchData() {
    try {
        const res = await fetch(API_URL);
        products = await res.json();
        filteredProducts = [...products];
        renderTable();
    } catch (err) { console.error("Lỗi fetch:", err); }
}

// 2. Render Table & Description Tooltip
function renderTable() {
    const pageSize = parseInt(document.getElementById('pageSize').value);
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pagedData = filteredProducts.slice(start, end);

    const tbody = document.getElementById('productTableBody');
    tbody.innerHTML = pagedData.map(p => `
        <tr class="product-row" 
            onmouseover="showTooltip(event, '${p.description.replace(/'/g, "\\'")}')" 
            onmouseout="hideTooltip()"
            onclick="openEditModal(${p.id})">
            <td>${p.id}</td>
            <td>${p.title}</td>
            <td>$${p.price}</td>
            <td><span class="badge bg-info text-dark">${p.category.name}</span></td>
            <td>${p.images.slice(0,2).map(img => `<img src="${img}" class="product-img" onerror="this.src='https://placehold.co/50'">`).join('')}</td>
        </tr>
    `).join('');
    
    renderPagination(pageSize);
}

// 3. Tooltip Logic
const tooltip = document.getElementById('tooltip');
function showTooltip(e, text) {
    tooltip.style.display = 'block';
    tooltip.innerText = text;
    tooltip.style.left = e.pageX + 10 + 'px';
    tooltip.style.top = e.pageY + 10 + 'px';
}
function hideTooltip() { tooltip.style.display = 'none'; }

// 4. Search & Filter
document.getElementById('searchInput').addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    filteredProducts = products.filter(p => p.title.toLowerCase().includes(val));
    currentPage = 1;
    renderTable();
});

// 5. Pagination
function renderPagination(pageSize) {
    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    let html = '';
    for(let i=1; i<=totalPages; i++) {
        html += `<li class="page-item ${i===currentPage?'active':''}"><a class="page-link" href="#" onclick="changePage(${i})">${i}</a></li>`;
    }
    document.getElementById('pagination').innerHTML = html;
}
function changePage(p) { currentPage = p; renderTable(); }
document.getElementById('pageSize').addEventListener('change', () => { currentPage = 1; renderTable(); });

// 6. Sort
function sortData(key) {
    sortDir[key] *= -1;
    filteredProducts.sort((a, b) => {
        if (typeof a[key] === 'string') return a[key].localeCompare(b[key]) * sortDir[key];
        return (a[key] - b[key]) * sortDir[key];
    });
    renderTable();
}

// 7. Export CSV
function exportCSV() {
    const pageSize = parseInt(document.getElementById('pageSize').value);
    const start = (currentPage - 1) * pageSize;
    const currentViewData = filteredProducts.slice(start, start + pageSize);
    
    let csv = "ID,Title,Price,Category\n";
    currentViewData.forEach(p => {
        csv += `${p.id},"${p.title}",${p.price},"${p.category.name}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_view.csv';
    a.click();
}

// 8. CRUD Operations (Modal)
async function openEditModal(id) {
    const p = products.find(x => x.id === id);
    document.getElementById('editId').value = p.id;
    document.getElementById('editTitle').value = p.title;
    document.getElementById('editPrice').value = p.price;
    document.getElementById('editDesc').value = p.description;
    new bootstrap.Modal('#detailModal').show();
}

document.getElementById('editForm').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const data = {
        title: document.getElementById('editTitle').value,
        price: parseInt(document.getElementById('editPrice').value)
    };
    
    const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    if(res.ok) { alert('Cập nhật thành công!'); location.reload(); }
};

document.getElementById('createForm').onsubmit = async (e) => {
    e.preventDefault();
    const data = {
        title: document.getElementById('cTitle').value,
        price: parseInt(document.getElementById('cPrice').value),
        description: document.getElementById('cDesc').value,
        categoryId: parseInt(document.getElementById('cCatId').value),
        images: [document.getElementById('cImg').value]
    };
    
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    if(res.ok) { alert('Tạo mới thành công!'); location.reload(); }
};

fetchData();