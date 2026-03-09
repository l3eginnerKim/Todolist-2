const input = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');

const BASE_URL = 'http://localhost:8080/api/todos';

// 공통 fetch 래퍼
async function request(url = BASE_URL, options = {}) {
    try {
        const response = await fetch(url, {
            headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
            ...options,
        });

        if (!response.ok) {
            const msg = `HTTP ${response.status}`;
            throw new Error(msg);
        }
        // GET인 경우에만 JSON 파싱, 그 외에는 비워둠
        if (!options.method || options.method === 'GET') {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('요청 실패:', error);
        throw error;
    }
}

// 1. 페이지 로드 시 서버에서 목록 가져오기
window.onload = loadTodos;

async function loadTodos() {
    try {
        const todos = await request();
        todoList.innerHTML = '';
        todos.forEach(createTodoElement);
    } catch (error) {
        console.error('목록 불러오기 실패:', error);
    }
}

// 2. 서버에 새 할 일 추가하기
async function addTodo() {
    const text = input.value.trim();
    if (!text) return;

    try {
        await request(BASE_URL, {
            method: 'POST',
            body: JSON.stringify({
                title: text,
                completed: false,
            }),
        });

        input.value = '';
        await loadTodos();
        input.focus();
    } catch (error) {
        console.error('추가 실패:', error);
    }
}

// 3. 화면에 리스트 아이템 그리기 및 이벤트 연결
function createTodoElement(todo) {
    const li = document.createElement('li');
    if (todo.completed) li.classList.add('completed-state');

    li.innerHTML = `
        <div class="task-left">
            <input type="checkbox" class="complete-check" ${todo.completed ? 'checked' : ''}>
            <span class="task-text ${todo.completed ? 'completed' : ''}">${todo.title}</span>
            <input type="text" class="edit-input">
        </div>
        <div class="btn-group">
            <button class="edit-btn">수정</button>
            <button class="save-btn">저장</button>
            <button class="cancel-btn">취소</button>
            <button class="delete-btn">삭제</button>
        </div>
    `;

    const taskText = li.querySelector('.task-text');
    const editInput = li.querySelector('.edit-input');
    const editBtn = li.querySelector('.edit-btn');
    const saveBtn = li.querySelector('.save-btn');
    const cancelBtn = li.querySelector('.cancel-btn');
    const deleteBtn = li.querySelector('.delete-btn');
    const checkbox = li.querySelector('.complete-check');

    // [수정 모드 진입]
    editBtn.addEventListener('click', () => {
        li.classList.add('editing');
        editInput.value = taskText.innerText;

        setTimeout(() => {
            editInput.focus();
            const val = editInput.value;
            editInput.value = '';
            editInput.value = val;
        }, 10);
    });

    // [수정 내용 저장 - 서버 PUT 연동]
    saveBtn.addEventListener('click', async () => {
        const newTitle = editInput.value.trim();
        if (!newTitle) return;

        try {
            await request(`${BASE_URL}/${todo.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    title: newTitle,
                    completed: checkbox.checked,
                }),
            });

            li.classList.remove('editing');
            await loadTodos();
        } catch (error) {
            console.error('수정 실패:', error);
        }
    });

    // 수정 입력창에서 엔터/ESC 처리
    editInput.addEventListener('keydown', (e) => {
        if (!e.isComposing && e.key === 'Enter') {
            saveBtn.click();
        } else if (e.key === 'Escape') {
            cancelBtn.click();
        }
    });

    // [취소]
    cancelBtn.addEventListener('click', () => {
        li.classList.remove('editing');
        editInput.value = '';
    });

    // [삭제 - 서버 DELETE 연동]
    deleteBtn.addEventListener('click', async () => {
        try {
            await request(`${BASE_URL}/${todo.id}`, { method: 'DELETE' });
            await loadTodos();
        } catch (error) {
            console.error('삭제 실패:', error);
        }
    });

    // [체크박스 - 서버 PUT 연동]
    checkbox.addEventListener('change', async () => {
        try {
            await request(`${BASE_URL}/${todo.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    title: taskText.innerText, // 최신 텍스트 사용
                    completed: checkbox.checked,
                }),
            });

            taskText.classList.toggle('completed', checkbox.checked);
            li.classList.toggle('completed-state', checkbox.checked);
        } catch (error) {
            console.error('체크 상태 업데이트 실패:', error);
        }
    });

    todoList.appendChild(li);
}

// 이벤트 연결
addBtn.addEventListener('click', addTodo);
input.addEventListener('keydown', (e) => {
    if (!e.isComposing && e.key === 'Enter') addTodo();
});