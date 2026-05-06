const API_BASE = 'http://localhost:8080';
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));
const userRole = user?.role;

// Pagination state
let postsPage = 0;
let postsTotalPages = 1;
let findRoomPage = 0;
let findRoomTotalPages = 1;

if (!token || userRole !== "quan_tri_vien") {
    document.getElementById("not-admin").classList.remove("hidden");
} else {
    document.getElementById("admin-content").classList.remove("hidden");
    loadPendingPosts();
}

/**
 * Get default placeholder image (SVG data URI)
 */
function getDefaultImage() {
    // Return a simple SVG placeholder as data URI
    return 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\'%3E%3Crect width=\'400\' height=\'300\' fill=\'%23f3f4f6\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' font-family=\'Arial\' font-size=\'16\' fill=\'%23999\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3EChưa có hình ảnh%3C/text%3E%3C/svg%3E';
}

/**
 * Process image URL to handle both full URLs and relative paths
 * Supports: http/https URLs, relative paths (/uploads/...), data URIs, and JSON arrays
 */
function processImageUrl(url) {
    if (!url) return getDefaultImage();
    
    // If url is a string representation of an array, try to parse it
    let urlString = url;
    if (typeof url === 'string' && (url.trim().startsWith('[') || url.trim().startsWith("['"))) {
        try {
            // Try to parse as JSON array
            // Replace single quotes with double quotes for JSON parsing
            const jsonString = url.replace(/'/g, '"');
            const parsed = JSON.parse(jsonString);
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Return first image from array
                urlString = parsed[0];
            } else {
                return getDefaultImage();
            }
        } catch (e) {
            console.warn('Failed to parse image array:', e);
            // If parsing fails, use original string
            urlString = url;
        }
    }
    
    // If it's already a full URL (http/https), normalize to relative path if it's localhost
    if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
        // If it's a localhost URL pointing to /uploads/, extract the relative path
        const localhostMatch = urlString.match(/https?:\/\/localhost(?::\d+)?(\/uploads\/.+)/);
        if (localhostMatch) {
            return localhostMatch[1]; // Return relative path like /uploads/filename.jpg
        }
        // For other URLs, return as is
        return urlString;
    }
    
    // If it's a data URI, return as is
    if (urlString.startsWith('data:')) {
        return urlString;
    }
    
    // If it's a relative path (starts with /), add server base URL
    if (urlString.startsWith('/')) {
        const baseUrl = window.location.origin || 'http://localhost:8080';
        return `${baseUrl}${urlString}`;
    }
    
    // Otherwise, assume it's relative to uploads
    const baseUrl = window.location.origin || 'http://localhost:8080';
    return `${baseUrl}/uploads/${urlString}`;
}

/**
 * Process multiple image URLs (for arrays)
 */
