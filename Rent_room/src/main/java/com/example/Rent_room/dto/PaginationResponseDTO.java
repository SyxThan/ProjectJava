package com.example.Rent_room.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class PaginationResponseDTO<T> {
    private boolean success;         // Trạng thái thành công
    private String message;          // Thông báo
    private List<T> data;           // Dữ liệu của trang hiện tại
    private PaginationInfo pagination; // Thông tin phân trang
    
    @Getter
    @Setter
    public static class PaginationInfo {
        private int currentPage;         // Trang hiện tại (bắt đầu từ 0)
        private int pageSize;            // Số lượng items mỗi trang
        private long totalItems;         // Tổng số items
        private int totalPages;          // Tổng số trang
        private boolean hasNext;         // Có trang tiếp theo không
        private boolean hasPrevious;     // Có trang trước không
        
        public PaginationInfo(int currentPage, int pageSize, long totalItems) {
            this.currentPage = currentPage;
            this.pageSize = pageSize;
            this.totalItems = totalItems;
            this.totalPages = (int) Math.ceil((double) totalItems / pageSize);
            this.hasNext = currentPage < (totalPages - 1);
            this.hasPrevious = currentPage > 0;
        }
    }

    public PaginationResponseDTO(List<T> data, int currentPage, int pageSize, long totalItems) {
        this.success = true;
        this.message = "Lấy dữ liệu thành công";
        this.data = data;
        this.pagination = new PaginationInfo(currentPage, pageSize, totalItems);
    }
    
    // Constructor cho trường hợp lỗi
    public PaginationResponseDTO(boolean success, String message) {
        this.success = success;
        this.message = message;
        this.data = List.of();
        this.pagination = new PaginationInfo(0, 0, 0);
    }
}
