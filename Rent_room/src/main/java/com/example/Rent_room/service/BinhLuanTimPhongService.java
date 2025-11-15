package com.example.Rent_room.service;

import com.example.Rent_room.dto.CommentRequestDTO;
import com.example.Rent_room.dto.CommentResponseDTO;
import com.example.Rent_room.entity.BinhLuanTimPhong;
import com.example.Rent_room.entity.BaiDangTimPhongEntity;
import com.example.Rent_room.entity.User;
import com.example.Rent_room.respository.BinhLuanTimPhongRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BinhLuanTimPhongService {

    @Autowired
    private BinhLuanTimPhongRepository binhLuanTimPhongRepository;


    @Transactional(readOnly = true)
    public List<CommentResponseDTO> getCommentsByBaiDang(Integer baiDangId) {
        List<BinhLuanTimPhong> mainComments = binhLuanTimPhongRepository
                .findByBaiDangTimPhongIdAndBinhLuanChaIsNull(baiDangId);
        return mainComments.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentResponseDTO addComment(Integer baiDangId, Integer userId, CommentRequestDTO request) {
        BinhLuanTimPhong comment = new BinhLuanTimPhong();

        User user = new User();
        user.setId(userId);
        comment.setUser(user);

        BaiDangTimPhongEntity baiDang = new BaiDangTimPhongEntity();
        baiDang.setId(baiDangId);
        comment.setBaiDangTimPhong(baiDang);

        comment.setNoiDung(request.getNoiDung());

        if (request.getIdBinhLuanCha() != null && request.getIdBinhLuanCha() > 0) {
            BinhLuanTimPhong parentComment = binhLuanTimPhongRepository
                    .findById(request.getIdBinhLuanCha())
                    .orElse(null);
            comment.setBinhLuanCha(parentComment);
        }

        BinhLuanTimPhong saved = binhLuanTimPhongRepository.save(comment);
        return convertToResponseDTO(saved);
    }

    @Transactional
    public CommentResponseDTO updateComment(Integer commentId, CommentRequestDTO request) {
        BinhLuanTimPhong comment = binhLuanTimPhongRepository
                .findById(commentId)
                .orElseThrow(() -> new RuntimeException("Bình luận không tồn tại với ID: " + commentId));

        comment.setNoiDung(request.getNoiDung());

        BinhLuanTimPhong updated = binhLuanTimPhongRepository.save(comment);
        return convertToResponseDTO(updated);
    }

    @Transactional
    public void deleteComment(Integer commentId) {
        BinhLuanTimPhong comment = binhLuanTimPhongRepository
                .findById(commentId)
                .orElseThrow(() -> new RuntimeException("Bình luận không tồn tại với ID: " + commentId));

        binhLuanTimPhongRepository.deleteById(commentId);
    }

    @Transactional(readOnly = true)
    public CommentResponseDTO getCommentById(Integer commentId) {
        BinhLuanTimPhong comment = binhLuanTimPhongRepository
                .findById(commentId)
                .orElseThrow(() -> new RuntimeException("Bình luận không tồn tại với ID: " + commentId));
        return convertToResponseDTO(comment);
    }

    private CommentResponseDTO convertToResponseDTO(BinhLuanTimPhong comment) {
        CommentResponseDTO dto = new CommentResponseDTO();
        dto.setId(comment.getId());
        dto.setNoiDung(comment.getNoiDung());
        dto.setNgayTao(comment.getNgayTao());
        dto.setNgayCapNhat(comment.getNgayCapNhat());

        if (comment.getUser() != null) {
            dto.setUserId(comment.getUser().getId());
            dto.setFullname(comment.getUser().getFullname());
            dto.setAvatar(comment.getUser().getAvatar());
        }

        if (comment.getBaiDangTimPhong() != null) {
            dto.setBaiDangId(comment.getBaiDangTimPhong().getId());
        }

        if (comment.getBinhLuanCha() != null) {
            dto.setIdBinhLuanCha(comment.getBinhLuanCha().getId());
        }

        if (comment.getBinhLuanCon() != null && !comment.getBinhLuanCon().isEmpty()) {
            dto.setBinhLuanCon(comment.getBinhLuanCon().stream()
                    .map(this::convertToResponseDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }
}
