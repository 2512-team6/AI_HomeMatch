package com.homematch;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.sql.Connection;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class DataSourceTest {

    @Autowired
    DataSource dataSource;

    @Test
    void dbConnectionTest() throws Exception {
        Connection conn = dataSource.getConnection();
        System.out.println("DB 연결 성공: " + conn);
        assertNotNull(conn);
    }
}
