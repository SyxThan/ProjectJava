package com.example.Rent_room.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GeocodeResponseDTO {
    private String address;
    
    @JsonProperty("latitude")
    private Double latitude;
    
    @JsonProperty("longitude")
    private Double longitude;
    
    public GeocodeResponseDTO() {}
    
    public GeocodeResponseDTO(String address, Double latitude, Double longitude) {
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
    }
}
