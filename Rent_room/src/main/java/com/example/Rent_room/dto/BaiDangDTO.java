package com.example.Rent_room.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BaiDangDTO {

    private Integer id;

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(min = 5, max = 255, message = "Tiêu đề phải từ 5 đến 255 ký tự")
    private String tieuDe;

    @NotBlank(message = "Mô tả không được để trống")
    @Size(min = 10, max = 5000, message = "Mô tả phải từ 10 đến 5000 ký tự")
    private String moTa;

    @NotBlank(message = "Địa chỉ không được để trống")
    private String diaChiDayDu;

    @NotBlank(message = "Phường/xã không được để trống")
    private String phuongXa;

    @NotBlank(message = "Tỉnh/thành phố không được để trống")
    private String tinhThanhpho;

    @NotNull(message = "Vĩ độ không được để trống")
    @DecimalMin(value = "-90.0", message = "Vĩ độ phải từ -90 đến 90")
    @DecimalMax(value = "90.0", message = "Vĩ độ phải từ -90 đến 90")
    private Double viDo;

    @NotNull(message = "Kinh độ không được để trống")
    @DecimalMin(value = "-180.0", message = "Kinh độ phải từ -180 đến 180")
    @DecimalMax(value = "180.0", message = "Kinh độ phải từ -180 đến 180")
    private Double kinhDo;

    @NotNull(message = "Giá thuê không được để trống")
    @Positive(message = "Giá thuê phải là số dương")
    private Double giaThang;

    @NotNull(message = "Diện tích không được để trống")
    @Positive(message = "Diện tích phải là số dương")
    private Float dienTichM2;

    @NotBlank(message = "Trạng thái không được để trống")
    @Pattern(regexp = "^(con_phong|het_phong|pending)$", message = "Trạng thái phải là: con_phong, het_phong hoặc pending")
    private String trangThai;

    @NotNull(message = "Ngày có thể vào ở không được để trống")
    private LocalDateTime ngayCoTheVaoO;

    private Integer idNguoiDang;
    private LocalDateTime ngayDang;
    private LocalDateTime ngayCapNhat;
}
