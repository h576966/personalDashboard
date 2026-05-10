import { getAuthCopy } from "./i18n/domains/auth";
import { getCountsCopy } from "./i18n/domains/counts";
import { getListsCopy } from "./i18n/domains/lists";
import { getModulesCopy } from "./i18n/domains/modules";
import { getNewsCopy } from "./i18n/domains/news";
import { getNewsSettingsCopy } from "./i18n/domains/newsSettings";
import { getNoticesCopy } from "./i18n/domains/notices";
import { getNotesCopy } from "./i18n/domains/notes";
import { getPreferencesCopy } from "./i18n/domains/preferences";
import { getReadLaterCopy } from "./i18n/domains/readLater";
import { getSearchCopy } from "./i18n/domains/search";
import { getSettingsCopy } from "./i18n/domains/settings";
import { getShellCopy } from "./i18n/domains/shell";
import { getShowMoreCopy } from "./i18n/domains/showMore";
import {
  formatShortDate,
  formatShortTime,
  LANGUAGE_OPTIONS,
  LOCALE_BY_LANGUAGE,
  normalizeAppLanguage,
  type AppLanguage,
} from "./i18nData";

const LANGUAGES: AppLanguage[] = ["en", "no", "sv"];

export { formatShortDate, formatShortTime, LANGUAGE_OPTIONS, LOCALE_BY_LANGUAGE, normalizeAppLanguage };
export type { AppLanguage };

export const appCopy = Object.fromEntries(
  LANGUAGES.map((language) => [
    language,
    {
      auth: getAuthCopy(language),
      shell: getShellCopy(language),
      search: getSearchCopy(language),
      modules: getModulesCopy(language),
      settings: getSettingsCopy(language),
      counts: getCountsCopy(language),
      lists: getListsCopy(language),
      notes: getNotesCopy(language),
      readLater: getReadLaterCopy(language),
      news: getNewsCopy(language),
      preferences: getPreferencesCopy(language),
      newsSettings: getNewsSettingsCopy(language),
      notices: getNoticesCopy(language),
      showMore: getShowMoreCopy(language),
    },
  ]),
) as Record<
  AppLanguage,
  {
    auth: ReturnType<typeof getAuthCopy>;
    shell: ReturnType<typeof getShellCopy>;
    search: ReturnType<typeof getSearchCopy>;
    modules: ReturnType<typeof getModulesCopy>;
    settings: ReturnType<typeof getSettingsCopy>;
    counts: ReturnType<typeof getCountsCopy>;
    lists: ReturnType<typeof getListsCopy>;
    notes: ReturnType<typeof getNotesCopy>;
    readLater: ReturnType<typeof getReadLaterCopy>;
    news: ReturnType<typeof getNewsCopy>;
    preferences: ReturnType<typeof getPreferencesCopy>;
    newsSettings: ReturnType<typeof getNewsSettingsCopy>;
    notices: ReturnType<typeof getNoticesCopy>;
    showMore: ReturnType<typeof getShowMoreCopy>;
  }
>;

export type AppCopy = (typeof appCopy)[AppLanguage];

export function getAppCopy(language: AppLanguage): AppCopy {
  return appCopy[language];
}
