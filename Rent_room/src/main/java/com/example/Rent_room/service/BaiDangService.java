package com.example.Rent_room.service;

import com.example.Rent_room.dto.BaiDangOutputDTO;
import com.example.Rent_room.dto.PaginationResponseDTO;
import com.example.Rent_room.entity.BaiDangChoThue;
import com.example.Rent_room.entity.TrangThaiBaiDang;
import com.example.Rent_room.respository.BaiDangRepository;
import com.example.Rent_room.respository.HinhAnhPhongTroRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BaiDangService {

    private final BaiDangRepository baiDangRepository;
    private final HinhAnhPhongTroRepository hinhAnhRepository;

    public BaiDangService(BaiDangRepository baiDangRepository, HinhAnhPhongTroRepository hinhAnhRepository) {
        this.baiDangRepository = baiDangRepository;
        this.hinhAnhRepository = hinhAnhRepository;
    }

    public List<BaiDangChoThue> getAllBaiDang() {
        return baiDangRepository.findAll();
    }
    
    // Phân trang với filter thủ công - trả về DTO
    public PaginationResponseDTO<BaiDangOutputDTO> getAllBaiDangWithPagination(
            int page, int size, String tinhThanh, String phuongXa,
            Double giaMin, Double giaMax, Float dienTichMin, Float dienTichMax,
            TrangThaiBaiDang trangThai) {

        try {
            // Validate input
            if (page < 0) page = 0;
            if (size < 1 || size > 100) size = 10;

            // Lấy tất cả dữ liệu đã filter từ database
            List<BaiDangChoThue> allData = baiDangRepository.findWithFilters(
                    tinhThanh, phuongXa, giaMin, giaMax, dienTichMin, dienTichMax, trangThai);

            // Đếm tổng số items
            long totalItems = baiDangRepository.countWithFilters(
                    tinhThanh, phuongXa, giaMin, giaMax, dienTichMin, dienTichMax, trangThai);

            // Tính toán phân trang thủ công
            int offset = page * size;
            int toIndex = Math.min(offset + size, allData.size());

            // Cắt list theo page và size
            List<BaiDangChoThue> pageData = offset < allData.size()
                    ? allData.subList(offset, toIndex)
                    : List.of();

            // Chuyển Entity sang DTO và set ảnh bìa
            List<BaiDangOutputDTO> dtoList = pageData.stream()
                    .map(entity -> {
                        BaiDangOutputDTO dto = new BaiDangOutputDTO(entity);
                        // Lấy ảnh bìa từ repository và set vào DTO
                        try {
                            String anhBia = hinhAnhRepository.file_anh_nen(entity.getId());
                            dto.setAnhBia(anhBia != null ? anhBia : "");
                        } catch (Exception e) {
                            dto.setAnhBia("");
                        }
                        return dto;
                    })
                    .collect(Collectors.toList());

            // Tạo response
            return new PaginationResponseDTO<>(dtoList, page, size, totalItems);

        } catch (Exception e) {
            return new PaginationResponseDTO<>(false, "Có lỗi xảy ra: " + e.getMessage());
        }
    }

    public Optional<BaiDangChoThue> getBaiDangById(Integer id) {
        return baiDangRepository.findById(id);
    }

    public List<BaiDangChoThue> getBaiDangByCostRange(Double costMin, Double costMax) {
        return baiDangRepository.findByGiaThangBetween(costMin, costMax);
    }

    public BaiDangChoThue saveBaiDang(BaiDangChoThue baiDang) {
        return baiDangRepository.save(baiDang);
    }

    public void deleteBaiDang(Integer id) {
        baiDangRepository.deleteById(id);
    }

    // Cập nhật trạng thái bài đăng
    public BaiDangChoThue updateStatus(Integer id, TrangThaiBaiDang status) {
        BaiDangChoThue post = baiDangRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));
        post.setTrangThai(status);
        return baiDangRepository.save(post);
    }

    // Lấy danh sách bài đăng theo trạng thái
    public List<BaiDangChoThue> getByStatus(TrangThaiBaiDang status) {
        return baiDangRepository.findByTrangThai(status);
    }
}
