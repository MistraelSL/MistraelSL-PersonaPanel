import { getUserAvatar, getUserAvatars, initPersona, isPersonaLocked, setPersonaDescription, setUserAvatar, togglePersonaLock, updatePersonaConnectionsAvatarList, user_avatar } from '../../../personas.js';
import { power_user } from '../../../power-user.js';
import { accountStorage } from '../../../util/AccountStorage.js';
import { openWorldInfoEditor, world_names } from '../../../world-info.js';
import { POPUP_RESULT, POPUP_TYPE, Popup } from '../../../popup.js';
import { eventSource, event_types, getThumbnailUrl, setUserName } from '../../../../script.js';

const EXTENSION_NAME = 'MistraelSL Persona Panel';
// Match the desktop CSS: tablets share the PC layout; short touch screens keep the phone layout.
const DESKTOP_LAYOUT_QUERY = '(min-width: 768px) and (min-height: 541px), (min-width: 768px) and (pointer: fine)';
const PANEL_SELECTOR = '#PersonaManagement';
const GLOBAL_LAUNCHER_ID = 'mpp-global-persona-launcher';
const LAUNCHER_POSITION_KEY = 'MistraelSL_PersonaPanel_launcherPosition_v1';
const STORAGE_KEY = 'mistraelsl-persona-panel:appearance';
const GLOBAL_SECTION_KEY = 'mistraelsl-persona-panel:global-expanded';
const EDITOR_SECTION_KEY = 'mistraelsl-persona-panel:editor-expanded-v3';
const DENSITY_KEY = 'MistraelSL_PersonaPanel_density';
const MOBILE_COLUMNS_KEY = 'MistraelSL_PersonaPanel_mobileColumns';
const FAVORITES_KEY = 'MistraelSL_PersonaPanel_favorites';
const WINDOW_MODE_KEY = 'MistraelSL_PersonaPanel_windowMode';
const PORTRAIT_CROP_KEY = 'MistraelSL_PersonaPanel_portraitCrop_v2';
const PERSONA_NOTES_KEY = 'MistraelSL_PersonaPanel_privateNotes_v1';
const SORT_KEY = 'MistraelSL_PersonaPanel_sort_v1';
const PERSONA_FIRST_SEEN_KEY = 'MistraelSL_PersonaPanel_firstSeen_v1';
const PERSONA_MODIFIED_KEY = 'MistraelSL_PersonaPanel_modified_v1';
const PERSONA_USAGE_KEY = 'MistraelSL_PersonaPanel_usage_v1';
const PERSONA_TAGS_KEY = 'MistraelSL_PersonaPanel_tags_v1';
const THEME_ISOLATION_STYLESHEET_ID = 'mpp-theme-isolation-stylesheet';

const imageRevisions = new Map();
let themeIsolationObserver;
let themeIsolationQueued = false;

const DEFAULT_APPEARANCE = Object.freeze({
    theme: 'amethyst',
    customColor: '#a78bfa',
    glassOpacity: 86,
    fontScale: 100,
    launcherEnabled: true,
});

const THEMES = Object.freeze({
    native: {
        accent: 'var(--SmartThemeQuoteColor, #a78bfa)',
        tint: 'var(--SmartThemeBlurTintColor, #171522)',
        text: 'var(--SmartThemeBodyColor, #f5f2ff)',
        muted: 'color-mix(in srgb, var(--SmartThemeBodyColor, #f5f2ff) 60%, transparent)',
        border: 'color-mix(in srgb, var(--SmartThemeBorderColor, #ffffff) 58%, transparent)',
        positive: '#73d9ad',
        warning: '#e8bd72',
        danger: '#ff7587',
    },
    imperial: {
        accent: '#d7b978', tint: '#211b14', text: '#f6ecd9', muted: '#b9aa93',
        border: 'rgba(215, 185, 120, 0.34)', positive: '#7bd3a4', warning: '#e7b965', danger: '#e47a7a',
    },
    amethyst: {
        accent: '#ad8bff', tint: '#191426', text: '#f5f0ff', muted: '#aea2c4',
        border: 'rgba(173, 139, 255, 0.32)', positive: '#75d6ad', warning: '#e8ba70', danger: '#ed7f91',
    },
    nord: {
        accent: '#88c0d0', tint: '#18212b', text: '#e5e9f0', muted: '#9aa8b9',
        border: '#445267', positive: '#8fbc8f', warning: '#ebcb8b', danger: '#bf616a',
    },
    emerald: {
        accent: '#70d6ad', tint: '#12211d', text: '#e9f8f2', muted: '#98b6aa',
        border: 'rgba(112, 214, 173, 0.3)', positive: '#70d6ad', warning: '#e3ba71', danger: '#e77d88',
    },
    crimson: {
        accent: '#e58a98', tint: '#251418', text: '#fff0f2', muted: '#bea0a6',
        border: 'rgba(229, 138, 152, 0.32)', positive: '#7dd1a5', warning: '#e5b86d', danger: '#ff7185',
    },
});

const I18N = {
    en: {
        title: 'Persona Panel',
        library: 'Persona library',
        editShort: 'Edit',
        personaOne: 'persona',
        personaFew: 'personas',
        personaMany: 'personas',
        active: 'Active',
        default: 'Default',
        chat: 'Chat',
        character: 'Character',
        appearance: 'Appearance',
        appearanceHint: 'These settings affect only Persona Panel.',
        theme: 'Color scheme',
        themeHint: 'SillyTavern uses only the app colors. Persona Panel keeps its own layout in every scheme.',
        native: 'SillyTavern colors',
        imperial: 'Imperial',
        amethyst: 'Amethyst',
        nord: 'Nord',
        custom: 'Custom',
        customColor: 'Custom accent color',
        glass: 'Glass visibility',
        font: 'Text size',
        launcherToggle: 'Floating quick-switch button',
        reset: 'Reset appearance',
        close: 'Close appearance settings',
        expand: 'Expand section',
        collapse: 'Collapse section',
        loading: 'Loading…',
        searchByPersonaName: 'Search by persona name',
        all: 'All',
        current: 'Current',
        linked: 'Linked',
        filters: 'Persona filters',
        selectedPersona: 'Current persona',
        noSelection: 'Select a persona to see its details',
        quickSwitch: 'Quick persona switch',
        quickSwitchHint: 'Type to search. Enter selects the first result, Esc closes.',
        openPanel: 'Open persona panel',
        recentPersonas: 'Recent',
        noPersonasFound: 'No personas found.',
        quickActions: 'Persona actions',
        closeQuickSwitch: 'Close quick switch',
        showEditor: 'Show persona editor',
        hideEditor: 'Hide persona editor',
        closePanel: 'Close persona panel',
        portraitShelf: 'Portrait pills',
        compactGrid: 'Compact grid',
        mobileColumns: 'Personas per row',
        backToLibrary: 'Back to persona library',
        emerald: 'Emerald',
        crimson: 'Crimson',
        favorite: 'Add to favorites',
        favorites: 'Favorites',
        favoriteShort: 'Favorite',
        unfavorite: 'Remove from favorites',
        editPersona: 'Edit persona',
        deletePersona: 'Delete persona',
        exportPersona: 'Export persona JSON',
        byMistraelSL: 'by MistraelSL',
        expandWindow: 'Use tall window',
        reduceWindow: 'Use standard window',
        cropPortrait: 'Adjust current persona portrait',
        visualCropPortrait: 'Choose crop area',
        fineTunePortrait: 'Fine-tune with sliders',
        cropInstruction: 'Move the frame and drag its corner to choose the visible area.',
        applyCrop: 'Apply crop',
        cancelCrop: 'Cancel',
        cropHorizontal: 'Horizontal position',
        cropVertical: 'Vertical position',
        cropZoom: 'Zoom',
        resetCrop: 'Reset framing',
        closeCrop: 'Close framing settings',
        createWorkspace: 'Create persona',
        creatorBack: 'Back to persona library',
        creatorName: 'Name me',
        creatorRename: 'Name the persona',
        creatorPhoto: 'Choose persona portrait',
        creatorCropPhoto: 'Adjust portrait crop',
        creatorPhotoRequired: 'Choose a portrait before creating the persona.',
        creatorNameRequired: 'Give the persona a name first.',
        creatorSave: 'Create persona',
        creatorSaveChanges: 'Save changes',
        creatorSaving: 'Creating…',
        creatorSaved: 'Persona created',
        creatorChangesSaved: 'Changes saved',
        creatorError: 'Could not create the persona.',
        creatorDescription: 'Description',
        creatorExpandDescription: 'Expand description',
        creatorPosition: 'Position',
        creatorConnections: 'Connections',
        creatorLorebook: 'Lorebook',
        creatorNotes: 'Private notes',
        creatorNotesHint: 'These notes are visible only here and are not sent to the model.',
        creatorNone: 'None (disabled)',
        creatorInPrompt: 'In Story String / Prompt',
        creatorTopAn: "Top of Author's Note",
        creatorBottomAn: "Bottom of Author's Note",
        creatorAtDepth: 'In-chat @ Depth',
        creatorDepth: 'Depth',
        creatorRole: 'Role',
        creatorSystem: 'System',
        creatorUser: 'User',
        creatorAssistant: 'Assistant',
        creatorDefault: 'Default',
        creatorCharacter: 'Character',
        creatorChat: 'Chat',
        creatorNoLorebook: 'No lorebook',
        linkedCharacters: 'Connected characters',
        openLorebook: 'Open selected lorebook',
        activatePersona: 'Activate persona',
        makeDefault: 'Set as default persona',
        duplicatePersona: 'Duplicate persona',
        changePortrait: 'Choose and crop another portrait',
        undo: 'Undo',
        deletePending: 'The persona will be deleted in {seconds} sec.',
        deleteConfirm: 'Delete this persona?',
        deleteDetails: 'You can undo the deletion for 10 seconds.',
        backupEmpty: 'There are no personas to back up.',
        backupReady: 'Persona backup created.',
        backupFailed: 'Could not create the persona backup.',
        backupFormatTitle: 'Backup format',
        backupFormatHint: 'ZIP includes persona images. JSON contains persona settings without image files.',
        backupZip: 'ZIP with images',
        backupJson: 'JSON',
        restoreReady: 'Persona backup restored.',
        restoreFailed: 'Could not restore this persona backup.',
        sortAz: 'Alphabetical A–Z',
        sortZa: 'Alphabetical Z–A',
        sortModified: 'Date modified',
        sortCreated: 'Date created',
        personaStats: 'Persona statistics',
        statsActivations: 'Activations',
        statsMessages: 'Messages sent as this persona',
        statsCreated: 'Created',
        statsModified: 'Modified',
        statsLastUsed: 'Last used',
        statsTrackedHint: 'Usage is counted locally from this version onward.',
        actionError: 'Could not perform this action.',
        unnamedPersona: 'Unnamed persona',
        noDescription: 'No description',
        pageFirst: 'First page',
        pagePrevious: 'Previous page',
        pageNext: 'Next page',
        pageLast: 'Last page',
        perPage: 'per page',
        cleanupTitle: 'Library cleanup',
        mapTitle: 'Usage map',
        mapHint: 'Where each persona is bound. Click a persona to open it in the editor.',
        mapBound: 'Bound',
        mapOrphans: 'No bindings',
        mapEmpty: 'No personas to show.',
        mapLinks: '{count} linked',
        mapLastUsed: 'used {date}',
        mapMissing: 'missing',
        cleanupHint: 'Duplicates, empty and dusty personas. Protected personas cannot be selected.',
        cleanupDaysLabel: 'Dust threshold',
        cleanupDays: '{days} days',
        cleanupBackup: 'Backup (ZIP)',
        cleanupSelectGroup: 'Select group',
        cleanupEmpty: 'No description',
        cleanupDusty: 'Dusty',
        cleanupSelected: 'Selected: {count}',
        cleanupExportSelected: 'Export selected (JSON)',
        cleanupDeleteSelected: 'Delete selected',
        cleanupDeleteConfirm: 'Delete selected personas?',
        cleanupDeleteHint: 'Deletion is permanent. A ZIP backup is one click above.',
        cleanupDeleted: 'Deleted: {count}.',
        cleanupProtected: 'Protected',
        cleanupLastUsed: 'last used',
        cleanupNoDesc: 'no description',
        cleanupLinked: 'links',
        cleanupDuplicatesHint: 'Same name. The most recently used sits on top.',
        cleanupEmptyHint: 'No description, no links, not the default persona.',
        cleanupDustyHint: 'Not used for longer than the selected period. No links, not favorite, not default.',
        cleanupClean: 'Nothing to clean up — the library is tidy.',
        cleanupDetails: 'Details',
        cleanupOpenInEditor: 'Open in editor',
        cleanupKeepNewest: 'Keep newest',
        cleanupEditActivates: 'Opening the editor switches the active persona. You will return here when it closes.',
        tags: 'Tags',
        tagsHint: 'Enter or comma adds a tag. Tags show up on cards and in the library filters.',
        tagAdd: 'Add tag…',
        tagRemove: 'Remove tag',
        tagCardFilter: 'Filter by tag: {tag}',
    },
    ru: {
        title: 'Панель персон',
        library: 'Библиотека персон',
        editShort: 'Править',
        personaOne: 'персона',
        personaFew: 'персоны',
        personaMany: 'персон',
        active: 'Активна',
        default: 'По умолчанию',
        chat: 'Чат',
        character: 'Персонаж',
        appearance: 'Внешний вид',
        appearanceHint: 'Эти настройки меняют только Persona Panel.',
        theme: 'Цветовая схема',
        themeHint: 'SillyTavern берёт только цвета приложения. Компоновка Persona Panel защищена в любой схеме.',
        native: 'Цвета SillyTavern',
        imperial: 'Имперская',
        amethyst: 'Аметист',
        nord: 'Нордическая',
        custom: 'Свой цвет',
        customColor: 'Свой цвет акцента',
        glass: 'Видимость стекла',
        font: 'Размер текста',
        launcherToggle: 'Плавающая кнопка быстрого выбора',
        reset: 'Сбросить оформление',
        createWorkspace: 'Создание персоны',
        creatorBack: 'Назад к библиотеке персон',
        creatorName: 'Назови меня',
        creatorRename: 'Назвать персону',
        creatorPhoto: 'Выбрать фотографию персоны',
        creatorCropPhoto: 'Настроить кадр фотографии',
        creatorPhotoRequired: 'Сначала выберите фотографию персоны.',
        creatorNameRequired: 'Сначала назовите персону.',
        creatorSave: 'Создать персону',
        creatorSaveChanges: 'Сохранить изменения',
        creatorSaving: 'Создаю…',
        creatorSaved: 'Персона создана',
        creatorChangesSaved: 'Изменения сохранены',
        creatorError: 'Не удалось создать персону.',
        creatorDescription: 'Описание',
        creatorExpandDescription: 'Увеличить описание',
        creatorPosition: 'Позиция',
        creatorConnections: 'Связь',
        creatorLorebook: 'Лорбук',
        creatorNotes: 'Личные заметки',
        creatorNotesHint: 'Заметки видны только здесь и не отправляются модели.',
        creatorNone: 'Нигде (отключено)',
        creatorInPrompt: 'В строке истории / промпте',
        creatorTopAn: 'Вверху заметок автора',
        creatorBottomAn: 'Внизу заметок автора',
        creatorAtDepth: 'В чате на глубине',
        creatorDepth: 'Глубина',
        creatorRole: 'Роль',
        creatorSystem: 'Система',
        creatorUser: 'Пользователь',
        creatorAssistant: 'Ассистент',
        creatorDefault: 'По умолчанию',
        creatorCharacter: 'Персонаж',
        creatorChat: 'Чат',
        creatorNoLorebook: 'Без лорбука',
        linkedCharacters: 'Привязанные персонажи',
        openLorebook: 'Открыть выбранный лорбук',
        activatePersona: 'Сделать персону активной',
        makeDefault: 'Сделать персоной по умолчанию',
        duplicatePersona: 'Дублировать персону',
        changePortrait: 'Выбрать и кадрировать другое фото',
        undo: 'Вернуть',
        deletePending: 'Персона будет удалена через {seconds} сек.',
        deleteConfirm: 'Удалить эту персону?',
        deleteDetails: 'Удаление можно отменить в течение 10 секунд.',
        backupEmpty: 'Нет персон для резервной копии.',
        backupReady: 'Резервная копия персон создана.',
        backupFailed: 'Не удалось создать резервную копию персон.',
        backupFormatTitle: 'Формат резервной копии',
        backupFormatHint: 'ZIP включает фотографии персон. JSON содержит настройки персон без файлов изображений.',
        backupZip: 'ZIP с фотографиями',
        backupJson: 'JSON',
        restoreReady: 'Резервная копия персон восстановлена.',
        restoreFailed: 'Не удалось восстановить эту резервную копию.',
        sortAz: 'По алфавиту А–Я',
        sortZa: 'По алфавиту Я–А',
        sortModified: 'По дате изменения',
        sortCreated: 'По дате создания',
        personaStats: 'Статистика персоны',
        statsActivations: 'Активаций',
        statsMessages: 'Сообщений от этой персоны',
        statsCreated: 'Создана',
        statsModified: 'Изменена',
        statsLastUsed: 'Последнее использование',
        statsTrackedHint: 'Использование считается локально, начиная с этой версии.',
        actionError: 'Не удалось выполнить это действие.',
        unnamedPersona: 'Без имени',
        noDescription: 'Нет описания',
        pageFirst: 'Первая страница',
        pagePrevious: 'Предыдущая страница',
        pageNext: 'Следующая страница',
        pageLast: 'Последняя страница',
        perPage: 'на странице',
        cleanupTitle: 'Уборка библиотеки',
        mapTitle: 'Карта использования',
        mapHint: 'Где привязана каждая персона. Клик по персоне открывает её в редакторе.',
        mapBound: 'С привязками',
        mapOrphans: 'Без привязок',
        mapEmpty: 'Нет персон для показа.',
        mapLinks: 'Привязок: {count}',
        mapLastUsed: 'была {date}',
        mapMissing: 'не найден',
        cleanupHint: 'Дубликаты, пустышки и пыльные персоны. Защищённых выбрать нельзя.',
        cleanupDaysLabel: 'Порог пыли',
        cleanupDays: '{days} дней',
        cleanupBackup: 'Бэкап (ZIP)',
        cleanupSelectGroup: 'Выбрать группу',
        cleanupEmpty: 'Без описания',
        cleanupDusty: 'Пыльные',
        cleanupSelected: 'Выбрано: {count}',
        cleanupExportSelected: 'Экспорт выбранных (JSON)',
        cleanupDeleteSelected: 'Удалить выбранные',
        cleanupDeleteConfirm: 'Удалить выбранные персоны?',
        cleanupDeleteHint: 'Удаление необратимо. ZIP-бэкап — кнопкой выше.',
        cleanupDeleted: 'Удалено: {count}.',
        cleanupProtected: 'Защищена',
        cleanupLastUsed: 'последний раз',
        cleanupNoDesc: 'нет описания',
        cleanupLinked: 'привязки',
        cleanupDuplicatesHint: 'Одинаковые имена. Самая свежая — сверху.',
        cleanupEmptyHint: 'Без описания, без привязок, не дефолтные.',
        cleanupDustyHint: 'Не использовались дольше выбранного срока. Без привязок, не избранные, не дефолтные.',
        cleanupClean: 'Убирать нечего — библиотека чистая.',
        cleanupDetails: 'Подробнее',
        cleanupOpenInEditor: 'Открыть в редакторе',
        cleanupKeepNewest: 'Оставить свежую',
        cleanupEditActivates: 'Открытие редактора сделает эту персону активной. После его закрытия вы вернётесь сюда.',
        tags: 'Теги',
        tagsHint: 'Enter или запятая добавляет тег. Теги появляются на карточках и в фильтрах библиотеки.',
        tagAdd: 'Добавить тег…',
        tagRemove: 'Убрать тег',
        tagCardFilter: 'Фильтр по тегу: {tag}',
        close: 'Закрыть настройки внешнего вида',
        expand: 'Развернуть раздел',
        collapse: 'Свернуть раздел',
        loading: 'Загрузка…',
        searchByPersonaName: 'Поиск по имени персоны',
        all: 'Все',
        current: 'Текущая',
        linked: 'Привязанные',
        filters: 'Фильтры персон',
        selectedPersona: 'Текущая персона',
        noSelection: 'Выберите персону, чтобы увидеть подробности',
        quickSwitch: 'Быстрый выбор персоны',
        quickSwitchHint: 'Введите имя. Enter выбирает первый результат, Esc закрывает.',
        openPanel: 'Открыть панель персон',
        recentPersonas: 'Недавние',
        noPersonasFound: 'Ничего не найдено.',
        quickActions: 'Действия персоны',
        closeQuickSwitch: 'Закрыть быстрый выбор',
        showEditor: 'Показать редактор персоны',
        hideEditor: 'Скрыть редактор персоны',
        closePanel: 'Закрыть панель персон',
        portraitShelf: 'Портретные пилюли',
        compactGrid: 'Компактная сетка',
        mobileColumns: 'Персон в строке',
        backToLibrary: 'Назад к библиотеке персон',
        emerald: 'Изумрудная',
        crimson: 'Багровая',
        favorite: 'Добавить в избранное',
        favorites: 'Избранные',
        favoriteShort: 'Избранная',
        unfavorite: 'Убрать из избранного',
        editPersona: 'Редактировать персону',
        deletePersona: 'Удалить персону',
        exportPersona: 'Экспортировать персону в JSON',
        byMistraelSL: 'от MistraelSL',
        expandWindow: 'Развернуть панель по высоте',
        reduceWindow: 'Вернуть обычную высоту',
        cropPortrait: 'Настроить портрет текущей персоны',
        visualCropPortrait: 'Выбрать область кадра',
        fineTunePortrait: 'Точная настройка ползунками',
        cropInstruction: 'Перемещайте рамку и тяните за её угол, чтобы выбрать видимую область.',
        applyCrop: 'Применить кадр',
        cancelCrop: 'Отмена',
        cropHorizontal: 'Положение по горизонтали',
        cropVertical: 'Положение по вертикали',
        cropZoom: 'Приближение',
        resetCrop: 'Сбросить кадрирование',
        closeCrop: 'Закрыть настройки кадрирования',
    },
};

