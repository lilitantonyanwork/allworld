// Открытие/закрытие мобильного меню
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const closeMenu = document.getElementById('closeMenu');

if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
        mobileMenu.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    closeMenu.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    // Закрытие меню при клике на ссылку
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

// Плавающий заголовок при скролле
const header = document.getElementById('mainHeader');
let lastScrollTop = 0;

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 100) {
        header.classList.add('floating');
    } else {
        header.classList.remove('floating');
    }
    
    lastScrollTop = scrollTop;
});

// Инициализация свайпера для отзывов
let reviewsSwiper = null;

function initReviewsSwiper() {
    if (window.innerWidth <= 768) {
        if (!reviewsSwiper) {
            reviewsSwiper = new Swiper('.reviews-slider', {
                slidesPerView: 1,
                spaceBetween: 20,
                loop: true,
                autoplay: {
                    delay: 5000,
                    disableOnInteraction: false,
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                breakpoints: {
                    640: {
                        slidesPerView: 2,
                    }
                }
            });
        }
    } else {
        if (reviewsSwiper) {
            reviewsSwiper.destroy(true, true);
            reviewsSwiper = null;
        }
        
        // Для десктопа показываем 3 отзыва
        const sliderContainer = document.querySelector('.reviews-slider');
        if (sliderContainer) {
            sliderContainer.classList.add('desktop-mode');
        }
    }
}

// Инициализация свайпера при загрузке и изменении размера
window.addEventListener('load', initReviewsSwiper);
window.addEventListener('resize', initReviewsSwiper);

// Обработка кнопок "Торговать"
const tradeButtons = document.querySelectorAll('.trade-btn');
tradeButtons.forEach(button => {
    button.addEventListener('click', () => {
        const pairCell = button.closest('tr').querySelector('td:first-child');
        const pairName = pairCell.textContent;
        alert(`Начало торговли по паре: ${pairName}`);
    });
});

// Плавный скролл для якорных ссылок
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 100,
                behavior: 'smooth'
            });
            
            // Закрываем мобильное меню если открыто
            if (mobileMenu.classList.contains('active')) {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    });
});

// Анимация появления элементов при скролле
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        }
    });
}, observerOptions);

// Наблюдаем за секциями для анимации
document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    
    // Добавляем CSS для анимаций
    const style = document.createElement('style');
    style.textContent = `
        .animate {
            animation: fadeInUp 0.8s ease forwards;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .desktop-mode .swiper-wrapper {
            display: flex !important;
            gap: 30px;
            transform: none !important;
            width: 100% !important;
        }
        
        .desktop-mode .swiper-slide {
            width: calc((100% - 60px) / 3) !important;
            flex-shrink: 0 !important;
            height: auto;
        }
    `;
    document.head.appendChild(style);
});