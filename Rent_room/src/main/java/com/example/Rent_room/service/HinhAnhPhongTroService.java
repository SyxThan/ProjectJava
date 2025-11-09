package com.example.Rent_room.service;

import com.example.Rent_room.entity.BaiDangChoThue;
import com.example.Rent_room.entity.HinhAnhPhongTro;
import com.example.Rent_room.respository.HinhAnhPhongTroRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import java.nio.file.*;
import java.io.File;
import java.io.IOException;

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
        return hinhAnhPhongTroRepository.findFirstByBaiDangChoThueIdAndLaAnhBiaTrue(baiDangId);
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

    public String saveImage(MultipartFile file, Integer baiDangId, boolean laAnhBia) throws IOException {
        String uploadDir = "uploads/";
        File dir = new File(uploadDir);
        if (!dir.exists()) dir.mkdirs();

        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path path = Paths.get(uploadDir + fileName);
        Files.write(path, file.getBytes());

        HinhAnhPhongTro hinh = new HinhAnhPhongTro();
        hinh.setDuong_dan_anh("/uploads/" + fileName);
        hinh.setLaAnhBia(laAnhBia);

        BaiDangChoThue baiDang = new BaiDangChoThue();
        baiDang.setId(baiDangId);
        hinh.setBaiDangChoThue(baiDang);

        hinhAnhPhongTroRepository.save(hinh);

        return "/uploads/" + fileName;
    }


    public List<HinhAnhPhongTro> uploadAnh(Integer baiDangId, MultipartFile[] files) throws Exception{
        List<HinhAnhPhongTro> listAnh = new ArrayList<>();
        String uploadDir = "src/main/resources/upload/";

        Files.createDirectories(Paths.get(uploadDir));

        for(MultipartFile file : files){
            String newFileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path filePaths = Paths.get(uploadDir + newFileName);
            Files.write(filePaths, file.getBytes());

            String imageUrl = "http://localhost:8080/uploads/" + newFileName;

            HinhAnhPhongTro img = new HinhAnhPhongTro();
            img.setBaiDangChoThue(new BaiDangChoThue(baiDangId)); // Gắn va bài đăng
            img.setDuong_dan_anh(imageUrl);
            img.setLaAnhBia(false); // mặc định chưa là ảnh bìa

            listAnh.add(hinhAnhPhongTroRepository.save(img));
        }

        return listAnh;
    }
    public HinhAnhPhongTro setThumbnail(Integer anhId) {
        HinhAnhPhongTro img = hinhAnhPhongTroRepository.findById(anhId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ảnh"));

        // Tắt tất cả ảnh bìa khác của bài đăng
        List<HinhAnhPhongTro> list = hinhAnhPhongTroRepository.findByBaiDangChoThueId(
                img.getBaiDangChoThue().getId()
        );

        for (HinhAnhPhongTro i : list) {
            i.setLaAnhBia(false);
            hinhAnhPhongTroRepository.save(i);
        }

        img.setLaAnhBia(true);
        return hinhAnhPhongTroRepository.save(img);
    }
}