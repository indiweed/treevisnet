document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Получаем значения полей
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Здесь должна быть реальная проверка учетных данных
    // Это пример - для демонстрации используем фиксированные значения
    if (username === 'admin' && password === 'admin123') {
        window.location.href = 'admin-panel.html'; // Перенаправление
    } else {
        // Показываем сообщение об ошибке
        document.getElementById('errorMessage').style.display = 'block';
    }
});

// Скрываем сообщение об ошибке при изменении полей
document.getElementById('username').addEventListener('input', function() {
    document.getElementById('errorMessage').style.display = 'none';
});

document.getElementById('password').addEventListener('input', function() {
    document.getElementById('errorMessage').style.display = 'none';
});