package com.homematch.domain.deed;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeedAnalysisDocumentRepository extends JpaRepository<DeedAnalysisDocument, Long> {

    @Query("SELECT d FROM DeedAnalysisDocument d JOIN d.user u " +
           "WHERE u.user_no = :userNo AND d.deletedAt IS NULL " +
           "AND (:archived IS NULL OR d.archived = :archived) " +
           "ORDER BY d.createdAt DESC")
    List<DeedAnalysisDocument> findByUserAndArchived(@Param("userNo") Integer userNo, @Param("archived") Boolean archived);

    @Query("SELECT d FROM DeedAnalysisDocument d JOIN d.user u " +
           "WHERE d.id = :id AND u.user_no = :userNo AND d.deletedAt IS NULL")
    Optional<DeedAnalysisDocument> findOneForUser(@Param("id") Long id, @Param("userNo") Integer userNo);
}

