package com.example.Rent_room.controller;

import com.example.Rent_room.dto.CommentRequestDTO;
import com.example.Rent_room.dto.CommentResponseDTO;
import com.example.Rent_room.entity.User;
import com.example.Rent_room.service.BinhLuanTimPhongService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/baidangtimphong")
@CrossOrigin(origins = "*", maxAge = 3600)
public class BinhLuanTimPhongController {

    @Autowired
    private BinhLuanTimPhongService binhLuanTimPhongService;

    @GetMapping("/{id}/binh-luan")
    public List<CommentResponseDTO> getCommentsByBaiDang(@PathVariable Integer id) {
        return binhLuanTimPhongService.getCommentsByBaiDang(id);
    }
    
    @PostMapping("/{id}/binh-luan")
    public CommentResponseDTO addComment(
            @PathVariable Integer id,
            @Valid @RequestBody CommentRequestDTO request) { 
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return binhLuanTimPhongService.addComment(id, user.getId(), request);
    }
   
    @PutMapping("/binh-luan/{id}")
    public CommentResponseDTO updateComment(
            @PathVariable Integer id,
            @Valid @RequestBody CommentRequestDTO request) {
        
        return binhLuanTimPhongService.updateComment(id, request);
    }
    
    @DeleteMapping("/binh-luan/{id}")
    public void deleteComment(@PathVariable Integer id) {
        binhLuanTimPhongService.deleteComment(id);
    }
}
