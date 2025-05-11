// Инициализация модальных окон
const addArticleModal = new bootstrap.Modal(document.getElementById('addArticleModal'));
const editArticleModal = new bootstrap.Modal(document.getElementById('editArticleModal'));
const importBibModal = new bootstrap.Modal(document.getElementById('importBibModal'));

// DOM элементы
const articlesContainer = document.getElementById('articlesContainer');
const alertMessage = document.getElementById('alertMessage');
const alertText = document.getElementById('alertText');

// Глобальная переменная для хранения распарсенных записей
let parsedBibEntries = [];

// Имитация базы данных (используем localStorage)
const db = {
    getArticles: () => {
        const articles = localStorage.getItem('articles');
        return articles ? JSON.parse(articles) : [];
    },
    saveArticle: (article) => {
        const articles = db.getArticles();
        if (article.id) {
            // Редактирование существующей статьи
            const index = articles.findIndex(a => a.id === article.id);
            if (index !== -1) {
                articles[index] = article;
            }
        } else {
            // Добавление новой статьи
            article.id = Date.now(); // Используем timestamp как ID
            article.createdAt = new Date().toISOString();
            articles.push(article);
        }
        localStorage.setItem('articles', JSON.stringify(articles));
        return article;
    },
    deleteArticle: (id) => {
        const articles = db.getArticles().filter(a => a.id !== id);
        localStorage.setItem('articles', JSON.stringify(articles));
    },
    importBibEntries: (entries) => {
        const articles = db.getArticles();
        const imported = [];
        
        entries.forEach(entry => {
            const fields = entry.entryTags || {};
            const article = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                authors: fields.author || '',       // Авторы
                title: fields.title || `Статья без названия (${entry.entryType})`,
                content: fields.abstract || '',     // Аннотация
                year: fields.year || '',            // Год
                createdAt: new Date().toISOString(),
                bibData: entry
            };
            
            articles.push(article);
            imported.push(article);
        });
        
        localStorage.setItem('articles', JSON.stringify(articles));
        return imported;
    }
};

// Обработчик кнопки импорта BibTeX
document.getElementById('importBibBtn').addEventListener('click', function() {
    if (parsedBibEntries.length > 0) {
        const importedArticles = db.importBibEntries(parsedBibEntries);
        loadArticles();
        importBibModal.hide();
        showAlert(`Успешно импортировано ${importedArticles.length} статей`, 'success');
    } else {
        showAlert('Нет данных для импорта', 'warning');
    }
});

// Форматирование BibTeX записи в текст
function formatBibEntry(entry) {
    const fields = entry.entryTags || {};
    let content = `Тип: ${entry.entryType}\n`;
    content += `Ключ: ${entry.citationKey}\n\n`;
    
    for (const [key, value] of Object.entries(fields)) {
        content += `${key}: ${value}\n`;
    }
    
    return content;
}

// Загрузка статей при загрузке страницы
function loadArticles() {
    const articles = db.getArticles();
    articlesContainer.innerHTML = '';
    
    if (articles.length === 0) {
        articlesContainer.innerHTML = '<div class="text-center py-4 text-muted">Статьи не найдены</div>';
        return;
    }

    articles.forEach(article => {
        const articleElement = document.createElement('div');
        articleElement.className = 'article-row';
        articleElement.innerHTML = `
            <div class="col-id">${article.id}</div>
            <div class="col-img"><img src="${article.image || ''}" style="max-width: 50px; max-height: 50px;"/></div>
            <div class="col-authors">${article.authors || ''}</div>
            <div class="col-title">${article.title || ''}</div>
            <div class="col-year">${article.year || ''}</div>
            <div class="col-date">${formatDate(article.createdAt)}</div>
            <div class="col-actions">
                <button class="btn btn-sm btn-outline-primary action-btn mb-2 edit" data-id="${article.id}">
                    <i class="bi bi-pencil"></i> Редактировать
                </button>
                <button class="btn btn-sm btn-outline-danger action-btn mb-2 delete" data-id="${article.id}">
                    <i class="bi bi-trash"></i> Удалить
                </button>
                <button class="btn btn-sm btn-success action-btn publish" data-id="${article.id}">
                    <i class="bi bi-upload"></i> Опубликовать
                </button>
            </div>
        `;
        articlesContainer.appendChild(articleElement);
    });
    
    // Назначение обработчиков для кнопок
    document.querySelectorAll('.action-btn.edit').forEach(btn => {
        btn.addEventListener('click', () => editArticle(parseInt(btn.dataset.id)));
    });
    
    document.querySelectorAll('.action-btn.delete').forEach(btn => {
        btn.addEventListener('click', () => deleteArticle(parseInt(btn.dataset.id)));
    });
    
    document.querySelectorAll('.action-btn.publish').forEach(btn => {
        btn.addEventListener('click', () => publishArticle(parseInt(btn.dataset.id)));
    });
}

