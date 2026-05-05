package com.example.Rent_room.service;

import com.example.Rent_room.dto.CommentRequestDTO;
import com.example.Rent_room.dto.CommentResponseDTO;
import com.example.Rent_room.entity.BinhLuanChoThue;
import com.example.Rent_room.entity.BaiDangChoThue;
import com.example.Rent_room.entity.User;
import com.example.Rent_room.repository.BinhLuanChoThueRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BinhLuanChoThueService {

    @Autowired
    private BinhLuanChoThueRepository binhLuanChoThueRepository;


    @Transactional(readOnly = true)
    public List<CommentResponseDTO> getCommentsByBaiDang(Integer baiDangId) {
        List<BinhLuanChoThue> mainComments = binhLuanChoThueRepository
                .findByBaiDangChoThueIdAndBinhLuanChaIsNull(baiDangId);
        return mainComments.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentResponseDTO addComment(Integer baiDangId, Integer userId, CommentRequestDTO request) {
        BinhLuanChoThue comment = new BinhLuanChoThue();

        User user = new User();
        user.setId(userId);
        comment.setUser(user);

        BaiDangChoThue baiDang = new BaiDangChoThue();
        baiDang.setId(baiDangId);
        comment.setBaiDangChoThue(baiDang);

        comment.setNoiDung(request.getNoiDung());
        comment.setDanhGiaSao(request.getDanhGiaSao());

        if (request.getIdBinhLuanCha() != null && request.getIdBinhLuanCha() > 0) {
            BinhLuanChoThue parentComment = binhLuanChoThueRepository
                    .findById(request.getIdBinhLuanCha())
                    .orElse(null);
            comment.setBinhLuanCha(parentComment);
        }

        BinhLuanChoThue saved = binhLuanChoThueRepository.save(comment);
        return convertToResponseDTO(saved);
    }

    @Transactional
    public CommentResponseDTO updateComment(Integer commentId, CommentRequestDTO request) {
        BinhLuanChoThue comment = binhLuanChoThueRepository
                .findById(commentId)
                .orElseThrow(() -> new RuntimeException("Bình luận không tồn tại với ID: " + commentId));

        checkOwnership(comment);

        comment.setNoiDung(request.getNoiDung());
        if (request.getDanhGiaSao() != null) {
            comment.setDanhGiaSao(request.getDanhGiaSao());
        }

        BinhLuanChoThue updated = binhLuanChoThueRepository.save(comment);
        return convertToResponseDTO(updated);
    }

    @Transactional
    public void deleteComment(Integer commentId) {
        BinhLuanChoThue comment = binhLuanChoThueRepository
                .findById(commentId)
                .orElseThrow(() -> new RuntimeException("Bình luận không tồn tại với ID: " + commentId));

        checkOwnership(comment);

        binhLuanChoThueRepository.deleteById(commentId);
    }

    private void checkOwnership(BinhLuanChoThue comment) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!comment.getUser().getId().equals(currentUser.getId())
                && !currentUser.getRole().equals(User.Role.quan_tri_vien)) {
            throw new AccessDeniedException("Bạn không có quyền thao tác bình luận này");
        }
    }

    @Transactional(readOnly = true)
    public CommentResponseDTO getCommentById(Integer commentId) {
        BinhLuanChoThue comment = binhLuanChoThueRepository
                .findById(commentId)
                .orElseThrow(() -> new RuntimeException("Bình luận không tồn tại với ID: " + commentId));
        return convertToResponseDTO(comment);
    }

    private CommentResponseDTO convertToResponseDTO(BinhLuanChoThue comment) {
        CommentResponseDTO dto = new CommentResponseDTO();
        dto.setId(comment.getId());
        dto.setNoiDung(comment.getNoiDung());
        dto.setDanhGiaSao(comment.getDanhGiaSao());
        dto.setNgayTao(comment.getNgayTao());
        dto.setNgayCapNhat(comment.getNgayCapNhat());

        if (comment.getUser() != null) {
            dto.setUserId(comment.getUser().getId());
            dto.setFullname(comment.getUser().getFullname());
            dto.setAvatar(comment.getUser().getAvatar());
        }

        if (comment.getBaiDangChoThue() != null) {
            dto.setBaiDangId(comment.getBaiDangChoThue().getId());
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