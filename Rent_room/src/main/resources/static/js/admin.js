const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));
const userRole = user?.role;

if (!token || userRole !== "quan_tri_vien") {
    document.getElementById("not-admin").classList.remove("hidden");
} else {
    document.getElementById("admin-content").classList.remove("hidden");
    loadPendingPosts();
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
            const thumb = post.anhBia || '/default.jpg';
            const html = `
                <div class="card" data-id="${post.id}">
                    <img src="${thumb}" class="thumb" />
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

        let galleryHtml = '';
        if (images.length > 0) {
            galleryHtml = '<div class="gallery">' +
                images.map(img => `<img src="${img.duong_dan_anh}" alt="ảnh phòng">`).join('') +
                '</div>';
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
