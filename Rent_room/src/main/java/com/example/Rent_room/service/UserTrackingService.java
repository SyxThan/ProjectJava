package com.example.Rent_room.service;

import com.example.Rent_room.entity.UserTracking;
import com.example.Rent_room.dto.BaiDangOutputDTO;
import com.example.Rent_room.dto.PaginationResponseDTO;
import com.example.Rent_room.entity.BaiDangChoThue;
import com.example.Rent_room.respository.UserTrackingRepository;
import com.example.Rent_room.respository.HinhAnhPhongTroRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserTrackingService {
    @Autowired
    private UserTrackingRepository userTrackingRepository;
    
    @Autowired
    private HinhAnhPhongTroRepository hinhAnhRepository;
    
    public UserTracking createTracking(UserTracking tracking) {
        return userTrackingRepository.save(tracking);
    }

    public boolean isLove(Integer user_id, Integer bai_dang_id) {
        List<UserTracking> trackingOptional = userTrackingRepository.isLove(user_id, bai_dang_id);
        return trackingOptional.size() > 0;
    }
    
    public boolean unlikePost(Integer userId, Integer baiDangId) {
        int rowsDeleted = userTrackingRepository.deleteLike(userId, baiDangId);
        return rowsDeleted > 0;
    }
    
    // Lấy danh sách bài đăng đã thích với phân trang
    public PaginationResponseDTO<BaiDangOutputDTO> getLikedPosts(Integer userId, int page, int size) {
        try {
            // Validate input
            if (page < 0) page = 0;
            if (size < 1 || size > 100) size = 20;
            
            // Lấy tất cả bài đăng đã thích từ repository
            List<BaiDangChoThue> allLikedPosts = userTrackingRepository.listLike(userId);
            
            // Tính toán phân trang
            long totalItems = allLikedPosts.size();
            int offset = page * size;
            
            // Cắt list theo page và size
            List<BaiDangChoThue> pageData;
            if (offset >= allLikedPosts.size()) {
                pageData = List.of();
            } else {
                int toIndex = Math.min(offset + size, allLikedPosts.size());
                pageData = allLikedPosts.subList(offset, toIndex);
            }
            
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
}