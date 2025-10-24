package com.example.Rent_room.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SearchFilterDTO {

    private String keyword;
    private String tinhThanhpho;
    private String phuongXa;
    private Double giaMin;
    private Double giaMax;
    private Float dienTichMin;
    private Float dienTichMax;
    private String trangThai;
    private Integer page = 0;
    private Integer pageSize = 10;
    private String sortBy = "ngayDang";
    private String sortDirection = "desc";
}
