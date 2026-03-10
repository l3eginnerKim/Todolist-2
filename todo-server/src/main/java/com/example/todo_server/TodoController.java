package com.example.todo_server;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor // final이 붙은 필드를 자동으로 연결해줍니다 (Autowired 필요 없음)
@RequestMapping("/api/todos")
@CrossOrigin(origins = "*")
public class TodoController {

    // 1. 중복 선언 제거 및 final 유지 (Lombok과 찰떡궁합)
    private final TodoRepository todoRepository;

    // 2. 목록 조회: 괄호를 비워야 /api/todos 주소로 연결됩니다.
    @GetMapping
    public List<Todo> getTodos() {
        return todoRepository.findAllByOrderBySequenceAsc();
    }

    // 3. 할 일 추가
    @PostMapping
    public Todo createTodo(@RequestBody Todo todo) {
        todo.setId(null);

        long count = todoRepository.count();
        todo.setSequence((int) count);

        return todoRepository.save(todo);
    }

    // 4. 삭제: /api/todos/{id} 로 연결되도록 수정
    @DeleteMapping("/{id}")
    public void deleteTodo(@PathVariable Long id) {
        todoRepository.deleteById(id);
    }

    // 5. 수정: /api/todos/{id} 로 연결되도록 수정
    @PutMapping("/{id}")
    public Todo updateTodo(@PathVariable Long id, @RequestBody Todo todoDetails) {
        Todo todo = todoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Todo not found"));

        todo.setTitle(todoDetails.getTitle());
        todo.setCompleted(todoDetails.isCompleted());

        return todoRepository.save(todo);
    }

    // 6. 순서 변경 기능 (PATCH /api/todos/reorder)
    @PatchMapping("/reorder")
    public void reorderTodos(@RequestBody List<TodoOrderDto> orderList) {
        for (TodoOrderDto dto : orderList) {
            Todo todo = todoRepository.findById(dto.getId())
                    .orElseThrow(() -> new RuntimeException("Todo not found"));
            todo.setSequence(dto.getSequence());
            todoRepository.save(todo);
        }
    }
}