// Редактирование статьи
function editArticle(id) {
    const article = db.getArticles().find(a => a.id === id);
    if (article) {
        document.getElementById('editArticleModalLabel').textContent = `Редактировать: ${article.title || 'Без названия'}`;
        document.getElementById('editArticleId').value = article.id;
        document.getElementById('editArticleAuthors').value = article.authors || '';
        document.getElementById('editArticleTitle').value = article.title || '';
        document.getElementById('editArticleYear').value = article.year || '';
        document.getElementById('editArticleContent').value = article.content || '';
        
        const imgPreview = document.getElementById('editImgPreview');
        if (article.image) {
            imgPreview.src = article.image;
            imgPreview.style.display = 'block';
        } else {
            imgPreview.style.display = 'none';
        }
        
        document.getElementById('editImgFileInput').value = '';
        editArticleModal.show();
    }
}

// Обработчик сохранения изменений
document.getElementById('updateArticleBtn').addEventListener('click', function() {
    const title = document.getElementById('editArticleTitle').value.trim();
    const content = document.getElementById('editArticleContent').value.trim();
    const id = document.getElementById('editArticleId').value;
    const authors = document.getElementById('editArticleAuthors').value.trim();
    const year = document.getElementById('editArticleYear').value.trim();
    const imgFileInput = document.getElementById('editImgFileInput');
    
    if (!title || !content) {
        showAlert('Название и содержание статьи обязательны для заполнения', 'danger');
        return;
    }
    
    const article = {
        id: parseInt(id),
        authors: authors,
        title: title,
        year: year,
        content: content,
        createdAt: db.getArticles().find(a => a.id === parseInt(id)).createdAt
    };
    
    if (imgFileInput.files.length > 0) {
        const file = imgFileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            article.image = e.target.result;
            saveUpdatedArticle(article);
        };
        reader.readAsDataURL(file);
    } else {
        const existingArticle = db.getArticles().find(a => a.id === parseInt(id));
        if (existingArticle && existingArticle.image) {
            article.image = existingArticle.image;
        }
        saveUpdatedArticle(article);
    }
});

function saveUpdatedArticle(article) {
    db.saveArticle(article);
    loadArticles();
    editArticleModal.hide();
    showAlert('Статья успешно обновлена', 'success');
}

// Превью изображения в форме редактирования
document.getElementById('editImgFileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const imgPreview = document.getElementById('editImgPreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imgPreview.src = e.target.result;
            imgPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        imgPreview.style.display = 'none';
    }
});

// Удаление статьи
function deleteArticle(id) {
    if (confirm('Вы уверены, что хотите удалить эту статью?')) {
        db.deleteArticle(id);
        loadArticles();
        showAlert('Статья успешно удалена', 'success');
    }
}

// Публикация статьи
function publishArticle(id) {
    const articles = db.getArticles();
    const article = articles.find(a => a.id === id);
    
    if (article) {
        const publishedArticles = JSON.parse(localStorage.getItem('publishedArticles') || '[]');
        
        if (!publishedArticles.some(a => a.id === id)) {
            publishedArticles.push(article);
            localStorage.setItem('publishedArticles', JSON.stringify(publishedArticles));
            showAlert('Статья успешно опубликована на сайте', 'success');
        } else {
            showAlert('Эта статья уже опубликована', 'warning');
        }
    }
}

// Сохранение статьи
document.getElementById('saveArticleBtn').addEventListener('click', function() {
    const title = document.getElementById('articleTitle').value.trim();
    const content = document.getElementById('articleContent').value.trim();
    const id = document.getElementById('articleId').value;
    const authors = document.getElementById('articleAuthors').value.trim();
    const year = document.getElementById('articleYear').value.trim();
    const imgFileInput = document.getElementById('imgFileInput');
    
    if (!title || !content) {
        showAlert('Название и содержание статьи обязательны для заполнения', 'danger');
        return;
    }
    
    const article = {
        id: id ? parseInt(id) : null,
        authors: authors,
        title: title,
        year: year,
        content: content,
        createdAt: id ? db.getArticles().find(a => a.id === parseInt(id)).createdAt : new Date().toISOString()
    };
    
    if (imgFileInput.files.length > 0) {
        const file = imgFileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            article.image = e.target.result;
            saveArticleToDB(article);
        };
        reader.readAsDataURL(file);
    } else {
        if (id) {
            const existingArticle = db.getArticles().find(a => a.id === parseInt(id));
            if (existingArticle && existingArticle.image) {
                article.image = existingArticle.image;
            }
        }
        saveArticleToDB(article);
    }
});

function saveArticleToDB(article) {
    db.saveArticle(article);
    loadArticles();
    addArticleModal.hide();
    showAlert(article.id ? 'Статья успешно обновлена' : 'Статья успешно добавлена', 'success');
}

