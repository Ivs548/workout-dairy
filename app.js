// Данные приложения
let exercises = JSON.parse(localStorage.getItem('exercises')) || [];
let workouts = JSON.parse(localStorage.getItem('workouts')) || [];

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Установка сегодняшней даты по умолчанию
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('workout-date').value = today;
    
    // Загрузка данных
    loadExercises();
    loadWorkouts();
    updateStats();
    
    // Настройка вкладок
    setupTabs();
    
    // Настройка графика
    setupChart();
    
    // Проверка PWA
    checkPWA();
});

// Настройка вкладок
function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // Убираем активный класс у всех вкладок
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
            
            // Добавляем активный класс текущей вкладке
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// Добавление упражнения
function addExercise() {
    const name = document.getElementById('exercise-name').value.trim();
    const category = document.getElementById('exercise-category').value;
    
    if (!name) {
        alert('Введите название упражнения');
        return;
    }
    
    const exercise = {
        id: Date.now(),
        name: name,
        category: category,
        createdAt: new Date().toISOString()
    };
    
    exercises.push(exercise);
    saveExercises();
    loadExercises();
    updateExerciseDropdown();
    updateStats();
    
    // Очистка формы
    document.getElementById('exercise-name').value = '';
    
    // Виброотклик (если поддерживается)
    if (navigator.vibrate) navigator.vibrate(100);
}

// Загрузка упражнений
function loadExercises() {
    const container = document.getElementById('exercises-list');
    
    if (exercises.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Нет упражнений</p>';
        return;
    }
    
    container.innerHTML = exercises.map(exercise => `
        <div class="exercise-item">
            <div>
                <strong>${exercise.name}</strong>
                <div style="font-size: 14px; color: #7f8c8d; margin-top: 5px;">
                    <i class="fas fa-tag"></i> ${exercise.category}
                </div>
            </div>
            <button onclick="deleteExercise(${exercise.id})" class="delete-btn">
                <i class="fas fa-trash"></i> Удалить
            </button>
        </div>
    `).join('');
}

// Удаление упражнения
function deleteExercise(id) {
    if (!confirm('Удалить это упражнение?')) return;
    
    exercises = exercises.filter(ex => ex.id !== id);
    workouts = workouts.filter(workout => workout.exerciseId !== id);
    
    saveExercises();
    saveWorkouts();
    loadExercises();
    loadWorkouts();
    updateExerciseDropdown();
    updateStats();
}

// Обновление dropdown с упражнениями
function updateExerciseDropdown() {
    const select = document.getElementById('workout-exercise');
    select.innerHTML = '<option value="">Выберите упражнение</option>' +
        exercises.map(ex => `<option value="${ex.id}">${ex.name} (${ex.category})</option>`).join('');
}

// Добавление тренировки
function addWorkout() {
    const exerciseId = parseInt(document.getElementById('workout-exercise').value);
    const date = document.getElementById('workout-date').value;
    const sets = parseInt(document.getElementById('workout-sets').value);
    const reps = parseInt(document.getElementById('workout-reps').value);
    const weight = parseFloat(document.getElementById('workout-weight').value);
    
    if (!exerciseId || !date || !sets || !reps) {
        alert('Заполните все обязательные поля');
        return;
    }
    
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) {
        alert('Упражнение не найдено');
        return;
    }
    
    const workout = {
        id: Date.now(),
        exerciseId: exerciseId,
        exerciseName: exercise.name,
        date: date,
        sets: sets,
        reps: reps,
        weight: weight || 0,
        createdAt: new Date().toISOString()
    };
    
    workouts.push(workout);
    saveWorkouts();
    loadWorkouts();
    updateStats();
    updateChart();
    
    // Очистка формы
    document.getElementById('workout-sets').value = '';
    document.getElementById('workout-reps').value = '';
    document.getElementById('workout-weight').value = '';
    
    // Уведомление
    alert(`Тренировка "${exercise.name}" добавлена!`);
    
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}

