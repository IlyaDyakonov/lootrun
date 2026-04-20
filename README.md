# loot.run

Статическая промо-страница **loot.run**: лендинг с колесом удачи, блоками оффера и декоративной вёрсткой на фоновых изображениях. Стили в `styles.css`, тексты с поддержкой локализации через `data-i18n`.

## Запуск локально

```bash
py -m http.server 8000
```

Откройте в браузере: http://localhost:8000/index.html


<!-- html {
  width: 100%;
  min-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
} -->

body {
  width: 100%;
  height: auto;
  background: #0D0E10;
  margin: 0;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-x: hidden;
}

<!-- @supports (-webkit-touch-callout: none) {
  html {
    min-height: -webkit-fill-available;
  }

  body {
    min-height: -webkit-fill-available;
  }
} -->