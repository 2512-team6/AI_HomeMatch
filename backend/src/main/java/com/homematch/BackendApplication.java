package com.homematch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		Dotenv dotenv = Dotenv.load(); // .env 파일 로드

        String dbUrl = dotenv.get("DB_URL");
        String dbUser = dotenv.get("DB_USER");
        String dbPass = dotenv.get("DB_PASSWORD");

        System.setProperty("spring.datasource.url", dbUrl);
        System.setProperty("spring.datasource.username", dbUser);
        System.setProperty("spring.datasource.password", dbPass);

        SpringApplication.run(BackendApplication.class, args);
	}

}
