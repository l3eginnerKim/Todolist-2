package com.example.todo_server;


import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@Entity
@Getter
@Setter
@NoArgsConstructor
public class Todo {

    @Id // 🌟 @Id는 실제 고유 번호인 id에 붙어야 합니다!
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer sequence; // sequence는 순서 저장용 일반 필드입니다.
    private Long id; // PK는 관례적으로 Long을 씁니다.
    private String title;
    private boolean completed;
}