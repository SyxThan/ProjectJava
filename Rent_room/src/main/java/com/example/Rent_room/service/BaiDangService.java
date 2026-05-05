package com.example.Rent_room.service;

import com.example.Rent_room.dto.BaiDangOutputDTO;
import com.example.Rent_room.dto.GeocodeResponseDTO;
import com.example.Rent_room.dto.PaginationResponseDTO;
import com.example.Rent_room.entity.BaiDangChoThue;
import com.example.Rent_room.entity.TrangThaiBaiDang;
import com.example.Rent_room.repository.BaiDangRepository;
import com.example.Rent_room.repository.HinhAnhPhongTroRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Service
public class BaiDangService {

    private static final Logger logger = Logger.getLogger(BaiDangService.class.getName());
    
    private final BaiDangRepository baiDangRepository;
    private final HinhAnhPhongTroRepository hinhAnhRepository;
    private final GeocodingService geocodingService;

    public BaiDangService(BaiDangRepository baiDangRepository, 
                         HinhAnhPhongTroRepository hinhAnhRepository,
                         GeocodingService geocodingService) {
        this.baiDangRepository = baiDangRepository;
        this.hinhAnhRepository = hinhAnhRepository;
        this.geocodingService = geocodingService;
    }

    public List<BaiDangChoThue> getAllBaiDang() {
        return baiDangRepository.findByTrangThai(TrangThaiBaiDang.APPROVED);
    }
    
    public PaginationResponseDTO<BaiDangOutputDTO> getAllBaiDangWithPagination(
            int page, int size, String tinhThanh, String phuongXa,
            Double giaMin, Double giaMax, Float dienTichMin, Float dienTichMax,
            TrangThaiBaiDang trangThai) {

        try {
            // Validate input
            if (page < 0) page = 0;
            if (size < 1 || size > 100) size = 10;

<<<<<<< HEAD
            // Phân trang tại DB bằng Pageable
            PageRequest pageable = PageRequest.of(page, size, Sort.by("ngay_dang").descending());
            Page<BaiDangChoThue> pageResult = baiDangRepository.findWithFilters(
                    tinhThanh, phuongXa, giaMin, giaMax, dienTichMin, dienTichMax, trangThai, pageable);
=======
            // Lấy tất cả dữ liệu đã filter từ database
            TrangThaiBaiDang effectiveStatus = trangThai != null ? trangThai : TrangThaiBaiDang.APPROVED;

            List<BaiDangChoThue> allData = baiDangRepository.findWithFilters(
                    tinhThanh, phuongXa, giaMin, giaMax, dienTichMin, dienTichMax, effectiveStatus);

            // Đếm tổng số items
            long totalItems = baiDangRepository.countWithFilters(
                    tinhThanh, phuongXa, giaMin, giaMax, dienTichMin, dienTichMax, effectiveStatus);

            // Tính toán phân trang thủ công
            int offset = page * size;
            int toIndex = Math.min(offset + size, allData.size());

            // Cắt list theo page và size
            List<BaiDangChoThue> pageData = offset < allData.size()
                    ? allData.subList(offset, toIndex)
                    : List.of();
>>>>>>> 51c922d34034c3cef761ca378a5ebbb8ff037b2a

            // Chuyển Entity sang DTO và set ảnh bìa
            List<BaiDangOutputDTO> dtoList = pageResult.getContent().stream()
                    .map(entity -> {
                        BaiDangOutputDTO dto = new BaiDangOutputDTO(entity);
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
            return new PaginationResponseDTO<>(dtoList, page, size, pageResult.getTotalElements());

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


    public void deleteBaiDang(Integer id) {
        baiDangRepository.deleteById(id);
    }

    public BaiDangChoThue updateStatus(Integer id, TrangThaiBaiDang status) {
        BaiDangChoThue post = baiDangRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));
        post.setTrangThai(status);
        return baiDangRepository.save(post);
    }

    public List<BaiDangChoThue> getByStatus(TrangThaiBaiDang status) {
        return baiDangRepository.findByTrangThai(status);
    }
    //  Chuyển đổi qua kinh độ vĩ độ trước khi save
    public BaiDangChoThue saveBaiDang(BaiDangChoThue baiDang) {
        if (baiDang.getVi_do() == null || baiDang.getKinh_do() == null) {
            try {
                String fullAddress = buildFullAddress(baiDang);
                GeocodeResponseDTO geocode = geocodingService.geocodeAddress(fullAddress);

                baiDang.setVi_do(geocode.getLatitude());
                baiDang.setKinh_do(geocode.getLongitude());
            } catch (Exception e) {

            }
        }
        return baiDangRepository.save(baiDang);
    }

    // ========== Nếu địa chỉ thay đổi thì cập nhật lại địa chỉ =============
    public BaiDangChoThue updateBaiDang(Integer id, BaiDangChoThue updatedBaiDang) {
        BaiDangChoThue existing = baiDangRepository.findById(id).orElse(null);
        boolean addressChanged = !existing.getDia_chi_day_du().equals(updatedBaiDang.getDia_chi_day_du());
        if (addressChanged) {
            try {
                String fullAddress = buildFullAddress(updatedBaiDang);
                GeocodeResponseDTO geocode = geocodingService.geocodeAddress(fullAddress);
                updatedBaiDang.setVi_do(geocode.getLatitude());
                updatedBaiDang.setKinh_do(geocode.getLongitude());
            } catch (Exception e) {
            }
        }
        
        existing.setTieu_de(updatedBaiDang.getTieu_de());
        existing.setMo_ta(updatedBaiDang.getMo_ta());
        existing.setDia_chi_day_du(updatedBaiDang.getDia_chi_day_du());
        existing.setPhuong_xa(updatedBaiDang.getPhuong_xa());
        existing.setTinh_thanhpho(updatedBaiDang.getTinh_thanhpho());
        existing.setVi_do(updatedBaiDang.getVi_do());
        existing.setKinh_do(updatedBaiDang.getKinh_do());
        existing.setGia_thang(updatedBaiDang.getGia_thang());
        existing.setDien_tich_m2(updatedBaiDang.getDien_tich_m2());
        
        return baiDangRepository.save(existing);
    }

    // Xây dựng địa chỉ đầy đủ từ các trường của bài đăng
    private String buildFullAddress(BaiDangChoThue baiDang) {
        return String.format("%s, %s, %s, Vietnam",
            baiDang.getDia_chi_day_du() != null ? baiDang.getDia_chi_day_du() : "",
            baiDang.getPhuong_xa() != null ? baiDang.getPhuong_xa() : "",
            baiDang.getTinh_thanhpho() != null ? baiDang.getTinh_thanhpho() : ""
        ).replaceAll(", ,", ",").trim();
    }

    // Trả về tọa độ của bài đăng
    public GeocodeResponseDTO geocodeBaiDang(Integer Id)  {
        BaiDangChoThue baiDang = baiDangRepository.findById(Id).orElse(null);
        GeocodeResponseDTO dto = new GeocodeResponseDTO();
        dto.setLatitude(baiDang.getVi_do());
        dto.setLongitude(baiDang.getKinh_do());
        return dto;
    }
}