// Загрузка тренировок
function loadWorkouts() {
    const container = document.getElementById('workouts-list');
    
    // Сортируем по дате (новые сверху)
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedWorkouts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Нет записей о тренировках</p>';
        return;
    }
    
    container.innerHTML = sortedWorkouts.map(workout => {
        const date = new Date(workout.date).toLocaleDateString('ru-RU');
        const totalWeight = (workout.sets * workout.reps * workout.weight).toFixed(1);
        
        return `
            <div class="workout-item">
                <div>
                    <strong>${workout.exerciseName}</strong>
                    <div style="font-size: 14px; color: #7f8c8d; margin-top: 5px;">
                        <i class="fas fa-calendar"></i> ${date} | 
                        <i class="fas fa-redo"></i> ${workout.sets}×${workout.reps} | 
                        <i class="fas fa-weight-hanging"></i> ${workout.weight} кг |
                        <strong>Всего: ${totalWeight} кг</strong>
                    </div>
                </div>
                <button onclick="deleteWorkout(${workout.id})" class="delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
}

// Удаление тренировки
function deleteWorkout(id) {
    if (!confirm('Удалить эту тренировку?')) return;
    
    workouts = workouts.filter(workout => workout.id !== id);
    saveWorkouts();
    loadWorkouts();
    updateStats();
    updateChart();
}

// Обновление статистики
function updateStats() {
    // Общее количество упражнений и тренировок
    document.getElementById('total-exercises').textContent = exercises.length;
    document.getElementById('total-workouts').textContent = workouts.length;
    
    // Общий поднятый вес
    const totalWeight = workouts.reduce((sum, workout) => {
        return sum + (workout.sets * workout.reps * workout.weight);
    }, 0);
    document.getElementById('total-weight').textContent = totalWeight.toFixed(1);
    
    // Последняя тренировка
    if (workouts.length > 0) {
        const lastWorkout = workouts.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        const date = new Date(lastWorkout.date).toLocaleDateString('ru-RU');
        document.getElementById('last-workout').textContent = date;
    }
}

// Настройка графика
let progressChart = null;

function setupChart() {
    const ctx = document.getElementById('progressChart').getContext('2d');
    
    progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Прогресс по весу',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Вес (кг)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Дата тренировки'
                    }
                }
            }
        }
    });
    
    updateChart();
}

// Обновление графика
function updateChart() {
    if (!progressChart) return;
    
    // Получаем тренировки за последние 30 дней
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentWorkouts = workouts
        .filter(w => new Date(w.date) >= thirtyDaysAgo)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Группируем по дате и упражнению
    const workoutData = {};
    recentWorkouts.forEach(workout => {
        const date = new Date(workout.date).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short'
        });
        
        if (!workoutData[date]) {
            workoutData[date] = [];
        }
        workoutData[date].push(workout.weight);
    });
    
    // Вычисляем средний вес для каждой даты
    const labels = Object.keys(workoutData);
    const data = labels.map(date => {
        const weights = workoutData[date];
        const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
        return Math.round(avg * 10) / 10;
    });
    
    // Обновляем график
    progressChart.data.labels = labels;
    progressChart.data.datasets[0].data = data;
    progressChart.update();
}

// Сохранение данных
function saveExercises() {
    localStorage.setItem('exercises', JSON.stringify(exercises));
}

function saveWorkouts() {
    localStorage.setItem('workouts', JSON.stringify(workouts));
}

// Проверка PWA
function checkPWA() {
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
        document.querySelector('.install-hint').style.display = 'none';
    }
}

// Экспорт данных
function exportData() {
    const data = {
        exercises: exercises,
        workouts: workouts,
        exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `тренировки_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Импорт данных
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (confirm('Импортировать данные? Текущие данные будут заменены.')) {
                exercises = data.exercises || [];
                workouts = data.workouts || [];
                
                saveExercises();
                saveWorkouts();
                
                loadExercises();
                loadWorkouts();
                updateExerciseDropdown();
                updateStats();
                updateChart();
                
                alert('Данные успешно импортированы!');
            }
        } catch (err) {
            alert('Ошибка при чтении файла');
        }
    };
    reader.readAsText(file);
}

// Автосохранение при закрытии
window.addEventListener('beforeunload', () => {
    saveExercises();
    saveWorkouts();
});

// Инициализация при первой загрузке
if (exercises.length === 0) {
    // Добавляем примеры упражнений
    exercises = [
        { id: 1, name: 'Жим лежа', category: 'Силовые', createdAt: new Date().toISOString() },
        { id: 2, name: 'Приседания', category: 'Силовые', createdAt: new Date().toISOString() },
        { id: 3, name: 'Бег', category: 'Кардио', createdAt: new Date().toISOString() }
    ];
    saveExercises();
    
    // Обновляем интерфейс
    setTimeout(() => {
        loadExercises();
        updateExerciseDropdown();
        updateStats();
    }, 100);
}
