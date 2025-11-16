package com.example.Rent_room.controller;

import com.example.Rent_room.dto.BaiDangOutputDTO;
import com.example.Rent_room.dto.PaginationResponseDTO;
import com.example.Rent_room.entity.UserTracking;
import com.example.Rent_room.service.UserTrackingService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;


@RestController
@RequestMapping("/api/usertracking")
public class UserTrackingController {
    @Autowired
    private UserTrackingService userTrackingService;
    
    @PostMapping
    public ResponseEntity<UserTracking> create(@RequestBody UserTracking tracking) {
        UserTracking savedTracking = userTrackingService.createTracking(tracking);
        return new ResponseEntity<>(savedTracking, HttpStatus.CREATED);
    }

    @GetMapping("/islove/{user_id}/{bai_dang_id}")
    public ResponseEntity<HashMap<String, Object>> isLove(
            @PathVariable Integer user_id, 
            @PathVariable Integer bai_dang_id) {
        HashMap<String, Object> response = new HashMap<>();
        boolean isLoved = userTrackingService.isLove(user_id, bai_dang_id);
        response.put("isLove", isLoved);
        response.put("userId", user_id);
        response.put("baiDangId", bai_dang_id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/deletelove/{user_id}/{bai_dang_id}")
    public ResponseEntity<HashMap<String, Object>> deleteLove(
        @PathVariable Integer user_id, 
        @PathVariable Integer bai_dang_id) {
        HashMap<String, Object> response = new HashMap<>();
        boolean success = userTrackingService.unlikePost(user_id, bai_dang_id);
        response.put("success", success);
        response.put("message", success ? "Unlike successful" : "Failed to unlike");
        return ResponseEntity.ok(response);
    }
    

    @GetMapping("/liked/{user_id}")
    public PaginationResponseDTO<BaiDangOutputDTO> getLikedPosts(
            @PathVariable Integer user_id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return userTrackingService.getLikedPosts(user_id, page, size);
    }
}
