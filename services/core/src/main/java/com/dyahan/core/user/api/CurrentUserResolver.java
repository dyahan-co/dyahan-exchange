package com.dyahan.core.user.api;

import com.dyahan.core.user.UnauthorizedException;
import com.dyahan.core.user.UserSessionService;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class CurrentUserResolver {
    private static final String BEARER_PREFIX = "Bearer ";

    private final UserSessionService userSessionService;

    public CurrentUserResolver(UserSessionService userSessionService) {
        this.userSessionService = userSessionService;
    }

    public UUID requireUserId(String authorizationHeader) {
        if (authorizationHeader == null
                || !authorizationHeader.startsWith(BEARER_PREFIX)) {
            throw new UnauthorizedException();
        }

        String token = authorizationHeader
                .substring(BEARER_PREFIX.length())
                .strip();

        if (token.isBlank()) {
            throw new UnauthorizedException();
        }

        return userSessionService.findActiveUserId(token)
                .orElseThrow(UnauthorizedException::new);
    }
}