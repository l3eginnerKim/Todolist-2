package com.example.todo_server;


import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity // 이 클래스는 DB의 테이블과 연결될 애라고 알려줌
@Getter // Getter 메서드 자동 생성
@Setter // Setter 메서드 자동 생성
@NoArgsConstructor // 기본 생성자 자동 생성
public class Todo {

    @Id // 이 필드를 기본키(Primary Key)로 사용
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 숫자를 1, 2, 3... 자동으로 올려줌
    private Long id;

    private String title;   // 할 일 내용
    private boolean completed; // 완료 여부
}