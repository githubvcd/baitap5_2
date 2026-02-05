const API_URL = 'https://api.escuelajs.co/api/v1/products';
const UPLOAD_URL = 'https://api.escuelajs.co/api/v1/files/upload';

let products = [];
let filteredProducts = [];
let currentPage = 1;
let sortDir = { title: 1, price: 1 };

async function init() {
    try {
        const res = await fetch(API_URL);
        products = await res.json();
        filteredProducts = [...products];
        renderTable();
    } catch (err) {
        console.error(err);
    }
}

function renderTable() {
    const pageSize = parseInt(document.getElementById('pageSize').value);
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pagedData = filteredProducts.slice(start, end);

    const tbody = document.getElementById('productTableBody');
    tbody.innerHTML = '';

    pagedData.forEach(p => {
        const row = document.createElement('tr');
        row.className = 'product-row';
        row.innerHTML = `
            <td><span class="fw-bold">#${p.id}</span></td>
            <td>${p.title}</td>
            <td class="text-danger fw-bold">$${p.price.toLocaleString()}</td>
            <td><span class="badge bg-secondary">${p.category.name}</span></td>
            <td class="product-img-cell">
                ${p.images.slice(0, 3).map(img => `
                    <img src="${cleanImageUrl(img)}" 
                         onerror="this.src='https://placehold.co/50?text=Error'">
                `).join('')}
            </td>
        `;
        
        row.onmouseover = (e) => showTooltip(e, p.description);
        row.onmouseout = hideTooltip;
        row.onclick = () => openEditModal(p.id);
        
        tbody.appendChild(row);
    });

    renderPagination(pageSize);
}

function cleanImageUrl(url) {
    if (!url) return 'https://placehold.co/50';
    return url.replace(/[\[\]"]/g, "");
}

const tooltip = document.getElementById('tooltip');
function showTooltip(e, text) {
    tooltip.style.display = 'block';
    tooltip.innerText = text;
    tooltip.style.left = (e.pageX + 15) + 'px';
    tooltip.style.top = (e.pageY + 15) + 'px';
}
function hideTooltip() { tooltip.style.display = 'none'; }

document.getElementById('searchInput').addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    filteredProducts = products.filter(p => p.title.toLowerCase().includes(keyword));
    currentPage = 1;
    renderTable();
});

function renderPagination(pageSize) {
    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                 </li>`;
    }
    document.getElementById('pagination').innerHTML = html;
}
function changePage(p) { currentPage = p; renderTable(); }
document.getElementById('pageSize').addEventListener('change', () => { currentPage = 1; renderTable(); });

function sortData(key) {
    document.querySelectorAll('.sort-icon').forEach(el => el.classList.remove('active-sort'));
    document.getElementById(`sort-${key}`).classList.add('active-sort');

    sortDir[key] *= -1;
    filteredProducts.sort((a, b) => {
        if (typeof a[key] === 'string') return a[key].localeCompare(b[key]) * sortDir[key];
        return (a[key] - b[key]) * sortDir[key];
    });
    renderTable();
}

function exportCSV() {
    const pageSize = parseInt(document.getElementById('pageSize').value);
    const viewData = filteredProducts.slice((currentPage-1)*pageSize, currentPage*pageSize);
    
    let csv = "\uFEFFID,Tieu de,Gia,Danh muc\n";
    viewData.forEach(p => {
        csv += `${p.id},"${p.title.replace(/"/g, '""')}",${p.price},"${p.category.name}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "products_dashboard.csv";
    link.click();
}

function openEditModal(id) {
    const p = products.find(x => x.id === id);
    if(!p) return;
    document.getElementById('editId').value = p.id;
    document.getElementById('editTitle').value = p.title;
    document.getElementById('editPrice').value = p.price;
    document.getElementById('editDesc').value = p.description;
    document.getElementById('editCatId').value = p.category.id;
    new bootstrap.Modal('#detailModal').show();
}

document.getElementById('editForm').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const updateData = {
        title: document.getElementById('editTitle').value,
        price: parseInt(document.getElementById('editPrice').value),
        description: document.getElementById('editDesc').value
    };

    const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
    });

    if (res.ok) {
        alert("Cập nhật thành công!");
        location.reload();
    }
};

document.getElementById('createForm').onsubmit = async (e) => {
    e.preventDefault();
    let finalImageUrl = document.getElementById('cImgUrl').value;
    const fileInput = document.getElementById('cFile');

    if (fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        try {
            const uploadRes = await fetch(UPLOAD_URL, { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();
            finalImageUrl = uploadData.location;
        } catch (err) {
            console.error(err);
        }
    }

    const newProduct = {
        title: document.getElementById('cTitle').value,
        price: parseInt(document.getElementById('cPrice').value),
        description: document.getElementById('cDesc').value,
        categoryId: parseInt(document.getElementById('cCatId').value),
        images: [finalImageUrl]
    };

    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
    });

    if (res.ok) {
        alert("Tạo thành công!");
        location.reload();
    }
};

init();