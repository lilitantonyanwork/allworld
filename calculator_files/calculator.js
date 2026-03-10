// calculator.js - отдельный скрипт для виджета обмена

// Функция для отправки запроса на бэкенд
async function sendExchangeRequest(data) {
    try {
        const response = await fetch('/api/exchange_api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.error) {
            console.error('API Error:', result.error);
            
            // Если ошибка резервов, возвращаем специальный объект с флагом
            if (result.error === 'Insufficient reserves') {
                return {
                    error: 'insufficient_reserves',
                    message: result.message,
                    available: result.available,
                    from_currency: result.from_currency,
                    to_currency: result.to_currency,
                    from_amount: result.from_amount,
                    to_amount: result.to_amount,
                    usd_equivalent: 0,
                    reserves: result.reserves
                };
            }
            
            const usdSpan = document.querySelector('.exchange-rate span');
            if (usdSpan) usdSpan.textContent = '= $0.00';
            return null;
        }
        
        return result;
    } catch (error) {
        console.error('Network Error:', error);
        return null;
    }
}

// Функция обновления интерфейса с данными от бэкенда
function updateExchangeUI(data) {
    if (!data) return;
    
    console.log('Updating UI with data:', data); // Отладка
    
    const fromSection = document.querySelector('.exchange-section:first-child');
    const toSection = document.querySelector('.exchange-section:last-child');
    
    // Обновляем поля ввода
    const fromInput = fromSection.querySelector('input');
    const toInput = toSection.querySelector('input');
    
    fromInput.value = data.from_amount;
    toInput.value = data.to_amount;
    
    // Обновляем USD эквивалент
    const usdSpan = document.querySelector('.exchange-rate span');
    if (usdSpan) {
        usdSpan.textContent = `= $${data.usd_equivalent || '0.00'}`;
    }
    
    // Обновляем символы валют
    fromSection.querySelector('.currency-symbol').textContent = data.from_currency;
    toSection.querySelector('.currency-symbol').textContent = data.to_currency;
    
    // Обновляем балансы (резервы) под полями
    const fromBalanceSpan = fromSection.querySelector('.balance-amount');
    const toBalanceSpan = toSection.querySelector('.balance-amount');
    
    if (fromBalanceSpan && data.reserves) {
        fromBalanceSpan.textContent = formatBalance(data.reserves.from, data.from_currency);
    }
    
    if (toBalanceSpan && data.reserves) {
        toBalanceSpan.textContent = formatBalance(data.reserves.to, data.to_currency);
    }
    
    // Проверяем превышение резервов и подсвечиваем поле
    if (data.reserves && data.to_amount > data.reserves.to) {
        console.log('Reserve exceeded!'); // Отладка
        toInput.classList.add('reserve-exceeded');
        
        // Добавляем подсказку о превышении
        let warningSpan = toSection.querySelector('.reserve-warning');
        if (!warningSpan) {
            warningSpan = document.createElement('span');
            warningSpan.className = 'reserve-warning';
            warningSpan.innerHTML = '⚠️ Превышение резерва';
            toSection.querySelector('.amount-input').appendChild(warningSpan);
        }
    } else {
        toInput.classList.remove('reserve-exceeded');
        const warningSpan = toSection.querySelector('.reserve-warning');
        if (warningSpan) {
            warningSpan.remove();
        }
    }
}

// Функция форматирования баланса
function formatBalance(balance, currency) {
    // Для разных валют разное форматирование
    if (currency === 'BTC') {
        return balance.toFixed(8) + ' ' + currency;
    } else if (currency === 'ETH') {
        return balance.toFixed(4) + ' ' + currency;
    } else {
        return balance.toFixed(2) + ' ' + currency;
    }
}

// Функция получения текущих данных из формы
function getCurrentExchangeData(activeField) {
    const fromSection = document.querySelector('.exchange-section:first-child');
    const toSection = document.querySelector('.exchange-section:last-child');
    
    const fromCurrency = fromSection.querySelector('.currency-option span').textContent;
    const toCurrency = toSection.querySelector('.currency-option span').textContent;
    
    const fromInput = fromSection.querySelector('input');
    const toInput = toSection.querySelector('input');
    
    return {
        from_currency: fromCurrency,
        to_currency: toCurrency,
        from_amount: parseFloat(fromInput.value) || 0,
        to_amount: parseFloat(toInput.value) || 0,
        active_field: activeField
    };
}

