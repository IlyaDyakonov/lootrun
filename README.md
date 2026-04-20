# loot.run

Статическая промо-страница **loot.run**: лендинг с колесом удачи, блоками оффера и декоративной вёрсткой на фоновых изображениях. Стили в `styles.css`, тексты с поддержкой локализации через `data-i18n`.

## Запуск локально

```bash
py -m http.server 8000
```

Откройте в браузере: http://localhost:8000/index.html


.page {
  position: relative;
  width: 393px;
  min-height: 1000px;
  /* Оставляем обрезку по X, но не создаём второй вертикальный скролл у .page */
  overflow-x: clip;
  overflow-y: visible;
  /* background:
    radial-gradient(60% 24% at 50% 9%, rgba(122, 86, 246, 0.18) 0%, rgba(122, 86, 246, 0) 100%),
    linear-gradient(180deg, #15161B 0%, #0D0E10 28%, #0D0E10 100%); */
  --hero-desc-top: 262px;
  --hero-desc-width: 310px;
}

/* Fallback для старых браузеров без поддержки clip */
@supports not (overflow: clip) {
  .page {
    overflow-x: hidden;
    overflow-y: visible;
  }
}
