package com.dyahan.core.guess.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.time.Duration;

@Service
public class GuessImageUrlService {
    private final S3Presigner s3Presigner;
    private final String bucket;
    private final Duration urlDuration;

    public GuessImageUrlService(
            S3Presigner s3Presigner,
            @Value("${guess.images.s3.bucket}") String bucket,
            @Value("${guess.images.s3.url-duration}") Duration urlDuration
    ) {
        if (bucket == null || bucket.isBlank()) {
            throw new IllegalArgumentException("Не задан bucket для изображений");
        }
        if (urlDuration == null || urlDuration.isZero() || urlDuration.isNegative()) {
            throw new IllegalArgumentException(
                    "Срок действия ссылки на изображение должен быть положительным"
            );
        }

        this.s3Presigner = s3Presigner;
        this.bucket = bucket;
        this.urlDuration = urlDuration;
    }

    public String createPresignedGetUrl(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            throw new IllegalArgumentException("Не задан ключ изображения");
        }

        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(objectKey)
                .build();

        GetObjectPresignRequest presignRequest =
                GetObjectPresignRequest.builder()
                        .signatureDuration(urlDuration)
                        .getObjectRequest(getObjectRequest)
                        .build();

        return s3Presigner.presignGetObject(presignRequest)
                .url()
                .toExternalForm();
    }
}