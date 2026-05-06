package com.example.Rent_room.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.util.Collection;
import java.util.Collections;
import com.fasterxml.jackson.annotation.JsonIgnore;

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
