package com.example.Rent_room.controller;

import com.example.Rent_room.entity.HinhAnhPhongTro;
import com.example.Rent_room.service.HinhAnhPhongTroService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/hinhanh")
public class HinhAnhPhongTroController {

    private final HinhAnhPhongTroService hinhAnhPhongTroService;

    public HinhAnhPhongTroController(HinhAnhPhongTroService hinhAnhPhongTroService) {
        this.hinhAnhPhongTroService = hinhAnhPhongTroService;
    }

    @GetMapping
    public List<HinhAnhPhongTro> getAll() {
        return hinhAnhPhongTroService.getAll();
    }

    @GetMapping("/{id}")
    public Optional<HinhAnhPhongTro> getById(@PathVariable Integer id) {
        return hinhAnhPhongTroService.getById(id);
    }

    @GetMapping("/baidang/{baiDangId}")
    public List<HinhAnhPhongTro> getByBaiDangId(@PathVariable Integer baiDangId) {
        return hinhAnhPhongTroService.getByBaiDangId(baiDangId);
    }

    @GetMapping("/thumbnail/{baiDangId}")
    public HinhAnhPhongTro getThumbnail(@PathVariable Integer baiDangId) {
        return hinhAnhPhongTroService.getThumbnailByBaiDangId(baiDangId);
    }

    @PostMapping
    public HinhAnhPhongTro create(@RequestBody HinhAnhPhongTro hinhAnh) {
        return hinhAnhPhongTroService.save(hinhAnh);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        hinhAnhPhongTroService.deleteById(id);
    }
}
