import { appCopy, type AppLanguage } from "@/lib/i18nData";

export function getWatchTopicsCopy(language: AppLanguage) {
  return appCopy[language].watchTopics;
}
