import type { QuizResponse } from "./types";

export const mockQuiz: QuizResponse = {
  steps: [
    {
      type: "welcome",
      title: "Стажировка в X5",
      image_url: "/static/welcome.webp",
      text: "Пройди путь енота до оффера!",
    },
    {
      type: "avatar_selection",
      title: "Выбери аватара",
      options: [
        { id: "enot_1", name: "Енот 1", img: "/static/enot-avatar-1.webp" },
        { id: "enot_2", name: "Енот 2", img: "/static/enot-avatar-2.webp" },
        { id: "enot_3", name: "Енот 3", img: "/static/enot-avatar-3.webp" },
        { id: "enot_4", name: "Енот 4", img: "/static/enot-avatar-4.webp" },
        { id: "enot_5", name: "Енот 5", img: "/static/enot-avatar-5.webp" },
        { id: "enot_6", name: "Енот 6", img: "/static/enot-avatar-6.webp" },
      ],
    },
    {
      type: "questions",
      block_id: "common_info",
      title: "Общая информация",
      support_image_url: "/static/support-common-info.webp",
      items: [
        { id: "fio", label: "ФИО", ui: "input_text", required: true },
        { id: "age", label: "Возраст", ui: "input_text", required: true },
        { id: "city", label: "Город", ui: "input_text", required: true },
        { id: "university", label: "ВУЗ", ui: "input_text", required: true },
        {
          id: "current_work",
          label: "Место работы (если есть)",
          ui: "input_text",
          required: false,
        },
      ],
    },
    {
      type: "questions",
      block_id: "availability",
      title: "Доступность",
      support_image_url: "/static/support-availability.webp",
      items: [
        {
          id: "ready_status",
          label: "Готов начать",
          ui: "single_select",
          variants: ["Завтра", "Через неделю", "Через месяц"],
        },
        {
          id: "schedule",
          label: "График",
          ui: "single_select",
          variants: ["Полный день", "Гибкий график", "Парт-тайм"],
        },
        {
          id: "work_type",
          label: "Формат работы",
          ui: "single_select",
          variants: ["Офис", "Гибрид", "Удаленка"],
        },
      ],
    },
    {
      type: "questions",
      block_id: "experience_skills",
      title: "Опыт и навыки",
      support_image_url: "/static/support-experience.webp",
      items: [
        {
          id: "exp_level",
          label: "Опыт работы (лет)",
          ui: "single_select",
          variants: ["0", "1", "2", "3", "4", "5+"],
        },
        {
          id: "exp_details",
          label: "Где и кем работал?",
          ui: "input_text",
          show_if: "exp_level != '0'",
        },
        {
          id: "intern_level",
          label: "Стажировки (количество)",
          ui: "single_select",
          variants: ["0", "1", "2", "3", "4", "5+"],
        },
        {
          id: "intern_details",
          label: "Какие стажировки прошел?",
          ui: "input_text",
          show_if: "intern_level != '0'",
        },
        {
          id: "hard_skills",
          label: "Хард-скиллы (выбери до 5)",
          ui: "multi_select",
          max: 5,
          variants: ["Go", "Python", "SQL", "Docker", "Git", "Linux", "Kubernetes", "Redis"],
        },
        {
          id: "achievements",
          label: "Профессиональные достижения / соревнования",
          ui: "single_select",
          variants: ["0", "1", "2", "3", "4", "5+"],
        },
        {
          id: "soft_skills",
          label: "Софт-скиллы (выбери до 5)",
          ui: "multi_select",
          max: 5,
          variants: [
            "Командная работа",
            "Тайм-менеджмент",
            "Коммуникация",
            "Лидерство",
            "Критическое мышление",
          ],
        },
      ],
    },
    {
      type: "final",
      title: "Енот наелся!",
      image_url: "/static/thank-you.webp",
    },
  ],
};
