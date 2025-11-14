package com.example.Rent_room.controller;

import com.example.Rent_room.dto.BaiDangTimPhongDTO;
import com.example.Rent_room.service.BaiDangTimPhongService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/baidangtimphong/")
@RequiredArgsConstructor
public class BaiDangTimPhongController {
    private final BaiDangTimPhongService baiDangTimPhongService;

    @GetMapping
    public ResponseEntity<?> findAllPost() {
        try {
            List<BaiDangTimPhongDTO> posts = baiDangTimPhongService.findAll();
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi lấy danh sách bài đăng: " + e.getMessage());
        }
    }

    @GetMapping("{id}")
    public ResponseEntity<?> findByPostId(@PathVariable Integer id){
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


    @GetMapping("user/{id}")
    public ResponseEntity<?> findByUser_Id(@PathVariable Integer id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().body("ID người dùng không hợp lệ");
            }
            List<BaiDangTimPhongDTO> posts = baiDangTimPhongService.findByUser_Id(id);
            return ResponseEntity.ok(posts);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi tìm bài đăng theo user: " + e.getMessage());
        }
    }

    @GetMapping("khuvuc/{thanhPho}/{xa}")
    public ResponseEntity<?> findByKhuVuc(@PathVariable String thanhPho,
                                          @PathVariable String xa) {
        try {
            if (thanhPho == null || thanhPho.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Tên thành phố không được để trống");
            }
            if (xa == null || xa.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Tên xã/phường không được để trống");
            }
            List<BaiDangTimPhongDTO> posts = baiDangTimPhongService.findByKhuVuc(xa, thanhPho);
            return ResponseEntity.ok(posts);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi tìm bài đăng theo khu vực: " + e.getMessage());
        }
    }

    @GetMapping("min/{costMin}/max/{costMax}")
    public ResponseEntity<?> findByRangeCost(@PathVariable BigDecimal costMin,
                                             @PathVariable BigDecimal costMax) {
        try {
            if (costMin == null || costMax == null) {
                return ResponseEntity.badRequest().body("Giá tối thiểu và tối đa không được để trống");
            }
            if (costMin.compareTo(BigDecimal.ZERO) < 0 || costMax.compareTo(BigDecimal.ZERO) < 0) {
                return ResponseEntity.badRequest().body("Giá không được âm");
            }
            if (costMin.compareTo(costMax) > 0) {
                return ResponseEntity.badRequest().body("Giá tối thiểu không được lớn hơn giá tối đa");
            }
            List<BaiDangTimPhongDTO> posts = baiDangTimPhongService.findByRangCost(costMin, costMax);
            return ResponseEntity.ok(posts);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi tìm bài đăng theo khoảng giá: " + e.getMessage());
        }
    }

    @GetMapping("min/{costMin}")
    public ResponseEntity<?> findByGreater(@PathVariable BigDecimal costMin) {
        try {
            if (costMin == null) {
                return ResponseEntity.badRequest().body("Giá tối thiểu không được để trống");
            }
            if (costMin.compareTo(BigDecimal.ZERO) < 0) {
                return ResponseEntity.badRequest().body("Giá tối thiểu không được âm");
            }
            List<BaiDangTimPhongDTO> posts = baiDangTimPhongService.findByGreater(costMin);
            return ResponseEntity.ok(posts);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi tìm bài đăng theo giá tối thiểu: " + e.getMessage());
        }
    }

    @GetMapping("max/{costMax}")
    public ResponseEntity<?> findByLower(@PathVariable BigDecimal costMax) {
        try {
            if (costMax == null) {
                return ResponseEntity.badRequest().body("Giá tối đa không được để trống");
            }
            if (costMax.compareTo(BigDecimal.ZERO) < 0) {
                return ResponseEntity.badRequest().body("Giá tối đa không được âm");
            }
            List<BaiDangTimPhongDTO> posts = baiDangTimPhongService.findByLower(costMax);
            return ResponseEntity.ok(posts);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi tìm bài đăng theo giá tối đa: " + e.getMessage());
        }
    }

    @PostMapping("createpost")
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
