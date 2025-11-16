package com.example.Rent_room.service;

import com.example.Rent_room.dto.GeocodeResponseDTO;
import com.example.Rent_room.entity.BaiDangChoThue;
import com.example.Rent_room.respository.BaiDangRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.io.IOException;

@Service
public class GeocodingService {
    
    private static final String GOOGLE_GEOCODING_API_URL = "https://maps.googleapis.com/maps/api/geocode/json";
    
    @Value("${google.maps.api.key:}")
    private String googleMapsApiKey;
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final BaiDangRepository baiDangRepository;
    
    public GeocodingService(RestTemplate restTemplate, ObjectMapper objectMapper, BaiDangRepository baiDangRepository) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.baiDangRepository = baiDangRepository;
    }
    
    /**
     * Chuyển đổi địa chỉ thành tọa độ
     */
    public GeocodeResponseDTO geocodeAddress(String address) throws IOException {
        String url = String.format("%s?address=%s&key=%s", 
            GOOGLE_GEOCODING_API_URL, address.replace(" ", "+"), googleMapsApiKey);
        
        JsonNode location = objectMapper.readTree(restTemplate.getForObject(url, String.class))
            .path("results").get(0).path("geometry").path("location");
        
        return new GeocodeResponseDTO(address, 
            location.path("lat").asDouble(), 
            location.path("lng").asDouble());
    }
    
    /**
     * Chuyển đổi địa chỉ của bài đăng thành tọa độ và lưu vào database
     */
    public GeocodeResponseDTO geocodeAndUpdateBaiDang(Integer baiDangId) throws IOException {
        BaiDangChoThue baiDang = baiDangRepository.findById(baiDangId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng với ID: " + baiDangId));
        
        String fullAddress = String.format("%s, %s, %s, Vietnam",
                baiDang.getDia_chi_day_du(), baiDang.getPhuong_xa(), baiDang.getTinh_thanhpho());
        
        GeocodeResponseDTO result = geocodeAddress(fullAddress);
        
        baiDang.setVi_do(result.getLatitude());
        baiDang.setKinh_do(result.getLongitude());
        baiDangRepository.save(baiDang);
        
        return result;
    }
}