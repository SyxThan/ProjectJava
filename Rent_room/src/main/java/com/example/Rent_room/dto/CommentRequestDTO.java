package com.example.Rent_room.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.validation.constraints.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CommentRequestDTO {

    @NotBlank(message = "Nội dung comment không được để trống")
    @Size(min = 1, max = 5000, message = "Nội dung phải từ 1 đến 5000 ký tự")
    private String noiDung;

    @Min(value = 1, message = "Đánh giá sao phải từ 1 đến 5")
    @Max(value = 5, message = "Đánh giá sao phải từ 1 đến 5")
    private Integer danhGiaSao;

    @Min(value = 0, message = "ID bình luận cha không hợp lệ")
    private Integer idBinhLuanCha;
}