function processImageUrls(urls) {
    if (!urls) return [];
    
    // If it's already an array
    if (Array.isArray(urls)) {
        return urls.map(url => processImageUrl(url)).filter(url => url);
    }
    
    // If it's a string that might be a JSON array
    if (typeof urls === 'string') {
        try {
            const jsonString = urls.replace(/'/g, '"');
            const parsed = JSON.parse(jsonString);
            if (Array.isArray(parsed)) {
                return parsed.map(url => processImageUrl(url)).filter(url => url);
            }
        } catch (e) {
            // Not a JSON array, treat as single URL
            const singleUrl = processImageUrl(urls);
            return singleUrl ? [singleUrl] : [];
        }
    }
    
    return [];
}

async function loadPendingPosts() {
    const list = document.getElementById("pending-list");
    list.innerHTML = "";
    document.getElementById("loading").classList.remove("hidden");

    try {
        const res = await fetch(`${API_BASE}/api/baidang/status/PENDING`, {
            headers: { Authorization: "Bearer " + token }
        });

        if (!res.ok) throw new Error("Không tải được danh sách bài chờ duyệt");

        const data = await res.json();
        document.getElementById("loading").classList.add("hidden");

        if (!data || data.length === 0) {
            list.innerHTML = `<p class="text-gray-600 text-center col-span-full">
                                Không có bài đăng nào đang chờ duyệt.
                              </p>`;
            return;
        }

        data.forEach(post => {
            // Get thumbnail - try multiple fields
            let thumb = post.anhBia || post.anh_bia || '';
            
            // If no thumbnail, try to get from images array
            if (!thumb && post.hinhAnhPhongTro && post.hinhAnhPhongTro.length > 0) {
                const firstImage = post.hinhAnhPhongTro.find(img => img.laAnhBia) || post.hinhAnhPhongTro[0];
                thumb = firstImage?.duong_dan_anh || '';
            }
            
            // Process image URL
            const thumbUrl = thumb ? processImageUrl(thumb) : getDefaultImage();
            
            const html = `
                <div class="card" data-id="${post.id}">
                    <img src="${thumbUrl}" class="thumb" alt="${post.tieu_de}" onerror="this.src='${getDefaultImage()}'" />
                    <h3>${post.tieu_de}</h3>
                    <p>${post.mo_ta ? post.mo_ta.slice(0, 80) + '...' : ''}</p>
                    <p><strong>Địa chỉ:</strong> ${post.dia_chi_day_du}</p>
                    <p><strong>Giá:</strong> ${post.gia_thang} VNĐ</p>
                    <button class="btn-detail" onclick="openDetailModal(${post.id})">Xem chi tiết</button>
                </div>`;
            list.innerHTML += html;
        });

    } catch (err) {
        document.getElementById("loading").classList.add("hidden");
        list.innerHTML = `<p class="text-red-600 text-center col-span-full">
                            Lỗi tải dữ liệu: ${err.message}
                          </p>`;
    }
}

// --- Modal ---
const modal = document.getElementById("detail-modal");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");
const modalActions = document.getElementById("modal-actions");
document.getElementById("close-modal").onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; }

async function openDetailModal(id) {
    modalBody.innerHTML = "Đang tải...";
    modalActions.innerHTML = "";
    modal.style.display = "block";

    try {
        // Lấy bài đăng chi tiết
        const res = await fetch(`${API_BASE}/api/baidang/${id}`, { headers: { Authorization: "Bearer " + token } });
        if (!res.ok) throw new Error("Không tải được bài đăng");
        const post = await res.json();

        // Lấy gallery ảnh
        const imgRes = await fetch(`${API_BASE}/api/hinhanh/baidang/${id}`, { headers: { Authorization: "Bearer " + token } });
        const images = imgRes.ok ? await imgRes.json() : [];
        
        console.log('Images from API:', images); // Debug log

        let galleryHtml = '';
        if (images && images.length > 0) {
            galleryHtml = '<div class="gallery">' +
                images.map(img => {
                    // Try multiple field names
                    const imagePath = img.duong_dan_anh || img.duongDanAnh || img.url || img.path || '';
                    console.log('Processing image:', imagePath); // Debug log
                    
                    if (!imagePath) {
                        console.warn('Image has no path:', img);
                        return '';
                    }
                    
                    // Process image - handle both single URLs and arrays
                    const processedUrls = processImageUrls(imagePath);
                    console.log('Processed image URLs:', processedUrls); // Debug log
                    
                    // If we have multiple URLs, create multiple img tags
                    if (processedUrls.length > 0) {
                        return processedUrls.map(imageUrl => 
                            `<img src="${imageUrl}" alt="ảnh phòng" class="gallery-image" onerror="this.onerror=null; this.src='${getDefaultImage()}'" />`
                        ).join('');
                    }
                    
                    return '';
                }).filter(img => img !== '').join('') +
                '</div>';
        } else {
            // Try to get image from post data if API returns empty
            if (post.hinhAnhPhongTro && post.hinhAnhPhongTro.length > 0) {
                galleryHtml = '<div class="gallery">' +
                    post.hinhAnhPhongTro.map(img => {
                        const imagePath = img.duong_dan_anh || img.duongDanAnh || img.url || img.path || '';
                        if (!imagePath) return '';
                        const imageUrl = processImageUrl(imagePath);
                        return `<img src="${imageUrl}" alt="ảnh phòng" class="gallery-image" onerror="this.onerror=null; this.src='${getDefaultImage()}'" />`;
                    }).filter(img => img !== '').join('') +
                    '</div>';
            } else if (post.anhBia || post.anh_bia) {
                // Fallback to thumbnail if no gallery
                const thumbPath = post.anhBia || post.anh_bia;
                const thumbUrl = processImageUrl(thumbPath);
                galleryHtml = `<div class="gallery"><img src="${thumbUrl}" alt="ảnh bìa" class="gallery-image" onerror="this.onerror=null; this.src='${getDefaultImage()}'" /></div>`;
            }
        }
        
        if (!galleryHtml) {
            galleryHtml = '<p class="text-gray-500">Chưa có hình ảnh</p>';
        }

        modalTitle.textContent = post.tieu_de;
        modalBody.innerHTML = `
            <p><strong>Mô tả:</strong> ${post.mo_ta}</p>
            <p><strong>Địa chỉ:</strong> ${post.dia_chi_day_du}, ${post.phuong_xa}, ${post.tinh_thanhpho}</p>
            <p><strong>Giá:</strong> ${post.gia_thang} VNĐ</p>
            <p><strong>Diện tích:</strong> ${post.dien_tich_m2} m²</p>
            <p><strong>Ngày đăng:</strong> ${post.ngay_dang}</p>
            <p><strong>Ngày có thể vào ở:</strong> ${post.ngay_co_the_vao_o}</p>
            <p><strong>Người đăng:</strong> ${post.nguoiDang.fullname} (${post.nguoiDang.email}, ${post.nguoiDang.so_dien_thoai})</p>
            ${galleryHtml}
        `;

        // Buttons
        modalActions.innerHTML = `
            <button class="btn-approve" onclick="approvePost(${id})">Duyệt</button>
            <button class="btn-reject" onclick="rejectPost(${id})">Từ chối</button>
            <button class="btn-delete" onclick="deletePost(${id})">Xóa</button>
        `;

    } catch (err) {
        modalBody.innerHTML = `<p class="text-red-600">${err.message}</p>`;
    }
}