function getLanguage() {
    const context = globalThis.SillyTavern?.getContext?.();
    const candidates = [
        context?.getCurrentLocale?.(),
        context?.locale,
        context?.language,
        document.documentElement.lang,
        navigator.language,
    ];
    const selected = candidates.find(value => String(value || '').trim());
    return String(selected || '').toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

function t(key) {
    return I18N[getLanguage()]?.[key] ?? I18N.en[key] ?? key;
}

function formatPersonaCount(count) {
    if (getLanguage() !== 'ru') return `${count} ${count === 1 ? t('personaOne') : t('personaMany')}`;
    const lastTwo = count % 100;
    const last = count % 10;
    const form = lastTwo >= 11 && lastTwo <= 14
        ? 'personaMany'
        : last === 1
            ? 'personaOne'
            : last >= 2 && last <= 4
                ? 'personaFew'
                : 'personaMany';
    return `${count} ${t(form)}`;
}

function createElement(tag, className = '', text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function ensureThemeIsolationStylesheet() {
    if (!document.head) return null;

    let stylesheet = document.getElementById(THEME_ISOLATION_STYLESHEET_ID);
    if (!(stylesheet instanceof HTMLLinkElement)) {
        stylesheet = document.createElement('link');
        stylesheet.id = THEME_ISOLATION_STYLESHEET_ID;
        stylesheet.rel = 'stylesheet';
        stylesheet.dataset.mppThemeIsolation = 'true';
        stylesheet.href = new URL('./style.css', import.meta.url).href;
    }

    // Keep the local extension stylesheet after host/user themes in the cascade.
    if (document.head.lastElementChild !== stylesheet) document.head.appendChild(stylesheet);

    if (!themeIsolationObserver) {
        themeIsolationObserver = new MutationObserver(() => {
            if (themeIsolationQueued) return;
            themeIsolationQueued = true;
            queueMicrotask(() => {
                themeIsolationQueued = false;
                ensureThemeIsolationStylesheet();
            });
        });
        themeIsolationObserver.observe(document.head, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['href', 'media', 'disabled'],
        });
    }

    return stylesheet;
}

function personaImageUrl(avatarId) {
    if (!avatarId) return '';
    const path = getUserAvatar(avatarId).split('/').map(encodeURIComponent).join('/');
    const revision = imageRevisions.get(avatarId);
    return `/${path}${revision ? `?mpp=${revision}` : ''}`;
}

function personaThumbnailUrl(avatarId) {
    if (!avatarId) return '';
    const source = getThumbnailUrl('persona', avatarId, false);
    const revision = imageRevisions.get(avatarId);
    return `${source}${revision ? `${source.includes('?') ? '&' : '?'}mpp=${revision}` : ''}`;
}

function markPersonaImageChanged(avatarId) {
    if (avatarId) imageRevisions.set(avatarId, Date.now());
}

function refreshPersonaImages(panel, avatarId) {
    if (!panel || !avatarId) return;
    const source = personaImageUrl(avatarId);
    const escaped = CSS.escape(avatarId);
    panel.querySelectorAll(`#user_avatar_block [data-avatar-id="${escaped}"] img`).forEach(image => {
        image.src = source;
    });
    if (user_avatar === avatarId) {
        const spotlightImage = panel.querySelector('.mpp-spotlight-portrait img');
        if (spotlightImage) spotlightImage.src = source;
    }
}

function loadFirstSeen() {
    try {
        const value = JSON.parse(localStorage.getItem(PERSONA_FIRST_SEEN_KEY) || '{}');
        return value && typeof value === 'object' ? value : {};
    } catch {
        return {};
    }
}

function rememberFirstSeen(avatarIds) {
    const stored = loadFirstSeen();
    let changed = false;
    const now = Date.now();
    avatarIds.forEach((avatarId, index) => {
        if (!Number.isFinite(stored[avatarId])) {
            stored[avatarId] = now + index;
            changed = true;
        }
    });
    if (changed) localStorage.setItem(PERSONA_FIRST_SEEN_KEY, JSON.stringify(stored));
    return stored;
}

function personaTimestamp(avatarId, firstSeen = {}) {
    const match = String(avatarId).match(/^(\d{10,})/);
    return match ? Number(match[1]) : Number(firstSeen[avatarId] || 0);
}

function loadPersonaModified() {
    try {
        const value = JSON.parse(localStorage.getItem(PERSONA_MODIFIED_KEY) || '{}');
        return value && typeof value === 'object' ? value : {};
    } catch {
        return {};
    }
}

function markPersonaModified(avatarId) {
    if (!avatarId) return;
    const value = loadPersonaModified();
    value[avatarId] = Date.now();
    localStorage.setItem(PERSONA_MODIFIED_KEY, JSON.stringify(value));
}

function loadPersonaUsage() {
    try {
        const value = JSON.parse(localStorage.getItem(PERSONA_USAGE_KEY) || '{}');
        return value && typeof value === 'object' ? value : {};
    } catch {
        return {};
    }
}

function recordPersonaUse(avatarId, { message = false } = {}) {
    if (!avatarId || power_user.personas?.[avatarId] === undefined) return;
    const usage = loadPersonaUsage();
    const item = usage[avatarId] && typeof usage[avatarId] === 'object' ? usage[avatarId] : {};
    item.activations = Number(item.activations || 0) + (message ? 0 : 1);
    item.messages = Number(item.messages || 0) + (message ? 1 : 0);
    item.lastUsed = Date.now();
    usage[avatarId] = item;
    localStorage.setItem(PERSONA_USAGE_KEY, JSON.stringify(usage));
}

// Inspection flows switch the active persona behind the user's back; those switches must not
// count as "usage", otherwise inspected personas drop out of the cleanup lists.
let skipNextUsageRecord = false;

function formatStatDate(timestamp) {
    const value = Number(timestamp || 0);
    return value ? new Intl.DateTimeFormat(getLanguage() === 'ru' ? 'ru-RU' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value)) : '—';
}

async function showPersonaStatistics(avatarId) {
    if (!avatarId || power_user.personas?.[avatarId] === undefined) return;
    const usage = loadPersonaUsage()[avatarId] || {};
    const firstSeen = loadFirstSeen();
    const modified = loadPersonaModified();
    const content = createElement('section', 'mpp-persona-stats');
    content.appendChild(createElement('h3', '', power_user.personas[avatarId] || t('personaStats')));
    const rows = [
        [t('statsActivations'), Number(usage.activations || 0)],
        [t('statsMessages'), Number(usage.messages || 0)],
        [t('statsCreated'), formatStatDate(personaTimestamp(avatarId, firstSeen))],
        [t('statsModified'), formatStatDate(modified[avatarId])],
        [t('statsLastUsed'), formatStatDate(usage.lastUsed)],
    ];
    const list = createElement('dl');
    rows.forEach(([label, value]) => {
        list.append(createElement('dt', '', label), createElement('dd', '', String(value)));
    });
    content.append(list, createElement('small', '', t('statsTrackedHint')));
    await new Popup(content, POPUP_TYPE.TEXT, '', { wide: true }).show();
}

function loadFavorites() {
    try {
        const value = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
        return new Set(Array.isArray(value) ? value : []);
    } catch {
        return new Set();
    }
}

const favoritePersonas = loadFavorites();

function saveFavorites() {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favoritePersonas]));
}

function loadPersonaTags() {
    try {
        const value = JSON.parse(localStorage.getItem(PERSONA_TAGS_KEY) || '{}');
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch {
        return {};
    }
}

const personaTags = loadPersonaTags();

function savePersonaTags() {
    localStorage.setItem(PERSONA_TAGS_KEY, JSON.stringify(personaTags));
}

function getPersonaTags(avatarId) {
    const list = personaTags[avatarId];
    return Array.isArray(list) ? list : [];
}

function setPersonaTags(avatarId, tags) {
    if (!avatarId) return;
    const clean = [...new Set(tags.map(tag => String(tag).trim()).filter(Boolean))];
    if (clean.length) personaTags[avatarId] = clean;
    else delete personaTags[avatarId];
    savePersonaTags();
}

function allUsedTags() {
    const found = new Set();
    Object.values(personaTags).forEach(list => {
        if (Array.isArray(list)) list.forEach(tag => found.add(tag));
    });
    const locale = getLanguage() === 'ru' ? 'ru' : 'en';
    return [...found].sort((left, right) => left.localeCompare(right, locale));
}

let globalPersonaLauncher;

function ensureGlobalPersonaLauncher() {
    if (globalPersonaLauncher?.isConnected) return globalPersonaLauncher;
    const existing = document.getElementById(GLOBAL_LAUNCHER_ID);
    if (existing) {
        globalPersonaLauncher = existing;
        return existing;
    }

    const root = createElement('div', 'mpp-global-persona-launcher');
    root.id = GLOBAL_LAUNCHER_ID;

    const button = createElement('button', 'mpp-global-persona-button');
    button.type = 'button';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', t('quickSwitch'));
    const buttonImage = createElement('img');
    buttonImage.alt = '';
    buttonImage.hidden = true;
    buttonImage.draggable = false;
    const buttonFallback = createElement('span', 'mpp-global-persona-fallback', '?');
    button.append(buttonImage, buttonFallback);

    const popover = createElement('section', 'mpp-global-persona-popover');
    popover.hidden = true;
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-label', t('quickSwitch'));
    const head = createElement('header', 'mpp-global-persona-head');
    const titleCopy = createElement('span', 'mpp-global-persona-title');
    titleCopy.append(createElement('strong', '', t('quickSwitch')), createElement('small', '', t('quickSwitchHint')));
    const openPanelButton = createElement('button', 'mpp-global-persona-open');
    openPanelButton.type = 'button';
    openPanelButton.title = t('openPanel');
    openPanelButton.setAttribute('aria-label', t('openPanel'));
    openPanelButton.appendChild(createElement('i', 'fa-solid fa-masks-theater'));
    const closeButton = createElement('button', 'mpp-global-persona-close');
    closeButton.type = 'button';
    closeButton.title = t('closeQuickSwitch');
    closeButton.setAttribute('aria-label', t('closeQuickSwitch'));
    closeButton.appendChild(createElement('i', 'fa-solid fa-xmark'));
    const headActions = createElement('span', 'mpp-global-persona-head-actions');
    headActions.append(openPanelButton, closeButton);
    head.append(titleCopy, headActions);
    const search = createElement('input', 'mpp-global-persona-search');
    search.type = 'search';
    search.placeholder = t('searchByPersonaName');
    search.setAttribute('aria-label', t('searchByPersonaName'));
    const recent = createElement('div', 'mpp-global-persona-recent');
    recent.hidden = true;
    const recentList = createElement('div', 'mpp-global-persona-recent-list');
    recent.append(createElement('small', '', t('recentPersonas')), recentList);
    const list = createElement('div', 'mpp-global-persona-list');
    list.setAttribute('role', 'listbox');
    popover.append(head, search, recent, list);
    root.append(button, popover);
    document.body.appendChild(root);
    // Wear the saved panel theme from the start, not only after the panel was opened once.
    applyAppearanceTokens(root, getAppearanceTokens(getAppearance()));

    let isOpen = false;
    let searchTimer;

    const readLauncherPosition = () => {
        try {
            const value = JSON.parse(localStorage.getItem(LAUNCHER_POSITION_KEY) || 'null');
            if (value && Number.isFinite(Number(value.left)) && Number.isFinite(Number(value.top))) return value;
        } catch {
            // Ignore a broken saved position and fall back to the default corner.
        }
        return null;
    };
    const clampLauncherPosition = (left, top) => {
        const rect = root.getBoundingClientRect();
        const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
        const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
        return {
            left: Math.min(maxLeft, Math.max(8, left)),
            top: Math.min(maxTop, Math.max(8, top)),
        };
    };
    const applyLauncherPosition = position => {
        if (!position) return;
        const next = clampLauncherPosition(Number(position.left), Number(position.top));
        root.style.left = `${next.left}px`;
        root.style.top = `${next.top}px`;
        root.style.right = 'auto';
        root.style.bottom = 'auto';
    };
    const saveLauncherPosition = () => {
        const rect = root.getBoundingClientRect();
        const next = clampLauncherPosition(rect.left, rect.top);
        localStorage.setItem(LAUNCHER_POSITION_KEY, JSON.stringify(next));
    };
    applyLauncherPosition(readLauncherPosition());

    const stateText = avatarId => {
        const connections = power_user.persona_descriptions?.[avatarId]?.connections;
        const chatPersona = globalThis.SillyTavern?.getContext?.()?.chatMetadata?.persona;
        return [
            avatarId === user_avatar ? t('active') : '',
            avatarId === power_user.default_persona ? t('default') : '',
            chatPersona === avatarId ? t('chat') : '',
            Array.isArray(connections) && connections.length ? t('character') : '',
            favoritePersonas.has(avatarId) ? t('favoriteShort') : '',
        ].filter(Boolean).join(' • ');
    };

    const updateButton = () => {
        const hasPersona = Boolean(user_avatar && power_user.personas?.[user_avatar] !== undefined);
        const source = hasPersona ? personaThumbnailUrl(user_avatar) : '';
        if (buttonImage.getAttribute('src') !== source) buttonImage.src = source;
        buttonImage.hidden = !hasPersona;
        buttonFallback.hidden = hasPersona;
        const personaName = hasPersona ? power_user.personas[user_avatar] : '';
        button.title = personaName ? `${t('quickSwitch')}: ${personaName}` : t('quickSwitch');
        button.setAttribute('aria-label', button.title);
    };

    const createPersonaButton = (avatarId, compact = false) => {
        const item = createElement('button', `mpp-global-persona-item${compact ? ' is-compact' : ''}`);
        item.type = 'button';
        item.dataset.avatarId = avatarId;
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', String(avatarId === user_avatar));
        const image = createElement('img');
        image.src = personaThumbnailUrl(avatarId);
        image.alt = '';
        image.loading = 'lazy';
        image.draggable = false;
        const copy = createElement('span', 'mpp-global-persona-item-copy');
        copy.append(
            createElement('strong', '', power_user.personas?.[avatarId] || avatarId || t('unnamedPersona')),
            createElement('small', '', stateText(avatarId) || `[${t('noDescription')}]`),
        );
        const check = createElement('i', 'fa-solid fa-circle-check');
        check.setAttribute('aria-hidden', 'true');
        check.hidden = avatarId !== user_avatar;
        item.append(image, copy, check);
        item.addEventListener('click', async event => {
            event.preventDefault();
            event.stopPropagation();
            if (item.disabled) return;
            item.disabled = true;
            try {
                await setUserAvatar(avatarId);
                setOpen(false);
                updateButton();
            } catch (error) {
                console.error(`[${EXTENSION_NAME}] Could not switch persona from launcher.`, error);
                globalThis.toastr?.error?.(t('actionError'));
            } finally {
                item.disabled = false;
            }
        });
        return item;
    };

    const render = async () => {
        let avatarIds = Object.keys(power_user.personas || {});
        if (!avatarIds.length) avatarIds = await getUserAvatars(false);
        avatarIds = [...new Set(avatarIds)].filter(Boolean);
        const query = search.value.trim().toLocaleLowerCase();
        const locale = getLanguage() === 'ru' ? 'ru' : 'en';
        const nameOf = avatarId => String(power_user.personas?.[avatarId] || avatarId || '');
        const matchesQuery = avatarId => !query || nameOf(avatarId).toLocaleLowerCase().includes(query);
        const sorted = avatarIds
            .filter(matchesQuery)
            .sort((left, right) => Number(favoritePersonas.has(right)) - Number(favoritePersonas.has(left))
                || nameOf(left).localeCompare(nameOf(right), locale));
        const usage = loadPersonaUsage();
        const recentIds = Object.entries(usage)
            .map(([avatarId, item]) => [avatarId, Number(item?.lastUsed || 0)])
            .filter(([avatarId]) => avatarIds.includes(avatarId) && matchesQuery(avatarId))
            .sort((left, right) => right[1] - left[1] || nameOf(left[0]).localeCompare(nameOf(right[0]), locale))
            .map(([avatarId]) => avatarId)
            .filter(avatarId => avatarId !== user_avatar)
            .slice(0, 5);
        recentList.replaceChildren(...recentIds.map(avatarId => createPersonaButton(avatarId, true)));
        recent.hidden = recentIds.length === 0;
        if (!sorted.length) {
            list.replaceChildren(createElement('div', 'mpp-global-persona-empty', t('noPersonasFound')));
            return;
        }
        list.replaceChildren(...sorted.map(avatarId => createPersonaButton(avatarId)));
    };

    const updatePopoverPlacement = () => {
        if (popover.hidden) return;
        const viewport = window.visualViewport;
        const left = (viewport?.offsetLeft || 0) + 8;
        const top = (viewport?.offsetTop || 0) + 8;
        const width = (viewport?.width || window.innerWidth) - 16;
        const height = (viewport?.height || window.innerHeight) - 16;
        popover.style.maxWidth = `${Math.max(0, width)}px`;
        popover.style.maxHeight = `min(540px, ${Math.max(0, height)}px)`;
        const rootRect = root.getBoundingClientRect();
        const popoverRect = popover.getBoundingClientRect();
        const above = rootRect.top - popoverRect.height - 10;
        const preferredTop = above >= top ? above : rootRect.bottom + 10;
        // Either side of a dragged launcher may be too short. Clamp the final box,
        // including when the phone keyboard reduces the visual viewport.
        const x = Math.max(left, Math.min(rootRect.right - popoverRect.width, left + width - popoverRect.width));
        const y = Math.max(top, Math.min(preferredTop, top + height - popoverRect.height));
        popover.style.right = 'auto';
        popover.style.bottom = 'auto';
        popover.style.left = `${x - rootRect.left}px`;
        popover.style.top = `${y - rootRect.top}px`;
    };

    const setOpen = open => {
        isOpen = Boolean(open);
        popover.hidden = !isOpen;
        button.setAttribute('aria-expanded', String(isOpen));
        root.classList.toggle('is-open', isOpen);
        if (!isOpen) return;
        requestAnimationFrame(updatePopoverPlacement);
        render()
            .then(() => {
                search.focus();
                updatePopoverPlacement();
            })
            .catch(error => console.error(`[${EXTENSION_NAME}] Could not render global persona launcher.`, error));
    };

    let dragState = null;
    let suppressNextClick = false;
    button.addEventListener('dragstart', event => event.preventDefault());
    button.addEventListener('pointerdown', event => {
        if (event.button !== 0) return;
        const rect = root.getBoundingClientRect();
        dragState = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            left: rect.left,
            top: rect.top,
            moved: false,
        };
        button.setPointerCapture(event.pointerId);
    });
    button.addEventListener('pointermove', event => {
        if (!dragState || event.pointerId !== dragState.pointerId) return;
        const deltaX = event.clientX - dragState.startX;
        const deltaY = event.clientY - dragState.startY;
        if (!dragState.moved && Math.hypot(deltaX, deltaY) < 5) return;
        if (!dragState.moved) {
            dragState.moved = true;
            root.classList.add('is-dragging');
            if (isOpen) setOpen(false);
        }
        const next = clampLauncherPosition(dragState.left + deltaX, dragState.top + deltaY);
        root.style.left = `${next.left}px`;
        root.style.top = `${next.top}px`;
        root.style.right = 'auto';
        root.style.bottom = 'auto';
        event.preventDefault();
    });
    const finishDrag = event => {
        if (!dragState || event.pointerId !== dragState.pointerId) return;
        const moved = dragState.moved;
        dragState = null;
        root.classList.remove('is-dragging');
        if (!moved) return;
        saveLauncherPosition();
        suppressNextClick = true;
        window.setTimeout(() => {
            suppressNextClick = false;
        }, 120);
    };
    button.addEventListener('pointerup', finishDrag);
    button.addEventListener('pointercancel', finishDrag);
    button.addEventListener('click', event => {
        if (suppressNextClick) {
            event.preventDefault();
            event.stopPropagation();
            suppressNextClick = false;
            return;
        }
        setOpen(!isOpen);
    });
    closeButton.addEventListener('click', () => setOpen(false));
    openPanelButton.addEventListener('click', () => {
        const panel = document.querySelector(PANEL_SELECTOR);
        if (!panel?.classList.contains('openDrawer')) {
            document.querySelector('#persona-management-button .drawer-toggle')?.click();
        }
        setOpen(false);
    });
    search.addEventListener('input', () => {
        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(() => {
            render().catch(error => console.error(`[${EXTENSION_NAME}] Could not filter global persona launcher.`, error));
        }, 60);
    });
    popover.addEventListener('keydown', event => {
        const items = [...popover.querySelectorAll('.mpp-global-persona-item:not([hidden])')];
        if (event.key === 'Escape') {
            event.preventDefault();
            setOpen(false);
            button.focus();
            return;
        }
        if (event.key === 'Enter' && event.target === search) {
            event.preventDefault();
            items[0]?.click();
            return;
        }
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        if (!items.length) return;
        event.preventDefault();
        const currentIndex = items.indexOf(document.activeElement);
        const nextIndex = event.key === 'ArrowDown'
            ? (currentIndex < 0 ? 0 : Math.min(items.length - 1, currentIndex + 1))
            : (currentIndex < 0 ? items.length - 1 : Math.max(0, currentIndex - 1));
        items[nextIndex]?.focus();
    });
    document.addEventListener('pointerdown', event => {
        if (!isOpen || root.contains(event.target)) return;
        setOpen(false);
    });
    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || !isOpen) return;
        event.preventDefault();
        setOpen(false);
        button.focus();
    });
    window.addEventListener('resize', () => {
        applyLauncherPosition(readLauncherPosition());
        updatePopoverPlacement();
    });
    window.visualViewport?.addEventListener('resize', updatePopoverPlacement);
    window.visualViewport?.addEventListener('scroll', updatePopoverPlacement);
    new ResizeObserver(updatePopoverPlacement).observe(popover);

    root.mppUpdate = () => {
        updateButton();
        if (isOpen) render().catch(error => console.error(`[${EXTENSION_NAME}] Could not refresh global persona launcher.`, error));
    };
    root.mppSetEnabled = enabled => {
        const isEnabled = Boolean(enabled);
        root.classList.toggle('is-hidden', !isEnabled);
        if (!isEnabled && isOpen) setOpen(false);
    };
    updateButton();
    root.mppSetEnabled(getAppearance().launcherEnabled);
    globalPersonaLauncher = root;
    return root;
}

function applyLauncherVisibility(enabled) {
    ensureGlobalPersonaLauncher()?.mppSetEnabled?.(enabled);
}

function updateGlobalPersonaLauncher() {
    ensureGlobalPersonaLauncher()?.mppUpdate?.();
}

