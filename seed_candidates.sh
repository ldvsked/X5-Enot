#!/usr/bin/env bash

set -euo pipefail

API_URL="${API_URL:-http://localhost:8080/api/v1/submit}"

submit_candidate() {
  local payload="$1"

  echo "POST ${API_URL}"
  curl -sS \
    -X POST "${API_URL}" \
    -H "Content-Type: application/json" \
    -d "${payload}"
  echo
  echo
}

submit_candidate '{
  "enot_id": "enot_1",
  "answers": {
    "fio": "Анна Смирнова",
    "age": "22",
    "city": "Москва",
    "university": "МФТИ",
    "current_work": "Стажер backend",
    "ready_status": "Завтра",
    "schedule": "Полный день",
    "work_type": "Гибрид",
    "exp_level": "3",
    "exp_details": "Backend developer intern, Go services",
    "intern_level": "2",
    "intern_details": "X5 и финтех стажировка",
    "hard_skills": ["Go", "SQL", "Docker", "Linux", "Kubernetes"],
    "achievements": "2",
    "soft_skills": ["Командная работа", "Ответственность", "Коммуникация", "Системное мышление", "Инициативность"]
  }
}'

submit_candidate '{
  "enot_id": "enot_2",
  "answers": {
    "fio": "Илья Петров",
    "age": "24",
    "city": "Санкт-Петербург",
    "university": "ИТМО",
    "current_work": "Junior backend developer",
    "ready_status": "Через неделю",
    "schedule": "Гибкий график",
    "work_type": "Офис",
    "exp_level": "4",
    "exp_details": "Разработка внутренних сервисов на Go и Python",
    "intern_level": "1",
    "intern_details": "Стажировка в ecommerce-команде",
    "hard_skills": ["Go", "SQL", "Docker", "Git", "Linux"],
    "achievements": "1",
    "soft_skills": ["Лидерство", "Коммуникация", "Самообучение", "Критическое мышление", "Адаптивность"]
  }
}'

submit_candidate '{
  "enot_id": "enot_3",
  "answers": {
    "fio": "Мария Кузнецова",
    "age": "23",
    "city": "Казань",
    "university": "КФУ",
    "current_work": "Не работаю",
    "ready_status": "Завтра",
    "schedule": "Полный день",
    "work_type": "Гибрид",
    "exp_level": "2",
    "exp_details": "Учебные и pet-проекты на Go",
    "intern_level": "3",
    "intern_details": "Три стажировки в продуктовых командах",
    "hard_skills": ["Go", "SQL", "Docker", "Linux", "Redis"],
    "achievements": "3",
    "soft_skills": ["Командная работа", "Эмпатия", "Ответственность", "Тайм-менеджмент", "Инициативность"]
  }
}'

submit_candidate '{
  "enot_id": "enot_4",
  "answers": {
    "fio": "Дмитрий Волков",
    "age": "25",
    "city": "Новосибирск",
    "university": "НГУ",
    "current_work": "Backend engineer",
    "ready_status": "Через неделю",
    "schedule": "Полный день",
    "work_type": "Офис",
    "exp_level": "5+",
    "exp_details": "Микросервисы, очереди, API на Go",
    "intern_level": "2",
    "intern_details": "Две стажировки в крупных компаниях",
    "hard_skills": ["Go", "SQL", "Docker", "Kubernetes", "Linux"],
    "achievements": "4",
    "soft_skills": ["Системное мышление", "Лидерство", "Коммуникация", "Ответственность", "Публичные выступления"]
  }
}'

submit_candidate '{
  "enot_id": "enot_5",
  "answers": {
    "fio": "Екатерина Орлова",
    "age": "21",
    "city": "Екатеринбург",
    "university": "УрФУ",
    "current_work": "Стажер-разработчик",
    "ready_status": "Завтра",
    "schedule": "Гибкий график",
    "work_type": "Гибрид",
    "exp_level": "3",
    "exp_details": "Разработка backend API и SQL-отчетов",
    "intern_level": "2",
    "intern_details": "Стажировки в ритейле и банке",
    "hard_skills": ["Go", "SQL", "Docker", "Linux", "Git"],
    "achievements": "2",
    "soft_skills": ["Самообучение", "Командная работа", "Адаптивность", "Ответственность", "Коммуникация"]
  }
}'

echo "Done. 5 candidates submitted."