// --- Duyệt / từ chối / xóa ---
async function approvePost(id) { await updateStatus(id, 'APPROVED'); }
async function rejectPost(id) { await updateStatus(id, 'REJECTED'); }

async function updateStatus(id, status) {
    try {
        const res = await fetch(`${API_BASE}/api/baidang/${id}/status?status=${status}`, {
            method: "PUT",
            headers: { Authorization: "Bearer " + token }
        });
        if (!res.ok) throw new Error("Không thể cập nhật trạng thái");
        alert(`Bài đăng đã ${status.toLowerCase()}`);
        modal.style.display = "none";
        loadPendingPosts();
    } catch (err) {
        alert(err.message);
    }
}

async function deletePost(id) {
    if (!confirm("Bạn có chắc muốn xóa bài này?")) return;
    try {
        const res = await fetch(`${API_BASE}/api/baidang/${id}`, {
            method: "DELETE",
            headers: { Authorization: "Bearer " + token }
        });
        if (!res.ok) throw new Error("Không thể xóa bài");
        alert("Bài đăng đã xóa");
        modal.style.display = "none";
        loadPendingPosts();
    } catch (err) {
        alert(err.message);
    }
}

// ==========================================
// ADMIN DASHBOARD & USER MANAGEMENT
// ==========================================

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const res = await fetch(`${API_BASE}/api/admin/dashboard`, {
            headers: { Authorization: "Bearer " + token }
        });
        if (!res.ok) throw new Error("Không tải được thống kê");
        
        const stats = await res.json();
        
        // Main stat cards
        document.getElementById("stat-users").textContent = stats.totalUsers || 0;
        document.getElementById("stat-posts").textContent = stats.totalPosts || 0;
        document.getElementById("stat-tim-phong").textContent = stats.totalTimPhong || 0;
        document.getElementById("stat-pending").textContent = stats.pendingPosts || 0;
        document.getElementById("stat-comments").textContent = stats.totalComments || 0;
        
        // User breakdown
        document.getElementById("stat-admin-count").textContent = stats.adminCount || 0;
        document.getElementById("stat-chutro-count").textContent = stats.chuTro || 0;
        document.getElementById("stat-nguoithue-count").textContent = stats.nguoiThue || 0;
        
        // Post status breakdown
        document.getElementById("stat-approved").textContent = stats.approvedPosts || 0;
        document.getElementById("stat-pending-detail").textContent = stats.pendingPosts || 0;
        document.getElementById("stat-rejected").textContent = stats.rejectedPosts || 0;
        
        // Update pending badge
        const pendingBadge = document.getElementById("pending-badge");
        if (stats.pendingPosts > 0) {
            pendingBadge.textContent = stats.pendingPosts;
            pendingBadge.classList.remove("hidden");
        }
    } catch (err) {
        console.error("Dashboard error:", err);
    }
}

