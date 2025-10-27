package com.example.Rent_room.service;

import com.example.Rent_room.entity.HinhAnhPhongTro;
import com.example.Rent_room.respository.HinhAnhPhongTroRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class HinhAnhPhongTroService {

    private final HinhAnhPhongTroRepository hinhAnhPhongTroRepository;

    public HinhAnhPhongTroService(HinhAnhPhongTroRepository hinhAnhPhongTroRepository) {
        this.hinhAnhPhongTroRepository = hinhAnhPhongTroRepository;
    }

    // Lấy tất cả ảnh
    public List<HinhAnhPhongTro> getAll(){
        return hinhAnhPhongTroRepository.findAll();
    }

    // Lấy ảnh theo bài đăng
    public List<HinhAnhPhongTro> getByBaiDangId(Integer baiDangId){
        return hinhAnhPhongTroRepository.findByBaiDangChoThueId(baiDangId);
    }

    // Sửa lại tên phương thức cho đúng với tên trong repository
    public HinhAnhPhongTro getThumbnailByBaiDangId(Integer baiDangId){
        return hinhAnhPhongTroRepository.findFirstByBaiDangChoThueIdAndLa_anh_biaTrue(baiDangId);
    }

    // Lấy ảnh theo ID
    public Optional<HinhAnhPhongTro> getById(Integer id){
        return hinhAnhPhongTroRepository.findById(id);
    }

    // Lưu ảnh
    public HinhAnhPhongTro save(HinhAnhPhongTro hinhAnh){
        return hinhAnhPhongTroRepository.save(hinhAnh);
    }

    // Xóa ảnh theo ID
    public void deleteById(Integer id){
        hinhAnhPhongTroRepository.deleteById(id);
    }
}
