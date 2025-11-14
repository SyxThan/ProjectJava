package com.example.Rent_room.service;

import com.example.Rent_room.dto.BaiDangTimPhongDTO;
import com.example.Rent_room.entity.BaiDangTimPhongEntity;
import com.example.Rent_room.entity.TrangThaiTimPhong;
import com.example.Rent_room.entity.User;
import com.example.Rent_room.respository.BaiDangTimPhongRepository;
import com.example.Rent_room.respository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BaiDangTimPhongService {
    private final BaiDangTimPhongRepository baiDangTimPhongRepository;
    private final UserRepository userRepository;

    public List<BaiDangTimPhongDTO> findAll(){
        return baiDangTimPhongRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
    public List<BaiDangTimPhongDTO> findByUser_Id(Integer userId) {
        return baiDangTimPhongRepository.findByUser_Id(userId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<BaiDangTimPhongDTO> findByKhuVuc(String xa, String thanhPho){
        return baiDangTimPhongRepository.findByKhuVuc(xa, thanhPho)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<BaiDangTimPhongDTO> findByRangCost(BigDecimal min, BigDecimal max){
        return baiDangTimPhongRepository.findByRangCost(min, max)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<BaiDangTimPhongDTO> findByLower(BigDecimal max){
        return baiDangTimPhongRepository.findByLower(max)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());

    }

    public List<BaiDangTimPhongDTO> findByGreater(BigDecimal min){
        return baiDangTimPhongRepository.findByGreater(min)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public Optional<BaiDangTimPhongDTO> findById(Integer id){
        return  baiDangTimPhongRepository.findById(id)
                .map(this::toDto);
    }

    public void createPost(BaiDangTimPhongDTO baiDangTimPhongDTO) {
        if (baiDangTimPhongDTO.getGiaThapNhat().compareTo(baiDangTimPhongDTO.getGiaCaoNhat()) > 0) {
            throw new IllegalArgumentException("Giá thấp nhất phải nhỏ hơn giá cao nhất");
        }

        if (baiDangTimPhongDTO.getGiaThapNhat().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Giá phải lớn hơn 0");
        }

        BaiDangTimPhongEntity post = new BaiDangTimPhongEntity();
        User user = userRepository.findById(baiDangTimPhongDTO.getUserId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user với ID: " + baiDangTimPhongDTO.getUserId()));;
        post.setUser(user);
        post.setTieuDe(baiDangTimPhongDTO.getTieuDe());
        post.setMoTa(baiDangTimPhongDTO.getMoTa());
        post.setKhuVucMongMuonXa(baiDangTimPhongDTO.getKhuVucMongMuonXa());
        post.setKhuVucMongMuonThanhPho(baiDangTimPhongDTO.getKhuVucMongMuonThanhPho());
        post.setGiaThapNhat(baiDangTimPhongDTO.getGiaThapNhat());
        post.setGiaCaoNhat(baiDangTimPhongDTO.getGiaCaoNhat());
        post.setDienTichToiThieu(baiDangTimPhongDTO.getDienTichToiThieu());
        post.setSoNguoiO(baiDangTimPhongDTO.getSoNguoiO());
        post.setTrangThaiTimPhong(TrangThaiTimPhong.dang_tim);
        baiDangTimPhongRepository.save(post);
    }

    public void deletePost(Integer id){
        if (!baiDangTimPhongRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy bài đăng với ID: " + id);
        }
        baiDangTimPhongRepository.deleteById(id);
    }

    public void updatePost(Integer id, BaiDangTimPhongDTO baiDangTimPhongDTO){
        BaiDangTimPhongEntity post = baiDangTimPhongRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng với ID: " + id));

        if (baiDangTimPhongDTO.getGiaThapNhat().compareTo(baiDangTimPhongDTO.getGiaCaoNhat()) > 0) {
            throw new IllegalArgumentException("Giá thấp nhất phải nhỏ hơn giá cao nhất");
        }

        if (baiDangTimPhongDTO.getGiaThapNhat().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Giá phải lớn hơn 0");
        }

        post.setTieuDe(baiDangTimPhongDTO.getTieuDe());
        post.setMoTa(baiDangTimPhongDTO.getMoTa());
        post.setKhuVucMongMuonXa(baiDangTimPhongDTO.getKhuVucMongMuonXa());
        post.setKhuVucMongMuonThanhPho(baiDangTimPhongDTO.getKhuVucMongMuonThanhPho());
        post.setGiaThapNhat(baiDangTimPhongDTO.getGiaThapNhat());
        post.setGiaCaoNhat(baiDangTimPhongDTO.getGiaCaoNhat());
        post.setDienTichToiThieu(baiDangTimPhongDTO.getDienTichToiThieu());
        post.setSoNguoiO(baiDangTimPhongDTO.getSoNguoiO());

        if (baiDangTimPhongDTO.getUserId() != null &&
                !post.getUser().getId().equals(baiDangTimPhongDTO.getUserId())) {
            User user = userRepository.findById(baiDangTimPhongDTO.getUserId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy user với ID: " + baiDangTimPhongDTO.getUserId()));
            post.setUser(user);
        }
        baiDangTimPhongRepository.save(post);
    }
    private BaiDangTimPhongDTO toDto(BaiDangTimPhongEntity entity) {
        return new BaiDangTimPhongDTO(
                entity.getId(),
                entity.getUser().getId(),
                entity.getTieuDe(),
                entity.getMoTa(),
                entity.getKhuVucMongMuonXa(),
                entity.getKhuVucMongMuonThanhPho(),
                entity.getGiaThapNhat(),
                entity.getGiaCaoNhat(),
                entity.getDienTichToiThieu(),
                entity.getSoNguoiO(),
                entity.getTrangThaiTimPhong() != null ? entity.getTrangThaiTimPhong().name() : null,
                entity.getNgayDang(),
                entity.getNgayCapNhat());
    }
}
