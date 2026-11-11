package com.dyahan.core.guess;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "guess_questions")
public class GuessQuestion {
    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "image_object_key", nullable = false, length = 512)
    private String imageObjectKey;

    @Column(name = "answer_normalized", nullable = false, length = 240)
    private String answerNormalized;

    @Column(nullable = false, length = 240)
    private String hint;

    @Column(name = "rules_version", nullable = false, length = 40)
    private String rulesVersion;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "guess_question_aliases",
            joinColumns = @JoinColumn(name = "question_id", nullable = false)
    )
    @Column(name = "answer_normalized", nullable = false, length = 240)
    private Set<String> aliases = new HashSet<>();

    protected GuessQuestion() {
        // Нужен JPA.
    }

    public GuessQuestion(
            UUID id,
            String imageObjectKey,
            String answerNormalized,
            String hint,
            String rulesVersion
    ) {
        this.id = id;
        this.imageObjectKey = imageObjectKey;
        this.answerNormalized = answerNormalized;
        this.hint = hint;
        this.rulesVersion = rulesVersion;
        this.active = true;
    }

    public void addAlias(String normalizedAlias) {
        if (normalizedAlias == null || normalizedAlias.isBlank()) {
            throw new IllegalArgumentException("Синоним не может быть пустым");
        }

        if (!answerNormalized.equals(normalizedAlias)) {
            aliases.add(normalizedAlias);
        }
    }

    public UUID getId() {
        return id;
    }

    public String getImageObjectKey() {
        return imageObjectKey;
    }

    public String getAnswerNormalized() {
        return answerNormalized;
    }

    public String getHint() {
        return hint;
    }

    public String getRulesVersion() {
        return rulesVersion;
    }

    public boolean isActive() {
        return active;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public Set<String> getAliases() {
        return Collections.unmodifiableSet(aliases);
    }
}