package com.facilitymanager.repository;

import com.facilitymanager.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    @Query("select count(u) from User u where upper(trim(u.role)) = upper(trim(:roleCode))")
    long countByRoleIgnoreCase(@Param("roleCode") String roleCode);
}