function loadPortraitCrops() {
    try {
        const value = JSON.parse(localStorage.getItem(PORTRAIT_CROP_KEY) || '{}');
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch {
        return {};
    }
}

const portraitCrops = loadPortraitCrops();

function getPortraitCrop(avatarId) {
    const stored = portraitCrops[avatarId] || {};
    return {
        x: clampNumber(stored.x, 0, 100, 50),
        y: clampNumber(stored.y, 0, 100, 22),
        zoom: clampNumber(stored.zoom, 100, 200, 115),
    };
}

function savePortraitCrop(avatarId, crop) {
    if (!avatarId) return;
    portraitCrops[avatarId] = crop;
    localStorage.setItem(PORTRAIT_CROP_KEY, JSON.stringify(portraitCrops));
}

function resetPortraitCrop(avatarId) {
    if (!avatarId) return;
    delete portraitCrops[avatarId];
    localStorage.setItem(PORTRAIT_CROP_KEY, JSON.stringify(portraitCrops));
}

function getCropGeometry(crop, naturalWidth, naturalHeight, frameRatio) {
    if (!naturalWidth || !naturalHeight || !frameRatio) return null;
    const imageRatio = naturalWidth / naturalHeight;
    const baseWidth = imageRatio >= frameRatio ? frameRatio / imageRatio : 1;
    const baseHeight = imageRatio >= frameRatio ? 1 : imageRatio / frameRatio;
    const zoom = clampNumber(crop.zoom, 100, 200, 115) / 100;
    const width = baseWidth / zoom;
    const height = baseHeight / zoom;
    const centerX = Math.min(1 - width / 2, Math.max(width / 2, clampNumber(crop.x, 0, 100, 50) / 100));
    const centerY = Math.min(1 - height / 2, Math.max(height / 2, clampNumber(crop.y, 0, 100, 22) / 100));
    return { left: centerX - width / 2, top: centerY - height / 2, width, height };
}

function cropGeometryToSettings(geometry, naturalWidth, naturalHeight, frameRatio) {
    const imageRatio = naturalWidth / naturalHeight;
    const baseWidth = imageRatio >= frameRatio ? frameRatio / imageRatio : 1;
    const baseHeight = imageRatio >= frameRatio ? 1 : imageRatio / frameRatio;
    return {
        x: Math.round((geometry.left + geometry.width / 2) * 100),
        y: Math.round((geometry.top + geometry.height / 2) * 100),
        zoom: Math.round(Math.max(baseWidth / geometry.width, baseHeight / geometry.height) * 100),
    };
}

function createIconButton(icon, label, className = '') {
    const button = createElement('button', `mpp-button ${className}`.trim());
    button.type = 'button';
    button.title = label;
    button.setAttribute('aria-label', label);
    const iconElement = createElement('i', `fa-solid ${icon}`);
    iconElement.setAttribute('aria-hidden', 'true');
    button.appendChild(iconElement);
    return button;
}

function clampNumber(value, minimum, maximum, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : fallback;
}

function normalizeColor(value) {
    const color = String(value || '').trim();
    return /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : DEFAULT_APPEARANCE.customColor;
}

function getAppearance() {
    let stored = {};
    try {
        stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
        stored = {};
    }

    const validThemes = [...Object.keys(THEMES), 'custom'];
    return {
        theme: validThemes.includes(stored.theme) ? stored.theme : DEFAULT_APPEARANCE.theme,
        customColor: normalizeColor(stored.customColor),
        glassOpacity: clampNumber(stored.glassOpacity, 65, 98, DEFAULT_APPEARANCE.glassOpacity),
        fontScale: clampNumber(stored.fontScale, 90, 120, DEFAULT_APPEARANCE.fontScale),
        launcherEnabled: typeof stored.launcherEnabled === 'boolean' ? stored.launcherEnabled : DEFAULT_APPEARANCE.launcherEnabled,
    };
}

function saveAppearance(settings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function getSelectedTheme(settings) {
    if (settings.theme !== 'custom') return THEMES[settings.theme] || THEMES.native;
    return {
        accent: settings.customColor,
        tint: `color-mix(in srgb, ${settings.customColor} 17%, #171522)`,
        text: '#f5f2ff',
        muted: '#aaa4b8',
        border: `color-mix(in srgb, ${settings.customColor} 34%, rgba(255, 255, 255, 0.16))`,
        positive: '#73d9ad',
        warning: '#e8bd72',
        danger: '#ff7587',
    };
}

function getAppearanceTokens(settings) {
    const theme = getSelectedTheme(settings);
    const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const fontAdjustment = rootFontSize * ((settings.fontScale - 100) / 100);

    return {
        '--mpp-accent': theme.accent,
        '--mpp-tint': theme.tint,
        '--mpp-text': theme.text,
        '--mpp-muted': theme.muted,
        '--mpp-border': theme.border,
        '--mpp-positive': theme.positive,
        '--mpp-warning': theme.warning,
        '--mpp-danger': theme.danger,
        '--mpp-glass-opacity': `${settings.glassOpacity}%`,
        '--mpp-glass-strong-opacity': `${Math.min(100, settings.glassOpacity + 9)}%`,
        '--mpp-font-adjust': `${fontAdjustment.toFixed(2)}px`,
    };
}

function applyAppearanceTokens(element, tokens) {
    Object.entries(tokens).forEach(([property, value]) => {
        element.style.setProperty(property, value, 'important');
    });
}

function applyAppearance(panel, settings) {
    ensureThemeIsolationStylesheet();
    const tokens = getAppearanceTokens(settings);
    applyAppearanceTokens(panel, tokens);
    panel.dataset.mppTheme = settings.theme;
    panel.dataset.mppIndependent = 'true';

    document.querySelectorAll('.mpp-visual-crop-backdrop[data-mpp-owner="persona-panel"]').forEach(backdrop => {
        applyAppearanceTokens(backdrop, tokens);
        backdrop.dataset.mppTheme = settings.theme;
        backdrop.dataset.mppIndependent = 'true';
    });

    // The floating launcher is var-driven too: let it wear the panel's theme.
    const launcher = document.getElementById(GLOBAL_LAUNCHER_ID);
    if (launcher) applyAppearanceTokens(launcher, tokens);
}

function makeRange({ label, minimum, maximum, value, onInput }) {
    const row = createElement('label', 'mpp-setting-row');
    const labelElement = createElement('span', 'mpp-setting-label', label);
    const control = createElement('span', 'mpp-range-wrap');
    const input = createElement('input', 'mpp-range');
    input.type = 'range';
    input.min = String(minimum);
    input.max = String(maximum);
    input.value = String(value);
    const output = createElement('output', 'mpp-range-output', `${value}%`);
    input.addEventListener('input', () => {
        const nextValue = Number(input.value);
        output.textContent = `${nextValue}%`;
        onInput(nextValue);
    });
    control.append(input, output);
    row.append(labelElement, control);
    return row;
}

function createAppearancePanel(panel, settingsButton) {
    const settings = getAppearance();
    applyAppearance(panel, settings);

    const settingsPanel = createElement('section', 'mpp-appearance');
    settingsPanel.hidden = true;
    const header = createElement('header', 'mpp-appearance-header');
    const copy = createElement('span', 'mpp-appearance-copy');
    copy.append(createElement('strong', '', t('appearance')), createElement('small', '', t('appearanceHint')));
    const closeButton = createIconButton('fa-xmark', t('close'), 'mpp-settings-close');
    header.append(copy, closeButton);

    const themeCopy = createElement('span', 'mpp-theme-copy');
    themeCopy.append(createElement('strong', '', t('theme')), createElement('small', '', t('themeHint')));
    const themeGrid = createElement('div', 'mpp-theme-grid');
    themeGrid.setAttribute('role', 'radiogroup');
    const themeLabels = {
        native: 'native', imperial: 'imperial', amethyst: 'amethyst', nord: 'nord',
        emerald: 'emerald', crimson: 'crimson', custom: 'custom',
    };

    const refreshThemes = () => {
        themeGrid.querySelectorAll('[data-mpp-theme-choice]').forEach(button => {
            const active = button.dataset.mppThemeChoice === settings.theme;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-checked', String(active));
        });
    };

    Object.keys(themeLabels).forEach(themeId => {
        const previewTheme = themeId === 'custom'
            ? { accent: settings.customColor, tint: '#171522', text: '#f5f2ff' }
            : THEMES[themeId];
        const button = createElement('button', 'mpp-theme-swatch');
        button.type = 'button';
        button.dataset.mppThemeChoice = themeId;
        button.setAttribute('role', 'radio');
        button.style.setProperty('--mpp-swatch-accent', previewTheme.accent);
        button.style.setProperty('--mpp-swatch-tint', previewTheme.tint);
        button.style.setProperty('--mpp-swatch-text', previewTheme.text);
        const preview = createElement('span', 'mpp-theme-preview');
        preview.append(createElement('i', 'is-accent'), createElement('i'), createElement('i', 'is-short'));
        button.append(preview, createElement('span', 'mpp-theme-name', t(themeLabels[themeId])));
        button.addEventListener('click', () => {
            settings.theme = themeId;
            saveAppearance(settings);
            applyAppearance(panel, settings);
            refreshThemes();
        });
        themeGrid.appendChild(button);
    });

    const colorRow = createElement('label', 'mpp-setting-row');
    colorRow.appendChild(createElement('span', 'mpp-setting-label', t('customColor')));
    const colorInput = createElement('input', 'mpp-color-input');
    colorInput.type = 'color';
    colorInput.value = settings.customColor;
    colorInput.addEventListener('input', () => {
        settings.customColor = normalizeColor(colorInput.value);
        settings.theme = 'custom';
        const swatch = themeGrid.querySelector('[data-mpp-theme-choice="custom"]');
        swatch?.style.setProperty('--mpp-swatch-accent', settings.customColor);
        saveAppearance(settings);
        applyAppearance(panel, settings);
        refreshThemes();
    });
    colorRow.appendChild(colorInput);

    const glassRange = makeRange({
        label: t('glass'), minimum: 65, maximum: 98, value: settings.glassOpacity,
        onInput: value => {
            settings.glassOpacity = value;
            saveAppearance(settings);
            applyAppearance(panel, settings);
        },
    });
    const fontRange = makeRange({
        label: t('font'), minimum: 90, maximum: 120, value: settings.fontScale,
        onInput: value => {
            settings.fontScale = value;
            saveAppearance(settings);
            applyAppearance(panel, settings);
        },
    });
    const launcherRow = createElement('label', 'mpp-setting-row');
    launcherRow.appendChild(createElement('span', 'mpp-setting-label', t('launcherToggle')));
    const launcherToggle = createElement('input', 'mpp-toggle');
    launcherToggle.type = 'checkbox';
    launcherToggle.checked = settings.launcherEnabled;
    launcherToggle.setAttribute('role', 'switch');
    launcherToggle.setAttribute('aria-label', t('launcherToggle'));
    launcherToggle.setAttribute('aria-checked', String(settings.launcherEnabled));
    launcherToggle.addEventListener('change', () => {
        settings.launcherEnabled = launcherToggle.checked;
        launcherToggle.setAttribute('aria-checked', String(settings.launcherEnabled));
        saveAppearance(settings);
        applyLauncherVisibility(settings.launcherEnabled);
    });
    launcherRow.appendChild(launcherToggle);
    const resetButton = createElement('button', 'mpp-button mpp-reset');
    resetButton.type = 'button';
    resetButton.append(createElement('i', 'fa-solid fa-arrow-rotate-left'), createElement('span', '', t('reset')));
    resetButton.addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEY);
        const defaults = getAppearance();
        Object.assign(settings, defaults);
        applyAppearance(panel, settings);
        launcherToggle.checked = settings.launcherEnabled;
        launcherToggle.setAttribute('aria-checked', String(settings.launcherEnabled));
        applyLauncherVisibility(settings.launcherEnabled);
        colorInput.value = settings.customColor;
        const customSwatch = themeGrid.querySelector('[data-mpp-theme-choice="custom"]');
        customSwatch?.style.setProperty('--mpp-swatch-accent', settings.customColor);
        const ranges = settingsPanel.querySelectorAll('.mpp-range');
        const outputs = settingsPanel.querySelectorAll('.mpp-range-output');
        if (ranges[0]) ranges[0].value = String(settings.glassOpacity);
        if (ranges[1]) ranges[1].value = String(settings.fontScale);
        if (outputs[0]) outputs[0].textContent = `${settings.glassOpacity}%`;
        if (outputs[1]) outputs[1].textContent = `${settings.fontScale}%`;
        refreshThemes();
    });

    const setOpen = open => {
        settingsPanel.hidden = !open;
        settingsButton.classList.toggle('is-active', open);
        settingsButton.setAttribute('aria-expanded', String(open));
    };
    settingsButton.setAttribute('aria-expanded', 'false');
    settingsButton.addEventListener('click', () => setOpen(settingsPanel.hidden));
    closeButton.addEventListener('click', () => setOpen(false));
    settingsPanel.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            setOpen(false);
            settingsButton.focus();
        }
    });

    settingsPanel.append(header, themeCopy, themeGrid, colorRow, glassRange, fontRange, launcherRow, resetButton);
    refreshThemes();
    return settingsPanel;
}

function createHero(panel, nativeHeader) {
    const hero = createElement('header', 'mpp-hero');
    const brand = createElement('div', 'mpp-brand');
    const icon = createElement('span', 'mpp-brand-icon');
    icon.innerHTML = '<i class="fa-solid fa-masks-theater" aria-hidden="true"></i>';
    const brandCopy = createElement('span', 'mpp-brand-copy');
    const titleRow = createElement('span', 'mpp-title-row');
    const title = createElement('h2');
    title.append(document.createTextNode(t('title')), createElement('span', 'mpp-brand-attribution', ` ${t('byMistraelSL')}`));
    titleRow.appendChild(title);
    const nativeDocsLink = nativeHeader.querySelector('h3 a');
    if (nativeDocsLink) titleRow.appendChild(nativeDocsLink);
    brandCopy.appendChild(titleRow);
    brand.append(icon, brandCopy);

    const actions = createElement('div', 'mpp-hero-actions');
    const nativeActions = panel.querySelector('#personas_backup')?.parentElement;
    if (nativeActions) {
        nativeActions.classList.add('mpp-native-actions');
        actions.appendChild(nativeActions);
        const backupButton = nativeActions.querySelector('#personas_backup');
        const restoreButton = nativeActions.querySelector('#personas_restore');
        const statsButton = nativeActions.querySelector('.user_stats_button');
        const zipInput = createElement('input', 'mpp-zip-restore-input');
        zipInput.type = 'file';
        zipInput.accept = '.zip,.json,application/zip,application/json';
        zipInput.hidden = true;
        actions.appendChild(zipInput);
        statsButton?.addEventListener('click', async event => {
            const editorAvatarId = panel.mppPersonaEditorAvatarId?.();
            if (!panel.classList.contains('mpp-creating') || !editorAvatarId) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            try { await showPersonaStatistics(editorAvatarId); }
            catch (error) {
                console.error(`[${EXTENSION_NAME}] Could not show persona statistics.`, error);
                globalThis.toastr?.error?.(t('actionError'));
            }
        }, { capture: true });
        backupButton?.addEventListener('click', async event => {
            event.preventDefault();
            event.stopImmediatePropagation();
            try {
                const editorAvatarId = panel.mppPersonaEditorAvatarId?.();
                if (panel.classList.contains('mpp-creating') && editorAvatarId) await exportPersonaJson(editorAvatarId);
                else if (!panel.classList.contains('mpp-creating')) {
                    const choice = await Popup.show.confirm(t('backupFormatTitle'), t('backupFormatHint'), {
                        okButton: t('backupZip'),
                        cancelButton: t('cancelCrop'),
                        customButtons: [{ text: t('backupJson'), result: POPUP_RESULT.CUSTOM1 }],
                    });
                    if (choice === POPUP_RESULT.CUSTOM1) await exportAllPersonasJson();
                    else if (choice === POPUP_RESULT.AFFIRMATIVE) await exportAllPersonasZip();
                }
            } catch (error) {
                console.error(`[${EXTENSION_NAME}] Could not create persona backup.`, error);
                globalThis.toastr?.error?.(t('backupFailed'));
            }
        }, { capture: true });
        restoreButton?.addEventListener('click', event => {
            event.preventDefault();
            event.stopImmediatePropagation();
            zipInput.click();
        }, { capture: true });
        zipInput.addEventListener('change', async () => {
            const file = zipInput.files?.[0];
            zipInput.value = '';
            if (!file) return;
            try {
                if (file.name.toLocaleLowerCase().endsWith('.json') || file.type === 'application/json') await restorePersonaJson(file, panel);
                else await restorePersonasZip(file, panel);
            }
            catch (error) {
                console.error(`[${EXTENSION_NAME}] Could not restore persona backup.`, error);
                globalThis.toastr?.error?.(t('restoreFailed'));
            }
        });
    }
    const windowModeButton = createIconButton('fa-expand', t('expandWindow'), 'mpp-window-mode-button');
    const settingsButton = createIconButton('fa-paintbrush', t('appearance'), 'mpp-settings-button');
    const editorButton = createIconButton('fa-pen-to-square', t('hideEditor'), 'mpp-editor-button');
    editorButton.hidden = true;
    const closeButton = createIconButton('fa-xmark', t('closePanel'), 'mpp-panel-close');
    let windowMode = localStorage.getItem(WINDOW_MODE_KEY) === 'tall' ? 'tall' : 'standard';
    const renderWindowMode = () => {
        const isTall = windowMode === 'tall';
        panel.dataset.mppWindowMode = windowMode;
        const label = t(isTall ? 'reduceWindow' : 'expandWindow');
        windowModeButton.title = label;
        windowModeButton.setAttribute('aria-label', label);
        windowModeButton.setAttribute('aria-pressed', String(isTall));
        windowModeButton.querySelector('i')?.classList.toggle('fa-expand', !isTall);
        windowModeButton.querySelector('i')?.classList.toggle('fa-compress', isTall);
    };
    windowModeButton.addEventListener('click', () => {
        windowMode = windowMode === 'tall' ? 'standard' : 'tall';
        localStorage.setItem(WINDOW_MODE_KEY, windowMode);
        renderWindowMode();
    });
    renderWindowMode();
    closeButton.addEventListener('click', () => {
        document.querySelector('#persona-management-button .drawer-toggle')?.click();
    });
    actions.append(windowModeButton, settingsButton, editorButton, closeButton);
    hero.append(brand, actions);
    return { hero, settingsButton, editorButton };
}

function setupDesktopDimmer(panel) {
    const dimmer = createElement('div', 'mpp-page-dimmer');
    dimmer.setAttribute('aria-hidden', 'true');
    if (panel.parentElement) panel.parentElement.insertBefore(dimmer, panel);
    else document.body.appendChild(dimmer);
    const desktopQuery = window.matchMedia(DESKTOP_LAYOUT_QUERY);
    const update = () => {
        const isOpen = panel.classList.contains('openDrawer');
        dimmer.classList.toggle('is-visible', desktopQuery.matches && isOpen);
        /* Programmatic toggle clicks (ESC cascade, dimmer, hero close) focus the native
           drawer icon, so it keeps the theme's :focus glow after the panel closes. */
        if (!isOpen) {
            const active = document.activeElement;
            if (active instanceof HTMLElement && (active.closest('#persona-management-button') || panel.contains(active))) {
                active.blur();
            }
        }
    };
    dimmer.addEventListener('click', () => {
        document.querySelector('#persona-management-button .drawer-toggle')?.click();
    });
    new MutationObserver(update).observe(panel, { attributes: true, attributeFilter: ['class'] });
    desktopQuery.addEventListener?.('change', update);
    update();
}

