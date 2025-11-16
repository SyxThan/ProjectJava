const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));
const userRole = user?.role;

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
        const res = await fetch("/api/baidang/status/PENDING", {
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
        const res = await fetch(`/api/baidang/${id}`, { headers: { Authorization: "Bearer " + token } });
        if (!res.ok) throw new Error("Không tải được bài đăng");
        const post = await res.json();

        // Lấy gallery ảnh
        const imgRes = await fetch(`/api/hinhanh/baidang/${id}`, { headers: { Authorization: "Bearer " + token } });
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
        const res = await fetch(`/api/baidang/${id}/status?status=${status}&role=ADMIN`, {
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
        const res = await fetch(`/api/baidang/${id}`, {
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
