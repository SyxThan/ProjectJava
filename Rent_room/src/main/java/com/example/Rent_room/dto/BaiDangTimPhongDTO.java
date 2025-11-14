package com.example.Rent_room.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.sql.Timestamp;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BaiDangTimPhongDTO {
    private Integer id;
    private Integer userId;

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(min = 5, max = 100, message = "Tiêu đề phải từ 5 đến 100 kí tự")
    private String tieuDe;

    @Size(min = 5, max = 255, message = "Mô tả phải từ 5 đến 255 kí tự")
    private String moTa;

    @NotBlank(message = "Không được để trống")
    private String khuVucMongMuonXa;

    @NotBlank(message = "Không được để trống thành phố")
    private String khuVucMongMuonThanhPho;

    @NotNull(message = "Giá thấp nhất không được để trống")
    @DecimalMin(value = "0.01", message = "Giá thấp nhất phải lớn hơn 0")
    @Digits(integer = 13, fraction = 2, message = "Giá thấp nhất không hợp lệ")
    private BigDecimal giaThapNhat;

    @NotNull(message = "Giá cao nhất không được để trống")
    @DecimalMin(value = "0.01", message = "Giá cao nhất phải lớn hơn 0")
    @Digits(integer = 13, fraction = 2, message = "Giá cao nhất không hợp lệ")
    private BigDecimal giaCaoNhat;

    @NotNull(message = "Diện tích tối thiểu không được để trống")
    @Positive(message = "Diện tích tối thiểu phải lớn hơn 0")
    private Float dienTichToiThieu;

    @Positive(message = "Số người ở phải lớn hơn 0")
    private Integer soNguoiO;

    private String trangThai;

    private Timestamp ngayDang;

    private Timestamp ngayCapNhat;
}
