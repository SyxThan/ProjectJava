package com.example.Rent_room.controller;

import com.example.Rent_room.entity.BaiDangChoThue;
import com.example.Rent_room.service.BaiDangService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/baidang")
public class BaiDangController {

    private final BaiDangService baiDangService;

    public BaiDangController(BaiDangService baiDangService) {
        this.baiDangService = baiDangService;
    }

    @GetMapping
    public List<BaiDangChoThue> getAll() {
        return baiDangService.getAllBaiDang();
    }

    @GetMapping("/{id}")
    public Optional<BaiDangChoThue> getById(@PathVariable Integer id) {
        return baiDangService.getBaiDangById(id);
    }

    @PostMapping
    public BaiDangChoThue create(@RequestBody BaiDangChoThue baiDang) {
        return baiDangService.saveBaiDang(baiDang);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        baiDangService.deleteBaiDang(id);
    }
}

