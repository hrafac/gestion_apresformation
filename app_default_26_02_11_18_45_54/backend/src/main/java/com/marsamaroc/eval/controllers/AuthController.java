package com.marsamaroc.eval.controllers;

import com.marsamaroc.eval.config.JwtService;
import com.marsamaroc.eval.entities.User;
import com.marsamaroc.eval.entities.Role;
import com.marsamaroc.eval.repositories.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        if (user.getRole() == null) {
            user.setRole(com.marsamaroc.eval.entities.Role.PARTICIPANT);
        }
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        var user = userRepository.findByUsername(request.getUsername()).orElseThrow();
        var token = jwtService.generateToken(user);
        return ResponseEntity.ok(new AuthResponse(token, user));
    }

    @GetMapping("/users/participants")
    public ResponseEntity<List<User>> getUserParticipant() {
        List<User> participants = userRepository.findByRole(Role.PARTICIPANT);
        return ResponseEntity.ok(participants);
    }

    @GetMapping("/users/formateurs")
    public ResponseEntity<List<User>> getUserFormateur() {
        List<User> formateurs = userRepository.findByRole(Role.TRAINER);
        return ResponseEntity.ok(formateurs);
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }
}

@Data
class LoginRequest { private String username; private String password; }
@Data
class AuthResponse { 
    private final String token; 
    private final User user;
    public AuthResponse(String token, User user) { this.token = token; this.user = user; }
}