// Load all users
async function loadUsers() {
    const tbody = document.getElementById("users-table-body");
    tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-4 text-center text-gray-500">Đang tải...</td></tr>`;
    
    try {
        const res = await fetch(`${API_BASE}/api/admin/users`, {
            headers: { Authorization: "Bearer " + token }
        });
        if (!res.ok) throw new Error("Không tải được danh sách người dùng");
        
        const users = await res.json();
        
        if (!users || users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-4 text-center text-gray-500">Không có người dùng nào.</td></tr>`;
            return;
        }
        
        tbody.innerHTML = users.map(u => {
            const roleText = u.role === 'quan_tri_vien' ? 'Quản trị viên' :
                           u.role === 'chu_tro' ? 'Chủ trọ' : 'Người thuê';
            const roleClass = u.role === 'quan_tri_vien' ? 'bg-purple-100 text-purple-700' :
                            u.role === 'chu_tro' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700';
            
            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm">${u.id}</td>
                    <td class="px-4 py-3 text-sm font-medium">${u.fullname || 'N/A'}</td>
                    <td class="px-4 py-3 text-sm">${u.email}</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 text-xs rounded-full ${roleClass}">${roleText}</span>
                    </td>
                    <td class="px-4 py-3">
                        <button onclick="viewUser(${u.id})" class="text-blue-600 hover:text-blue-800 mr-2">
                            <i data-feather="eye" class="w-4 h-4"></i>
                        </button>
                        <button onclick="editUser(${u.id})" class="text-green-600 hover:text-green-800 mr-2">
                            <i data-feather="edit" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteUser(${u.id})" class="text-red-600 hover:text-red-800">
                            <i data-feather="trash-2" class="w-4 h-4"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        if (typeof feather !== "undefined") feather.replace();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-4 text-center text-red-500">${err.message}</td></tr>`;
    }
}

// Load all posts with pagination
async function loadAllPosts(page = 0) {
    const tbody = document.getElementById("posts-table-body");
    tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-4 text-center text-gray-500">Đang tải...</td></tr>`;
    
    try {
        const res = await fetch(`${API_BASE}/api/admin/posts/paged?page=${page}&size=10`, {
            headers: { Authorization: "Bearer " + token }
        });
        if (!res.ok) throw new Error("Không tải được danh sách bài đăng");
        
        const result = await res.json();
        const posts = result.data || [];
        postsPage = result.pagination?.currentPage || 0;
        postsTotalPages = result.pagination?.totalPages || 1;
        
        if (!posts || posts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-4 text-center text-gray-500">Không có bài đăng nào.</td></tr>`;
            renderPostsPagination();
            return;
        }
        
        tbody.innerHTML = posts.map(p => {
            const statusText = p.trangThai === 'PENDING' ? 'Chờ duyệt' :
                             p.trangThai === 'APPROVED' ? 'Đã duyệt' : 'Từ chối';
            const statusClass = p.trangThai === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                              p.trangThai === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
            
            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm">${p.id}</td>
                    <td class="px-4 py-3 text-sm font-medium">${p.tieu_de || 'N/A'}</td>
                    <td class="px-4 py-3 text-sm">${p.nguoiDang?.fullname || 'N/A'}</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 text-xs rounded-full ${statusClass}">${statusText}</span>
                    </td>
                    <td class="px-4 py-3">
                        <button onclick="openDetailModal(${p.id})" class="text-blue-600 hover:text-blue-800 mr-2">
                            <i data-feather="eye" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deletePost(${p.id})" class="text-red-600 hover:text-red-800">
                            <i data-feather="trash-2" class="w-4 h-4"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        renderPostsPagination();
        if (typeof feather !== "undefined") feather.replace();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-4 text-center text-red-500">${err.message}</td></tr>`;
    }
}

// Render pagination controls
function renderPostsPagination() {
    const existing = document.getElementById('posts-pagination');
    if (existing) existing.remove();
    
    const paginationDiv = document.createElement('div');
    paginationDiv.id = 'posts-pagination';
    paginationDiv.className = 'flex justify-center items-center gap-2 mt-4';
    
    let html = `
        <button onclick="loadAllPosts(${postsPage - 1})" ${postsPage === 0 ? 'disabled' : ''} 
            class="px-3 py-1 bg-gray-200 rounded ${postsPage === 0 ? 'opacity-50' : 'hover:bg-gray-300'}">Trước</button>
        <span class="text-sm text-gray-600">Trang ${postsPage + 1} / ${postsTotalPages}</span>
        <button onclick="loadAllPosts(${postsPage + 1})" ${postsPage >= postsTotalPages - 1 ? 'disabled' : ''} 
            class="px-3 py-1 bg-gray-200 rounded ${postsPage >= postsTotalPages - 1 ? 'opacity-50' : 'hover:bg-gray-300'}">Sau</button>
    `;
    
    paginationDiv.innerHTML = html;
    document.getElementById('tab-posts').appendChild(paginationDiv);
}

// Load find room posts with pagination
async function loadFindRoomPosts(page = 0) {
    const tbody = document.getElementById("find-room-posts-table-body");
    tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-4 text-center text-gray-500">Đang tải...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/api/admin/tim-phong/paged?page=${page}&size=10`, {
            headers: { Authorization: "Bearer " + token }
        });
        if (!res.ok) throw new Error("Không tải được danh sách bài đăng tìm phòng");

        const result = await res.json();
        const posts = result.data || [];
        findRoomPage = result.pagination?.currentPage || 0;
        findRoomTotalPages = result.pagination?.totalPages || 1;

        if (!posts || posts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-4 text-center text-gray-500">Không có bài đăng tìm phòng nào.</td></tr>`;
            renderFindRoomPagination();
            return;
        }

        tbody.innerHTML = posts.map(p => {
            const statusText = p.trangThai === 'dang_tim' ? 'Đang tìm' :
                             p.trangThai === 'da_tim_duoc' ? 'Đã tìm được' : p.trangThai;
            const statusClass = p.trangThai === 'dang_tim' ? 'bg-blue-100 text-blue-700' :
                              p.trangThai === 'da_tim_duoc' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';

            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm">${p.id}</td>
                    <td class="px-4 py-3 text-sm font-medium">${p.tieuDe || 'N/A'}</td>
                    <td class="px-4 py-3 text-sm">${p.khuVucMongMuonXa || ''}, ${p.khuVucMongMuonThanhPho || ''}</td>
                    <td class="px-4 py-3 text-sm">${p.giaThapNhat ? p.giaThapNhat.toLocaleString('vi-VN') : '-'} - ${p.giaCaoNhat ? p.giaCaoNhat.toLocaleString('vi-VN') : '-'} VNĐ</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 text-xs rounded-full ${statusClass}">${statusText}</span>
                    </td>
                    <td class="px-4 py-3">
                        <button onclick="openFindRoomDetailModal(${p.id})" class="text-blue-600 hover:text-blue-800 mr-2">
                            <i data-feather="eye" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteFindRoomPost(${p.id})" class="text-red-600 hover:text-red-800">
                            <i data-feather="trash-2" class="w-4 h-4"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        renderFindRoomPagination();
        if (typeof feather !== "undefined") feather.replace();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-4 text-center text-red-500">${err.message}</td></tr>`;
    }
}

function renderFindRoomPagination() {
    const existing = document.getElementById('find-room-posts-pagination');
    if (existing) existing.remove();

    const paginationDiv = document.createElement('div');
    paginationDiv.id = 'find-room-posts-pagination';
    paginationDiv.className = 'flex justify-center items-center gap-2 mt-4';

    let html = `
        <button onclick="loadFindRoomPosts(${findRoomPage - 1})" ${findRoomPage === 0 ? 'disabled' : ''}
            class="px-3 py-1 bg-gray-200 rounded ${findRoomPage === 0 ? 'opacity-50' : 'hover:bg-gray-300'}">Trước</button>
        <span class="text-sm text-gray-600">Trang ${findRoomPage + 1} / ${findRoomTotalPages}</span>
        <button onclick="loadFindRoomPosts(${findRoomPage + 1})" ${findRoomPage >= findRoomTotalPages - 1 ? 'disabled' : ''}
            class="px-3 py-1 bg-gray-200 rounded ${findRoomPage >= findRoomTotalPages - 1 ? 'opacity-50' : 'hover:bg-gray-300'}">Sau</button>
    `;

    paginationDiv.innerHTML = html;
    document.getElementById('tab-find-room-posts').appendChild(paginationDiv);
}

async function openFindRoomDetailModal(id) {
    modalBody.innerHTML = "Đang tải...";
    modalActions.innerHTML = "";
    modal.style.display = "block";

    try {
        const res = await fetch(`${API_BASE}/api/baidangtimphong/${id}`, {
            headers: { Authorization: "Bearer " + token }
        });
        if (!res.ok) throw new Error("Không tải được bài đăng tìm phòng");
        const post = await res.json();

        const statusText = post.trangThai === 'dang_tim' ? 'Đang tìm' :
                         post.trangThai === 'da_tim_duoc' ? 'Đã tìm được' : post.trangThai;

        modalTitle.textContent = post.tieuDe;
        modalBody.innerHTML = `
            <div class="space-y-3">
                <p><strong>Mô tả:</strong> ${post.moTa || 'N/A'}</p>
                <p><strong>Khu vực mong muốn:</strong> ${post.khuVucMongMuonXa || ''}, ${post.khuVucMongMuonThanhPho || ''}</p>
                <p><strong>Giá mong muốn:</strong> ${post.giaThapNhat ? post.giaThapNhat.toLocaleString('vi-VN') : '-'} - ${post.giaCaoNhat ? post.giaCaoNhat.toLocaleString('vi-VN') : '-'} VNĐ</p>
                <p><strong>Diện tích tối thiểu:</strong> ${post.dienTichToiThieu || '-'} m²</p>
                <p><strong>Số người ở:</strong> ${post.soNguoiO || '-'}</p>
                <p><strong>Trạng thái:</strong> ${statusText}</p>
                <p><strong>Ngày đăng:</strong> ${post.ngayDang ? new Date(post.ngayDang).toLocaleString('vi-VN') : 'N/A'}</p>
                <p><strong>Người đăng:</strong> ${post.userFullname || 'N/A'} (${post.userEmail || 'N/A'}, ${post.userSoDienThoai || 'N/A'})</p>
            </div>
        `;

        modalActions.innerHTML = `
            <button onclick="deleteFindRoomPost(${id})" class="btn-delete">Xóa</button>
            <button onclick="closeModal()" class="px-4 py-2 bg-gray-200 rounded-lg">Đóng</button>
        `;
    } catch (err) {
        modalBody.innerHTML = `<p class="text-red-600">${err.message}</p>`;
    }
}

async function deleteFindRoomPost(id) {
    if (!confirm("Bạn có chắc muốn xóa bài đăng tìm phòng này?")) return;

    try {
        const res = await fetch(`${API_BASE}/api/admin/tim-phong/${id}`, {
            method: "DELETE",
            headers: { Authorization: "Bearer " + token }
        });

        if (!res.ok) throw new Error("Không thể xóa bài đăng tìm phòng");

        alert("Xóa bài đăng tìm phòng thành công!");
        modal.style.display = "none";
        loadFindRoomPosts(findRoomPage);
    } catch (err) {
        alert(err.message);
    }
}

// User management functions
async function viewUser(id) {
    try {
        const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
            headers: { Authorization: "Bearer " + token }
        });
        if (!res.ok) throw new Error("Không tải được thông tin user");
        
        const u = await res.json();
        const roleText = u.role === 'quan_tri_vien' ? 'Quản trị viên' :
                       u.role === 'chu_tro' ? 'Chủ trọ' : 'Người thuê';
        
        modalTitle.textContent = `Thông tin người dùng #${u.id}`;
        modalBody.innerHTML = `
            <div class="space-y-3">
                <p><strong>Họ tên:</strong> ${u.fullname || 'N/A'}</p>
                <p><strong>Email:</strong> ${u.email}</p>
                <p><strong>Số điện thoại:</strong> ${u.so_dien_thoai || 'N/A'}</p>
                <p><strong>Vai trò:</strong> ${roleText}</p>
                <p><strong>Ngày tạo:</strong> ${u.ngay_tao ? new Date(u.ngay_tao).toLocaleString('vi-VN') : 'N/A'}</p>
            </div>
        `;
        modalActions.innerHTML = `
            <button onclick="editUser(${u.id})" class="btn-primary">Chỉnh sửa</button>
            <button onclick="closeModal()" class="px-4 py-2 bg-gray-200 rounded-lg">Đóng</button>
        `;
        modal.style.display = "block";
    } catch (err) {
        alert(err.message);
    }
}

async function editUser(id) {
    try {
        const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
            headers: { Authorization: "Bearer " + token }
        });
        if (!res.ok) throw new Error("Không tải được thông tin user");
        
        const u = await res.json();
        
        modalTitle.textContent = `Chỉnh sửa người dùng #${u.id}`;
        modalBody.innerHTML = `
            <form id="editUserForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                    <input type="text" id="edit-fullname" value="${u.fullname || ''}" class="w-full px-3 py-2 border rounded-lg">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                    <input type="text" id="edit-phone" value="${u.so_dien_thoai || ''}" class="w-full px-3 py-2 border rounded-lg">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                    <select id="edit-role" class="w-full px-3 py-2 border rounded-lg">
                        <option value="nguoi_thue" ${u.role === 'nguoi_thue' ? 'selected' : ''}>Người thuê</option>
                        <option value="chu_tro" ${u.role === 'chu_tro' ? 'selected' : ''}>Chủ trọ</option>
                        <option value="quan_tri_vien" ${u.role === 'quan_tri_vien' ? 'selected' : ''}>Quản trị viên</option>
                    </select>
                </div>
            </form>
        `;
        modalActions.innerHTML = `
            <button onclick="saveUser(${id})" class="btn-primary">Lưu thay đổi</button>
            <button onclick="closeModal()" class="px-4 py-2 bg-gray-200 rounded-lg">Hủy</button>
        `;
        modal.style.display = "block";
    } catch (err) {
        alert(err.message);
    }
}

