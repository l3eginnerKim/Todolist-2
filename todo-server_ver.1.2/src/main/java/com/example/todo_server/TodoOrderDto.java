package com.example.todo_server;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TodoOrderDto {
    private Long id;
    private Integer sequence;
}