const input = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const toggleAllBtn = document.getElementById('toggleAllBtn');
const barFill = document.getElementById('progressBarFill');
const percentText = document.getElementById('progressPercent');
let currentFilter = 'all'; // 기본값은 전체 보기
const filterButtons = document.querySelectorAll('.filter-btn');


const BASE_URL = 'http://localhost:8080/api/todos';

// [공통 fetch 래퍼]
async function request(url = BASE_URL, options = {}) {
    try {
        const response = await fetch(url, {
            headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
            ...options,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (!options.method || options.method === 'GET') return await response.json();
        return null;
    } catch (error) {
        console.error('요청 실패:', error);
        throw error;
    }
}

// [1. 초기 로드]
window.onload = async () => {
    await loadTodos();
};

async function loadTodos() {
    try {
        const todos = await request();
        const emptyMessage = document.getElementById('emptyMessage'); // 메시지 요소 가져오기

        todoList.innerHTML = '';

        // 🌟 할 일이 없을 때 처리
        if (todos.length === 0) {
            emptyMessage.style.display = 'block';
        } else {
            emptyMessage.style.display = 'none';
            todos.forEach(createTodoElement);
        }

        updateProgress(todos);
        updateToggleButton(todos);
        applyFilter();
    } catch (error) {
        console.error('목록 로드 실패:', error);
    }
}

// [2. 할 일 추가]
async function addTodo() {
    const text = input.value.trim();
    if (!text) return;

    const newTodo = {
        title: text,
        completed: false
    };


    try {
        await request(BASE_URL, {
            method: 'POST',
            body: JSON.stringify({ title: text, completed: false }),
        });
        input.value = '';
        await loadTodos();
        input.focus();
    } catch (error) { console.error('추가 실패:', error); }
}

// [3. 리스트 아이템 생성]
function createTodoElement(todo) {
    const li = document.createElement('li');
    li.dataset.id = todo.id;
    if (todo.completed) li.classList.add('completed-state');

    li.innerHTML = `
        <div class="task-left">
            <span class="drag-handle">☰</span>
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

    const dragHandle = li.querySelector('.drag-handle')
    const taskText = li.querySelector('.task-text');
    const editInput = li.querySelector('.edit-input');
    const editBtn = li.querySelector('.edit-btn');
    const saveBtn = li.querySelector('.save-btn');
    const cancelBtn = li.querySelector('.cancel-btn');
    const deleteBtn = li.querySelector('.delete-btn');
    const checkbox = li.querySelector('.complete-check');

// 2. 🌟 핵심 로직: 석삼자(☰)에 마우스를 올릴 때만 li의 드래그를 활성화합니다.
    dragHandle.addEventListener('mousedown', () => {
        li.setAttribute('draggable', true);
    });

    li.addEventListener('dragend',async () => {
        li.setAttribute('draggable', false);
        li.classList.remove('dragging');

        await updateTodoOrder();
    });

    // 기존 드래그 시작 이벤트는 유지
    li.addEventListener('dragstart', () => li.classList.add('dragging'));

    // 수정 모드
    editBtn.addEventListener('click', () => {
        li.classList.add('editing');
        editInput.value = taskText.innerText;
        setTimeout(() => editInput.focus(), 10);
    });

    // 개별 저장 (전체 리로딩 없이 해당 줄만 변경)
    saveBtn.addEventListener('click', async () => {
        const newTitle = editInput.value.trim();
        if (!newTitle) return;
        try {
            await request(`${BASE_URL}/${todo.id}`, {
                method: 'PUT',
                body: JSON.stringify({ title: newTitle, completed: checkbox.checked }),
            });
            taskText.innerText = newTitle;
            li.classList.remove('editing');
        } catch (error) { console.error('수정 실패:', error); }
    });

    cancelBtn.addEventListener('click', () => li.classList.remove('editing'));

    editInput.addEventListener('keydown', (e) => {
        if (e.isComposing) return; // 한글 입력 중 엔터 중복 방지

        if (e.key === 'Enter') {
            saveBtn.click(); // 엔터 누르면 저장 버튼 클릭
        } else if (e.key === 'Escape') {
            cancelBtn.click(); // ESC 누르면 취소 버튼 클릭
        }
    });

    deleteBtn.addEventListener('click', async () => {
        try {
            await request(`${BASE_URL}/${todo.id}`, { method: 'DELETE' });
            await loadTodos();
        } catch (error) { console.error('삭제 실패:', error); }
    });

    checkbox.addEventListener('change', async () => {
        try {
            await request(`${BASE_URL}/${todo.id}`, {
                method: 'PUT',
                body: JSON.stringify({ title: taskText.innerText, completed: checkbox.checked }),
            });
            taskText.classList.toggle('completed', checkbox.checked);
            li.classList.toggle('completed-state', checkbox.checked);
            await updateProgress(); // 체크 시 진행률 즉시 반영
        } catch (error) { console.error('체크 실패:', error); }
    });

    // 드래그 이벤트
    li.addEventListener('dragstart', () => li.classList.add('dragging'));
    li.addEventListener('dragend', () => li.classList.remove('dragging'));

    todoList.appendChild(li);
}

// [4. 전체 완료/해제 토글]
async function handleToggleAll() {
    try {
        const todos = await request();
        if (todos.length === 0) return;
        const isAllCompleted = todos.every(t => t.completed);
        const targetStatus = !isAllCompleted;

        await Promise.all(todos.map(t =>
            request(`${BASE_URL}/${t.id}`, {
                method: 'PUT',
                body: JSON.stringify({ title: t.title, completed: targetStatus }),
            })
        ));
        await loadTodos();
    } catch (error) { console.error('토글 실패:', error); }
}

function updateToggleButton(todos) {
    if (!toggleAllBtn || todos.length === 0) return;
    const isAllCompleted = todos.every(t => t.completed);
    toggleAllBtn.innerText = isAllCompleted ? "전체 해제" : "전체 완료";
}

// [5. 진행률 계산]
// [5. 진행률 계산 - 정수 처리 및 색상 변경 통합 버전]
async function updateProgress(existingTodos = null) {
    const todos = existingTodos || await request();
    const total = todos.length;

    // 1. 퍼센트 계산 (0과 100은 정수로, 나머지는 소수점 한 자리)
    const percent = total === 0 ? 0 : Number(((todos.filter(t => t.completed).length / total) * 100).toFixed(1));

    // 2. 화면 글자 및 게이지 바 너비 업데이트
    barFill.style.width = percent + '%';
    percentText.innerText = percent;

    // 3. 금색 변경 로직 추가!
    // percent가 숫자 100일 때만 배경색을 금색으로 바꿉니다.
    if (percent === 100) {
        barFill.style.backgroundColor = "#fbc02d"; // 금색 (Gold)
        barFill.style.boxShadow = "0 0 10px rgba(251, 192, 45, 0.5)"; // 살짝 빛나는 효과
    } else {
        barFill.style.backgroundColor = "#4caf50"; // 다시 초록색으로 복구
        barFill.style.boxShadow = "none";
    }
}

// [6. 드래그 위치 계산]
todoList.addEventListener('dragover', e => {
    e.preventDefault();
    const draggingItem = document.querySelector('.dragging');
    const afterElement = getDragAfterElement(todoList, e.clientY);
    if (afterElement == null) todoList.appendChild(draggingItem);
    else todoList.insertBefore(draggingItem, afterElement);
});

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
        else return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // 1. 버튼 디자인 변경 (클릭한 버튼만 초록색으로)
        filterButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        // 2. 필터 값 변경 및 목록 다시 그리기
        currentFilter = e.target.dataset.filter;
        applyFilter();
    });
});
async function updateTodoOrder() {
    // 1. 화면에 보이는 순서대로 ID들을 배열에 담습니다.
    const items = [...todoList.querySelectorAll('li')];
    const orderData = items.map((li, index) => ({
        id: li.dataset.id,
        sequence: index // 위에서부터 0, 1, 2... 순서 부여
    }));

    try {
        // 2. 서버의 특정 API(예: /api/todos/reorder)로 새 순서를 보냅니다.
        await request(`${BASE_URL}/reorder`, {
            method: 'PATCH', // 여러 항목의 일부만 수정하므로 PATCH가 적당합니다.
            body: JSON.stringify(orderData)
        });
        console.log("순서 저장 완료!");
    } catch (error) {
        console.error("순서 저장 실패:", error);
    }
}


// 화면에 보이는 항목만 골라주는 함수
function applyFilter() {
    const items = todoList.querySelectorAll('li');

    items.forEach(li => {
        const isCompleted = li.classList.contains('completed-state');

        switch (currentFilter) {
            case 'all':
                li.style.display = 'flex'; // 전체 보기
                break;
            case 'active':
                li.style.display = isCompleted ? 'none' : 'flex'; // 미완료만
                break;
            case 'completed':
                li.style.display = isCompleted ? 'flex' : 'none'; // 완료만
                break;
        }
    });
}

// 이벤트 연결
addBtn.addEventListener('click', addTodo);
input.addEventListener('keydown', e => { if (!e.isComposing && e.key === 'Enter') addTodo(); });
toggleAllBtn.addEventListener('click', handleToggleAll);