// Превью изображения при выборе файла
document.getElementById('imgFileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const imgPreview = document.getElementById('imgPreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imgPreview.src = e.target.result;
            imgPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        imgPreview.style.display = 'none';
    }
});

// Обработка загрузки BibTeX файла
document.getElementById('bibFileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const bibtexContent = e.target.result;
        document.getElementById('bibPreview').textContent = bibtexContent;
        
        try {
            parsedBibEntries = parseBibtexSimple(bibtexContent);
            displayParsedEntries(parsedBibEntries);
            document.getElementById('importBibBtn').disabled = false;
        } catch (error) {
            document.getElementById('bibPreview').innerHTML = `
                <div class="alert alert-danger">Ошибка парсинга: ${error.message}</div>
            `;
            document.getElementById('parsedEntriesContainer').style.display = 'none';
            document.getElementById('importBibBtn').disabled = true;
        }
    };
    reader.readAsText(file);
});

// Простой парсер BibTeX (поддерживает оба формата полей: {} и "")
// Улучшенный парсер BibTeX
function parseBibtexSimple(bibtexContent) {
    const entries = [];
    // Улучшенное регулярное выражение для обработки многострочных записей
    const entryRegex = /@(\w+)\s*\{\s*([^,]+),\s*([\s\S]*?)(?=\s*@\w+\s*\{|\s*$)/g;
    
    let match;
    while ((match = entryRegex.exec(bibtexContent)) !== null) {
        const entry = {
            entryType: match[1],
            citationKey: match[2].trim(),
            entryTags: {}
        };

        // Улучшенная обработка полей с разными разделителями
        const fieldsContent = match[3].replace(/\s+/g, ' ');
        const fieldPairs = fieldsContent.split(/,\s*(?=\w+\s*=)/g);
        
        fieldPairs.forEach(pair => {
            const fieldMatch = pair.trim().match(/(\w+)\s*=\s*(?:{((?:[^{}]|{[^{}]*})*)}|"((?:\\"|[^"])*)")/i);
            if (fieldMatch) {
                const key = fieldMatch[1].toLowerCase();
                const value = (fieldMatch[2] || fieldMatch[3] || '')
                    .replace(/\\"/g, '"') // Удаляем экранирование кавычек
                    .replace(/\s+/g, ' ') // Нормализация пробелов
                    .trim();
                entry.entryTags[key] = value;
            }
        });
        
        entries.push(entry);
    }
    
    return entries;
}

function displayParsedEntries(entries) {
    const container = document.getElementById('parsedEntriesList');
    container.innerHTML = '';
    
    if (!entries || entries.length === 0) {
        container.innerHTML = '<div class="alert alert-warning">Не найдено записей в BibTeX файле</div>';
        return;
    }

    entries.forEach((entry, index) => {
        const fields = entry.entryTags || {};
        const entryElement = document.createElement('div');
        entryElement.className = 'list-group-item';
        entryElement.innerHTML = `
            <div class="d-flex justify-content-between">
                <h6 class="mb-1">${fields.title || `Запись ${index + 1}`}</h6>
                <small class="text-muted">${entry.entryType}</small>
            </div>
            <div><small>Авторы: ${fields.author || 'не указаны'}</small></div>
            <div><small>Год: ${fields.year || 'не указан'}</small></div>
            <div class="abstract-preview">${fields.abstract ? fields.abstract.substring(0, 100) + '...' : 'нет аннотации'}</div>
        `;
        container.appendChild(entryElement);
    });
    
    document.getElementById('parsedEntriesContainer').style.display = 'block';
}

// Форматирование даты
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    try {
        const date = dateString ? new Date(dateString) : new Date();
        return isNaN(date.getTime()) ? 'Нет даты' : date.toLocaleString('ru-RU', options);
    } catch (e) {
        return 'Нет даты';
    }
}

// Показать уведомление
function showAlert(message, type = 'success') {
    alertMessage.style.display = 'block';
    alertMessage.className = `alert alert-${type} alert-dismissible fade show`;
    alertText.textContent = message;
    
    setTimeout(() => {
        const alert = bootstrap.Alert.getInstance(alertMessage);
        if (alert) alert.close();
    }, 3000);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadArticles();
    
    document.getElementById('addArticleModal').addEventListener('show.bs.modal', function() {
        document.getElementById('addArticleModalLabel').textContent = 'Добавить статью';
        document.getElementById('articleForm').reset();
        document.getElementById('articleId').value = '';
        document.getElementById('imgPreview').style.display = 'none';
        document.getElementById('imgFileInput').value = '';
    });
    
    document.getElementById('importBibModal').addEventListener('show.bs.modal', function() {
        document.getElementById('bibUploadForm').reset();
        document.getElementById('bibPreview').textContent = 'Файл не выбран';
        document.getElementById('parsedEntriesContainer').style.display = 'none';
        document.getElementById('importBibBtn').disabled = true;
        parsedBibEntries = []; // Сбрасываем распарсенные записи
    });
});
