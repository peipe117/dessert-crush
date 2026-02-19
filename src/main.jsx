import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './ChineseVocabMatch.jsx' // 引入您的遊戲檔案
import './index.css' // 引入 Tailwind CSS 樣式 (如果您有的話)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)