function createSpotlight(panel, editorButton) {
    const spotlight = createElement('section', 'mpp-spotlight');
    const portrait = createElement('span', 'mpp-spotlight-portrait');
    const image = createElement('img');
    image.alt = '';
    portrait.appendChild(image);

    const copy = createElement('span', 'mpp-spotlight-copy');
    const kicker = createElement('small', '', t('selectedPersona'));
    const name = createElement('strong', '', t('loading'));
    const chips = createElement('span', 'mpp-spotlight-chips');
    chips.hidden = true;
    const actions = createElement('span', 'mpp-spotlight-actions');
    actions.hidden = true;
    actions.setAttribute('aria-label', t('quickActions'));
    const hint = createElement('span', 'mpp-spotlight-status', t('noSelection'));
    copy.append(kicker, name, chips, actions, hint);

    const visualCropButton = createIconButton('fa-crop-simple', t('visualCropPortrait'), 'mpp-spotlight-visual-crop-button');
    const slidersButton = createIconButton('fa-sliders', t('fineTunePortrait'), 'mpp-spotlight-crop-button');
    slidersButton.setAttribute('aria-expanded', 'false');

    let currentAvatarId = '';

    const getPersonaStates = avatarId => {
        if (!avatarId || power_user.personas?.[avatarId] === undefined) return [];
        const connections = power_user.persona_descriptions?.[avatarId]?.connections;
        const chatPersona = globalThis.SillyTavern?.getContext?.()?.chatMetadata?.persona;
        return [
            avatarId === user_avatar ? ['active', 'fa-circle-check', t('active')] : null,
            avatarId === power_user.default_persona ? ['default', 'fa-crown', t('default')] : null,
            chatPersona === avatarId ? ['chat', 'fa-comments', t('chat')] : null,
            Array.isArray(connections) && connections.length ? ['character', 'fa-user', t('character')] : null,
            favoritePersonas.has(avatarId) ? ['favorite', 'fa-star', t('favoriteShort')] : null,
        ].filter(Boolean);
    };

    const openCurrentPersonaEditor = async () => {
        if (currentAvatarId && typeof panel.mppOpenPersonaEditor === 'function') {
            await setUserAvatar(currentAvatarId, { toastPersonaNameChange: false });
            await panel.mppOpenPersonaEditor(currentAvatarId, personaImageUrl(currentAvatarId));
            return;
        }
        if (panel.classList.contains('mpp-editor-collapsed')) editorButton.click();
        panel.querySelector('.mpp-editor-column')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    const runSpotlightAction = async (button, handler) => {
        if (!currentAvatarId || button.disabled) return;
        button.disabled = true;
        try {
            await handler();
            update();
        } catch (error) {
            console.error(`[${EXTENSION_NAME}] Spotlight action failed.`, error);
            globalThis.toastr?.error?.(t('actionError'));
        } finally {
            button.disabled = false;
        }
    };

    const editAction = createIconButton('fa-pen-to-square', t('editPersona'), 'mpp-spotlight-action');
    const favoriteAction = createIconButton('fa-star', t('favorite'), 'mpp-spotlight-action mpp-spotlight-favorite');
    const defaultAction = createIconButton('fa-crown', t('makeDefault'), 'mpp-spotlight-action mpp-spotlight-default');
    const duplicateAction = createIconButton('fa-clone', t('duplicatePersona'), 'mpp-spotlight-action');
    const exportAction = createIconButton('fa-file-export', t('exportPersona'), 'mpp-spotlight-action');
    const statsAction = createIconButton('fa-chart-simple', t('personaStats'), 'mpp-spotlight-action');
    actions.append(editAction, favoriteAction, defaultAction, duplicateAction, exportAction, statsAction);

    editAction.addEventListener('click', () => runSpotlightAction(editAction, openCurrentPersonaEditor));
    favoriteAction.addEventListener('click', () => runSpotlightAction(favoriteAction, async () => {
        if (favoritePersonas.has(currentAvatarId)) favoritePersonas.delete(currentAvatarId);
        else favoritePersonas.add(currentAvatarId);
        saveFavorites();
        await panel.mppRefresh?.();
    }));
    defaultAction.addEventListener('click', () => runSpotlightAction(defaultAction, async () => {
        await setUserAvatar(currentAvatarId, { toastPersonaNameChange: false });
        await togglePersonaLock('default');
        await panel.mppRefresh?.();
    }));
    duplicateAction.addEventListener('click', () => runSpotlightAction(duplicateAction, () => duplicatePersonaThroughSillyTavern(panel, currentAvatarId)));
    exportAction.addEventListener('click', () => runSpotlightAction(exportAction, () => exportPersonaJson(currentAvatarId)));
    statsAction.addEventListener('click', () => runSpotlightAction(statsAction, () => showPersonaStatistics(currentAvatarId)));

    const cropPanel = createElement('section', 'mpp-crop-panel');
    cropPanel.hidden = true;
    const cropHeader = createElement('header', 'mpp-crop-header');
    cropHeader.appendChild(createElement('strong', '', t('fineTunePortrait')));
    const closeCropButton = createIconButton('fa-xmark', t('closeCrop'), 'mpp-crop-close');
    cropHeader.appendChild(closeCropButton);

    const cropControls = createElement('div', 'mpp-crop-controls');
    const cropInputs = {};
    const makeCropRange = (key, label, minimum, maximum) => {
        const row = createElement('label', 'mpp-crop-row');
        const labelText = createElement('span', '', label);
        const input = createElement('input');
        input.type = 'range';
        input.min = String(minimum);
        input.max = String(maximum);
        input.step = '1';
        const output = createElement('output');
        row.append(labelText, input, output);
        cropControls.appendChild(row);
        cropInputs[key] = { input, output };
    };
    makeCropRange('x', t('cropHorizontal'), 0, 100);
    makeCropRange('y', t('cropVertical'), 0, 100);
    makeCropRange('zoom', t('cropZoom'), 100, 200);
    const resetCropButton = createElement('button', 'mpp-button mpp-crop-reset');
    resetCropButton.type = 'button';
    resetCropButton.append(createElement('i', 'fa-solid fa-arrow-rotate-left'), createElement('span', '', t('resetCrop')));
    cropPanel.append(cropHeader, cropControls, resetCropButton);

    const cropModalBackdrop = createElement('div', 'mpp-visual-crop-backdrop');
    cropModalBackdrop.dataset.mppOwner = 'persona-panel';
    cropModalBackdrop.hidden = true;
    cropModalBackdrop.tabIndex = -1;
    const cropModal = createElement('section', 'mpp-visual-crop-modal');
    cropModal.setAttribute('role', 'dialog');
    cropModal.setAttribute('aria-modal', 'true');
    const modalHeader = createElement('header', 'mpp-visual-crop-header');
    const modalHeading = createElement('span');
    modalHeading.append(createElement('strong', '', t('visualCropPortrait')), createElement('small', '', t('cropInstruction')));
    const modalClose = createIconButton('fa-xmark', t('cancelCrop'), 'mpp-visual-crop-close');
    modalHeader.append(modalHeading, modalClose);
    const cropStage = createElement('div', 'mpp-visual-crop-stage');
    const stageImage = createElement('img', 'mpp-visual-crop-image');
    stageImage.alt = '';
    stageImage.draggable = false;
    const cropSelection = createElement('div', 'mpp-visual-crop-selection');
    cropSelection.hidden = true;
    const cropHandle = createElement('span', 'mpp-visual-crop-handle');
    cropSelection.appendChild(cropHandle);
    cropStage.append(stageImage, cropSelection);
    const modalActions = createElement('footer', 'mpp-visual-crop-actions');
    const cancelCropButton = createElement('button', 'mpp-button');
    cancelCropButton.type = 'button';
    cancelCropButton.textContent = t('cancelCrop');
    const applyCropButton = createElement('button', 'mpp-button mpp-visual-crop-apply');
    applyCropButton.type = 'button';
    applyCropButton.textContent = t('applyCrop');
    modalActions.append(cancelCropButton, applyCropButton);
    cropModal.append(modalHeader, cropStage, modalActions);
    cropModalBackdrop.appendChild(cropModal);
    document.body.appendChild(cropModalBackdrop);

    const openEditor = createElement('button', 'mpp-button mpp-spotlight-edit');
    openEditor.type = 'button';
    openEditor.append(createElement('i', 'fa-solid fa-pen-to-square'), createElement('span', '', t('showEditor')));
    openEditor.addEventListener('click', () => runSpotlightAction(openEditor, openCurrentPersonaEditor));
    spotlight.append(portrait, copy, visualCropButton, slidersButton, openEditor, cropPanel);

    let currentCrop = getPortraitCrop('');
    let modalOriginalCrop = null;
    let modalGeometry = null;
    let modalImageRect = null;

    const getFrameRatio = () => {
        const rect = portrait.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 ? rect.width / rect.height : 4.4;
    };

    const applyCrop = crop => {
        currentCrop = { x: Number(crop.x), y: Number(crop.y), zoom: Number(crop.zoom) };
        Object.entries(cropInputs).forEach(([key, elements]) => {
            const value = currentCrop[key];
            elements.input.value = String(value);
            elements.output.textContent = key === 'zoom' ? `${value}%` : String(value);
        });
        const geometry = getCropGeometry(currentCrop, image.naturalWidth, image.naturalHeight, getFrameRatio());
        if (!geometry) return;
        image.style.width = `${100 / geometry.width}%`;
        image.style.height = `${100 / geometry.height}%`;
        image.style.left = `${-geometry.left / geometry.width * 100}%`;
        image.style.top = `${-geometry.top / geometry.height * 100}%`;
    };
    const readCropControls = () => ({
        x: Number(cropInputs.x.input.value),
        y: Number(cropInputs.y.input.value),
        zoom: Number(cropInputs.zoom.input.value),
    });
    const setCropPanelOpen = open => {
        cropPanel.hidden = !open;
        slidersButton.classList.toggle('is-active', open);
        slidersButton.setAttribute('aria-expanded', String(open));
    };
    slidersButton.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        setCropPanelOpen(cropPanel.hidden);
    });
    closeCropButton.addEventListener('click', () => setCropPanelOpen(false));
    cropPanel.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            setCropPanelOpen(false);
            slidersButton.focus();
        }
    });
    Object.values(cropInputs).forEach(({ input }) => {
        input.addEventListener('input', () => applyCrop(readCropControls()));
        input.addEventListener('change', () => savePortraitCrop(currentAvatarId, readCropControls()));
    });
    resetCropButton.addEventListener('click', () => {
        resetPortraitCrop(currentAvatarId);
        applyCrop(getPortraitCrop(currentAvatarId));
    });

    const getContainedImageRect = () => {
        const stageRect = cropStage.getBoundingClientRect();
        if (!stageImage.naturalWidth || !stageImage.naturalHeight || !stageRect.width || !stageRect.height) return null;
        const imageRatio = stageImage.naturalWidth / stageImage.naturalHeight;
        const stageRatio = stageRect.width / stageRect.height;
        if (imageRatio >= stageRatio) {
            const width = stageRect.width;
            const height = width / imageRatio;
            return { left: 0, top: (stageRect.height - height) / 2, width, height };
        }
        const height = stageRect.height;
        const width = height * imageRatio;
        return { left: (stageRect.width - width) / 2, top: 0, width, height };
    };

    const renderModalCrop = crop => {
        if (!stageImage.naturalWidth || !stageImage.naturalHeight) return;
        modalImageRect = getContainedImageRect();
        if (!modalImageRect) return;
        stageImage.style.left = `${modalImageRect.left}px`;
        stageImage.style.top = `${modalImageRect.top}px`;
        stageImage.style.width = `${modalImageRect.width}px`;
        stageImage.style.height = `${modalImageRect.height}px`;
        modalGeometry = getCropGeometry(crop, stageImage.naturalWidth, stageImage.naturalHeight, getFrameRatio());
        if (!modalGeometry) return;
        cropSelection.style.left = `${modalImageRect.left + modalGeometry.left * modalImageRect.width}px`;
        cropSelection.style.top = `${modalImageRect.top + modalGeometry.top * modalImageRect.height}px`;
        cropSelection.style.width = `${modalGeometry.width * modalImageRect.width}px`;
        cropSelection.style.height = `${modalGeometry.height * modalImageRect.height}px`;
        cropSelection.hidden = false;
    };

    const closeVisualCrop = apply => {
        if (!apply && modalOriginalCrop) applyCrop(modalOriginalCrop);
        cropModalBackdrop.hidden = true;
        cropSelection.hidden = true;
        modalOriginalCrop = null;
        modalGeometry = null;
    };

    const openVisualCrop = () => {
        if (!currentAvatarId || !image.src) return;
        setCropPanelOpen(false);
        modalOriginalCrop = { ...currentCrop };
        cropSelection.hidden = true;
        stageImage.src = image.src;
        const panelStyle = getComputedStyle(panel);
        ['--mpp-text', '--mpp-muted', '--mpp-border', '--mpp-accent', '--mpp-tint'].forEach(property => {
            cropModalBackdrop.style.setProperty(property, panelStyle.getPropertyValue(property), 'important');
        });
        cropModalBackdrop.dataset.mppTheme = panel.dataset.mppTheme || '';
        cropModalBackdrop.dataset.mppIndependent = 'true';
        cropModalBackdrop.hidden = false;
        requestAnimationFrame(() => {
            renderModalCrop(currentCrop);
            cropModalBackdrop.focus();
        });
    };

    visualCropButton.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        openVisualCrop();
    });
    stageImage.addEventListener('load', () => renderModalCrop(currentCrop));
    modalClose.addEventListener('click', () => closeVisualCrop(false));
    cancelCropButton.addEventListener('click', () => closeVisualCrop(false));
    applyCropButton.addEventListener('click', () => {
        savePortraitCrop(currentAvatarId, currentCrop);
        closeVisualCrop(true);
    });
    ['pointerdown', 'mousedown'].forEach(eventName => {
        cropModalBackdrop.addEventListener(eventName, event => event.stopPropagation());
    });
    cropModalBackdrop.addEventListener('click', event => {
        event.stopPropagation();
        if (event.target === cropModalBackdrop) closeVisualCrop(false);
    });
    cropModalBackdrop.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeVisualCrop(false);
    });

    let cropInteraction = null;
    cropSelection.addEventListener('pointerdown', event => {
        if (!modalGeometry || !modalImageRect) return;
        event.preventDefault();
        cropSelection.setPointerCapture(event.pointerId);
        cropInteraction = {
            mode: event.target === cropHandle ? 'resize' : 'move',
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            geometry: { ...modalGeometry },
        };
    });
    cropSelection.addEventListener('pointermove', event => {
        if (!cropInteraction || event.pointerId !== cropInteraction.pointerId || !modalImageRect) return;
        const start = cropInteraction.geometry;
        let geometry = { ...start };
        const deltaX = (event.clientX - cropInteraction.startX) / modalImageRect.width;
        const deltaY = (event.clientY - cropInteraction.startY) / modalImageRect.height;
        if (cropInteraction.mode === 'move') {
            geometry.left = Math.min(1 - geometry.width, Math.max(0, start.left + deltaX));
            geometry.top = Math.min(1 - geometry.height, Math.max(0, start.top + deltaY));
        } else {
            const imageRatio = stageImage.naturalWidth / stageImage.naturalHeight;
            const frameRatio = getFrameRatio();
            const widthFromX = start.width + deltaX;
            const widthFromY = (start.height + deltaY) * frameRatio / imageRatio;
            const proposedWidth = Math.abs(deltaX) >= Math.abs(deltaY) ? widthFromX : widthFromY;
            const base = getCropGeometry({ x: 50, y: 50, zoom: 100 }, stageImage.naturalWidth, stageImage.naturalHeight, frameRatio);
            const minWidth = base.width / 2;
            const maxWidth = Math.min(base.width, 1 - start.left, (1 - start.top) * frameRatio / imageRatio);
            geometry.width = Math.min(maxWidth, Math.max(minWidth, proposedWidth));
            geometry.height = geometry.width * imageRatio / frameRatio;
        }
        const settings = cropGeometryToSettings(geometry, stageImage.naturalWidth, stageImage.naturalHeight, getFrameRatio());
        applyCrop(settings);
        renderModalCrop(settings);
    });
    const finishCropInteraction = event => {
        if (!cropInteraction || event.pointerId !== cropInteraction.pointerId) return;
        cropInteraction = null;
    };
    cropSelection.addEventListener('pointerup', finishCropInteraction);
    cropSelection.addEventListener('pointercancel', finishCropInteraction);
    window.addEventListener('resize', () => {
        if (!cropModalBackdrop.hidden) renderModalCrop(currentCrop);
    });

    image.addEventListener('load', () => applyCrop(currentCrop));
    // First applyCrop runs while the panel is still display:none: the frame measures 0px and
    // getFrameRatio() falls back to a guess, so the photo sits wrong until the next refresh.
    new ResizeObserver(() => {
        if (!image.naturalWidth || !portrait.clientWidth) return;
        applyCrop(currentCrop);
    }).observe(portrait);

    const renderSpotlightActions = () => {
        const hasPersona = Boolean(currentAvatarId);
        [editAction, favoriteAction, defaultAction, duplicateAction, exportAction, statsAction].forEach(button => {
            button.disabled = !hasPersona;
        });
        const isFavorite = hasPersona && favoritePersonas.has(currentAvatarId);
        favoriteAction.classList.toggle('is-active', isFavorite);
        favoriteAction.title = t(isFavorite ? 'unfavorite' : 'favorite');
        favoriteAction.setAttribute('aria-label', favoriteAction.title);
        favoriteAction.setAttribute('aria-pressed', String(isFavorite));
        const isDefault = hasPersona && currentAvatarId === power_user.default_persona;
        defaultAction.classList.toggle('is-active', isDefault);
        defaultAction.setAttribute('aria-pressed', String(isDefault));
    };

    const renderSpotlightMeta = () => {
        const hasPersona = Boolean(currentAvatarId);
        const states = getPersonaStates(currentAvatarId);
        const tags = hasPersona ? getPersonaTags(currentAvatarId) : [];
        chips.replaceChildren(
            ...states.map(([state, icon, label]) => {
                const chip = createElement('span', `mpp-badge is-${state}`);
                chip.append(createElement('i', `fa-solid ${icon}`), createElement('span', '', label));
                return chip;
            }),
            ...tags.map(tag => {
                const chip = createElement('span', 'mpp-badge is-tag');
                chip.append(createElement('i', 'fa-solid fa-tag'), createElement('span', '', tag));
                return chip;
            }),
        );
        chips.hidden = !hasPersona || (states.length === 0 && tags.length === 0);
        actions.hidden = !hasPersona;
        hint.hidden = hasPersona;
        if (!hasPersona) hint.textContent = t('noSelection');
        renderSpotlightActions();
    };

    const update = () => {
        currentAvatarId = user_avatar && power_user.personas?.[user_avatar] !== undefined ? user_avatar : '';
        const nextSource = currentAvatarId ? personaImageUrl(currentAvatarId) : '';
        if (image.getAttribute('src') !== nextSource) image.src = nextSource;
        portrait.hidden = !currentAvatarId;
        visualCropButton.hidden = !currentAvatarId;
        slidersButton.hidden = !currentAvatarId;
        applyCrop(getPortraitCrop(currentAvatarId));
        name.textContent = currentAvatarId ? (power_user.personas[currentAvatarId] || t('unnamedPersona')) : t('noSelection');
        renderSpotlightMeta();
    };

    return { spotlight, update };
}

function createFilterBar(avatarBlock) {
    const bar = createElement('nav', 'mpp-filters');
    bar.setAttribute('aria-label', t('filters'));
    const definitions = [
        ['all', 'fa-border-all', () => true],
        ['current', 'fa-circle-check', card => card.classList.contains('selected')],
        ['default', 'fa-crown', isDefaultPersonaCard],
        ['linked', 'fa-link', isLinkedPersonaCard],
        ['favorites', 'fa-star', card => favoritePersonas.has(getCardAvatarId(card))],
    ];
    let activeFilter = 'all';

    const apply = () => {
        const tagMatch = activeFilter.startsWith('tag:') ? activeFilter.slice(4) : null;
        const predicate = tagMatch !== null
            ? card => getPersonaTags(getCardAvatarId(card)).includes(tagMatch)
            : definitions.find(([id]) => id === activeFilter)?.[2] || (() => true);
        avatarBlock.querySelectorAll(':scope > .avatar-container').forEach(card => {
            card.classList.toggle('mpp-filter-hidden', !predicate(card));
        });
    };

    const syncActive = () => {
        bar.querySelectorAll('.mpp-filter').forEach(item => {
            const active = item.dataset.mppFilter === activeFilter;
            item.classList.toggle('is-active', active);
            item.setAttribute('aria-pressed', String(active));
        });
    };

    definitions.forEach(([id, icon]) => {
        const button = createElement('button', `mpp-filter${id === activeFilter ? ' is-active' : ''}`);
        button.type = 'button';
        button.dataset.mppFilter = id;
        button.append(createElement('i', `fa-solid ${icon}`), createElement('span', '', t(id)));
        button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            activeFilter = id;
            syncActive();
            apply();
        });
        button.setAttribute('aria-pressed', String(id === activeFilter));
        bar.appendChild(button);
    });

    const tagFilters = createElement('span', 'mpp-filter-tags');
    bar.appendChild(tagFilters);

    const renderTags = () => {
        const tags = allUsedTags();
        if (activeFilter.startsWith('tag:') && !tags.includes(activeFilter.slice(4))) activeFilter = 'all';
        tagFilters.replaceChildren(...tags.map(tag => {
            const chip = createElement('button', 'mpp-filter mpp-filter-tag');
            chip.type = 'button';
            chip.dataset.mppFilter = `tag:${tag}`;
            chip.append(createElement('i', 'fa-solid fa-tag'), createElement('span', '', tag));
            chip.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                activeFilter = activeFilter === `tag:${tag}` ? 'all' : `tag:${tag}`;
                syncActive();
                apply();
            });
            return chip;
        }));
        tagFilters.hidden = tags.length === 0;
        syncActive();
    };

    const setTagFilter = tag => {
        const available = allUsedTags();
        activeFilter = tag && available.includes(tag) ? `tag:${tag}` : 'all';
        syncActive();
        apply();
    };

    return { bar, apply, renderTags, setTagFilter };
}

function createPersonaCardFromTemplate(avatarBlock, avatarId) {
    const source = document.querySelector('#user_avatar_template .avatar-container');
    if (!source) return null;
    const card = source.cloneNode(true);
    const name = power_user.personas?.[avatarId] || `[${t('unnamedPersona')}]`;
    const descriptor = power_user.persona_descriptions?.[avatarId] || {};
    const description = descriptor.description || avatarBlock.getAttribute('no_desc_text') || `[${t('noDescription')}]`;
    card.dataset.avatarId = avatarId;
    card.hidden = false;
    card.classList.toggle('selected', avatarId === user_avatar);
    card.classList.toggle('default_persona', avatarId === power_user.default_persona);
    const chatPersona = globalThis.SillyTavern?.getContext?.()?.chatMetadata?.persona;
    card.classList.toggle('locked_to_chat', avatarId === chatPersona);
    card.classList.toggle('locked_to_character', Array.isArray(descriptor.connections) && descriptor.connections.length > 0);
    const avatar = card.querySelector('.avatar');
    if (avatar) {
        avatar.dataset.avatarId = avatarId;
        avatar.title = avatarId;
    }
    const image = card.querySelector('.avatar img');
    if (image) image.src = personaThumbnailUrl(avatarId);
    const nameElement = card.querySelector('.ch_name');
    if (nameElement) nameElement.textContent = name;
    const descriptionElement = card.querySelector('.ch_description');
    if (descriptionElement) {
        descriptionElement.textContent = description;
        descriptionElement.classList.toggle('text_muted', !descriptor.description);
    }
    const titleElement = card.querySelector('.ch_additional_info');
    if (titleElement) titleElement.textContent = descriptor.title || '';
    return card;
}

function createSortController({ panel, avatarBlock, searchInput, sortSelect, paginationContainer, afterRender }) {
    if (!sortSelect || !paginationContainer) return null;
    const options = [
        ['asc', t('sortAz')],
        ['desc', t('sortZa')],
        ['modified', t('sortModified')],
        ['created', t('sortCreated')],
    ];
    const saved = localStorage.getItem(SORT_KEY);
    const state = {
        sort: options.some(([value]) => value === saved) ? saved : (power_user.persona_sort_order === 'desc' ? 'desc' : 'asc'),
        page: 1,
        pageSize: Number(accountStorage.getItem('Personas_PerPage')) || 5,
    };
    sortSelect.replaceChildren(...options.map(([value, label]) => new Option(label, value)));
    sortSelect.value = state.sort;

    const isCustom = () => state.sort === 'modified' || state.sort === 'created';
    const renderPager = (total, pages) => {
        const pager = createElement('div', 'mpp-custom-pager');
        const first = createIconButton('fa-angles-left', t('pageFirst'), 'mpp-pager-button');
        const previous = createIconButton('fa-chevron-left', t('pagePrevious'), 'mpp-pager-button');
        const next = createIconButton('fa-chevron-right', t('pageNext'), 'mpp-pager-button');
        const last = createIconButton('fa-angles-right', t('pageLast'), 'mpp-pager-button');
        const start = total ? (state.page - 1) * state.pageSize + 1 : 0;
        const end = Math.min(total, state.page * state.pageSize);
        const label = createElement('strong', 'mpp-pager-label', `${start}–${end} / ${total}`);
        const size = createElement('select', 'mpp-pager-size');
        [5, 10, 25, 50, 100, 250, 500, 1000].forEach(value => size.appendChild(new Option(`${value} ${t('perPage')}`, String(value))));
        size.value = String(state.pageSize);
        first.disabled = previous.disabled = state.page <= 1;
        next.disabled = last.disabled = state.page >= pages;
        first.addEventListener('click', () => { state.page = 1; render(); });
        previous.addEventListener('click', () => { state.page = Math.max(1, state.page - 1); render(); });
        next.addEventListener('click', () => { state.page = Math.min(pages, state.page + 1); render(); });
        last.addEventListener('click', () => { state.page = pages; render(); });
        size.addEventListener('change', () => {
            state.pageSize = Number(size.value) || 5;
            accountStorage.setItem('Personas_PerPage', String(state.pageSize));
            state.page = 1;
            render();
        });
        pager.append(label, first, previous, next, last, size);
        paginationContainer.classList.add('mpp-has-custom-pager');
        paginationContainer.replaceChildren(pager);
    };
    const render = async () => {
        if (!isCustom()) return false;
        state.pageSize = Number(accountStorage.getItem('Personas_PerPage')) || 5;
        let avatarIds = Object.keys(power_user.personas || {});
        if (!avatarIds.length) avatarIds = await getUserAvatars(false);
        const firstSeen = rememberFirstSeen(avatarIds);
        const modified = loadPersonaModified();
        const query = String(searchInput?.value || '').trim().toLocaleLowerCase();
        if (query) avatarIds = avatarIds.filter(avatarId => String(power_user.personas?.[avatarId] || '').toLocaleLowerCase().includes(query));
        avatarIds.sort((left, right) => {
            const leftTime = state.sort === 'modified'
                ? Number(modified[left] || personaTimestamp(left, firstSeen))
                : personaTimestamp(left, firstSeen);
            const rightTime = state.sort === 'modified'
                ? Number(modified[right] || personaTimestamp(right, firstSeen))
                : personaTimestamp(right, firstSeen);
            return rightTime - leftTime || String(power_user.personas?.[left] || '').localeCompare(String(power_user.personas?.[right] || ''));
        });
        const pages = Math.max(1, Math.ceil(avatarIds.length / state.pageSize));
        state.page = Math.min(state.page, pages);
        const visible = avatarIds.slice((state.page - 1) * state.pageSize, state.page * state.pageSize);
        avatarBlock.replaceChildren(...visible.map(avatarId => createPersonaCardFromTemplate(avatarBlock, avatarId)).filter(Boolean));
        renderPager(avatarIds.length, pages);
        afterRender?.();
        return true;
    };
    sortSelect.addEventListener('input', async event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        state.sort = sortSelect.value;
        state.page = 1;
        localStorage.setItem(SORT_KEY, state.sort);
        if (isCustom()) await render();
        else {
            paginationContainer.classList.remove('mpp-has-custom-pager');
            power_user.persona_sort_order = state.sort;
            globalThis.SillyTavern?.getContext?.()?.saveSettingsDebounced?.();
            await getUserAvatars(true, user_avatar);
            afterRender?.();
        }
    }, { capture: true });
    searchInput?.addEventListener('input', () => {
        if (!isCustom()) return;
        state.page = 1;
        window.setTimeout(() => {
            sortSelect.value = state.sort;
            render();
        }, 80);
    });
    return { isCustom, render, initialize: () => isCustom() ? render() : Promise.resolve(false) };
}

