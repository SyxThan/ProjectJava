package com.example.Rent_room.service;

import com.example.Rent_room.dto.CommentRequestDTO;
import com.example.Rent_room.dto.CommentResponseDTO;
import com.example.Rent_room.entity.BinhLuanTimPhong;
import com.example.Rent_room.entity.BaiDangTimPhongEntity;
import com.example.Rent_room.entity.User;
import com.example.Rent_room.entity.UserTracking;
import com.example.Rent_room.repository.BinhLuanTimPhongRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BinhLuanTimPhongService {

    @Autowired
    private BinhLuanTimPhongRepository binhLuanTimPhongRepository;

    @Autowired
    private UserTrackingService userTrackingService;

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

        if (userTrackingService != null) {
            userTrackingService.createTracking(new UserTracking(userId, baiDangId, "binhluan"));
        }

        return convertToResponseDTO(saved);
    }

    @Transactional
    public CommentResponseDTO updateComment(Integer commentId, CommentRequestDTO request) {
        BinhLuanTimPhong comment = binhLuanTimPhongRepository
                .findById(commentId)
                .orElseThrow(() -> new RuntimeException("Bình luận không tồn tại với ID: " + commentId));

        checkOwnership(comment);

        comment.setNoiDung(request.getNoiDung());

        BinhLuanTimPhong updated = binhLuanTimPhongRepository.save(comment);
        return convertToResponseDTO(updated);
    }

    @Transactional
    public void deleteComment(Integer commentId) {
        BinhLuanTimPhong comment = binhLuanTimPhongRepository
                .findById(commentId)
                .orElseThrow(() -> new RuntimeException("Bình luận không tồn tại với ID: " + commentId));

<<<<<<< Updated upstream
        binhLuanTimPhongRepository.delete(comment);
=======
<<<<<<< HEAD
        checkOwnership(comment);

        binhLuanTimPhongRepository.deleteById(commentId);
=======
        binhLuanTimPhongRepository.delete(comment);
>>>>>>> 51c922d34034c3cef761ca378a5ebbb8ff037b2a
    }

    private void checkOwnership(BinhLuanTimPhong comment) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!comment.getUser().getId().equals(currentUser.getId())
                && !currentUser.getRole().equals(User.Role.quan_tri_vien)) {
            throw new AccessDeniedException("Bạn không có quyền thao tác bình luận này");
        }
>>>>>>> Stashed changes
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

        // User
        if (comment.getUser() != null) {
            dto.setUserId(comment.getUser().getId());
            dto.setFullname(comment.getUser().getFullname());
            dto.setAvatar(comment.getUser().getAvatar());
        }

        // Bài đăng TÌM PHÒNG
        if (comment.getBaiDangTimPhong() != null) {
            dto.setBaiDangId(comment.getBaiDangTimPhong().getId());
        }

        // Bình luận cha
        if (comment.getBinhLuanCha() != null) {
            dto.setIdBinhLuanCha(comment.getBinhLuanCha().getId());
        }

        // Bình luận con (đệ quy)
        if (comment.getBinhLuanCon() != null && !comment.getBinhLuanCon().isEmpty()) {
            dto.setBinhLuanCon(
                comment.getBinhLuanCon().stream()
                    .map(this::convertToResponseDTO)
                    .collect(Collectors.toList())
            );
        }

        return dto;
    }

}
