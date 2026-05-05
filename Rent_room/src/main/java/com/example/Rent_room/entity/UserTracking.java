package com.example.Rent_room.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "user_tracking")
@Getter
@Setter

public class UserTracking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "type", columnDefinition = "TEXT")
    private String type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bai_dang_id", insertable = false, updatable = false)
    private BaiDangChoThue baiDang;

    @Column(name = "user_id")
    private Integer user_id;

    @Column(name = "bai_dang_id")
    private Integer bai_dang_id;

    public UserTracking(Integer user_id, Integer bai_dang_id, String type) {
        this.user_id = user_id;
        this.bai_dang_id = bai_dang_id;
        this.type = type;
    }

    public UserTracking() {}
}
