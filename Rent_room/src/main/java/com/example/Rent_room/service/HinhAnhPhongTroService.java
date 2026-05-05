package com.example.Rent_room.service;

import com.example.Rent_room.entity.BaiDangChoThue;
import com.example.Rent_room.entity.HinhAnhPhongTro;
import com.example.Rent_room.repository.HinhAnhPhongTroRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

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

    private static final List<String> ALLOWED_EXTENSIONS = List.of("jpg", "jpeg", "png", "webp", "gif");
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File rỗng");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File vượt quá 5MB");
        }
        String originalName = file.getOriginalFilename();
        if (originalName == null || !originalName.contains(".")) {
            throw new IllegalArgumentException("File không hợp lệ");
        }
        String ext = originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("Chỉ chấp nhận file ảnh: " + ALLOWED_EXTENSIONS);
        }
    }

    private String getExtension(MultipartFile file) {
        String originalName = file.getOriginalFilename();
        return originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase();
    }

    public String saveImage(MultipartFile file, Integer baiDangId, boolean laAnhBia) throws IOException {
        validateFile(file);

        String uploadDir = "uploads/";
        File dir = new File(uploadDir);
        if (!dir.exists()) dir.mkdirs();

        String fileName = UUID.randomUUID() + "." + getExtension(file);
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
        String uploadDir = "uploads/";
        
        File dir = new File(uploadDir);
        if (!dir.exists()) dir.mkdirs();

        for(MultipartFile file : files){
            if (file.isEmpty()) continue;
            validateFile(file);
            
            String newFileName = UUID.randomUUID() + "." + getExtension(file);
            Path filePaths = Paths.get(uploadDir + newFileName);
            Files.write(filePaths, file.getBytes());

            String imageUrl = "/uploads/" + newFileName;

            HinhAnhPhongTro img = new HinhAnhPhongTro();
            img.setBaiDangChoThue(new BaiDangChoThue(baiDangId));
            img.setDuong_dan_anh(imageUrl);
            img.setLaAnhBia(false);

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