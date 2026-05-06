package com.example.Rent_room.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.Rent_room.dto.BaiDangTimPhongDTO;
import com.example.Rent_room.dto.PaginationResponseDTO;
import com.example.Rent_room.dto.UserDTO;
import com.example.Rent_room.entity.BaiDangChoThue;
import com.example.Rent_room.entity.BaiDangTimPhongEntity;
import com.example.Rent_room.entity.TrangThaiBaiDang;
import com.example.Rent_room.entity.User;
import com.example.Rent_room.repository.BaiDangRepository;
import com.example.Rent_room.repository.BaiDangTimPhongRepository;
import com.example.Rent_room.repository.BinhLuanChoThueRepository;
import com.example.Rent_room.repository.BinhLuanTimPhongRepository;
import com.example.Rent_room.repository.UserRepository;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BaiDangRepository baiDangRepository;
    private final BaiDangTimPhongRepository baiDangTimPhongRepository;
    private final BinhLuanChoThueRepository binhLuanChoThueRepository;
    private final BinhLuanTimPhongRepository binhLuanTimPhongRepository;

    public AdminService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                        BaiDangRepository baiDangRepository,
                        BaiDangTimPhongRepository baiDangTimPhongRepository,
                        BinhLuanChoThueRepository binhLuanChoThueRepository,
                        BinhLuanTimPhongRepository binhLuanTimPhongRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.baiDangRepository = baiDangRepository;
        this.baiDangTimPhongRepository = baiDangTimPhongRepository;
        this.binhLuanChoThueRepository = binhLuanChoThueRepository;
        this.binhLuanTimPhongRepository = binhLuanTimPhongRepository;
    }

    // 🔹 Dashboard - Thống kê tổng quan
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Thống kê người dùng theo role
        List<User> allUsers = userRepository.findAll();
        long nguoiThueCount = allUsers.stream().filter(u -> u.getRole() == User.Role.nguoi_thue).count();
        long chuTroCount = allUsers.stream().filter(u -> u.getRole() == User.Role.chu_tro).count();
        long adminCount = allUsers.stream().filter(u -> u.getRole() == User.Role.quan_tri_vien).count();
        
        stats.put("totalUsers", allUsers.size());
        stats.put("nguoiThue", nguoiThueCount);
        stats.put("chuTro", chuTroCount);
        stats.put("adminCount", adminCount);
        
        // Thống kê bài đăng cho thuê
        long totalPosts = baiDangRepository.count();
        long pendingPosts = baiDangRepository.findByTrangThai(TrangThaiBaiDang.PENDING).size();
        long approvedPosts = baiDangRepository.findByTrangThai(TrangThaiBaiDang.APPROVED).size();
        long rejectedPosts = baiDangRepository.findByTrangThai(TrangThaiBaiDang.REJECTED).size();
        
        stats.put("totalPosts", totalPosts);
        stats.put("pendingPosts", pendingPosts);
        stats.put("approvedPosts", approvedPosts);
        stats.put("rejectedPosts", rejectedPosts);
        
        // Thống kê bài đăng tìm phòng
        stats.put("totalTimPhong", baiDangTimPhongRepository.count());
        
        // Thống kê bình luận
        long totalComments = binhLuanChoThueRepository.count() + binhLuanTimPhongRepository.count();
        stats.put("totalComments", totalComments);
        stats.put("commentsChoThue", binhLuanChoThueRepository.count());
        stats.put("commentsTimPhong", binhLuanTimPhongRepository.count());
        
        return stats;
    }

    // 🔹 Lấy tất cả user
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // 🔹 Lấy user theo ID
    public Optional<User> getUserById(Integer id) {
        return userRepository.findById(id);
    }

    // 🔹 Cập nhật role cho user
    public String assignRole(Integer id, String role) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (!optionalUser.isPresent()) {
            return "User không tồn tại!";
        }

        User user = optionalUser.get();

        try {
            user.setRole(User.Role.valueOf(role.toLowerCase()));
        } catch (IllegalArgumentException e) {
            return "Role không hợp lệ!";
        }

        user.setNgay_cap_nhat(LocalDateTime.now());
        userRepository.save(user);
        return "Cập nhật role thành công cho user " + user.getEmail();
    }

    // 🔹 Cập nhật thông tin user
    public String updateUser(Integer id, UserDTO dto) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (!optionalUser.isPresent()) {
            return "User không tồn tại!";
        }

        User user = optionalUser.get();
        user.setFullname(dto.getFullname());
        user.setSo_dien_thoai(dto.getSoDienThoai());
        user.setEmail(dto.getEmail());
        
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            user.setHash_password(passwordEncoder.encode(dto.getPassword()));
        }
        
        if (dto.getRole() != null && !dto.getRole().isEmpty()) {
            try {
                user.setRole(User.Role.valueOf(dto.getRole().toLowerCase()));
            } catch (IllegalArgumentException e) {
                return "Role không hợp lệ!";
            }
        }
        
        user.setNgay_cap_nhat(LocalDateTime.now());
        userRepository.save(user);

        return "Cập nhật user thành công!";
    }

    // 🔹 Xóa user
    public String deleteUser(Integer id) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (!optionalUser.isPresent()) {
            return "User không tồn tại!";
        }
        userRepository.deleteById(id);
        return "Xóa user thành công!";
    }

    // 🔹 Lấy tất cả bài đăng cho thuê (không phân biệt trạng thái - dành cho admin)
    public List<BaiDangChoThue> getAllBaiDang() {
        return baiDangRepository.findAll();
    }

    // 🔹 Lấy bài đăng cho thuê có phân trang (dành cho admin)
    public PaginationResponseDTO<BaiDangChoThue> getAllBaiDangPaged(Pageable pageable) {
        Page<BaiDangChoThue> page = baiDangRepository.findAll(pageable);

        return new PaginationResponseDTO<>(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements()
        );
    }

    // 🔹 Lấy tất cả bài đăng tìm phòng có phân trang (dành cho admin)
    public PaginationResponseDTO<BaiDangTimPhongDTO> getAllBaiDangTimPhongPaged(Pageable pageable) {
        Page<BaiDangTimPhongEntity> page = baiDangTimPhongRepository.findAll(pageable);

        List<BaiDangTimPhongDTO> dtoList = page.getContent().stream()
                .map(this::toTimPhongDto)
                .toList();

        return new PaginationResponseDTO<>(
            dtoList,
            page.getNumber(),
            page.getSize(),
            page.getTotalElements()
        );
    }

    // 🔹 Xóa bài đăng tìm phòng
    public String deleteBaiDangTimPhong(Integer id) {
        Optional<BaiDangTimPhongEntity> optional = baiDangTimPhongRepository.findById(id);
        if (!optional.isPresent()) {
            return "Bài đăng tìm phòng không tồn tại!";
        }
        baiDangTimPhongRepository.deleteById(id);
        return "Xóa bài đăng tìm phòng thành công!";
    }

    private BaiDangTimPhongDTO toTimPhongDto(BaiDangTimPhongEntity entity) {
        BaiDangTimPhongDTO dto = new BaiDangTimPhongDTO();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUser() != null ? entity.getUser().getId() : null);
        dto.setTieuDe(entity.getTieuDe());
        dto.setMoTa(entity.getMoTa());
        dto.setKhuVucMongMuonXa(entity.getKhuVucMongMuonXa());
        dto.setKhuVucMongMuonThanhPho(entity.getKhuVucMongMuonThanhPho());
        dto.setGiaThapNhat(entity.getGiaThapNhat());
        dto.setGiaCaoNhat(entity.getGiaCaoNhat());
        dto.setDienTichToiThieu(entity.getDienTichToiThieu());
        dto.setSoNguoiO(entity.getSoNguoiO());
        dto.setTrangThai(entity.getTrangThaiTimPhong() != null ? entity.getTrangThaiTimPhong().name() : null);
        dto.setNgayDang(entity.getNgayDang());
        dto.setNgayCapNhat(entity.getNgayCapNhat());

        if (entity.getUser() != null) {
            dto.setUserFullname(entity.getUser().getFullname());
            dto.setUserEmail(entity.getUser().getEmail());
            dto.setUserSoDienThoai(entity.getUser().getSo_dien_thoai());
        }

        return dto;
    }
}
