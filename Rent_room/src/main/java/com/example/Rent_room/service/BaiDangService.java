package com.example.Rent_room.service;

import com.example.Rent_room.entity.BaiDangChoThue;
import com.example.Rent_room.respository.BaiDangRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class BaiDangService {

    private final BaiDangRepository baiDangRepository;

    public BaiDangService(BaiDangRepository baiDangRepository) {
        this.baiDangRepository = baiDangRepository;
    }

    public List<BaiDangChoThue> getAllBaiDang() {
        return baiDangRepository.findAll();
    }

    public Optional<BaiDangChoThue> getBaiDangById(Integer id) {
        return baiDangRepository.findById(id);
    }

    public BaiDangChoThue saveBaiDang(BaiDangChoThue baiDang) {
        return baiDangRepository.save(baiDang);
    }

    public void deleteBaiDang(Integer id) {
        baiDangRepository.deleteById(id);
    }
}
