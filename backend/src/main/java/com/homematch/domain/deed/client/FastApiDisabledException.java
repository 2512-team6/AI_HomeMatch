package com.homematch.domain.deed.client;

/**
 * FastAPI base-url이 비어 있어 등기부등본 AI 분석을 수행하지 않을 때 사용.
 */
public class FastApiDisabledException extends RuntimeException {
    public FastApiDisabledException() {
        super("FastAPI가 비활성화되어 있습니다. (fastapi.base-url 미설정)");
    }
}
