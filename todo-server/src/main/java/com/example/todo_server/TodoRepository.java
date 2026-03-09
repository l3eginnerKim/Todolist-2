package com.example.todo_server;

import org.springframework.data.jpa.repository.JpaRepository;

// JpaRepository를 상속받으면 모든 기본적인 DB 기능이 완성
public interface TodoRepository extends JpaRepository<Todo, Long> {
}