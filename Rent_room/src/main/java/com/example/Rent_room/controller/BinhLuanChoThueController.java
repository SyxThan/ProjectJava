package com.example.Rent_room.controller;

import com.example.Rent_room.dto.CommentRequestDTO;
import com.example.Rent_room.dto.CommentResponseDTO;
import com.example.Rent_room.service.BinhLuanChoThueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/bai-dang-cho-thue")
@CrossOrigin(origins = "*", maxAge = 3600)
public class BinhLuanChoThueController {

    @Autowired
    private BinhLuanChoThueService binhLuanChoThueService;

    @GetMapping("/{id}/binh-luan")
    public List<CommentResponseDTO> getCommentsByBaiDang(@PathVariable Integer id) {
        return binhLuanChoThueService.getCommentsByBaiDang(id);
    }
    
    @PostMapping("/{id}/binh-luan")
    public CommentResponseDTO addComment(
            @PathVariable Integer id,
            @Valid @RequestBody CommentRequestDTO request,
            @RequestHeader(name = "userId") Integer userId) { 
        
        return binhLuanChoThueService.addComment(id, userId, request);
    }
   
    @PutMapping("/binh-luan/{id}")
    public CommentResponseDTO updateComment(
            @PathVariable Integer id,
            @Valid @RequestBody CommentRequestDTO request) {
        
        return binhLuanChoThueService.updateComment(id, request);
    }
    
    @DeleteMapping("/binh-luan/{id}")
    public void deleteComment(@PathVariable Integer id) {
        binhLuanChoThueService.deleteComment(id);
    }
}