package com.homematch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		// ✅ DB 설정 우선순위:
		// 1) 시스템 환경변수(DB_URL/DB_USER/DB_PASSWORD)  → 배포 환경(Cloudtype)에서 권장
		// 2) .env 파일(있을 때만)                           → 로컬 개발 편의용
		// 3) application.yml 기본값                         → 그 외
		String dbUrl = System.getenv("DB_URL");
		String dbUser = System.getenv("DB_USER");
		String dbPass = System.getenv("DB_PASSWORD");

		// .env 파일이 없어도 앱이 뜨도록 ignoreIfMissing
		Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();

		if (dbUrl == null || dbUrl.isBlank()) dbUrl = dotenv.get("DB_URL");
		if (dbUser == null || dbUser.isBlank()) dbUser = dotenv.get("DB_USER");
		if (dbPass == null || dbPass.isBlank()) dbPass = dotenv.get("DB_PASSWORD");

		// 값이 있을 때만 override (없으면 application.yml 기본값 사용)
		if (dbUrl != null && !dbUrl.isBlank()) {
			System.setProperty("spring.datasource.url", dbUrl);
		}
		if (dbUser != null && !dbUser.isBlank()) {
			System.setProperty("spring.datasource.username", dbUser);
		}
		if (dbPass != null && !dbPass.isBlank()) {
			System.setProperty("spring.datasource.password", dbPass);
		}

        SpringApplication.run(BackendApplication.class, args);
	}

}
