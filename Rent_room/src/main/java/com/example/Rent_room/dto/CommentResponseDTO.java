package com.example.Rent_room.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.sql.Timestamp;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponseDTO {

    private Integer id;
    private String noiDung;
    private Integer danhGiaSao;
    private Timestamp ngayTao;
    private Timestamp ngayCapNhat;

    // Thông tin người bình luận
    private Integer userId;
    private String fullname;
    private String avatar;

    // Thông tin bài đăng
    private Integer baiDangId;
    private String tieuDe;

    // Bình luận con
    private List<CommentResponseDTO> binhLuanCon;

    // ID bình luận cha (nếu là comment con)
    private Integer idBinhLuanCha;
}
