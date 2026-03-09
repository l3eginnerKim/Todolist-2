package com.example.todo_server;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController // 이 클래스는 API 요청을 처리하는 곳이라고 지정
@RequiredArgsConstructor // Repository를 자동으로 연결해주는 도구
@CrossOrigin(origins = "*") // 중요! 프론트엔드와 연결을 허용하는 설정 (CORS 해결)
public class TodoController {

    private final TodoRepository todoRepository;

    @GetMapping("/api/todos")
    public List<Todo> getTodos() {
        return todoRepository.findAll();
    }


    @PostMapping("/api/todos")
    public Todo createTodo(@RequestBody Todo todo) {
        return todoRepository.save(todo);
    }


    @DeleteMapping("/api/todos/{id}")
    public void deleteTodo(@PathVariable Long id) {
        todoRepository.deleteById(id);
    }


    @PutMapping("/api/todos/{id}")
    public Todo updateTodo(@PathVariable Long id, @RequestBody Todo todoDetails) {
        Todo todo = todoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Todo not found"));

        // 제목과 완료 여부를 전달받은 값으로 수정
        todo.setTitle(todoDetails.getTitle());
        todo.setCompleted(todoDetails.isCompleted());

        return todoRepository.save(todo);
    }
}