function createDensityControls(avatarBlock) {
    const state = {
        density: localStorage.getItem(DENSITY_KEY) === 'compact' ? 'compact' : 'shelf',
        mobileColumns: Math.min(4, Math.max(2, Number(localStorage.getItem(MOBILE_COLUMNS_KEY)) || 3)),
    };
    const controls = createElement('div', 'mpp-density');
    const shelf = createIconButton('fa-table-cells-large', t('portraitShelf'), 'mpp-density-button');
    const compact = createIconButton('fa-grip', t('compactGrid'), 'mpp-density-button');
    const mobile = createElement('div', 'mpp-mobile-density');
    mobile.title = t('mobileColumns');

    const apply = () => {
        avatarBlock.dataset.mppDensity = state.density;
        avatarBlock.dataset.mppMobileColumns = String(state.mobileColumns);
        shelf.classList.toggle('is-active', state.density === 'shelf');
        compact.classList.toggle('is-active', state.density === 'compact');
        shelf.setAttribute('aria-pressed', String(state.density === 'shelf'));
        compact.setAttribute('aria-pressed', String(state.density === 'compact'));
        mobile.querySelectorAll('button').forEach(button => {
            const active = state.density === 'compact' && Number(button.textContent) === state.mobileColumns;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    };

    shelf.addEventListener('click', () => {
        state.density = 'shelf';
        localStorage.setItem(DENSITY_KEY, state.density);
        apply();
    });
    compact.addEventListener('click', () => {
        state.density = 'compact';
        localStorage.setItem(DENSITY_KEY, state.density);
        apply();
    });
    [2, 3, 4].forEach(columns => {
        const button = createElement('button', '', String(columns));
        button.type = 'button';
        button.title = `${t('mobileColumns')}: ${columns}`;
        button.setAttribute('aria-label', button.title);
        button.addEventListener('click', () => {
            state.mobileColumns = columns;
            /* Column counts only exist in the compact grid; switch so the tap visibly works. */
            state.density = 'compact';
            localStorage.setItem(DENSITY_KEY, state.density);
            localStorage.setItem(MOBILE_COLUMNS_KEY, String(columns));
            apply();
        });
        mobile.appendChild(button);
    });
    controls.append(shelf, compact, mobile);
    apply();
    return controls;
}

function makeGlobalSettingsCollapsible(section) {
    if (!section || section.dataset.mppCollapsible === 'true') return;
    section.dataset.mppCollapsible = 'true';
    const heading = section.querySelector(':scope > h4');
    if (!heading) return;

    const header = createElement('div', 'mpp-section-header');
    const toggle = createIconButton('fa-chevron-down', t('expand'), 'mpp-section-toggle');
    const body = createElement('div', 'mpp-section-body');
    const content = [...section.children].filter(child => child !== heading);
    body.append(...content);
    header.append(heading, toggle);
    section.append(header, body);

    let expanded = localStorage.getItem(GLOBAL_SECTION_KEY) === 'true';
    const render = () => {
        body.hidden = !expanded;
        section.classList.toggle('is-collapsed', !expanded);
        toggle.setAttribute('aria-expanded', String(expanded));
        toggle.title = expanded ? t('collapse') : t('expand');
        toggle.setAttribute('aria-label', toggle.title);
    };
    toggle.addEventListener('click', () => {
        expanded = !expanded;
        localStorage.setItem(GLOBAL_SECTION_KEY, String(expanded));
        render();
    });
    render();
}

function getCardAvatarId(card) {
    return card.dataset.avatarId
        || card.querySelector('.avatar[data-avatar-id]')?.dataset.avatarId
        || '';
}

function isDefaultPersonaCard(card) {
    const avatarId = getCardAvatarId(card);
    return Boolean(avatarId && (avatarId === power_user.default_persona || card.classList.contains('default_persona')));
}

function isLinkedPersonaCard(card) {
    const avatarId = getCardAvatarId(card);
    if (!avatarId) return false;
    const connections = power_user.persona_descriptions?.[avatarId]?.connections;
    const chatPersona = globalThis.SillyTavern?.getContext?.()?.chatMetadata?.persona;
    return chatPersona === avatarId
        || (Array.isArray(connections) && connections.length > 0)
        || card.classList.contains('locked_to_chat')
        || card.classList.contains('locked_to_character');
}

function sanitizeFileName(value) {
    const clean = String(value || 'persona')
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
        .replace(/[. ]+$/g, '')
        .trim();
    return clean || 'persona';
}

async function exportPersonaJson(avatarId) {
    const personaName = power_user.personas?.[avatarId];
    if (!avatarId || personaName === undefined) return;

    const data = {
        personas: { [avatarId]: personaName },
        persona_descriptions: {
            [avatarId]: power_user.persona_descriptions?.[avatarId] ?? {
                description: '',
                connections: [],
            },
        },
        default_persona: power_user.default_persona === avatarId ? avatarId : null,
    };
    try {
        const response = await fetch(personaImageUrl(avatarId), { cache: 'no-store' });
        if (response.ok) {
            const blob = await response.blob();
            data.avatar_image = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.addEventListener('load', () => resolve(String(reader.result || '')), { once: true });
                reader.addEventListener('error', reject, { once: true });
                reader.readAsDataURL(blob);
            });
        }
    } catch (error) {
        console.warn(`[${EXTENSION_NAME}] Persona JSON was exported without its image.`, error);
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFileName(personaName)}.persona.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

let zipLibraryPromise;

function ensureZipLibrary() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    if (zipLibraryPromise) return zipLibraryPromise;
    zipLibraryPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-mpp-jszip]');
        if (existing) {
            existing.addEventListener('load', () => resolve(window.JSZip), { once: true });
            existing.addEventListener('error', reject, { once: true });
            return;
        }
        const script = document.createElement('script');
        script.dataset.mppJszip = 'true';
        script.src = '/lib/jszip.min.js';
        script.addEventListener('load', () => window.JSZip ? resolve(window.JSZip) : reject(new Error('JSZip unavailable.')), { once: true });
        script.addEventListener('error', reject, { once: true });
        document.head.appendChild(script);
    });
    return zipLibraryPromise;
}

function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function backupTimestamp() {
    const date = new Date();
    const part = value => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}-${part(date.getHours())}-${part(date.getMinutes())}`;
}

async function exportAllPersonasZip() {
    const avatarIds = await getUserAvatars(false);
    if (!Array.isArray(avatarIds) || !avatarIds.length) {
        globalThis.toastr?.info?.(t('backupEmpty'));
        return;
    }
    const JSZip = await ensureZipLibrary();
    const zip = new JSZip();
    const personas = {};
    const personaDescriptions = {};
    avatarIds.forEach(avatarId => {
        personas[avatarId] = power_user.personas?.[avatarId] ?? '';
        personaDescriptions[avatarId] = power_user.persona_descriptions?.[avatarId] ?? { description: '', connections: [] };
    });
    zip.file('personas/personas.json', JSON.stringify({
        kind: 'mistraelsl-personas-backup',
        schema: 1,
        default_persona: power_user.default_persona ?? null,
        personas,
        persona_descriptions: personaDescriptions,
    }, null, 2));
    const images = zip.folder('persona-images');
    const ctx = globalThis.SillyTavern?.getContext?.();
    for (const avatarId of avatarIds) {
        try {
            const response = await fetch(personaImageUrl(avatarId), {
                headers: ctx?.getRequestHeaders?.(),
                cache: 'no-store',
            });
            if (response.ok) images.file(avatarId, await response.blob());
        } catch (error) {
            console.warn(`[${EXTENSION_NAME}] Could not add persona image to backup: ${avatarId}`, error);
        }
    }
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    downloadBlob(blob, `personas-${backupTimestamp()}.zip`);
    globalThis.toastr?.success?.(t('backupReady'));
}

async function exportAllPersonasJson(onlyIds = null) {
    let avatarIds = await getUserAvatars(false);
    if (!Array.isArray(avatarIds)) avatarIds = [];
    if (Array.isArray(onlyIds)) avatarIds = avatarIds.filter(avatarId => onlyIds.includes(avatarId));
    if (!avatarIds.length) {
        globalThis.toastr?.info?.(t('backupEmpty'));
        return;
    }
    const personas = {};
    const personaDescriptions = {};
    avatarIds.forEach(avatarId => {
        personas[avatarId] = power_user.personas?.[avatarId] ?? '';
        personaDescriptions[avatarId] = power_user.persona_descriptions?.[avatarId] ?? { description: '', connections: [] };
    });
    const blob = new Blob([JSON.stringify({
        personas,
        persona_descriptions: personaDescriptions,
        default_persona: power_user.default_persona ?? null,
    }, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `personas${Array.isArray(onlyIds) ? '-selected' : ''}-${backupTimestamp()}.json`);
    globalThis.toastr?.success?.(t('backupReady'));
}

async function uploadAvatarBlob(avatarId, blob) {
    const ctx = globalThis.SillyTavern?.getContext?.();
    if (!ctx?.getRequestHeaders) throw new Error('SillyTavern request context is unavailable.');
    const form = new FormData();
    form.append('avatar', blob, 'avatar.png');
    form.append('overwrite_name', avatarId);
    const response = await fetch('/api/avatars/upload', {
        method: 'POST',
        headers: ctx.getRequestHeaders({ omitContentType: true }),
        cache: 'no-cache',
        body: form,
    });
    if (!response.ok) throw new Error(`Avatar upload failed (${response.status}).`);
}

async function restorePersonasZip(file, panel) {
    const JSZip = await ensureZipLibrary();
    const zip = await JSZip.loadAsync(file);
    const manifest = zip.file('personas/personas.json');
    if (!manifest) throw new Error('Persona backup manifest is missing.');
    const data = JSON.parse(await manifest.async('string'));
    if (!data?.personas || !data?.persona_descriptions) throw new Error('Persona backup manifest is invalid.');

    const restored = [];
    for (const [avatarId, name] of Object.entries(data.personas)) {
        if (!avatarId || avatarId.length > 255 || /[\\/]/.test(avatarId) || ['__proto__', 'prototype', 'constructor'].includes(avatarId)) continue;
        if (power_user.personas?.[avatarId] !== undefined) continue;
        const image = zip.file(`persona-images/${avatarId}`);
        if (image) await uploadAvatarBlob(avatarId, await image.async('blob'));
        power_user.personas[avatarId] = String(name || '');
        power_user.persona_descriptions[avatarId] = data.persona_descriptions[avatarId] ?? { description: '', connections: [] };
        restored.push(avatarId);
        markPersonaImageChanged(avatarId);
    }
    if (restored.length) {
        rememberFirstSeen(restored);
        globalThis.SillyTavern?.getContext?.()?.saveSettingsDebounced?.();
        await eventSource.emit(event_types.PERSONA_CREATED, { avatarId: restored.at(-1), name: power_user.personas[restored.at(-1)] });
        await getUserAvatars(true, restored.at(-1));
        await panel?.mppRefresh?.();
        const restoredAvatarId = restored.at(-1);
        await setUserAvatar(restoredAvatarId, { toastPersonaNameChange: false });
        if (panel?.classList.contains('mpp-creating')) {
            await panel.mppOpenPersonaEditor?.(restoredAvatarId, personaImageUrl(restoredAvatarId));
        }
    }
    globalThis.toastr?.success?.(t('restoreReady'));
}

async function restorePersonaJson(file, panel) {
    const data = JSON.parse(await file.text());
    const entries = Object.entries(data?.personas || {});
    if (!entries.length) throw new Error('Persona JSON is invalid.');

    let fallbackBlob;
    const restored = [];
    for (const [sourceAvatarId, name] of entries) {
        const safeBase = String(sourceAvatarId || 'persona.png').replace(/[\\/]/g, '_');
        if (!safeBase || ['__proto__', 'prototype', 'constructor'].includes(safeBase)) continue;
        let avatarId = safeBase;
        let collision = 0;
        while (power_user.personas?.[avatarId] !== undefined) {
            collision += 1;
            avatarId = `${Date.now()}-${collision}-${safeBase}`;
        }
        let imageBlob;
        if (entries.length === 1 && typeof data.avatar_image === 'string' && data.avatar_image.startsWith('data:image/')) {
            imageBlob = await (await fetch(data.avatar_image)).blob();
        } else {
            if (!fallbackBlob) {
                const fallback = await fetch('/img/ai4.png');
                if (!fallback.ok) throw new Error('Persona image is missing.');
                fallbackBlob = await fallback.blob();
            }
            imageBlob = fallbackBlob;
        }
        await uploadAvatarBlob(avatarId, imageBlob);
        power_user.personas[avatarId] = String(name || '');
        power_user.persona_descriptions[avatarId] = data.persona_descriptions?.[sourceAvatarId] ?? { description: '', connections: [] };
        restored.push(avatarId);
        markPersonaModified(avatarId);
        markPersonaImageChanged(avatarId);
        await eventSource.emit(event_types.PERSONA_CREATED, { avatarId, name: power_user.personas[avatarId] });
    }
    if (!restored.length) throw new Error('Persona JSON contains no restorable personas.');
    rememberFirstSeen(restored);
    globalThis.SillyTavern?.getContext?.()?.saveSettingsDebounced?.();
    const avatarId = restored.at(-1);
    await getUserAvatars(true, avatarId);
    await setUserAvatar(avatarId, { toastPersonaNameChange: false });
    await panel?.mppRefresh?.();
    await panel?.mppOpenPersonaEditor?.(avatarId, personaImageUrl(avatarId));
}

async function duplicatePersonaThroughSillyTavern(panel, avatarId) {
    if (!avatarId || !panel) return;
    await setUserAvatar(avatarId, { toastPersonaNameChange: false });
    panel.querySelector('#persona_duplicate_button')?.click();
}

async function deletePersonaNow(avatarId, panel) {
    const ctx = globalThis.SillyTavern?.getContext?.();
    if (!avatarId || !ctx?.getRequestHeaders) return false;
    const name = power_user.personas?.[avatarId] || '';
    const response = await fetch('/api/avatars/delete', {
        method: 'POST',
        headers: ctx.getRequestHeaders(),
        body: JSON.stringify({ avatar: avatarId }),
    });
    // 404 means the avatar file is already gone (phantom settings entry): finish the local cleanup anyway.
    if (response.status === 404) console.info(`[${EXTENSION_NAME}] Avatar file already missing, cleaning settings only: ${avatarId}`);
    else if (!response.ok) throw new Error(`Persona deletion failed (${response.status}).`);

    delete power_user.personas?.[avatarId];
    delete power_user.persona_descriptions?.[avatarId];
    if (power_user.default_persona === avatarId) power_user.default_persona = null;
    if (ctx.chatMetadata?.persona === avatarId) {
        delete ctx.chatMetadata.persona;
        await ctx.saveMetadata?.();
    }
    favoritePersonas.delete(avatarId);
    saveFavorites();
    try {
        const notes = JSON.parse(localStorage.getItem(PERSONA_NOTES_KEY) || '{}');
        delete notes[avatarId];
        localStorage.setItem(PERSONA_NOTES_KEY, JSON.stringify(notes));
    } catch { /* Ignore malformed optional private notes. */ }
    delete portraitCrops[avatarId];
    localStorage.setItem(PORTRAIT_CROP_KEY, JSON.stringify(portraitCrops));
    const modified = loadPersonaModified();
    delete modified[avatarId];
    localStorage.setItem(PERSONA_MODIFIED_KEY, JSON.stringify(modified));
    const usage = loadPersonaUsage();
    delete usage[avatarId];
    localStorage.setItem(PERSONA_USAGE_KEY, JSON.stringify(usage));
    if (personaTags[avatarId] !== undefined) {
        delete personaTags[avatarId];
        savePersonaTags();
    }
    ctx.saveSettingsDebounced?.();
    await eventSource.emit(event_types.PERSONA_DELETED, { avatarId, name });
    await getUserAvatars(true);
    if (user_avatar === avatarId) {
        const nextAvatarId = Object.keys(power_user.personas || {})[0];
        if (nextAvatarId) await setUserAvatar(nextAvatarId, { toastPersonaNameChange: false });
    }
    await panel?.mppRefresh?.();
    return true;
}

async function schedulePersonaDeletion(panel, avatarId) {
    const name = power_user.personas?.[avatarId] || '';
    if (!panel || !avatarId || !name) return false;
    const confirmed = await Popup.show.confirm(t('deleteConfirm'), `${name}<br>${t('deleteDetails')}`);
    if (!confirmed) return false;

    const card = panel.querySelector(`#user_avatar_block [data-avatar-id="${CSS.escape(avatarId)}"]`);
    card?.classList.add('mpp-pending-delete');
    const notice = createElement('div', 'mpp-undo-delete');
    const copy = createElement('span');
    const countdown = createElement('span', 'mpp-delete-countdown');
    let secondsLeft = 10;
    const renderCountdown = () => {
        countdown.textContent = ` — ${t('deletePending').replace('{seconds}', String(secondsLeft))}`;
    };
    copy.append(createElement('strong', '', name), countdown);
    renderCountdown();
    const undo = createElement('button', 'mpp-button', t('undo'));
    undo.type = 'button';
    notice.append(copy, undo);
    panel.appendChild(notice);

    let cancelled = false;
    const countdownTimer = window.setInterval(() => {
        secondsLeft = Math.max(0, secondsLeft - 1);
        renderCountdown();
    }, 1000);
    const timer = window.setTimeout(async () => {
        window.clearInterval(countdownTimer);
        notice.remove();
        if (cancelled) return;
        try { await deletePersonaNow(avatarId, panel); }
        catch (error) {
            console.error(`[${EXTENSION_NAME}] Could not delete persona.`, error);
            globalThis.toastr?.error?.(t('creatorError'));
            card?.classList.remove('mpp-pending-delete');
        }
    }, 10000);
    undo.addEventListener('click', () => {
        cancelled = true;
        window.clearTimeout(timer);
        window.clearInterval(countdownTimer);
        notice.remove();
        card?.classList.remove('mpp-pending-delete');
    }, { once: true });
    return true;
}

function isCleanupProtected(avatarId) {
    const connections = power_user.persona_descriptions?.[avatarId]?.connections;
    const chatPersona = globalThis.SillyTavern?.getContext?.()?.chatMetadata?.persona;
    return avatarId === user_avatar
        || avatarId === power_user.default_persona
        || avatarId === chatPersona
        || favoritePersonas.has(avatarId)
        || (Array.isArray(connections) && connections.length > 0);
}