async function saveUser(id) {
    const data = {
        fullname: document.getElementById("edit-fullname").value,
        soDienThoai: document.getElementById("edit-phone").value,
        role: document.getElementById("edit-role").value
    };
    
    try {
        const res = await fetch(`${API_BASE}/api/admin/update-user/${id}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                Authorization: "Bearer " + token 
            },
            body: JSON.stringify(data)
        });
        
        if (!res.ok) throw new Error("Không thể cập nhật user");
        
        alert("Cập nhật thành công!");
        modal.style.display = "none";
        loadUsers();
    } catch (err) {
        alert(err.message);
    }
}

async function deleteUser(id) {
    if (!confirm("Bạn có chắc muốn xóa người dùng này?")) return;
    
    try {
        const res = await fetch(`${API_BASE}/api/admin/delete-user/${id}`, {
            method: "DELETE",
            headers: { Authorization: "Bearer " + token }
        });
        
        if (!res.ok) throw new Error("Không thể xóa user");
        
        alert("Xóa user thành công!");
        loadUsers();
    } catch (err) {
        alert(err.message);
    }
}

// Tab navigation
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from sidebar buttons
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
        btn.classList.remove('bg-blue-50', 'text-blue-600', 'font-medium');
        btn.classList.add('text-gray-600');
    });
    
    // Show selected tab
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    // Add active to clicked button
    const clickedBtn = event.target.closest('.sidebar-btn');
    if (clickedBtn) {
        clickedBtn.classList.remove('text-gray-600');
        clickedBtn.classList.add('bg-blue-50', 'text-blue-600', 'font-medium');
    }
    
    // Load data for specific tabs
    if (tabName === 'dashboard') {
        loadDashboardStats();
    } else if (tabName === 'users') {
        loadUsers();
    } else if (tabName === 'posts') {
        loadAllPosts();
    } else if (tabName === 'pending') {
        loadPendingPosts();
    } else if (tabName === 'find-room-posts') {
        loadFindRoomPosts();
    }
}

function closeModal() {
    modal.style.display = "none";
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_id");
    window.location.href = "auth.html";
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    if (token && userRole === "quan_tri_vien") {
        loadDashboardStats();
    }
});