// Дебаунс функция для избежания частых запросов
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Инициализация калькулятора
function initExchangeCalculator() {
    console.log('Exchange calculator initialized');
    
    // Проверяем, есть ли калькулятор на странице
    if (!document.querySelector('.exchange')) return;
    
    // Добавляем стили для подсветки превышения
    const style = document.createElement('style');
    style.textContent = `
        .amount-input input.reserve-exceeded {
            color: #ef4444 !important;
            border-color: #ef4444 !important;
        }
        .reserve-warning {
            position: absolute;
            right: 20px;
            bottom: -25px;
            font-size: 0.85rem;
            color: #ef4444;
            white-space: nowrap;
            background-color: rgba(239, 68, 68, 0.1);
            padding: 4px 10px;
            border-radius: 6px;
            border: 1px solid rgba(239, 68, 68, 0.3);
            pointer-events: none;
            z-index: 5;
        }
        .amount-input {
            position: relative;
            margin-bottom: 30px;
        }
    `;
    document.head.appendChild(style);
    
    // ===== СЕЛЕКТОРЫ ВАЛЮТ =====
    const currencySelectors = document.querySelectorAll('.currency-selector');
    
    currencySelectors.forEach(selector => {
        const option = selector.querySelector('.currency-option');
        const dropdown = selector.querySelector('.currency-dropdown');
        const items = dropdown.querySelectorAll('.currency-item');
        
        // Открытие/закрытие дропдауна
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            // Закрываем все другие дропдауны
            document.querySelectorAll('.currency-dropdown.show').forEach(d => {
                if (d !== dropdown) d.classList.remove('show');
            });
            
            // Переключаем текущий дропдаун
            dropdown.classList.toggle('show');
        });
        
        // Выбор валюты из дропдауна
        items.forEach(item => {
            item.addEventListener('click', async (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                const currency = item.getAttribute('data-currency');
                const iconSrc = item.querySelector('img').src;
                const currencyName = item.querySelector('span').textContent;
                
                // Определяем, какое поле было изменено
                const isFrom = selector.closest('.exchange-section') === document.querySelector('.exchange-section:first-child');
                
                // Получаем текущие данные для проверки
                const currentData = getCurrentExchangeData(isFrom ? 'from' : 'to');
                
                // Проверяем, не пытается ли пользователь выбрать ту же валюту, что в противоположном поле
                if ((isFrom && currency === currentData.to_currency) || 
                    (!isFrom && currency === currentData.from_currency)) {
                    alert('Нельзя обменять одинаковые валюты');
                    dropdown.classList.remove('show');
                    return;
                }
                
                // Обновляем выбранную опцию
                option.querySelector('img').src = iconSrc;
                option.querySelector('span').textContent = currencyName;
                
                // Обновляем символ в инпуте
                const amountInput = selector.closest('.exchange-section').querySelector('.currency-symbol');
                amountInput.textContent = currency;
                
                // Закрываем дропдаун
                dropdown.classList.remove('show');
                
                // Получаем обновленные данные
                let data = getCurrentExchangeData(isFrom ? 'from' : 'to');
                
                // Отправляем запрос на бэкенд
                const result = await sendExchangeRequest(data);
                if (result) {
                    updateExchangeUI(result);
                }
            });
        });
        
        // Закрытие при клике вне элемента
        document.addEventListener('click', (e) => {
            if (!selector.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    });
    
    // ===== ОБРАБОТКА ИНПУТОВ =====
    // Левое поле
    const fromInput = document.querySelector('.exchange-section:first-child input');
    if (fromInput) {
        fromInput.addEventListener('input', debounce(async function() {
            const data = getCurrentExchangeData('from');
            const result = await sendExchangeRequest(data);
            if (result) {
                updateExchangeUI(result);
            }
        }, 500));
    }
    
    // Правое поле
    const toInput = document.querySelector('.exchange-section:last-child input');
    if (toInput) {
        toInput.addEventListener('input', debounce(async function() {
            const data = getCurrentExchangeData('to');
            const result = await sendExchangeRequest(data);
            if (result) {
                updateExchangeUI(result);
            }
        }, 500));
    }
    
    // ===== ОБМЕН ВАЛЮТ МЕСТАМИ =====
    const exchangeArrow = document.querySelector('.exchange-arrow');
    if (exchangeArrow) {
        exchangeArrow.addEventListener('click', async () => {
            const fromSection = document.querySelector('.exchange-section:first-child');
            const toSection = document.querySelector('.exchange-section:last-child');
            
            // Сохраняем данные
            const fromCurrency = fromSection.querySelector('.currency-option span').textContent;
            const fromIcon = fromSection.querySelector('.currency-option img').src;
            const fromBalanceText = fromSection.querySelector('.balance-amount').textContent;
            
            const toCurrency = toSection.querySelector('.currency-option span').textContent;
            const toIcon = toSection.querySelector('.currency-option img').src;
            const toBalanceText = toSection.querySelector('.balance-amount').textContent;
            
            // Проверяем, что валюты разные
            if (fromCurrency === toCurrency) {
                alert('Нельзя обменять одинаковые валюты');
                return;
            }
            
            // Меняем местами валюты
            fromSection.querySelector('.currency-option span').textContent = toCurrency;
            fromSection.querySelector('.currency-option img').src = toIcon;
            fromSection.querySelector('.currency-symbol').textContent = toCurrency;
            fromSection.querySelector('.balance-amount').textContent = toBalanceText;
            
            toSection.querySelector('.currency-option span').textContent = fromCurrency;
            toSection.querySelector('.currency-option img').src = fromIcon;
            toSection.querySelector('.currency-symbol').textContent = fromCurrency;
            toSection.querySelector('.balance-amount').textContent = fromBalanceText;
            
            // Получаем данные для запроса
            let data = getCurrentExchangeData('from');
            
            // Отправляем запрос на бэкенд
            const result = await sendExchangeRequest(data);
            if (result) {
                updateExchangeUI(result);
            }
        });
    }
    
    // ===== КНОПКА ОБМЕНА =====
    const exchangeBtn = document.querySelector('.exchange-action-btn');
    if (exchangeBtn) {
        exchangeBtn.addEventListener('click', async () => {
            const data = getCurrentExchangeData('from');
            
            // Проверяем, что валюты разные
            if (data.from_currency === data.to_currency) {
                alert('Нельзя обменять одинаковые валюты');
                return;
            }
            
            // Получаем актуальные данные с резервами
            const checkResult = await sendExchangeRequest(data);
            
            if (!checkResult) {
                alert('Ошибка при проверке заявки');
                return;
            }
            
            // Если это ошибка резервов, показываем сообщение
            if (checkResult.error === 'insufficient_reserves') {
                alert(`Недостаточно средств у обменника для выдачи ${data.to_currency}. Доступно: ${formatBalance(checkResult.reserves.to, data.to_currency)}`);
                return;
            }
            
            // Проверяем превышение резервов
            if (checkResult.to_amount > checkResult.reserves.to) {
                alert(`Недостаточно средств у обменника для выдачи ${data.to_currency}. Доступно: ${formatBalance(checkResult.reserves.to, data.to_currency)}`);
                return;
            }
            
            // Создаем заявку
            try {
                const response = await fetch('/api/create_order.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from_currency: checkResult.from_currency,
                        to_currency: checkResult.to_currency,
                        from_amount: checkResult.from_amount,
                        to_amount: checkResult.to_amount,
                        usd_equivalent: checkResult.usd_equivalent
                    })
                });
                
                const result = await response.json();
                
                if (result.error) {
                    alert('Ошибка при создании заявки: ' + result.error);
                    return;
                }
                
                if (result.success && result.redirect_url) {
                    window.location.href = result.redirect_url;
                }
                
            } catch (error) {
                console.error('Error creating order:', error);
                alert('Ошибка при создании заявки');
            }
        });
    }
    
    // ===== ЗАПРОС НАЧАЛЬНОГО КУРСА =====
    setTimeout(async () => {
        const fromSection = document.querySelector('.exchange-section:first-child');
        const toSection = document.querySelector('.exchange-section:last-child');
        
        const fromCurrency = fromSection.querySelector('.currency-option span').textContent;
        const toCurrency = toSection.querySelector('.currency-option span').textContent;
        const fromAmount = fromSection.querySelector('input').value;
        
        const initialData = {
            from_currency: fromCurrency,
            to_currency: toCurrency,
            from_amount: parseFloat(fromAmount) || 0,
            to_amount: 0,
            active_field: 'from'
        };
        
        const result = await sendExchangeRequest(initialData);
        if (result) {
            updateExchangeUI(result);
        }
    }, 100);
}

// Запускаем инициализацию после загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExchangeCalculator);
} else {
    initExchangeCalculator();
}