function createCleanupWorkspace(panel) {
    const workspace = createElement('section', 'mpp-cleanup');
    workspace.hidden = true;

    const top = createElement('header', 'mpp-cleanup-top');
    const backButton = createElement('button', 'mpp-button mpp-cleanup-back');
    backButton.type = 'button';
    backButton.append(createElement('i', 'fa-solid fa-arrow-left'), createElement('span', '', t('backToLibrary')));
    const title = createElement('span', 'mpp-cleanup-title');
    title.append(createElement('strong', '', t('cleanupTitle')), createElement('small', '', t('cleanupHint')));
    const topActions = createElement('span', 'mpp-cleanup-top-actions');
    const daysSelect = createElement('select', 'mpp-cleanup-days');
    daysSelect.setAttribute('aria-label', t('cleanupDaysLabel'));
    [30, 60, 90].forEach(days => {
        const option = createElement('option', '', t('cleanupDays').replace('{days}', String(days)));
        option.value = String(days);
        daysSelect.appendChild(option);
    });
    daysSelect.value = '60';
    const backupButton = createElement('button', 'mpp-button mpp-cleanup-backup');
    backupButton.type = 'button';
    backupButton.title = t('cleanupBackup');
    backupButton.append(createElement('i', 'fa-solid fa-file-zipper'), createElement('span', '', t('cleanupBackup')));
    backupButton.addEventListener('click', () => exportAllPersonasZip());
    topActions.append(daysSelect, backupButton);
    top.append(backButton, title, topActions);

    const body = createElement('div', 'mpp-cleanup-body');

    const bar = createElement('footer', 'mpp-cleanup-bar');
    const selectedLabel = createElement('span', 'mpp-cleanup-selected');
    const exportButton = createElement('button', 'mpp-button mpp-cleanup-export');
    exportButton.type = 'button';
    exportButton.append(createElement('i', 'fa-solid fa-file-export'), createElement('span', '', t('cleanupExportSelected')));
    const deleteButton = createElement('button', 'mpp-button mpp-cleanup-delete');
    deleteButton.type = 'button';
    deleteButton.append(createElement('i', 'fa-solid fa-trash'), createElement('span', '', t('cleanupDeleteSelected')));
    bar.append(selectedLabel, exportButton, deleteButton);

    workspace.append(top, body, bar);

    const selected = new Set();
    let dustDays = 60;

    const renderBar = () => {
        const count = selected.size;
        selectedLabel.textContent = count ? t('cleanupSelected').replace('{count}', String(count)) : '';
        exportButton.disabled = !count;
        deleteButton.disabled = !count;
        deleteButton.querySelector('span').textContent = count
            ? `${t('cleanupDeleteSelected')} (${count})`
            : t('cleanupDeleteSelected');
    };

    const collectCandidates = async () => {
        // Bind to avatar files that actually exist on disk: settings entries without files are phantoms
        // left by external cleanups. If the file list cannot be fetched at all, fall back to settings keys.
        const fileIds = await getUserAvatars(false).catch(() => null);
        const keys = Object.keys(power_user.personas || {}).filter(Boolean);
        const avatarIds = Array.isArray(fileIds) ? keys.filter(id => fileIds.includes(id)) : keys;
        const usage = loadPersonaUsage();
        const firstSeen = loadFirstSeen();
        const modified = loadPersonaModified();
        const infoOf = id => {
            const connections = power_user.persona_descriptions?.[id]?.connections;
            return {
                id,
                name: power_user.personas?.[id] || id,
                last: Number(usage[id]?.lastUsed || 0) || personaTimestamp(id, firstSeen),
                created: personaTimestamp(id, firstSeen),
                modified: Number(modified[id] || 0),
                description: String(power_user.persona_descriptions?.[id]?.description || ''),
                hasDescription: Boolean(String(power_user.persona_descriptions?.[id]?.description || '').trim()),
                links: Array.isArray(connections) ? connections.length : 0,
                protected: isCleanupProtected(id),
            };
        };
        const byName = new Map();
        avatarIds.forEach(id => {
            const key = String(power_user.personas?.[id] || '').trim().toLocaleLowerCase();
            if (!key) return;
            if (!byName.has(key)) byName.set(key, []);
            byName.get(key).push(id);
        });
        const duplicateGroups = [...byName.values()]
            .filter(ids => ids.length > 1)
            .map(ids => ({
                name: power_user.personas?.[ids[0]] || '',
                infos: ids.map(infoOf).sort((left, right) => right.last - left.last),
            }))
            .sort((left, right) => right.infos.length - left.infos.length);
        const emptyInfos = avatarIds
            .map(infoOf)
            .filter(info => !info.hasDescription && !info.protected)
            .sort((left, right) => left.last - right.last);
        const cutoff = Date.now() - dustDays * 24 * 60 * 60 * 1000;
        const dustyInfos = avatarIds
            .map(infoOf)
            .filter(info => !info.protected && info.last && info.last < cutoff)
            .sort((left, right) => left.last - right.last);
        return { duplicateGroups, emptyInfos, dustyInfos };
    };

    // Set when the editor was opened from the details popup: closing the editor resumes the cleanup.
    let resumeAfterEditor = false;
    let inspectedAvatarId = '';
    let restoreAvatarId = '';

    const showDetails = async info => {
        const content = createElement('div', 'mpp-cleanup-details-view');
        const head = createElement('header', 'mpp-cleanup-details-head');
        const portrait = createElement('img');
        portrait.src = personaThumbnailUrl(info.id);
        portrait.alt = info.name;
        portrait.draggable = false;
        const headCopy = createElement('span', 'mpp-cleanup-details-title');
        headCopy.append(createElement('strong', '', info.name), createElement('small', '', info.id));
        head.append(portrait, headCopy);
        const badges = createElement('span', 'mpp-cleanup-details-badges');
        const chatPersona = globalThis.SillyTavern?.getContext?.()?.chatMetadata?.persona;
        [
            [info.id === user_avatar, 'active', 'fa-circle-check'],
            [info.id === power_user.default_persona, 'default', 'fa-crown'],
            [favoritePersonas.has(info.id), 'favorite', 'fa-star'],
            [info.id === chatPersona, 'chat', 'fa-comments'],
            [info.links > 0, 'character', 'fa-user'],
            [info.protected, 'protected', 'fa-shield-halved'],
        ].forEach(([visible, state, icon]) => {
            if (!visible) return;
            const labelKeys = { favorite: 'favoriteShort', protected: 'cleanupProtected' };
            const badge = createElement('span', `mpp-badge is-${state}`);
            badge.append(createElement('i', `fa-solid ${icon}`), createElement('span', '', t(labelKeys[state] || state)));
            badges.appendChild(badge);
        });
        badges.hidden = !badges.childElementCount;
        const description = createElement('p', 'mpp-cleanup-details-desc', info.description.trim() || t('noDescription'));
        const tagsRow = createElement('span', 'mpp-cleanup-details-tags');
        getPersonaTags(info.id).forEach(tag => {
            const chip = createElement('span', 'mpp-cleanup-details-tag');
            chip.append(createElement('i', 'fa-solid fa-tag'), createElement('span', '', tag));
            tagsRow.appendChild(chip);
        });
        tagsRow.hidden = !tagsRow.childElementCount;
        const meta = createElement('dl', 'mpp-cleanup-details-meta');
        [
            [t('statsCreated'), formatStatDate(info.created)],
            [t('statsModified'), formatStatDate(info.modified)],
            [t('statsLastUsed'), formatStatDate(info.last)],
            [t('cleanupLinked'), String(info.links)],
        ].forEach(([label, value]) => {
            meta.append(createElement('dt', '', label), createElement('dd', '', value));
        });
        const hint = createElement('small', 'mpp-cleanup-details-hint', t('cleanupEditActivates'));
        content.append(head, badges, description, tagsRow, meta, hint);
        const result = await new Popup(content, POPUP_TYPE.TEXT, '', {
            wide: true,
            customButtons: [{ text: t('cleanupOpenInEditor'), result: POPUP_RESULT.CUSTOM1, icon: 'fa-pen', appendAtEnd: true }],
        }).show();
        if (result === POPUP_RESULT.CUSTOM1 && power_user.personas?.[info.id] !== undefined && typeof panel.mppOpenPersonaEditor === 'function') {
            resumeAfterEditor = true;
            inspectedAvatarId = info.id;
            restoreAvatarId = user_avatar !== info.id ? user_avatar : '';
            // The editor silently activates the persona on open: skip that "usage" so inspection
            // does not push the persona out of the dusty/empty cleanup groups.
            if (restoreAvatarId) skipNextUsageRecord = true;
            try {
                await panel.mppOpenPersonaEditor(info.id, personaImageUrl(info.id));
            } finally {
                // The editor did not open (early return or failure): nothing to resume after.
                if (!panel.classList.contains('mpp-creating')) {
                    resumeAfterEditor = false;
                    inspectedAvatarId = '';
                    restoreAvatarId = '';
                    skipNextUsageRecord = false;
                }
            }
        }
    };

    const createRow = info => {
        const row = createElement('label', 'mpp-cleanup-row');
        row.dataset.avatarId = info.id;
        if (info.protected) row.classList.add('is-protected');
        const checkbox = createElement('input', 'mpp-cleanup-check');
        checkbox.type = 'checkbox';
        checkbox.checked = selected.has(info.id);
        checkbox.disabled = info.protected;
        checkbox.setAttribute('aria-label', info.name);
        const image = createElement('img');
        image.src = personaThumbnailUrl(info.id);
        image.alt = '';
        image.loading = 'lazy';
        image.draggable = false;
        const copy = createElement('span', 'mpp-cleanup-row-copy');
        const meta = [
            `${t('cleanupLastUsed')}: ${info.last ? formatStatDate(info.last) : '—'}`,
            info.hasDescription ? '' : t('cleanupNoDesc'),
            info.links ? `${t('cleanupLinked')}: ${info.links}` : '',
        ].filter(Boolean).join(' • ');
        copy.append(createElement('strong', '', info.name), createElement('small', '', meta));
        const detailsButton = createIconButton('fa-eye', `${t('cleanupDetails')}: ${info.name}`, 'mpp-cleanup-details');
        detailsButton.addEventListener('click', event => {
            // The row is a <label>: keep the click from toggling the checkbox.
            event.preventDefault();
            event.stopPropagation();
            showDetails(info).catch(error => console.error(`[${EXTENSION_NAME}] Could not show persona details.`, error));
        });
        row.append(checkbox, image, copy);
        if (info.protected) row.appendChild(createElement('span', 'mpp-cleanup-protected', t('cleanupProtected')));
        row.appendChild(detailsButton);
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) selected.add(info.id);
            else selected.delete(info.id);
            body.querySelectorAll(`.mpp-cleanup-row[data-avatar-id="${CSS.escape(info.id)}"] .mpp-cleanup-check`)
                .forEach(twin => { twin.checked = checkbox.checked; });
            renderBar();
        });
        return row;
    };

    const createGroup = (title, infos, hint, { keepNewest = false } = {}) => {
        const group = createElement('section', 'mpp-cleanup-group');
        const head = createElement('header', 'mpp-cleanup-group-head');
        const headCopy = createElement('span', 'mpp-cleanup-group-title');
        headCopy.append(createElement('strong', '', title), createElement('small', '', ` ×${infos.length}`));
        head.appendChild(headCopy);
        const selectable = infos.filter(info => !info.protected);
        if (keepNewest && infos.length > 1 && selectable.length) {
            // Duplicates are sorted freshest first: keeping the newest means selecting every older copy.
            const keepButton = createElement('button', 'mpp-button mpp-cleanup-select-group', t('cleanupKeepNewest'));
            keepButton.type = 'button';
            keepButton.addEventListener('click', () => {
                infos.forEach(info => selected.delete(info.id));
                infos.slice(1).forEach(info => { if (!info.protected) selected.add(info.id); });
                renderSafe();
            });
            head.appendChild(keepButton);
        } else if (selectable.length > 1) {
            const selectGroup = createElement('button', 'mpp-button mpp-cleanup-select-group', t('cleanupSelectGroup'));
            selectGroup.type = 'button';
            selectGroup.addEventListener('click', () => {
                const allSelected = selectable.every(info => selected.has(info.id));
                selectable.forEach(info => allSelected ? selected.delete(info.id) : selected.add(info.id));
                renderSafe();
            });
            head.appendChild(selectGroup);
        }
        group.appendChild(head);
        if (hint) group.appendChild(createElement('small', 'mpp-cleanup-group-hint', hint));
        const rows = createElement('div', 'mpp-cleanup-rows');
        rows.append(...infos.map(createRow));
        group.appendChild(rows);
        return group;
    };

    const render = async () => {
        [...selected].forEach(id => {
            if (power_user.personas?.[id] === undefined) selected.delete(id);
        });
        const { duplicateGroups, emptyInfos, dustyInfos } = await collectCandidates();
        const groups = [];
        duplicateGroups.forEach(group => groups.push(createGroup(`«${group.name}»`, group.infos, t('cleanupDuplicatesHint'), { keepNewest: true })));
        if (emptyInfos.length) groups.push(createGroup(t('cleanupEmpty'), emptyInfos, t('cleanupEmptyHint')));
        if (dustyInfos.length) groups.push(createGroup(t('cleanupDusty'), dustyInfos, t('cleanupDustyHint')));
        body.replaceChildren(...(groups.length ? groups : [createElement('div', 'mpp-cleanup-empty', t('cleanupClean'))]));
        renderBar();
    };

    const renderSafe = () => render().catch(error => console.error(`[${EXTENSION_NAME}] Could not render cleanup workspace.`, error));

    exportButton.addEventListener('click', async () => {
        const ids = [...selected];
        if (!ids.length) return;
        exportButton.disabled = true;
        try { await exportAllPersonasJson(ids); }
        finally { exportButton.disabled = !selected.size; }
    });

    deleteButton.addEventListener('click', async () => {
        const ids = [...selected].filter(id => !isCleanupProtected(id));
        if (!ids.length) return;
        const names = ids.map(id => power_user.personas?.[id] || id).join('<br>');
        const confirmed = await Popup.show.confirm(t('cleanupDeleteConfirm'), `${names}<br><br>${t('cleanupDeleteHint')}`);
        if (!confirmed) return;
        deleteButton.disabled = true;
        let deleted = 0;
        for (const id of ids) {
            try {
                if (await deletePersonaNow(id, panel)) {
                    selected.delete(id);
                    deleted += 1;
                }
            } catch (error) {
                console.error(`[${EXTENSION_NAME}] Could not delete persona: ${id}`, error);
            }
        }
        if (deleted) globalThis.toastr?.success?.(t('cleanupDeleted').replace('{count}', String(deleted)));
        if (deleted < ids.length) globalThis.toastr?.error?.(t('actionError'));
        await renderSafe();
    });

    const open = ({ preserveSelection = false } = {}) => {
        if (panel.classList.contains('mpp-creating')) panel.mppClosePersonaEditor?.();
        if (!preserveSelection) selected.clear();
        renderSafe();
        panel.classList.add('mpp-cleaning');
        workspace.hidden = false;
    };
    const close = () => {
        workspace.hidden = true;
        panel.classList.remove('mpp-cleaning');
    };
    backButton.addEventListener('click', close);
    daysSelect.addEventListener('change', () => {
        dustDays = Number(daysSelect.value) || 60;
        renderSafe();
    });
    panel.mppCloseCleanup = close;
    panel.mppPersonaEditorClosed = async ({ deliberateActivation = false } = {}) => {
        if (!resumeAfterEditor) return;
        resumeAfterEditor = false;
        const inspectedId = inspectedAvatarId;
        const restoreId = restoreAvatarId;
        inspectedAvatarId = '';
        restoreAvatarId = '';
        // Undo the editor's silent activation, unless the user deliberately activated the persona
        // themselves or switched elsewhere (e.g. via the launcher) while inspecting.
        if (restoreId && inspectedId && !deliberateActivation && user_avatar === inspectedId) {
            skipNextUsageRecord = true;
            try {
                await setUserAvatar(restoreId, { toastPersonaNameChange: false });
            } catch (error) {
                skipNextUsageRecord = false;
                console.warn(`[${EXTENSION_NAME}] Could not restore the previous persona after inspection.`, error);
            }
        }
        open({ preserveSelection: true });
    };
    return { workspace, open };
}

/* Usage map: a read-only stage showing where every persona is bound
   (default, active, current chat, character/group connections). */
function createUsageMapStage(panel) {
    const workspace = createElement('section', 'mpp-map');
    workspace.hidden = true;

    const top = createElement('header', 'mpp-map-top');
    const backButton = createElement('button', 'mpp-button mpp-map-back');
    backButton.type = 'button';
    backButton.append(createElement('i', 'fa-solid fa-arrow-left'), createElement('span', '', t('backToLibrary')));
    const title = createElement('span', 'mpp-map-title');
    title.append(createElement('strong', '', t('mapTitle')), createElement('small', '', t('mapHint')));
    top.append(backButton, title);

    const body = createElement('div', 'mpp-map-body');
    workspace.append(top, body);

    const statusChip = (className, icon, label) => {
        const chip = createElement('span', `mpp-map-chip ${className}`);
        chip.title = label;
        chip.append(createElement('i', `fa-solid ${icon}`), createElement('span', '', label));
        return chip;
    };

    const connectionChip = connection => {
        const context = globalThis.SillyTavern?.getContext?.() || {};
        if (connection?.type === 'character') {
            const character = (context.characters || []).find(item => item && item.avatar === connection.id);
            const chip = createElement('span', 'mpp-map-chip is-character');
            const name = character?.name || t('mapMissing');
            chip.title = `${t('character')}: ${name}`;
            if (character?.avatar) {
                const image = createElement('img');
                image.src = getThumbnailUrl('avatar', character.avatar, false);
                image.alt = '';
                image.draggable = false;
                image.addEventListener('error', () => image.remove(), { once: true });
                chip.appendChild(image);
            } else {
                chip.appendChild(createElement('i', 'fa-solid fa-user-slash'));
            }
            chip.appendChild(createElement('span', '', name));
            return chip;
        }
        if (connection?.type === 'group') {
            const group = (context.groups || []).find(item => item && String(item.id) === String(connection.id));
            const chip = createElement('span', 'mpp-map-chip is-group');
            const name = group?.name || t('mapMissing');
            chip.title = name;
            chip.append(createElement('i', 'fa-solid fa-users'), createElement('span', '', name));
            return chip;
        }
        return null;
    };

    const render = () => {
        body.replaceChildren();
        const context = globalThis.SillyTavern?.getContext?.() || {};
        const chatPersona = context.chatMetadata?.persona;
        const usage = loadPersonaUsage();
        const infos = Object.keys(power_user.personas || {}).filter(Boolean).map(id => {
            const connections = power_user.persona_descriptions?.[id]?.connections;
            return {
                id,
                name: power_user.personas?.[id] || id,
                isDefault: id === power_user.default_persona,
                isActive: id === user_avatar,
                isChat: Boolean(chatPersona) && id === chatPersona,
                connections: Array.isArray(connections) ? connections : [],
                lastUsed: Number(usage[id]?.lastUsed || 0),
            };
        });
        if (!infos.length) {
            body.append(createElement('div', 'mpp-map-empty', t('mapEmpty')));
            return;
        }
        const isBound = info => info.isDefault || info.isActive || info.isChat || info.connections.length > 0;
        const bound = infos.filter(isBound);
        const orphans = infos.filter(info => !isBound(info));
        const weight = info => (info.isDefault ? 4 : 0) + (info.isActive ? 2 : 0) + (info.isChat ? 1 : 0);
        bound.sort((left, right) => (weight(right) - weight(left))
            || (right.connections.length - left.connections.length)
            || left.name.localeCompare(right.name));
        orphans.sort((left, right) => (right.lastUsed - left.lastUsed) || left.name.localeCompare(right.name));

        const buildRow = info => {
            const row = createElement('button', 'mpp-map-row');
            row.type = 'button';
            row.title = t('editPersona');
            const image = createElement('img');
            image.src = personaThumbnailUrl(info.id);
            image.alt = '';
            image.draggable = false;
            const copy = createElement('span', 'mpp-map-row-copy');
            const meta = [];
            if (info.connections.length) meta.push(t('mapLinks').replace('{count}', String(info.connections.length)));
            if (info.lastUsed) meta.push(t('mapLastUsed').replace('{date}', new Date(info.lastUsed).toLocaleDateString()));
            copy.append(createElement('strong', '', info.name), createElement('small', '', meta.join(' • ') || ' '));
            const chips = createElement('span', 'mpp-map-chips');
            if (info.isDefault) chips.appendChild(statusChip('is-default', 'fa-crown', t('default')));
            if (info.isActive) chips.appendChild(statusChip('is-active', 'fa-circle-check', t('active')));
            if (info.isChat) chips.appendChild(statusChip('is-chat', 'fa-comment', t('chat')));
            info.connections.map(connectionChip).filter(Boolean).forEach(chip => chips.appendChild(chip));
            row.append(image, copy, chips);
            row.addEventListener('click', async () => {
                close();
                await panel.mppOpenPersonaEditor?.(info.id, personaImageUrl(info.id));
            });
            return row;
        };

        const buildGroup = (label, list) => {
            const group = createElement('section', 'mpp-map-group');
            const head = createElement('div', 'mpp-map-group-head');
            head.append(createElement('strong', '', label), createElement('small', '', String(list.length)));
            const rows = createElement('div', 'mpp-map-rows');
            list.forEach(info => rows.appendChild(buildRow(info)));
            group.append(head, rows);
            return group;
        };

        if (bound.length) body.appendChild(buildGroup(t('mapBound'), bound));
        if (orphans.length) body.appendChild(buildGroup(t('mapOrphans'), orphans));
    };

    const open = () => {
        if (panel.classList.contains('mpp-creating')) panel.mppClosePersonaEditor?.();
        panel.mppCloseCleanup?.();
        render();
        panel.classList.add('mpp-mapping');
        workspace.hidden = false;
    };
    const close = () => {
        workspace.hidden = true;
        panel.classList.remove('mpp-mapping');
    };
    backButton.addEventListener('click', close);
    panel.mppCloseMap = close;
    return { workspace, open, close };
}

function createCardAction(icon, label, className, handler) {
    const button = createElement('button', `mpp-card-action ${className}`);
    button.type = 'button';
    button.title = label;
    button.setAttribute('aria-label', label);
    button.appendChild(createElement('i', `fa-solid ${icon}`));
    button.addEventListener('click', async event => {
        event.preventDefault();
        event.stopPropagation();
        if (button.disabled) return;
        button.disabled = true;
        try {
            await handler(button);
        } catch (error) {
            console.error(`[${EXTENSION_NAME}] Persona card action failed.`, error);
            globalThis.toastr?.error?.(t('actionError'));
        } finally {
            button.disabled = false;
        }
    });
    button.addEventListener('keydown', event => event.stopPropagation());
    return button;
}

