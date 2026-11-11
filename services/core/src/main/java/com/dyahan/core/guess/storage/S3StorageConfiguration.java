package com.dyahan.core.guess.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

@Configuration
public class S3StorageConfiguration {
    @Bean(destroyMethod = "close")
    public S3Presigner s3Presigner(
            @Value("${guess.images.s3.endpoint}") String endpoint,
            @Value("${guess.images.s3.region}") String region,
            @Value("${guess.images.s3.access-key-id}") String accessKeyId,
            @Value("${guess.images.s3.secret-access-key}") String secretAccessKey
    ) {
        AwsBasicCredentials credentials = AwsBasicCredentials.create(
                accessKeyId,
                secretAccessKey
        );

        return S3Presigner.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region))
                .credentialsProvider(
                        StaticCredentialsProvider.create(credentials)
                )
                .serviceConfiguration(
                        S3Configuration.builder()
                                .pathStyleAccessEnabled(true)
                                .build()
                )
                .build();
    }
}