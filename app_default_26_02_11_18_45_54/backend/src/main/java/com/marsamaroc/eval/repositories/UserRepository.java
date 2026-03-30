package com.marsamaroc.eval.repositories;

import com.marsamaroc.eval.entities.User;
import com.marsamaroc.eval.entities.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    List<User> findByRole(Role role);
    long countByRole(Role role);
    
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM training_participants WHERE user_id = ?1", nativeQuery = true)
    void removeUserFromTrainings(Long userId);
    
    @Modifying
    @Transactional
    @Query(value = "UPDATE training SET trainer_id = NULL WHERE trainer_id = ?1", nativeQuery = true)
    void removeUserAsTrainer(Long userId);
}