function ensureCardActions(card) {
    const avatarId = getCardAvatarId(card);
    if (!avatarId) return;

    let actions = card.querySelector(':scope > .mpp-card-actions');
    if (!actions) {
        actions = createElement('span', 'mpp-card-actions');
        const favorite = createCardAction('fa-star', t('favorite'), 'mpp-action-favorite', button => {
            if (favoritePersonas.has(avatarId)) favoritePersonas.delete(avatarId);
            else favoritePersonas.add(avatarId);
            saveFavorites();
            updateCardActions(card);
            card.closest(PANEL_SELECTOR)?.mppRefresh?.();
        });
        const edit = createCardAction('fa-pen-to-square', t('editPersona'), 'mpp-action-edit', async () => {
            const panel = card.closest(PANEL_SELECTOR);
            await setUserAvatar(avatarId, { toastPersonaNameChange: false });
            if (typeof panel?.mppOpenPersonaEditor === 'function') {
                await panel.mppOpenPersonaEditor(avatarId, card.querySelector('.avatar img')?.src || '');
                return;
            }
            if (panel?.classList.contains('mpp-editor-collapsed')) panel.querySelector('.mpp-editor-button')?.click();
            panel?.querySelector('.mpp-editor-column')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        edit.appendChild(createElement('span', 'mpp-card-edit-label', t('editShort')));
        const duplicate = createCardAction('fa-clone', t('duplicatePersona'), 'mpp-action-duplicate', async () => {
            await duplicatePersonaThroughSillyTavern(card.closest(PANEL_SELECTOR), avatarId);
        });
        const remove = createCardAction('fa-trash', t('deletePersona'), 'mpp-action-delete', async () => {
            const panel = card.closest(PANEL_SELECTOR);
            await schedulePersonaDeletion(panel, avatarId);
        });
        const exportButton = createCardAction('fa-file-export', t('exportPersona'), 'mpp-action-export', () => {
            exportPersonaJson(avatarId);
        });
        actions.append(favorite, edit, duplicate, remove, exportButton);
        card.appendChild(actions);
    }

    updateCardActions(card);
}

function updateCardActions(card) {
    const avatarId = getCardAvatarId(card);
    const favorite = card.querySelector(':scope > .mpp-card-actions .mpp-action-favorite');
    const isFavorite = favoritePersonas.has(avatarId);
    card.classList.toggle('mpp-is-favorite', isFavorite);
    if (!favorite) return;
    const label = t(isFavorite ? 'unfavorite' : 'favorite');
    favorite.classList.toggle('is-active', isFavorite);
    favorite.title = label;
    favorite.setAttribute('aria-label', label);
    favorite.setAttribute('aria-pressed', String(isFavorite));
}

function updateCardBadges(card) {
    let badges = card.querySelector(':scope > .mpp-card-badges');
    if (!badges) {
        badges = createElement('span', 'mpp-card-badges');
        card.appendChild(badges);
    }
    const states = [
        ['selected', 'active', 'fa-circle-check'],
        ['default_persona', 'default', 'fa-crown'],
        ['locked_to_chat', 'chat', 'fa-comments'],
        ['locked_to_character', 'character', 'fa-user'],
    ];
    const activeStates = states.filter(([stateClass]) => card.classList.contains(stateClass));
    const signature = activeStates.map(([, labelKey]) => labelKey).join('|');
    if (badges.dataset.mppStates === signature) return;
    badges.dataset.mppStates = signature;
    badges.replaceChildren();

    activeStates.forEach(([, labelKey, iconClass]) => {
        const badge = createElement('span', `mpp-badge is-${labelKey}`);
        badge.setAttribute('aria-label', t(labelKey));
        badge.append(createElement('i', `fa-solid ${iconClass}`), createElement('span', '', t(labelKey)));
        badges.appendChild(badge);
    });
    badges.hidden = badges.childElementCount === 0;
}

function updateCardTags(card) {
    const avatarId = getCardAvatarId(card);
    const host = card.querySelector(':scope .character_select_container');
    const tags = avatarId ? getPersonaTags(avatarId) : [];
    const existing = card.querySelector(':scope .mpp-card-tags');
    if (!host || !tags.length) {
        existing?.remove();
        return;
    }
    const tagsRow = existing || host.appendChild(createElement('span', 'mpp-card-tags'));
    const signature = tags.join('\u0001');
    if (tagsRow.dataset.mppTags === signature) return;
    tagsRow.dataset.mppTags = signature;
    const chips = tags.slice(0, 3).map(tag => {
        const chip = createElement('button', 'mpp-card-tag');
        chip.type = 'button';
        chip.dataset.tag = tag;
        const label = t('tagCardFilter').replace('{tag}', tag);
        chip.title = label;
        chip.setAttribute('aria-label', label);
        chip.append(createElement('i', 'fa-solid fa-tag'), createElement('span', '', tag));
        return chip;
    });
    if (tags.length > 3) {
        const more = createElement('span', 'mpp-card-tag-more', `+${tags.length - 3}`);
        more.title = tags.slice(3).join(', ');
        chips.push(more);
    }
    tagsRow.replaceChildren(...chips);
}

function decorateCards(avatarBlock) {
    avatarBlock.querySelectorAll(':scope > .avatar-container').forEach(card => {
        card.classList.add('mpp-persona-card');
        card.setAttribute('role', 'button');
        card.tabIndex = 0;
        const name = card.querySelector('.ch_name')?.textContent?.trim() || t('title');
        const image = card.querySelector('.avatar img');
        if (image) image.alt = name;
        if (card.dataset.mppKeyboard !== 'true') {
            card.dataset.mppKeyboard = 'true';
            card.addEventListener('keydown', event => {
                if (event.target !== card) return;
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    card.click();
                }
            });
        }
        ensureCardActions(card);
        updateCardBadges(card);
        updateCardTags(card);
    });
}

async function refreshPersonaCount(counter) {
    counter.textContent = t('loading');
    try {
        const avatars = await getUserAvatars(false);
        const count = Array.isArray(avatars) ? avatars.length : 0;
        counter.textContent = formatPersonaCount(count);
    } catch (error) {
        console.warn(`[${EXTENSION_NAME}] Could not count personas.`, error);
        counter.textContent = t('personaMany');
    }
}

function createPersonaWorkspace(panel, createButton, personaCounter, updateSpotlight) {
    if (!createButton) return null;

    const workspace = createElement('section', 'mpp-creator');
    workspace.hidden = true;
    workspace.setAttribute('aria-label', t('createWorkspace'));

    const top = createElement('header', 'mpp-creator-top');
    const backButton = createElement('button', 'mpp-button mpp-creator-back');
    backButton.type = 'button';
    backButton.setAttribute('aria-label', t('creatorBack'));
    backButton.title = t('creatorBack');
    backButton.append(createElement('i', 'fa-solid fa-arrow-left'), createElement('span', '', t('creatorBack')));
    const saveButton = createElement('button', 'mpp-button mpp-creator-save');
    saveButton.type = 'button';
    saveButton.append(createElement('i', 'fa-solid fa-check'), createElement('span', '', t('creatorSave')));
    top.append(backButton, saveButton);

    const body = createElement('div', 'mpp-creator-body');
    const left = createElement('aside', 'mpp-creator-left');
    const photoFrame = createElement('div', 'mpp-creator-photo-frame');
    const photoButton = createElement('button', 'mpp-creator-photo');
    photoButton.type = 'button';
    photoButton.setAttribute('aria-label', t('creatorPhoto'));
    const photoImage = createElement('img');
    photoImage.alt = '';
    photoImage.hidden = true;
    const photoEmpty = createElement('span', 'mpp-creator-photo-empty');
    photoEmpty.append(createElement('i', 'fa-regular fa-image'), createElement('strong', '', t('creatorPhoto')));
    const photoInput = createElement('input');
    photoInput.type = 'file';
    photoInput.accept = 'image/*';
    photoInput.hidden = true;
    photoButton.append(photoImage, photoEmpty);
    photoFrame.appendChild(photoButton);

    const toolNav = createElement('nav', 'mpp-creator-tools');
    const toolDefinitions = [
        ['position', 'fa-location-dot', t('creatorPosition')],
        ['connections', 'fa-link', t('creatorConnections')],
        ['lorebook', 'fa-book-open', t('creatorLorebook')],
    ];
    const toolButtons = new Map();
    toolDefinitions.forEach(([key, icon, label]) => {
        const button = createElement('button', 'mpp-creator-tool');
        button.type = 'button';
        button.dataset.creatorTool = key;
        /* Narrow panels hide the text label; keep the name on hover and for screen readers. */
        button.title = label;
        button.setAttribute('aria-label', label);
        button.append(createElement('i', `fa-solid ${icon}`), createElement('span', '', label));
        toolButtons.set(key, button);
        toolNav.appendChild(button);
    });
    left.append(photoFrame, photoInput, toolNav);

    const right = createElement('div', 'mpp-creator-right');
    const identity = createElement('header', 'mpp-creator-identity');
    const identityCopy = createElement('span', 'mpp-creator-identity-copy');
    const nameDisplay = createElement('strong', 'mpp-creator-name', t('creatorName'));
    const nameInput = createElement('input', 'mpp-creator-name-input');
    nameInput.type = 'text';
    nameInput.maxLength = 120;
    nameInput.placeholder = t('creatorName');
    nameInput.hidden = true;
    const identityMeta = createElement('span', 'mpp-creator-meta');
    identityMeta.hidden = true;
    identityCopy.append(nameDisplay, nameInput, identityMeta);
    const identityActions = createElement('span', 'mpp-creator-actions');
    const renameButton = createIconButton('fa-pencil', t('creatorRename'), 'mpp-creator-rename');
    const activateButton = createIconButton('fa-circle-check', t('activatePersona'), 'mpp-creator-action mpp-creator-activate');
    const defaultButton = createIconButton('fa-crown', t('makeDefault'), 'mpp-creator-action mpp-creator-default');
    const favoriteButton = createIconButton('fa-star', t('favorite'), 'mpp-creator-action mpp-creator-favorite');
    const recropButton = createIconButton('fa-image', t('changePortrait'), 'mpp-creator-action mpp-creator-recrop');
    const duplicateButton = createIconButton('fa-clone', t('duplicatePersona'), 'mpp-creator-action mpp-creator-duplicate');
    const exportButton = createIconButton('fa-file-export', t('exportPersona'), 'mpp-creator-action mpp-creator-export');
    const deleteButton = createIconButton('fa-trash', t('deletePersona'), 'mpp-creator-action mpp-creator-delete');
    identityActions.append(renameButton, activateButton, defaultButton, favoriteButton, recropButton, duplicateButton, exportButton, deleteButton);
    identity.append(identityCopy, identityActions);

    const descriptionField = createElement('section', 'mpp-creator-field mpp-creator-description');
    const descriptionHead = createElement('header', 'mpp-creator-field-head');
    const descriptionTitle = createElement('strong', '', t('creatorDescription'));
    descriptionTitle.prepend(createElement('i', 'fa-solid fa-align-left'));
    const descriptionCounter = createElement('small', 'mpp-creator-counter', '0');
    const expandDescription = createIconButton('fa-expand', t('creatorExpandDescription'), 'mpp-creator-description-expand');
    descriptionHead.append(descriptionTitle, descriptionCounter, expandDescription);
    const description = createElement('textarea', 'text_pole mpp-creator-description-input');
    description.rows = 12;
    descriptionField.append(descriptionHead, description);

    const toolStage = createElement('section', 'mpp-creator-tool-stage');
    toolStage.hidden = true;
    const toolStageHead = createElement('header', 'mpp-creator-tool-stage-head');
    const toolStageTitle = createElement('strong', '', t('creatorPosition'));
    toolStageHead.appendChild(toolStageTitle);

    const positionPanel = createElement('div', 'mpp-creator-tool-panel');
    positionPanel.dataset.creatorPanel = 'position';
    const position = createElement('select', 'text_pole');
    position.hidden = true;
    const positionChoices = createElement('div', 'mpp-creator-choice-list');
    const positionButtons = new Map();
    const positionDefinitions = [
        [0, t('creatorInPrompt')],
        [2, t('creatorTopAn')],
        [3, t('creatorBottomAn')],
        [4, t('creatorAtDepth')],
        [9, t('creatorNone')],
    ];
    positionDefinitions.forEach(([value, label]) => {
        position.appendChild(new Option(label, String(value)));
        const button = createElement('button', 'mpp-creator-choice', label);
        button.type = 'button';
        button.dataset.value = String(value);
        button.setAttribute('aria-pressed', 'false');
        positionButtons.set(String(value), button);
        positionChoices.appendChild(button);
    });
    const depthRow = createElement('div', 'mpp-creator-depth-row');
    const depthLabel = createElement('label');
    depthLabel.append(createElement('span', '', t('creatorDepth')));
    const depth = createElement('input', 'text_pole');
    depth.type = 'number';
    depth.min = '0';
    depth.max = '9999';
    depth.value = '2';
    depthLabel.appendChild(depth);
    const roleLabel = createElement('label');
    roleLabel.append(createElement('span', '', t('creatorRole')));
    const role = createElement('select', 'text_pole');
    [[0, t('creatorSystem')], [1, t('creatorUser')], [2, t('creatorAssistant')]]
        .forEach(([value, label]) => role.appendChild(new Option(label, String(value))));
    roleLabel.appendChild(role);
    depthRow.append(depthLabel, roleLabel);
    positionPanel.append(position, positionChoices, depthRow);

    const connectionsPanel = createElement('div', 'mpp-creator-tool-panel mpp-creator-connections');
    connectionsPanel.dataset.creatorPanel = 'connections';
    const connectionDefinitions = [
        ['default', 'fa-crown', t('creatorDefault')],
        ['character', 'fa-user-lock', t('creatorCharacter')],
        ['chat', 'fa-comment', t('creatorChat')],
    ];
    const connectionButtons = new Map();
    connectionDefinitions.forEach(([key, icon, label]) => {
        const button = createElement('button', 'mpp-creator-connection');
        button.type = 'button';
        button.dataset.lockType = key;
        button.setAttribute('aria-pressed', 'false');
        button.append(createElement('i', `fa-solid ${icon}`), createElement('span', '', label));
        connectionButtons.set(key, button);
        connectionsPanel.appendChild(button);
    });

    const lorebookPanel = createElement('div', 'mpp-creator-tool-panel');
    lorebookPanel.dataset.creatorPanel = 'lorebook';
    const lorebook = createElement('select', 'text_pole');
    lorebook.hidden = true;
    const lorebookChoices = createElement('div', 'mpp-creator-choice-list mpp-creator-lorebook-list');
    const openLorebookButton = createElement('button', 'mpp-button mpp-open-lorebook');
    openLorebookButton.type = 'button';
    openLorebookButton.append(createElement('i', 'fa-solid fa-arrow-up-right-from-square'), createElement('span', '', t('openLorebook')));
    lorebookPanel.append(lorebook, lorebookChoices, openLorebookButton);
    toolStage.append(toolStageHead, positionPanel, connectionsPanel, lorebookPanel);
    left.appendChild(toolStage);

    const connectionPreview = createElement('section', 'mpp-creator-linked');
    connectionPreview.hidden = true;
    connectionPreview.appendChild(createElement('strong', 'mpp-creator-linked-title', t('linkedCharacters')));
    const connectionPreviewInfo = createElement('div', 'mpp-creator-linked-info');
    const connectionPreviewList = createElement('div', 'mpp-creator-linked-list text_muted');
    connectionPreview.append(connectionPreviewInfo, connectionPreviewList);
    left.appendChild(connectionPreview);

    const notesField = createElement('label', 'mpp-creator-field mpp-creator-notes');
    const notesTitle = createElement('strong', '', t('creatorNotes'));
    notesTitle.prepend(createElement('i', 'fa-solid fa-lock'));
    const notesHint = createElement('small', '', t('creatorNotesHint'));
    const notes = createElement('textarea', 'text_pole');
    notes.rows = 5;
    notesField.append(notesTitle, notesHint, notes);

    const tagsField = createElement('section', 'mpp-creator-field mpp-creator-tags');
    const tagsTitle = createElement('strong', '', t('tags'));
    tagsTitle.prepend(createElement('i', 'fa-solid fa-tags'));
    const tagsHint = createElement('small', '', t('tagsHint'));
    const tagsEditor = createElement('div', 'mpp-tags-editor');
    const tagsInput = createElement('input', 'mpp-tags-input');
    tagsInput.type = 'text';
    tagsInput.placeholder = t('tagAdd');
    tagsInput.setAttribute('aria-label', t('tagAdd'));
    tagsEditor.appendChild(tagsInput);
    tagsField.append(tagsTitle, tagsHint, tagsEditor);
    right.append(identity, descriptionField, tagsField, notesField);
    body.append(left, right);
    workspace.append(top, body);

    const state = {
        activeTool: '',
        avatarId: '',
        draftTags: [],
        busy: false,
        file: null,
        objectUrl: '',
        cropData: null,
        previousWindowMode: 'standard',
        locks: new Set(),
        // True when the user explicitly pressed "activate" (as opposed to the silent activation on open).
        deliberateActivation: false,
    };
    let descriptionTimer;
    const updateDescriptionCounter = () => {
        descriptionCounter.textContent = String(description.value.length);
    };
    const editedTags = () => state.avatarId ? getPersonaTags(state.avatarId) : state.draftTags;
    const updateEditedTags = tags => {
        if (state.avatarId) setPersonaTags(state.avatarId, tags);
        else state.draftTags = [...new Set(tags.map(tag => String(tag).trim()).filter(Boolean))];
    };

    const createTagChip = tag => {
        const chip = createElement('span', 'mpp-tag-chip');
        chip.append(createElement('i', 'fa-solid fa-tag'), createElement('span', '', tag));
        const remove = createElement('button', 'mpp-tag-remove', '×');
        remove.type = 'button';
        remove.title = t('tagRemove');
        remove.setAttribute('aria-label', `${t('tagRemove')}: ${tag}`);
        remove.addEventListener('click', () => {
            updateEditedTags(editedTags().filter(item => item !== tag));
            renderTagsEditor();
            panel.mppRefresh?.();
        });
        chip.appendChild(remove);
        return chip;
    };
    const renderTagsEditor = () => {
        tagsEditor.querySelectorAll('.mpp-tag-chip').forEach(chip => chip.remove());
        const tags = editedTags();
        tagsEditor.prepend(...tags.map(createTagChip));
        tagsInput.value = '';
    };
    const commitTagsInput = () => {
        const value = tagsInput.value.trim();
        tagsInput.value = '';
        if (!value) return;
        updateEditedTags([...editedTags(), ...value.split(',')]);
        renderTagsEditor();
        panel.mppRefresh?.();
    };
    tagsInput.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ',') return;
        event.preventDefault();
        commitTagsInput();
    });
    tagsInput.addEventListener('blur', commitTagsInput);
    tagsEditor.addEventListener('click', event => {
        if (event.target === tagsEditor) tagsInput.focus();
    });

    const context = () => globalThis.SillyTavern?.getContext?.();
    const notify = (message, type = 'error') => {
        const toast = globalThis.toastr?.[type];
        if (typeof toast === 'function') toast(message);
        else console[type === 'error' ? 'error' : 'info'](`[${EXTENSION_NAME}] ${message}`);
    };
    const saveSettings = () => context()?.saveSettingsDebounced?.();
    const descriptor = () => state.avatarId ? power_user.persona_descriptions?.[state.avatarId] : null;
    const runEditorAction = async (button, action) => {
        if (state.busy || button.disabled) return;
        button.disabled = true;
        button.classList.add('is-busy');
        button.setAttribute('aria-busy', 'true');
        try { await action(); }
        catch (error) {
            console.error(`[${EXTENSION_NAME}] Persona editor action failed.`, error);
            notify(t('actionError'));
        } finally {
            button.disabled = false;
            button.classList.remove('is-busy');
            button.removeAttribute('aria-busy');
            if (state.avatarId === user_avatar) syncConnectionButtons();
            renderEditorActions();
        }
    };
    const syncConnectionButtons = () => {
        state.locks.clear();
        connectionButtons.forEach((button, type) => {
            const active = Boolean(isPersonaLocked(type));
            if (active) state.locks.add(type);
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    };
    const renderEditorMeta = () => {
        const hasPersona = Boolean(state.avatarId && power_user.personas?.[state.avatarId] !== undefined);
        const states = hasPersona ? [
            state.avatarId === user_avatar ? ['active', 'fa-circle-check', t('active')] : null,
            state.avatarId === power_user.default_persona ? ['default', 'fa-crown', t('default')] : null,
            favoritePersonas.has(state.avatarId) ? ['favorite', 'fa-star', t('favoriteShort')] : null,
            state.locks.has('character') ? ['character', 'fa-user', t('character')] : null,
            state.locks.has('chat') ? ['chat', 'fa-comments', t('chat')] : null,
        ].filter(Boolean) : [];
        identityMeta.replaceChildren(...states.map(([stateName, icon, label]) => {
            const chip = createElement('span', `mpp-badge is-${stateName}`);
            chip.append(createElement('i', `fa-solid ${icon}`), createElement('span', '', label));
            return chip;
        }));
        identityMeta.hidden = states.length === 0;
    };
    const renderEditorActions = () => {
        const hasPersona = Boolean(state.avatarId && power_user.personas?.[state.avatarId] !== undefined);
        [activateButton, defaultButton, favoriteButton, recropButton, duplicateButton, exportButton, deleteButton]
            .forEach(button => { button.hidden = !hasPersona; });
        activateButton.classList.toggle('is-active', hasPersona && state.avatarId === user_avatar);
        defaultButton.classList.toggle('is-active', hasPersona && state.avatarId === power_user.default_persona);
        favoriteButton.classList.toggle('is-active', hasPersona && favoritePersonas.has(state.avatarId));
        favoriteButton.title = t(hasPersona && favoritePersonas.has(state.avatarId) ? 'unfavorite' : 'favorite');
        renderEditorMeta();
    };
    const renderHeroContext = () => {
        const editing = !workspace.hidden && Boolean(state.avatarId);
        const creating = !workspace.hidden && !state.avatarId;
        const statsButton = panel.querySelector('.user_stats_button');
        const backupButton = panel.querySelector('#personas_backup');
        const restoreButton = panel.querySelector('#personas_restore');
        if (statsButton) statsButton.hidden = creating;
        if (backupButton) backupButton.hidden = creating;
        if (restoreButton) restoreButton.hidden = editing;
    };
    const renderConnectionPreview = () => {
        connectionPreview.hidden = !state.avatarId;
        if (!state.avatarId) return;
        updatePersonaConnectionsAvatarList();
        const nativeInfo = panel.querySelector('#persona_connections_info_block');
        const nativeList = panel.querySelector('#persona_connections_list');
        connectionPreviewInfo.replaceChildren(...[...(nativeInfo?.childNodes || [])].map(node => node.cloneNode(true)));
        connectionPreviewList.replaceChildren(...[...(nativeList?.childNodes || [])].map(node => node.cloneNode(true)));
        connectionPreview.classList.toggle('is-empty', !connectionPreviewList.querySelector('.avatar'));
    };
    const updateDescriptor = () => {
        const value = descriptor();
        if (!value) return;
        value.description = description.value;
        value.position = Number(position.value);
        value.depth = Number(depth.value) || 0;
        value.role = Number(role.value);
        value.lorebook = lorebook.value;
        markPersonaModified(state.avatarId);
        if (state.avatarId === user_avatar) {
            power_user.persona_description = value.description;
            power_user.persona_description_position = value.position;
            power_user.persona_description_depth = value.depth;
            power_user.persona_description_role = value.role;
            power_user.persona_description_lorebook = value.lorebook;
            setPersonaDescription();
        }
        saveSettings();
        const cardDescription = panel.querySelector(`#user_avatar_block [data-avatar-id="${CSS.escape(state.avatarId)}"] .ch_description`);
        if (cardDescription) cardDescription.textContent = value.description || `[${t('noDescription')}]`;
    };
    const writeNotes = () => {
        if (!state.avatarId) return;
        try {
            const stored = JSON.parse(localStorage.getItem(PERSONA_NOTES_KEY) || '{}');
            if (notes.value) stored[state.avatarId] = notes.value;
            else delete stored[state.avatarId];
            localStorage.setItem(PERSONA_NOTES_KEY, JSON.stringify(stored));
        } catch (error) {
            console.warn(`[${EXTENSION_NAME}] Could not save private persona notes.`, error);
        }
    };
    const readNotes = avatarId => {
        try {
            const stored = JSON.parse(localStorage.getItem(PERSONA_NOTES_KEY) || '{}');
            return String(stored?.[avatarId] || '');
        } catch {
            return '';
        }
    };
    const fillLorebooks = () => {
        const selected = lorebook.value;
        lorebook.replaceChildren(new Option(t('creatorNoLorebook'), ''));
        for (const name of world_names || []) lorebook.appendChild(new Option(name, name));
        lorebook.value = [...lorebook.options].some(option => option.value === selected) ? selected : '';
        openLorebookButton.disabled = !lorebook.value;
        lorebookChoices.replaceChildren();
        [...lorebook.options].forEach(option => {
            const button = createElement('button', 'mpp-creator-choice', option.textContent);
            button.type = 'button';
            button.dataset.value = option.value;
            button.classList.toggle('is-active', option.value === lorebook.value);
            button.setAttribute('aria-pressed', String(option.value === lorebook.value));
            button.addEventListener('click', () => {
                lorebook.value = option.value;
                lorebookChoices.querySelectorAll('.mpp-creator-choice').forEach(choice => {
                    const active = choice.dataset.value === lorebook.value;
                    choice.classList.toggle('is-active', active);
                    choice.setAttribute('aria-pressed', String(active));
                });
                updateDescriptor();
                openLorebookButton.disabled = !lorebook.value;
            });
            lorebookChoices.appendChild(button);
        });
    };
    const renderPositionDetails = () => {
        positionButtons.forEach((button, value) => {
            const active = value === position.value;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', String(active));
        });
        depthRow.hidden = Number(position.value) !== 4;
    };
    const renderActiveTool = () => {
        workspace.dataset.creatorTool = state.activeTool;
        const activeToolButton = state.activeTool ? toolButtons.get(state.activeTool) : null;
        toolStageTitle.textContent = activeToolButton?.querySelector('span')?.textContent || t('creatorPosition');
        toolStage.hidden = !state.activeTool;
        toolButtons.forEach((button, key) => {
            const active = key === state.activeTool;
            button.hidden = Boolean(state.activeTool && !active);
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-expanded', String(active));
        });
        toolStage.querySelectorAll('[data-creator-panel]').forEach(element => {
            element.hidden = element.dataset.creatorPanel !== state.activeTool;
        });
    };
    const startNameEdit = () => {
        nameDisplay.hidden = true;
        nameInput.hidden = false;
        renameButton.classList.add('is-active');
        renameButton.setAttribute('aria-pressed', 'true');
        nameInput.value = nameDisplay.textContent === t('creatorName') ? '' : nameDisplay.textContent;
        requestAnimationFrame(() => nameInput.focus());
    };
    const finishNameEdit = async () => {
        if (nameInput.hidden) return;
        const nextName = nameInput.value.trim();
        nameInput.hidden = true;
        nameDisplay.hidden = false;
        renameButton.classList.remove('is-active');
        renameButton.setAttribute('aria-pressed', 'false');
        nameDisplay.textContent = nextName || t('creatorName');
        if (state.avatarId && nextName && power_user.personas[state.avatarId] !== nextName) {
            const previousName = power_user.personas[state.avatarId] || '';
            power_user.personas[state.avatarId] = nextName;
            markPersonaModified(state.avatarId);
            if (state.avatarId === user_avatar) setUserName(nextName);
            saveSettings();
            await eventSource.emit(event_types.PERSONA_RENAMED, {
                avatarId: state.avatarId,
                oldName: previousName,
                newName: nextName,
            });
            await getUserAvatars(true, state.avatarId);
            panel.mppRefresh?.();
            updateSpotlight();
        }
    };
    const uploadPortrait = async (avatarId, file, cropData = null) => {
        const ctx = context();
        if (!ctx?.getRequestHeaders) throw new Error('SillyTavern request context is unavailable.');
        const form = new FormData();
        form.append('avatar', file, 'avatar.png');
        form.append('overwrite_name', avatarId);
        const cropQuery = cropData ? `?crop=${encodeURIComponent(JSON.stringify(cropData))}` : '';
        const response = await fetch(`/api/avatars/upload${cropQuery}`, {
            method: 'POST',
            headers: ctx.getRequestHeaders({ omitContentType: true }),
            cache: 'no-cache',
            body: form,
        });
        if (!response.ok) throw new Error(`Avatar upload failed (${response.status}).`);
    };
    const readFileAsDataUrl = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => resolve(String(reader.result || '')), { once: true });
        reader.addEventListener('error', () => reject(reader.error || new Error('Could not read image.')), { once: true });
        reader.readAsDataURL(file);
    });
    const preparePortrait = async file => {
        let previewSource = '';
        let cropData = null;
        if (!power_user.never_resize_avatars) {
            const source = await readFileAsDataUrl(file);
            const popup = new Popup(t('creatorCropPhoto'), POPUP_TYPE.CROP, '', { cropImage: source });
            const croppedImage = await popup.show();
            if (!croppedImage) return false;
            cropData = popup.cropData ?? null;
            previewSource = String(croppedImage);
        }
        state.file = file;
        state.cropData = cropData;
        photoButton.classList.remove('has-error');
        if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
        state.objectUrl = previewSource.startsWith('data:') ? '' : URL.createObjectURL(file);
        photoImage.src = previewSource.startsWith('data:') ? previewSource : state.objectUrl;
        photoImage.hidden = false;
        photoEmpty.hidden = true;
        return true;
    };
    const commitPreparedPortrait = async () => {
        if (!state.avatarId || !state.file) return;
        await uploadPortrait(state.avatarId, state.file, state.cropData);
        markPersonaImageChanged(state.avatarId);
        markPersonaModified(state.avatarId);
        await getUserAvatars(true, state.avatarId);
        await setUserAvatar(state.avatarId);
        await eventSource.emit(event_types.PERSONA_UPDATED, state.avatarId);
        refreshPersonaImages(panel, state.avatarId);
        photoImage.src = personaImageUrl(state.avatarId);
        state.file = null;
        state.cropData = null;
        await panel.mppRefresh?.();
        updateSpotlight();
    };
    const recropExistingPortrait = async () => {
        if (!state.avatarId) return;
        try {
            const response = await fetch(personaImageUrl(state.avatarId), { cache: 'no-store' });
            if (!response.ok) throw new Error(`Portrait download failed (${response.status}).`);
            const blob = await response.blob();
            const file = new File([blob], state.avatarId, { type: blob.type || 'image/png' });
            if (!(await preparePortrait(file))) return;
            await commitPreparedPortrait();
        } catch (error) {
            console.error(`[${EXTENSION_NAME}] Could not recrop persona portrait.`, error);
            notify(t('creatorError'));
        }
    };
    const applyLocks = async () => {
        for (const type of connectionButtons.keys()) {
            const desired = state.locks.has(type);
            if (Boolean(isPersonaLocked(type)) !== desired) await togglePersonaLock(type);
        }
    };
    const reset = () => {
        state.activeTool = '';
        state.avatarId = '';
        state.draftTags = [];
        state.busy = false;
        state.file = null;
        state.cropData = null;
        state.deliberateActivation = false;
        state.locks.clear();
        if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
        state.objectUrl = '';
        photoImage.removeAttribute('src');
        photoImage.hidden = true;
        photoEmpty.hidden = false;
        photoButton.classList.remove('has-error');
        nameDisplay.textContent = t('creatorName');
        nameDisplay.hidden = false;
        nameInput.value = '';
        nameInput.hidden = true;
        renameButton.classList.remove('is-active');
        renameButton.setAttribute('aria-pressed', 'false');
        description.value = '';
        updateDescriptionCounter();
        position.value = '0';
        depth.value = '2';
        role.value = '0';
        notes.value = '';
        lorebook.value = '';
        renderTagsEditor();
        fillLorebooks();
        connectionButtons.forEach(button => {
            button.classList.remove('is-active');
            button.setAttribute('aria-pressed', 'false');
        });
        saveButton.disabled = false;
        saveButton.querySelector('span').textContent = t('creatorSave');
        saveButton.querySelector('i').className = 'fa-solid fa-check';
        workspace.classList.remove('is-description-expanded', 'is-saved');
        expandDescription.querySelector('i').className = 'fa-solid fa-expand';
        renderPositionDetails();
        renderActiveTool();
        renderEditorActions();
        renderHeroContext();
        renderConnectionPreview();
    };
    const showWorkspace = () => {
        panel.mppCloseCleanup?.();
        state.previousWindowMode = panel.dataset.mppWindowMode || 'standard';
        panel.dataset.mppWindowMode = 'tall';
        panel.classList.add('mpp-creating');
        workspace.hidden = false;
        renderHeroContext();
    };
    const open = () => {
        reset();
        showWorkspace();
    };
    const openExisting = async (avatarId, imageSource = '') => {
        const existingName = power_user.personas?.[avatarId];
        if (!avatarId || existingName === undefined) return;
        if (user_avatar !== avatarId) {
            await setUserAvatar(avatarId, { toastPersonaNameChange: false });
        }
        reset();
        state.avatarId = avatarId;
        nameDisplay.textContent = existingName || t('creatorName');
        const value = power_user.persona_descriptions?.[avatarId] || {};
        description.value = value.description || '';
        updateDescriptionCounter();
        position.value = String(value.position ?? 0);
        depth.value = String(value.depth ?? 2);
        role.value = String(value.role ?? 0);
        lorebook.value = String(value.lorebook || '');
        fillLorebooks();
        notes.value = readNotes(avatarId);
        renderTagsEditor();
        syncConnectionButtons();
        const portraitSource = imageSource || personaImageUrl(avatarId);
        if (portraitSource) {
            photoImage.src = portraitSource;
            photoImage.hidden = false;
            photoEmpty.hidden = true;
        }
        saveButton.querySelector('span').textContent = t('creatorSaveChanges');
        renderPositionDetails();
        renderEditorActions();
        showWorkspace();
        renderConnectionPreview();
    };
    const close = () => {
        if (state.busy) return;
        // Capture before reset() wipes them: listeners may need to know what was edited and how.
        const closedAvatarId = state.avatarId;
        const deliberateActivation = state.deliberateActivation;
        workspace.hidden = true;
        panel.classList.remove('mpp-creating');
        panel.dataset.mppWindowMode = state.previousWindowMode;
        reset();
        renderHeroContext();
        panel.mppPersonaEditorClosed?.({ avatarId: closedAvatarId, deliberateActivation });
    };

    createButton.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        open();
    }, { capture: true });
    panel.mppOpenPersonaEditor = openExisting;
    panel.mppClosePersonaEditor = close;
    panel.mppPersonaEditorAvatarId = () => state.avatarId;
    panel.mppRefreshPersonaEditor = () => {
        if (workspace.hidden || !state.avatarId || power_user.personas?.[state.avatarId] === undefined) return;
        if (nameInput.hidden) nameDisplay.textContent = power_user.personas[state.avatarId] || t('creatorName');
        if (!state.file) {
            photoImage.src = personaImageUrl(state.avatarId);
            photoImage.hidden = false;
            photoEmpty.hidden = true;
        }
        if (state.avatarId === user_avatar) syncConnectionButtons();
        renderEditorActions();
        renderConnectionPreview();
    };
    backButton.addEventListener('click', close);
    photoButton.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', async () => {
        const file = photoInput.files?.[0];
        photoInput.value = '';
        if (!file) return;
        try {
            if (!(await preparePortrait(file))) return;
            if (state.avatarId) {
                await commitPreparedPortrait();
            }
        } catch (error) {
            console.error(`[${EXTENSION_NAME}] Could not prepare persona portrait.`, error);
            notify(t('creatorError'));
        }
    });
    activateButton.addEventListener('click', () => runEditorAction(activateButton, async () => {
        if (!state.avatarId) return;
        state.deliberateActivation = true;
        await setUserAvatar(state.avatarId);
        syncConnectionButtons();
        await panel.mppRefresh?.();
        renderEditorActions();
        renderConnectionPreview();
    }));
    defaultButton.addEventListener('click', () => runEditorAction(defaultButton, async () => {
        if (!state.avatarId) return;
        await setUserAvatar(state.avatarId, { toastPersonaNameChange: false });
        const locked = await togglePersonaLock('default');
        if (locked) state.locks.add('default');
        else state.locks.delete('default');
        connectionButtons.get('default')?.classList.toggle('is-active', locked);
        connectionButtons.get('default')?.setAttribute('aria-pressed', String(locked));
        await panel.mppRefresh?.();
        renderEditorActions();
    }));
    favoriteButton.addEventListener('click', () => runEditorAction(favoriteButton, async () => {
        if (!state.avatarId) return;
        if (favoritePersonas.has(state.avatarId)) favoritePersonas.delete(state.avatarId);
        else favoritePersonas.add(state.avatarId);
        saveFavorites();
        await panel.mppRefresh?.();
        renderEditorActions();
    }));
    recropButton.addEventListener('click', () => runEditorAction(recropButton, recropExistingPortrait));
    duplicateButton.addEventListener('click', () => runEditorAction(duplicateButton, () => duplicatePersonaThroughSillyTavern(panel, state.avatarId)));
    exportButton.addEventListener('click', () => runEditorAction(exportButton, () => exportPersonaJson(state.avatarId)));
    deleteButton.addEventListener('click', () => runEditorAction(deleteButton, async () => {
        const scheduled = await schedulePersonaDeletion(panel, state.avatarId);
        if (scheduled) close();
    }));
    openLorebookButton.addEventListener('click', () => runEditorAction(openLorebookButton, async () => {
        if (lorebook.value) await openWorldInfoEditor(lorebook.value);
    }));
    renameButton.addEventListener('pointerdown', event => {
        if (!nameInput.hidden) event.preventDefault();
    });
    renameButton.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        if (nameInput.hidden) startNameEdit();
        else finishNameEdit();
    });
    nameInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            finishNameEdit();
        }
        if (event.key === 'Escape') {
            nameInput.hidden = true;
            nameDisplay.hidden = false;
            renameButton.classList.remove('is-active');
            renameButton.setAttribute('aria-pressed', 'false');
        }
    });
    nameInput.addEventListener('blur', finishNameEdit);
    toolButtons.forEach((button, key) => button.addEventListener('click', () => {
        state.activeTool = state.activeTool === key ? '' : key;
        if (key === 'lorebook') fillLorebooks();
        renderActiveTool();
    }));
    workspace.addEventListener('click', event => {
        if (!state.activeTool) return;
        if (event.target.closest('.mpp-creator-tools, .mpp-creator-tool-stage, button, input, textarea, select, label')) return;
        state.activeTool = '';
        renderActiveTool();
    });
    expandDescription.addEventListener('click', () => {
        const expanded = workspace.classList.toggle('is-description-expanded');
        expandDescription.querySelector('i').className = `fa-solid ${expanded ? 'fa-compress' : 'fa-expand'}`;
    });
    positionButtons.forEach((button, value) => button.addEventListener('click', () => {
        position.value = value;
        renderPositionDetails();
        updateDescriptor();
    }));
    depth.addEventListener('input', updateDescriptor);
    role.addEventListener('change', updateDescriptor);
    description.addEventListener('input', () => {
        updateDescriptionCounter();
        window.clearTimeout(descriptionTimer);
        descriptionTimer = window.setTimeout(updateDescriptor, 250);
    });
    notes.addEventListener('input', writeNotes);
    connectionButtons.forEach((button, type) => button.addEventListener('click', () => runEditorAction(button, async () => {
        const active = !state.locks.has(type);
        if (active) state.locks.add(type);
        else state.locks.delete(type);
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
        if (state.avatarId) {
            await applyLocks();
            syncConnectionButtons();
            renderConnectionPreview();
            await panel.mppRefresh?.();
        }
    })));
    saveButton.addEventListener('click', async () => {
        if (state.busy) return;
        commitTagsInput();
        if (!nameInput.hidden) await finishNameEdit();
        const name = nameDisplay.textContent.trim();
        if (!name || name === t('creatorName')) {
            notify(t('creatorNameRequired'));
            startNameEdit();
            return;
        }
        const isNew = !state.avatarId;
        if (isNew && !state.file) {
            notify(t('creatorPhotoRequired'));
            photoButton.classList.add('has-error');
            photoButton.focus();
            return;
        }
        const safeName = name.replace(/[^a-zA-Z0-9]/g, '') || 'persona';
        const avatarId = state.avatarId || `${Date.now()}-${safeName}.png`;
        let shouldClose = false;
        try {
            state.busy = true;
            saveButton.disabled = true;
            saveButton.querySelector('span').textContent = t('creatorSaving');
            saveButton.querySelector('i').className = 'fa-solid fa-hourglass-half';
            if (isNew) {
                await initPersona(avatarId, name, description.value, '', {
                    position: Number(position.value),
                    depth: Number(depth.value) || 0,
                    role: Number(role.value),
                    lorebook: lorebook.value,
                });
                state.avatarId = avatarId;
                power_user.persona_descriptions[avatarId].connections = [];
                await uploadPortrait(avatarId, state.file, state.cropData);
                markPersonaImageChanged(avatarId);
                markPersonaModified(avatarId);
                rememberFirstSeen([avatarId]);
            } else {
                power_user.personas[avatarId] = name;
                updateDescriptor();
                markPersonaModified(avatarId);
                await eventSource.emit(event_types.PERSONA_UPDATED, avatarId);
            }
            saveSettings();
            await getUserAvatars(true, avatarId);
            await setUserAvatar(avatarId);
            await applyLocks();
            writeNotes();
            if (isNew) setPersonaTags(avatarId, state.draftTags);
            state.file = null;
            state.cropData = null;
            workspace.classList.add('is-saved');
            saveButton.querySelector('span').textContent = t(isNew ? 'creatorSaved' : 'creatorChangesSaved');
            saveButton.querySelector('i').className = 'fa-solid fa-circle-check';
            await refreshPersonaCount(personaCounter);
            await panel.mppRefresh?.();
            updateSpotlight();
            notify(t(isNew ? 'creatorSaved' : 'creatorChangesSaved'), 'success');
            shouldClose = true;
        } catch (error) {
            console.error(`[${EXTENSION_NAME}] Could not create persona.`, error);
            if (isNew && state.avatarId) {
                setPersonaTags(state.avatarId, []);
                delete power_user.personas?.[state.avatarId];
                delete power_user.persona_descriptions?.[state.avatarId];
                state.avatarId = '';
                saveSettings();
            }
            saveButton.disabled = false;
            saveButton.querySelector('span').textContent = t(isNew ? 'creatorSave' : 'creatorSaveChanges');
            saveButton.querySelector('i').className = 'fa-solid fa-check';
            notify(t('creatorError'));
        } finally {
            state.busy = false;
            saveButton.disabled = false;
        }
        if (shouldClose) close();
    });

    reset();
    return workspace;
}

