package com.dyahan.core.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {
    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "nickname", nullable = false, length = 24)
    private String nickname;

    @Column(name = "nickname_normalized", nullable = false, unique = true, length = 24)
    private String nicknameNormalized;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "role", nullable = false, length = 20)
    private String role;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "notice_accepted_at", nullable = false)
    private OffsetDateTime noticeAcceptedAt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Version
    @Column(name = "version", nullable = false)
    private long version;

    protected User() {
        // Нужен JPA для загрузки сущности из базы.
    }

    public User(
            UUID id,
            String nickname,
            String nicknameNormalized,
            String passwordHash,
            OffsetDateTime noticeAcceptedAt
    ) {
        this.id = id;
        this.nickname = nickname;
        this.nicknameNormalized = nicknameNormalized;
        this.passwordHash = passwordHash;
        this.role = "PLAYER";
        this.status = "ACTIVE";
        this.noticeAcceptedAt = noticeAcceptedAt;
    }

    public UUID getId() {
        return id;
    }

    public String getNickname() {
        return nickname;
    }

    public String getNicknameNormalized() {
        return nicknameNormalized;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getRole() {
        return role;
    }

    public String getStatus() {
        return status;
    }

    public OffsetDateTime getNoticeAcceptedAt() {
        return noticeAcceptedAt;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public long getVersion() {
        return version;
    }
}