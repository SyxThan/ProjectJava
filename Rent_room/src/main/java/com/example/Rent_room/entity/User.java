package com.example.Rent_room.entity;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "user")
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String fullname;
    private String email;
    private String so_dien_thoai;
    @JsonIgnore
    private String hash_password;
    private String avatar;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('nguoi_thue', 'chu_tro', 'quan_tri_vien') DEFAULT 'nguoi_thue'")
    private Role role;

    private LocalDateTime ngay_tao;
    private LocalDateTime ngay_cap_nhat;

    public enum Role {
        nguoi_thue,
        chu_tro,
        quan_tri_vien
    }

    // Chuyển role sang Spring Security GrantedAuthority
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (this.role == null) return Collections.emptyList();
        return Collections.singletonList(
            new SimpleGrantedAuthority("ROLE_" + this.role.name().toUpperCase())
        );
    }
}
