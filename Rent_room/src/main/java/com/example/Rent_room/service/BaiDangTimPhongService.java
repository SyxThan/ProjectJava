package com.example.Rent_room.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.Rent_room.dto.BaiDangTimPhongDTO;
import com.example.Rent_room.dto.PaginationResponseDTO;
import com.example.Rent_room.entity.BaiDangTimPhongEntity;
import com.example.Rent_room.entity.TrangThaiTimPhong;
import com.example.Rent_room.entity.User;
import com.example.Rent_room.repository.BaiDangTimPhongRepository;
import com.example.Rent_room.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BaiDangTimPhongService {
    private final BaiDangTimPhongRepository baiDangTimPhongRepository;
    private final UserRepository userRepository;

    // Phân trang với filter thủ công - trả về DTO
    public PaginationResponseDTO<BaiDangTimPhongDTO> getAllBaiDangTimPhongWithPagination(
            int page, int size, String thanhPho, String xa,
            BigDecimal giaMin, BigDecimal giaMax, Float dienTichMin, Float dienTichMax,
            TrangThaiTimPhong trangThai) {

        try {
            // Validate input
            if (page < 0)
                page = 0;
            if (size < 1 || size > 100)
                size = 20;

            // Đếm tổng số items trước
            long totalItems = baiDangTimPhongRepository.countWithFilters(
                    thanhPho, xa, giaMin, giaMax, dienTichMin, dienTichMax, trangThai);

            // Tính toán phân trang
            int offset = page * size;
            int toIndex = (int) Math.min(offset + size, totalItems);

            // Lấy tất cả dữ liệu đã filter từ database
            List<BaiDangTimPhongEntity> allData = baiDangTimPhongRepository.findWithFilters(
                    thanhPho, xa, giaMin, giaMax, dienTichMin, dienTichMax, trangThai);

            // Cắt list theo page và size
            List<BaiDangTimPhongEntity> pageData;
            if (offset >= allData.size()) {
                pageData = List.of();
            } else {
                int actualToIndex = Math.min(toIndex, allData.size());
                pageData = allData.subList(offset, actualToIndex);
            }

            // Chuyển Entity sang DTO
            List<BaiDangTimPhongDTO> dtoList = pageData.stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());

            // Tạo response
            return new PaginationResponseDTO<>(dtoList, page, size, totalItems);

        } catch (Exception e) {
            return new PaginationResponseDTO<>(false, "Có lỗi xảy ra: " + e.getMessage());
        }
    }

    public Optional<BaiDangTimPhongDTO> findById(Integer id) {
        // Sử dụng findByIdWithUser để đảm bảo User được load
        Optional<BaiDangTimPhongEntity> entityOpt = baiDangTimPhongRepository.findByIdWithUser(id);

        if (entityOpt.isEmpty()) {
            return Optional.empty();
        }

        BaiDangTimPhongEntity entity = entityOpt.get();
        return Optional.of(toDto(entity));
    }

    public void createPost(BaiDangTimPhongDTO baiDangTimPhongDTO) {
        if (baiDangTimPhongDTO.getGiaThapNhat().compareTo(baiDangTimPhongDTO.getGiaCaoNhat()) > 0) {
            throw new IllegalArgumentException("Giá thấp nhất phải nhỏ hơn giá cao nhất");
        }

        if (baiDangTimPhongDTO.getGiaThapNhat().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Giá phải lớn hơn 0");
        }

        BaiDangTimPhongEntity post = new BaiDangTimPhongEntity();
        System.out.println("DEBUG Service - Looking for userId: " + baiDangTimPhongDTO.getUserId());
        User user = userRepository.findById(baiDangTimPhongDTO.getUserId())
                .orElseThrow(
                        () -> new RuntimeException("Không tìm thấy user với ID: " + baiDangTimPhongDTO.getUserId()));
        System.out.println("DEBUG Service - Found user: " + (user != null ? user.getId() : "null"));
        post.setUser(user);
        post.setTieuDe(baiDangTimPhongDTO.getTieuDe());
        post.setMoTa(baiDangTimPhongDTO.getMoTa());
        post.setKhuVucMongMuonXa(baiDangTimPhongDTO.getKhuVucMongMuonXa());
        post.setKhuVucMongMuonThanhPho(baiDangTimPhongDTO.getKhuVucMongMuonThanhPho());
        post.setGiaThapNhat(baiDangTimPhongDTO.getGiaThapNhat());
        post.setGiaCaoNhat(baiDangTimPhongDTO.getGiaCaoNhat());
        post.setDienTichToiThieu(baiDangTimPhongDTO.getDienTichToiThieu());
        post.setSoNguoiO(baiDangTimPhongDTO.getSoNguoiO());
        post.setTrangThaiTimPhong(TrangThaiTimPhong.dang_tim);
        baiDangTimPhongRepository.save(post);
    }

    public void deletePost(Integer id) {
        if (!baiDangTimPhongRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy bài đăng với ID: " + id);
        }
        baiDangTimPhongRepository.deleteById(id);
    }

    public void updatePost(Integer id, BaiDangTimPhongDTO baiDangTimPhongDTO) {
        BaiDangTimPhongEntity post = baiDangTimPhongRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng với ID: " + id));

        if (baiDangTimPhongDTO.getGiaThapNhat().compareTo(baiDangTimPhongDTO.getGiaCaoNhat()) > 0) {
            throw new IllegalArgumentException("Giá thấp nhất phải nhỏ hơn giá cao nhất");
        }

        if (baiDangTimPhongDTO.getGiaThapNhat().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Giá phải lớn hơn 0");
        }

        post.setTieuDe(baiDangTimPhongDTO.getTieuDe());
        post.setMoTa(baiDangTimPhongDTO.getMoTa());
        post.setKhuVucMongMuonXa(baiDangTimPhongDTO.getKhuVucMongMuonXa());
        post.setKhuVucMongMuonThanhPho(baiDangTimPhongDTO.getKhuVucMongMuonThanhPho());
        post.setGiaThapNhat(baiDangTimPhongDTO.getGiaThapNhat());
        post.setGiaCaoNhat(baiDangTimPhongDTO.getGiaCaoNhat());
        post.setDienTichToiThieu(baiDangTimPhongDTO.getDienTichToiThieu());
        post.setSoNguoiO(baiDangTimPhongDTO.getSoNguoiO());

        if (baiDangTimPhongDTO.getUserId() != null &&
                !post.getUser().getId().equals(baiDangTimPhongDTO.getUserId())) {
            User user = userRepository.findById(baiDangTimPhongDTO.getUserId())
                    .orElseThrow(() -> new RuntimeException(
                            "Không tìm thấy user với ID: " + baiDangTimPhongDTO.getUserId()));
            post.setUser(user);
        }
        baiDangTimPhongRepository.save(post);
    }

    private BaiDangTimPhongDTO toDto(BaiDangTimPhongEntity entity) {
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

        // Thêm thông tin user nếu có
        if (entity.getUser() != null) {
            dto.setUserFullname(entity.getUser().getFullname());
            dto.setUserEmail(entity.getUser().getEmail());
            dto.setUserSoDienThoai(entity.getUser().getSo_dien_thoai());
        }

        return dto;
    }
}
