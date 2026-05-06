package com.example.Rent_room.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.Rent_room.dto.BaiDangTimPhongDTO;
import com.example.Rent_room.dto.PaginationResponseDTO;
import com.example.Rent_room.entity.TrangThaiTimPhong;
import com.example.Rent_room.service.BaiDangTimPhongService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/baidangtimphong/")
@RequiredArgsConstructor
public class BaiDangTimPhongController {
    private final BaiDangTimPhongService baiDangTimPhongService;

    @GetMapping
    public ResponseEntity<?> getAllWithPagination(
            @RequestParam(defaultValue = "0") int page, // Trang hiện tại (bắt đầu từ 0)
            @RequestParam(defaultValue = "20") int size, // Số items mỗi trang
            @RequestParam(required = false) String thanhPho, // Filter theo tỉnh/thành phố
            @RequestParam(required = false) String xa, // Filter theo phường/xã
            @RequestParam(required = false) BigDecimal giaMin, // Giá tối thiểu
            @RequestParam(required = false) BigDecimal giaMax, // Giá tối đa
            @RequestParam(required = false) Float dienTichMin, // Diện tích tối thiểu
            @RequestParam(required = false) Float dienTichMax, // Diện tích tối đa
            @RequestParam(required = false) TrangThaiTimPhong trangThai // Trạng thái bài đăng
    ) {
        try {
            // Convert empty strings to null
            if (thanhPho != null && thanhPho.trim().isEmpty()) {
                thanhPho = null;
            }
            if (xa != null && xa.trim().isEmpty()) {
                xa = null;
            }

            PaginationResponseDTO<BaiDangTimPhongDTO> response = baiDangTimPhongService
                    .getAllBaiDangTimPhongWithPagination(
                            page, size, thanhPho, xa, giaMin, giaMax,
                            dienTichMin, dienTichMax, trangThai);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi lấy danh sách bài đăng: " + e.getMessage());
        }
    }

    @GetMapping("{id}")
    public ResponseEntity<?> findByPostId(@PathVariable Integer id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().body("ID bài đăng không hợp lệ");
            }
Optional<BaiDangTimPhongDTO> post = baiDangTimPhongService.findById(id);
            if (post.isPresent()) {
                return ResponseEntity.ok(post.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Không tìm thấy bài đăng với ID: " + id);
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi tìm bài đăng: " + e.getMessage());
        }
    }

    @PostMapping("createpost")
    @PreAuthorize("hasAnyRole('NGUOI_THUE','QUAN_TRI_VIEN')")
    public ResponseEntity<?> createPost(
            @Valid @RequestBody BaiDangTimPhongDTO baiDangTimPhongDTO,
            BindingResult result) {
        try {
            if (result.hasErrors()) {
                List<String> errorMessages = result.getFieldErrors()
                        .stream()
                        .map(FieldError::getDefaultMessage)
                        .toList();
                return ResponseEntity.badRequest().body(errorMessages);
            }

            if (baiDangTimPhongDTO.getGiaThapNhat() != null &&
                    baiDangTimPhongDTO.getGiaCaoNhat() != null) {
                if (baiDangTimPhongDTO.getGiaThapNhat().compareTo(baiDangTimPhongDTO.getGiaCaoNhat()) > 0) {
                    return ResponseEntity.badRequest()
                            .body("Giá thấp nhất không được lớn hơn giá cao nhất");
                }
            }

            if (baiDangTimPhongDTO.getUserId() == null || baiDangTimPhongDTO.getUserId() <= 0) {
                return ResponseEntity.badRequest().body("ID người dùng không hợp lệ");
            }

            // Debug log
            System.out.println("DEBUG - Creating post with userId: " + baiDangTimPhongDTO.getUserId());

            baiDangTimPhongService.createPost(baiDangTimPhongDTO);
            return ResponseEntity.ok("Tạo bài viết thành công");

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Không tìm thấy người dùng") ||
                    e.getMessage().contains("Không tìm thấy user")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi tạo bài đăng: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("{id}")
    public ResponseEntity<?> deletePost(@PathVariable Integer id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().body("ID bài đăng không hợp lệ");
            }
baiDangTimPhongService.deletePost(id);
            return ResponseEntity.ok("Xóa bài viết thành công");

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Không tìm thấy bài đăng")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi xóa bài đăng: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("{id}")
    public ResponseEntity<?> updatePost(
            @PathVariable Integer id,
            @Valid @RequestBody BaiDangTimPhongDTO baiDangTimPhongDTO,
            BindingResult result) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().body("ID bài đăng không hợp lệ");
            }

            if (result.hasErrors()) {
                List<String> errorMessages = result.getFieldErrors()
                        .stream()
                        .map(FieldError::getDefaultMessage)
                        .toList();
                return ResponseEntity.badRequest().body(errorMessages);
            }

            if (baiDangTimPhongDTO.getGiaThapNhat() != null &&
                    baiDangTimPhongDTO.getGiaCaoNhat() != null) {
                if (baiDangTimPhongDTO.getGiaThapNhat().compareTo(baiDangTimPhongDTO.getGiaCaoNhat()) > 0) {
                    return ResponseEntity.badRequest()
                            .body("Giá thấp nhất không được lớn hơn giá cao nhất");
                }
            }

            baiDangTimPhongService.updatePost(id, baiDangTimPhongDTO);
            return ResponseEntity.ok("Cập nhật bài đăng thành công");

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Không tìm thấy")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi cập nhật bài đăng: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}