function enhancePanel(panel) {
    if (!(panel instanceof HTMLElement) || panel.dataset.mppEnhanced === 'true') return;

    const shell = panel.firstElementChild;
    const nativeHeader = shell?.querySelector(':scope > .flex-container.alignItemsBaseline');
    const main = panel.querySelector('#persona-management-block');
    const leftColumn = main?.querySelector('.persona_management_left_column');
    const rightColumn = main?.querySelector('.persona_management_right_column');
    const avatarBlock = panel.querySelector('#user_avatar_block');
    if (!shell || !nativeHeader || !main || !leftColumn || !rightColumn || !avatarBlock) {
        console.warn(`[${EXTENSION_NAME}] Native Persona Management structure was not recognized.`);
        return;
    }

    panel.dataset.mppEnhanced = 'true';
    panel.classList.add('mpp-panel');

    const { hero, settingsButton, editorButton } = createHero(panel, nativeHeader);
    const appearance = createAppearancePanel(panel, settingsButton);
    const { spotlight, update: updateSpotlight } = createSpotlight(panel, editorButton);
    setupDesktopDimmer(panel);
    nativeHeader.hidden = true;
    shell.prepend(hero, appearance, spotlight);

    main.classList.add('mpp-main');
    leftColumn.classList.add('mpp-library-column');
    rightColumn.classList.add('mpp-editor-column');
    const nativeToolbar = leftColumn.firstElementChild;
    nativeToolbar?.classList.add('mpp-library-toolbar');
    const libraryHeader = createElement('header', 'mpp-library-header');
    const libraryCopy = createElement('span', 'mpp-library-copy');
    const libraryTitle = createElement('h3', '', t('library'));
    const personaCounter = createElement('span', 'mpp-persona-counter', t('loading'));
    libraryTitle.append(document.createTextNode(': '), personaCounter);
    libraryCopy.appendChild(libraryTitle);
    const densityControls = createDensityControls(avatarBlock);
    const mapOpenButton = createIconButton('fa-map', t('mapTitle'), 'mpp-map-open');
    const cleanupOpenButton = createIconButton('fa-broom', t('cleanupTitle'), 'mpp-cleanup-open');
    const libraryActions = createElement('span', 'mpp-library-actions');
    libraryActions.append(mapOpenButton, cleanupOpenButton, densityControls);
    libraryHeader.append(libraryCopy, libraryActions);
    leftColumn.prepend(libraryHeader);
    const { bar: filters, apply: applyFilter, renderTags: renderTagFilters, setTagFilter } = createFilterBar(avatarBlock);
    // Tag chips on cards double as filter shortcuts. Capture phase beats the card's own activation click.
    avatarBlock.addEventListener('click', event => {
        const chip = event.target instanceof Element ? event.target.closest('.mpp-card-tag') : null;
        if (!chip || !avatarBlock.contains(chip)) return;
        event.preventDefault();
        event.stopPropagation();
        setTagFilter(chip.dataset.tag || '');
    }, true);
    const createButton = nativeToolbar?.querySelector(':scope > .menu_button:not(#persona_grid_toggle), :scope > button:not(#persona_grid_toggle)');
    const searchInput = nativeToolbar?.querySelector('input[type="search"], input[type="text"]');
    const sortSelect = nativeToolbar?.querySelector('#persona_sort_order');
    const paginationContainer = panel.querySelector('#persona_pagination_container');
    if (paginationContainer) {
        const syncNativePageSize = () => {
            const selectedSize = String(Number(accountStorage.getItem('Personas_PerPage')) || 5);
            const nativeSizeSelect = paginationContainer.querySelector('.J-paginationjs-size-select');
            if (!nativeSizeSelect) return;
            nativeSizeSelect.value = selectedSize;
            [...nativeSizeSelect.options].forEach(option => {
                option.selected = option.value === selectedSize;
            });
        };
        paginationContainer.addEventListener('change', event => {
            const select = event.target.closest?.('.J-paginationjs-size-select');
            if (!select) return;
            accountStorage.setItem('Personas_PerPage', String(Number(select.value) || 5));
            requestAnimationFrame(syncNativePageSize);
        }, { capture: true });
        new MutationObserver(() => requestAnimationFrame(syncNativePageSize))
            .observe(paginationContainer, { childList: true, subtree: true });
        syncNativePageSize();
    }
    createButton?.classList.add('mpp-create-persona');
    if (searchInput) searchInput.placeholder = t('searchByPersonaName');
    nativeToolbar?.after(filters);
    // Keep the native controls and listeners when the panel crosses the phone breakpoint.
    // Pagination follows the cards in the phone's single scrolling library.
    const desktopLibraryQuery = window.matchMedia(DESKTOP_LAYOUT_QUERY);
    const shortTouchQuery = window.matchMedia('(max-height: 540px) and (pointer: coarse)');
    const syncLibraryLayout = () => {
        const width = panel.getBoundingClientRect().width;
        if (!width || !nativeToolbar) return;
        const narrow = width <= 562 || shortTouchQuery.matches; // Content box excludes borders.
        const createParent = !narrow && desktopLibraryQuery.matches ? filters : nativeToolbar;
        if (createButton && createButton.parentElement !== createParent) {
            if (createParent === filters) createParent.appendChild(createButton);
            else createParent.prepend(createButton);
        }
        const pagerParent = narrow ? leftColumn : nativeToolbar;
        if (paginationContainer && paginationContainer.parentElement !== pagerParent) pagerParent.appendChild(paginationContainer);
    };
    new ResizeObserver(syncLibraryLayout).observe(panel);
    desktopLibraryQuery.addEventListener('change', syncLibraryLayout);
    shortTouchQuery.addEventListener('change', syncLibraryLayout);
    syncLibraryLayout();

    const editorHead = createElement('header', 'mpp-editor-head');
    const editorBack = createElement('button', 'mpp-button mpp-editor-back');
    editorBack.type = 'button';
    editorBack.append(createElement('i', 'fa-solid fa-arrow-left'), createElement('span', '', t('backToLibrary')));
    editorHead.appendChild(editorBack);
    rightColumn.prepend(editorHead);

    let editorExpanded = localStorage.getItem(EDITOR_SECTION_KEY) === 'true';
    const renderEditorState = () => {
        panel.classList.toggle('mpp-editor-collapsed', !editorExpanded);
        editorButton.classList.toggle('is-active', editorExpanded);
        editorButton.setAttribute('aria-expanded', String(editorExpanded));
        editorButton.title = editorExpanded ? t('hideEditor') : t('showEditor');
        editorButton.setAttribute('aria-label', editorButton.title);
    };
    editorButton.addEventListener('click', () => {
        editorExpanded = !editorExpanded;
        localStorage.setItem(EDITOR_SECTION_KEY, String(editorExpanded));
        renderEditorState();
    });
    editorBack.addEventListener('click', () => {
        if (editorExpanded) editorButton.click();
    });
    renderEditorState();

    makeGlobalSettingsCollapsible(rightColumn.querySelector('.persona_management_global_settings'));
    const creatorWorkspace = createPersonaWorkspace(panel, createButton, personaCounter, updateSpotlight);
    if (creatorWorkspace) shell.appendChild(creatorWorkspace);
    const cleanupStage = createCleanupWorkspace(panel);
    shell.appendChild(cleanupStage.workspace);
    cleanupOpenButton.addEventListener('click', () => cleanupStage.open());
    const mapStage = createUsageMapStage(panel);
    shell.appendChild(mapStage.workspace);
    mapOpenButton.addEventListener('click', () => mapStage.open());
    const refreshRenderedLibrary = () => {
        decorateCards(avatarBlock);
        applyFilter();
        renderTagFilters();
        updateSpotlight();
    };
    const sortController = createSortController({
        panel,
        avatarBlock,
        searchInput,
        sortSelect,
        paginationContainer,
        afterRender: refreshRenderedLibrary,
    });
    panel.mppRefresh = async ({ reloadList = false, openPageAt = '', refreshCount = false } = {}) => {
        if (reloadList) await getUserAvatars(true, openPageAt || user_avatar);
        if (!(await sortController?.render?.())) refreshRenderedLibrary();
        panel.mppRefreshPersonaEditor?.();
        if (refreshCount) await refreshPersonaCount(personaCounter);
    };
    panel.mppRefresh({ refreshCount: true });

    let updateQueued = false;
    let pendingCardsChanged = false;
    let countTimer;
    const avatarObserver = new MutationObserver(mutations => {
        const cardsChanged = mutations.some(mutation =>
            mutation.type === 'childList' && mutation.target === avatarBlock);
        const cardStateChanged = mutations.some(mutation =>
            mutation.type === 'attributes'
            && mutation.target instanceof HTMLElement
            && mutation.target.parentElement === avatarBlock);
        if (!cardsChanged && !cardStateChanged) return;
        pendingCardsChanged ||= cardsChanged;

        if (!updateQueued) {
            updateQueued = true;
            requestAnimationFrame(() => {
                updateQueued = false;
                const shouldDecorate = pendingCardsChanged;
                pendingCardsChanged = false;
                if (shouldDecorate) decorateCards(avatarBlock);
                applyFilter();
                updateSpotlight();
            });
        }
        if (cardsChanged) {
            window.clearTimeout(countTimer);
            countTimer = window.setTimeout(() => refreshPersonaCount(personaCounter), 250);
        }
    });
    avatarObserver.observe(avatarBlock, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

    const nameElement = panel.querySelector('#your_name');
    if (nameElement) {
        new MutationObserver(() => {
            decorateCards(avatarBlock);
            updateSpotlight();
        }).observe(nameElement, { childList: true, characterData: true, subtree: true });
    }
}

let personaEventsWired = false;

function wirePersonaEvents() {
    if (personaEventsWired) return;
    personaEventsWired = true;
    const refresh = () => window.setTimeout(() => {
        document.querySelector(`${PANEL_SELECTOR}[data-mpp-enhanced='true']`)?.mppRefresh?.();
        updateGlobalPersonaLauncher();
    }, 0);
    const avatarIdFrom = payload => typeof payload === 'string' ? payload : payload?.avatarId;
    eventSource.on(event_types.PERSONA_CHANGED, payload => {
        if (skipNextUsageRecord) skipNextUsageRecord = false;
        else recordPersonaUse(avatarIdFrom(payload));
        refresh();
    });
    eventSource.on(event_types.PERSONA_UPDATED, payload => {
        markPersonaModified(avatarIdFrom(payload));
        refresh();
    });
    eventSource.on(event_types.PERSONA_CREATED, payload => {
        const avatarId = avatarIdFrom(payload);
        if (avatarId) rememberFirstSeen([avatarId]);
        refresh();
    });
    eventSource.on(event_types.PERSONA_DELETED, refresh);
    eventSource.on(event_types.PERSONA_RENAMED, payload => {
        markPersonaModified(avatarIdFrom(payload));
        refresh();
    });
    eventSource.on(event_types.MESSAGE_SENT, () => recordPersonaUse(user_avatar, { message: true }));
}

function scan(node = document) {
    if (node instanceof Element) {
        if (node.matches(PANEL_SELECTOR)) enhancePanel(node);
        else enhancePanel(node.closest(PANEL_SELECTOR));
    }
    node.querySelectorAll?.(PANEL_SELECTOR).forEach(enhancePanel);
}

function init() {
    ensureThemeIsolationStylesheet();
    wirePersonaEvents();
    ensureGlobalPersonaLauncher();
    const existingPanel = document.querySelector(PANEL_SELECTOR);
    if (existingPanel) {
        enhancePanel(existingPanel);
        return;
    }

    const panelObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
            if (node instanceof Element) scan(node);
        }));
        if (document.querySelector(`${PANEL_SELECTOR}[data-mpp-enhanced='true']`)) panelObserver.disconnect();
    });
    panelObserver.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}
