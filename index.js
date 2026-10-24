import { convertCharacterToPersona, getUserAvatar, getUserAvatars, initPersona, isPersonaLocked, setPersonaDescription, setUserAvatar, togglePersonaLock, updatePersonaConnectionsAvatarList, user_avatar } from '../../../personas.js';
import { power_user } from '../../../power-user.js';
import { accountStorage } from '../../../util/AccountStorage.js';
import { openWorldInfoEditor, world_names } from '../../../world-info.js';
import { POPUP_RESULT, POPUP_TYPE, Popup } from '../../../popup.js';
import { eventSource, event_types, getThumbnailUrl, saveSettings as saveSillyTavernSettings, setUserName } from '../../../../script.js';

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
const PERSONA_FOLDERS_KEY = 'MistraelSL_PersonaPanel_folders_v1';
const FOLDER_CREATE_OPTION = '__mpp_create_folder__';

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
        folders: 'Folders',
        folderNew: 'New folder',
        folderNamePrompt: 'Folder name',
        folderRename: 'Rename folder',
        folderDelete: 'Delete folder',
        folderDeleteHint: 'Only the folder is deleted. Personas stay in the library.',
        folderBack: 'Back to folders',
        folderAdd: 'Add personas',
        folderEmpty: 'No folders yet. Create one to group your personas.',
        folderEmptyPersonas: 'This folder is empty. Add personas to it.',
        folderAssign: 'Assign persona to a folder',
        folderUnsorted: 'No folder',
        folderChoose: 'Choose a folder',
        folderNewOption: '+ New folder…',
        folderSave: 'Apply',
        folderAssignmentHint: 'This changes only the folder link. The persona stays in the full library.',
        folderPickerHint: 'Checked personas will be in this folder. Unchecking removes them only from this folder.',
        folderRemove: 'Remove from folder',
        folderRemoveFor: 'Remove {name} from this folder',
        folderCurrent: 'Currently: {name}',
        folderOpen: 'Open folder {name}',
        folderNoPersonas: 'No personas available.',
        folderSearch: 'Search folders',
        folderEditor: 'Folder',
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
        creatorTitle: 'Title (optional)',
        creatorTokenCount: 'Tokens',
        editorSaving: 'Saving…',
        editorSaved: 'Saved',
        creatorPhoto: 'Choose persona portrait (optional)',
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
        creatorExpandDescription: 'Edit description in a separate window',
        descriptionEditorClose: 'Done editing description',
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
        backupProgress: 'Creating backup…',
        backupImages: 'Collecting persona images…',
        backupCompress: 'Compressing ZIP…',
        restoreProgress: 'Restoring personas…',
        backupBusy: 'Another backup operation is already running.',
        backupFormatTitle: 'Backup format',
        backupFormatHint: 'ZIP includes persona images. JSON contains persona settings without image files.',
        backupZip: 'ZIP with images',
        backupJson: 'JSON',
        restoreReady: 'Persona backup restored.',
        restoreFailed: 'Could not restore this persona backup.',
        restoreRefreshFailed: 'Personas were restored, but the library could not be refreshed. Reload the page.',
        restoreRollbackFailed: 'Restore failed, and some uploaded avatar files could not be rolled back. Check the library before retrying.',
        sortAz: 'Alphabetical A–Z',
        sortZa: 'Alphabetical Z–A',
        sortModified: 'Date modified',
        sortCreated: 'Date created',
        sortRecent: 'Recently used',
        sortOldest: 'Oldest first',
        searchByPersonaContent: 'Search name, title or description',
        convertCharacter: 'Convert character to persona',
        convertCharacterPrompt: 'Choose a character to convert',
        convertEmpty: 'There are no characters to convert.',
        convertError: 'Could not convert the character to a persona.',
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
        selectPersonas: 'Select personas',
        selectPage: 'Select this page',
        selectCancel: 'Cancel selection',
        selectMove: 'Move to folder',
        selectFavorite: 'Toggle favorite',
        selectExport: 'Export selected (ZIP)',
        selectDelete: 'Delete selected',
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
        creatorTitle: 'Заголовок (необязательно)',
        creatorTokenCount: 'Токены',
        editorSaving: 'Сохраняю…',
        editorSaved: 'Сохранено',
        creatorPhoto: 'Выбрать фотографию персоны (необязательно)',
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
        creatorExpandDescription: 'Открыть описание в отдельном окне',
        descriptionEditorClose: 'Закончить редактирование описания',
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
        backupProgress: 'Создание резервной копии…',
        backupImages: 'Собираем фотографии персон…',
        backupCompress: 'Сжимаем ZIP…',
        restoreProgress: 'Восстанавливаем персон…',
        backupBusy: 'Другая операция с резервной копией уже выполняется.',
        backupFormatTitle: 'Формат резервной копии',
        backupFormatHint: 'ZIP включает фотографии персон. JSON содержит настройки персон без файлов изображений.',
        backupZip: 'ZIP с фотографиями',
        backupJson: 'JSON',
        restoreReady: 'Резервная копия персон восстановлена.',
        restoreFailed: 'Не удалось восстановить эту резервную копию.',
        restoreRefreshFailed: 'Персоны восстановлены, но библиотеку обновить не удалось. Перезагрузите страницу.',
        restoreRollbackFailed: 'Восстановление не удалось, а часть загруженных файлов не удалось откатить. Проверьте библиотеку перед повторной попыткой.',
        sortAz: 'По алфавиту А–Я',
        sortZa: 'По алфавиту Я–А',
        sortModified: 'По дате изменения',
        sortCreated: 'По дате создания',
        sortRecent: 'Недавно использованные',
        sortOldest: 'Сначала старые',
        searchByPersonaContent: 'Поиск по имени, заголовку или описанию',
        convertCharacter: 'Персонаж → персона',
        convertCharacterPrompt: 'Выберите персонажа для преобразования',
        convertEmpty: 'Нет персонажей для преобразования.',
        convertError: 'Не удалось преобразовать персонажа в персону.',
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
        selectPersonas: 'Выбрать персон',
        selectPage: 'Выбрать эту страницу',
        selectCancel: 'Отменить выбор',
        selectMove: 'Переместить в папку',
        selectFavorite: 'Переключить избранное',
        selectExport: 'Экспорт выбранных (ZIP)',
        selectDelete: 'Удалить выбранных',
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
        folders: 'Папки',
        folderNew: 'Новая папка',
        folderNamePrompt: 'Название папки',
        folderRename: 'Переименовать папку',
        folderDelete: 'Удалить папку',
        folderDeleteHint: 'Удалится только папка. Все персоны останутся в общей библиотеке.',
        folderBack: 'Назад к папкам',
        folderAdd: 'Добавить персон',
        folderEmpty: 'Папок пока нет. Создайте первую для группировки персон.',
        folderEmptyPersonas: 'Папка пуста. Добавьте в неё персон.',
        folderAssign: 'Назначить папку персоне',
        folderUnsorted: 'Без папки',
        folderChoose: 'Выбор папки',
        folderNewOption: '+ Новая папка…',
        folderSave: 'Готово',
        folderAssignmentHint: 'Меняется только связь с папкой. Персона остаётся в общей библиотеке.',
        folderPickerHint: 'Отмеченные персоны будут в этой папке. Снятие галочки убирает их только из этой папки.',
        folderRemove: 'Убрать из папки',
        folderRemoveFor: 'Убрать {name} из этой папки',
        folderCurrent: 'Сейчас: {name}',
        folderOpen: 'Открыть папку {name}',
        folderNoPersonas: 'Нет доступных персон.',
        folderSearch: 'Поиск папок',
        folderEditor: 'Папка',
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

function onMediaQueryChange(query, callback) {
    if (typeof query.addEventListener === 'function') query.addEventListener('change', callback);
    else query.addListener?.(callback);
}

function observeResize(element, callback) {
    if (typeof globalThis.ResizeObserver === 'function') {
        const observer = new ResizeObserver(callback);
        observer.observe(element);
        return observer;
    }
    /* Older WebKit still gets orientation/window updates instead of a failed initialization. */
    window.addEventListener('resize', callback, { passive: true });
    return { disconnect: () => window.removeEventListener('resize', callback) };
}

/* Persona names come from backups too, and ST popups render their text as HTML. */
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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

/* Native changeUserAvatar warms these caches before reloading avatars; our upload paths
   must do the same, otherwise chat and thumbnails serve the old image until a restart. */
async function bustPersonaImageCache(avatarId) {
    if (!avatarId) return;
    const imagePath = `/${getUserAvatar(avatarId).split('/').map(encodeURIComponent).join('/')}`;
    try { await fetch(imagePath, { cache: 'reload' }); } catch { /* best effort */ }
    try { await fetch(getThumbnailUrl('persona', avatarId, false), { cache: 'reload' }); } catch { /* best effort */ }
}

/* Mirrors the native reloadUserAvatar: setUserAvatar() early-returns when the persona is
   already active, so chat messages keep the stale avatar without this. */
function reloadUserChatAvatars(avatarId) {
    if (!avatarId || avatarId !== user_avatar) return;
    const source = getThumbnailUrl('persona', avatarId, false);
    document.querySelectorAll('.mes[is_user="true"][force_avatar="false"] .avatar img').forEach(image => {
        image.src = source;
    });
}

async function setServicePersonaAvatar(avatarId) {
    const previousAutoLock = power_user.persona_auto_lock;
    let pending;
    try {
        /* Native selectCurrentPersona() runs synchronously before setUserAvatar's first await.
            Inspection/editing must not silently rebind the current chat through auto-lock. */
        power_user.persona_auto_lock = false;
        pending = setUserAvatar(avatarId, { toastPersonaNameChange: false });
    } finally {
        power_user.persona_auto_lock = previousAutoLock;
    }
    return await pending;
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

function normalizeFolderName(value) {
    return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 80);
}

function loadPersonaFolders() {
    const fallback = { folders: [], assignments: {} };
    try {
        const stored = JSON.parse(localStorage.getItem(PERSONA_FOLDERS_KEY) || '{}');
        if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return fallback;
        const folders = [];
        const folderIds = new Set();
        if (Array.isArray(stored.folders)) {
            stored.folders.forEach(item => {
                const id = String(item?.id || '').trim();
                const name = normalizeFolderName(item?.name);
                if (!id || !name || id === FOLDER_CREATE_OPTION || folderIds.has(id)) return;
                folderIds.add(id);
                folders.push({ id, name, createdAt: Number(item.createdAt) || Date.now() + folders.length });
            });
        }
        const assignments = {};
        if (stored.assignments && typeof stored.assignments === 'object' && !Array.isArray(stored.assignments)) {
            Object.entries(stored.assignments).forEach(([avatarId, folderId]) => {
                if (['__proto__', 'prototype', 'constructor'].includes(avatarId)) return;
                if (folderIds.has(String(folderId))) assignments[avatarId] = String(folderId);
            });
        }
        return { folders, assignments };
    } catch {
        return fallback;
    }
}

const personaFolderState = loadPersonaFolders();

function savePersonaFolders() {
    localStorage.setItem(PERSONA_FOLDERS_KEY, JSON.stringify(personaFolderState));
}

function getPersonaFolder(folderId) {
    return personaFolderState.folders.find(folder => folder.id === folderId) || null;
}

function getSortedPersonaFolders() {
    const locale = getLanguage() === 'ru' ? 'ru' : 'en';
    return [...personaFolderState.folders].sort((left, right) => left.name.localeCompare(right.name, locale));
}

function hasPersonaRecord(avatarId) {
    return Boolean(avatarId && Object.prototype.hasOwnProperty.call(power_user.personas || {}, avatarId));
}

function getPersonaFolderId(avatarId) {
    const folderId = personaFolderState.assignments[avatarId] || '';
    return getPersonaFolder(folderId) ? folderId : '';
}

function getFolderPersonaIds(folderId) {
    const locale = getLanguage() === 'ru' ? 'ru' : 'en';
    return Object.keys(power_user.personas || {})
        .filter(avatarId => getPersonaFolderId(avatarId) === folderId)
        .sort((left, right) => String(power_user.personas[left] || '').localeCompare(String(power_user.personas[right] || ''), locale));
}

function createPersonaFolder(name) {
    const cleanName = normalizeFolderName(name);
    if (!cleanName) return null;
    const id = globalThis.crypto?.randomUUID?.()
        || `folder-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    if (getPersonaFolder(id) || id === FOLDER_CREATE_OPTION) return null;
    const folder = { id, name: cleanName, createdAt: Date.now() };
    personaFolderState.folders.push(folder);
    savePersonaFolders();
    return folder;
}

function renamePersonaFolder(folderId, name) {
    const folder = getPersonaFolder(folderId);
    const cleanName = normalizeFolderName(name);
    if (!folder || !cleanName) return false;
    folder.name = cleanName;
    savePersonaFolders();
    return true;
}

function deletePersonaFolder(folderId) {
    const folder = getPersonaFolder(folderId);
    if (!folder) return false;
    personaFolderState.folders = personaFolderState.folders.filter(item => item.id !== folderId);
    Object.entries(personaFolderState.assignments).forEach(([avatarId, assignedFolderId]) => {
        if (assignedFolderId === folderId) delete personaFolderState.assignments[avatarId];
    });
    savePersonaFolders();
    return true;
}

function setPersonaFolder(avatarId, folderId, persist = true) {
    if (!hasPersonaRecord(avatarId)) return false;
    if (folderId && !getPersonaFolder(folderId)) return false;
    const previous = getPersonaFolderId(avatarId);
    if (previous === folderId) return false;
    if (folderId) personaFolderState.assignments[avatarId] = folderId;
    else delete personaFolderState.assignments[avatarId];
    if (persist) savePersonaFolders();
    return true;
}

function removePersonaFromFolder(avatarId, folderId) {
    if (getPersonaFolderId(avatarId) !== folderId) return false;
    return setPersonaFolder(avatarId, '');
}

async function requestPersonaFolderName(title, initial = '') {
    const value = await Popup.show.input(title, t('folderNamePrompt'), initial);
    return typeof value === 'string' ? normalizeFolderName(value) : '';
}

async function requestPersonaFolderChoice(currentFolderId = '') {
    const content = createElement('div', 'mpp-folder-assign-dialog');
    applyAppearanceTokens(content, getAppearanceTokens(getAppearance()));
    const label = createElement('label', 'mpp-folder-assign-label', t('folderChoose'));
    const select = createElement('select', 'text_pole mpp-folder-assign-select');
    select.setAttribute('aria-label', t('folderChoose'));
    select.appendChild(new Option(t('folderUnsorted'), ''));
    getSortedPersonaFolders().forEach(folder => select.appendChild(new Option(folder.name, folder.id)));
    select.appendChild(new Option(t('folderNewOption'), FOLDER_CREATE_OPTION));
    select.value = currentFolderId || (personaFolderState.folders.length ? '' : FOLDER_CREATE_OPTION);
    label.appendChild(select);
    content.append(label, createElement('small', '', t('folderAssignmentHint')));
    const result = await new Popup(content, POPUP_TYPE.CONFIRM, t('folderChoose'), {
        okButton: t('folderSave'),
        cancelButton: t('cancelCrop'),
    }).show();
    if (result !== POPUP_RESULT.AFFIRMATIVE && result !== true) return null;
    let nextFolderId = select.value;
    if (nextFolderId === FOLDER_CREATE_OPTION) {
        const name = await requestPersonaFolderName(t('folderNew'));
        if (!name) return null;
        nextFolderId = createPersonaFolder(name)?.id || '';
        if (!nextFolderId) return null;
    }
    return nextFolderId;
}

async function choosePersonaFolder(avatarId) {
    if (!hasPersonaRecord(avatarId)) return false;
    const nextFolderId = await requestPersonaFolderChoice(getPersonaFolderId(avatarId));
    if (nextFolderId === null) return false;
    return setPersonaFolder(avatarId, nextFolderId);
}

async function editFolderPersonas(folderId) {
    const folder = getPersonaFolder(folderId);
    if (!folder) return false;
    const locale = getLanguage() === 'ru' ? 'ru' : 'en';
    const avatarIds = Object.keys(power_user.personas || {})
        .sort((left, right) => String(power_user.personas[left] || '').localeCompare(String(power_user.personas[right] || ''), locale));
    const content = createElement('section', 'mpp-folder-picker-dialog');
    applyAppearanceTokens(content, getAppearanceTokens(getAppearance()));
    const search = createElement('input', 'mpp-folder-picker-search');
    search.type = 'search';
    search.placeholder = t('searchByPersonaName');
    search.setAttribute('aria-label', t('searchByPersonaName'));
    const list = createElement('div', 'mpp-folder-picker-list');
    avatarIds.forEach(avatarId => {
        const name = power_user.personas[avatarId] || t('unnamedPersona');
        const item = createElement('label', 'mpp-folder-picker-item');
        item.dataset.avatarId = avatarId;
        item.dataset.search = name.toLocaleLowerCase();
        const checkbox = createElement('input', 'mpp-folder-picker-check');
        checkbox.type = 'checkbox';
        checkbox.checked = getPersonaFolderId(avatarId) === folderId;
        const image = createElement('img');
        image.src = personaThumbnailUrl(avatarId);
        image.alt = '';
        const copy = createElement('span', 'mpp-folder-picker-copy');
        copy.appendChild(createElement('strong', '', name));
        const assignedFolder = getPersonaFolder(getPersonaFolderId(avatarId));
        if (assignedFolder && assignedFolder.id !== folderId) {
            copy.appendChild(createElement('small', '', t('folderCurrent').replace('{name}', assignedFolder.name)));
        }
        item.append(checkbox, image, copy);
        list.appendChild(item);
    });
    if (!avatarIds.length) list.appendChild(createElement('div', 'mpp-folder-picker-empty', t('folderNoPersonas')));
    search.addEventListener('input', () => {
        const query = search.value.trim().toLocaleLowerCase();
        list.querySelectorAll('.mpp-folder-picker-item').forEach(item => {
            item.hidden = Boolean(query && !item.dataset.search.includes(query));
        });
    });
    content.append(search, list, createElement('small', 'mpp-folder-picker-hint', t('folderPickerHint')));
    const result = await new Popup(content, POPUP_TYPE.CONFIRM, t('folderAdd'), {
        wide: true,
        okButton: t('folderSave'),
        cancelButton: t('cancelCrop'),
    }).show();
    if (result !== POPUP_RESULT.AFFIRMATIVE && result !== true) return false;
    let changed = false;
    list.querySelectorAll('.mpp-folder-picker-item').forEach(item => {
        const avatarId = item.dataset.avatarId;
        const checked = item.querySelector('.mpp-folder-picker-check').checked;
        const previous = getPersonaFolderId(avatarId);
        if (checked && previous !== folderId) {
            personaFolderState.assignments[avatarId] = folderId;
            changed = true;
        } else if (!checked && previous === folderId) {
            delete personaFolderState.assignments[avatarId];
            changed = true;
        }
    });
    if (changed) savePersonaFolders();
    return changed;
}

let globalPersonaLauncher;

function ensureGlobalPersonaLauncher() {
    if (globalPersonaLauncher?.isConnected) return globalPersonaLauncher;
    /* A removed root would otherwise keep its document/window listeners forever. */
    globalPersonaLauncher?.mppCleanup?.();
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
    // The launcher never follows ST themes; native uses the default palette here.
    const launcherAppearance = getAppearance();
    if (launcherAppearance.theme === 'native') launcherAppearance.theme = DEFAULT_APPEARANCE.theme;
    root.dataset.mppTheme = launcherAppearance.theme;
    root.dataset.mppIndependent = 'true';
    applyAppearanceTokens(root, getAppearanceTokens(launcherAppearance));
    document.body.appendChild(root);

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

    recentList.addEventListener('wheel', event => {
        if (event.defaultPrevented || event.ctrlKey || recentList.scrollWidth <= recentList.clientWidth + 1) return;
        const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        if (Math.abs(delta) < 1) return;
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? recentList.clientWidth : 1;
        const maxScroll = recentList.scrollWidth - recentList.clientWidth;
        const nextScroll = Math.max(0, Math.min(maxScroll, recentList.scrollLeft + delta * unit));
        if (Math.abs(nextScroll - recentList.scrollLeft) < 0.5) return;
        recentList.scrollLeft = nextScroll;
        event.preventDefault();
        event.stopPropagation();
    }, { passive: false });

    let recentDrag = null;
    let suppressRecentClickUntil = 0;
    recentList.addEventListener('pointerdown', event => {
        /* Touch keeps native overflow scrolling/fling; custom dragging is only for a mouse. */
        if (event.pointerType !== 'mouse' || event.button !== 0 || recentList.scrollWidth <= recentList.clientWidth + 1) return;
        recentDrag = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            scrollLeft: recentList.scrollLeft,
            moved: false,
        };
    });
    recentList.addEventListener('pointermove', event => {
        if (!recentDrag || event.pointerId !== recentDrag.pointerId) return;
        const deltaX = event.clientX - recentDrag.startX;
        const deltaY = event.clientY - recentDrag.startY;
        if (!recentDrag.moved) {
            if (Math.hypot(deltaX, deltaY) < 6) return;
            if (Math.abs(deltaX) <= Math.abs(deltaY)) {
                recentDrag = null;
                return;
            }
            recentDrag.moved = true;
            recentList.classList.add('is-dragging');
            recentList.setPointerCapture(event.pointerId);
        }
        const maxScroll = recentList.scrollWidth - recentList.clientWidth;
        recentList.scrollLeft = Math.max(0, Math.min(maxScroll, recentDrag.scrollLeft - deltaX));
        event.preventDefault();
        event.stopPropagation();
    });
    const finishRecentDrag = event => {
        if (!recentDrag || event.pointerId !== recentDrag.pointerId) return;
        const moved = recentDrag.moved;
        recentDrag = null;
        recentList.classList.remove('is-dragging');
        if (!moved) return;
        suppressRecentClickUntil = performance.now() + 350;
        event.preventDefault();
        event.stopPropagation();
    };
    recentList.addEventListener('pointerup', finishRecentDrag);
    recentList.addEventListener('pointercancel', finishRecentDrag);
    recentList.addEventListener('lostpointercapture', finishRecentDrag);
    recentList.addEventListener('click', event => {
        if (performance.now() >= suppressRecentClickUntil) return;
        suppressRecentClickUntil = 0;
        event.preventDefault();
        event.stopImmediatePropagation();
    }, { capture: true });

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
            /* Otherwise ST's document-level Escape cascade closes the whole persona panel too. */
            event.stopPropagation();
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
    const listenerAbort = new AbortController();
    const listenerOptions = { signal: listenerAbort.signal };
    document.addEventListener('pointerdown', event => {
        if (!isOpen || root.contains(event.target)) return;
        setOpen(false);
    }, listenerOptions);
    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || !isOpen) return;
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        button.focus();
    }, listenerOptions);
    window.addEventListener('resize', () => {
        applyLauncherPosition(readLauncherPosition());
        updatePopoverPlacement();
    }, listenerOptions);
    window.visualViewport?.addEventListener('resize', updatePopoverPlacement, listenerOptions);
    window.visualViewport?.addEventListener('scroll', updatePopoverPlacement, listenerOptions);
    const popoverObserver = observeResize(popover, updatePopoverPlacement);
    root.mppCleanup = () => {
        listenerAbort.abort();
        popoverObserver.disconnect();
    };

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
        /* JSON.parse('null') does not throw — it returns null, which then breaks stored.theme. */
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        stored = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
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
    const colorMixSupported = globalThis.CSS?.supports?.('color', 'color-mix(in srgb, #000 50%, #fff)') ?? false;
    if (settings.theme === 'native' && !colorMixSupported) {
        return { ...THEMES.native, muted: 'rgba(245, 242, 255, 0.6)', border: 'rgba(255, 255, 255, 0.32)' };
    }
    if (settings.theme !== 'custom') return THEMES[settings.theme] || THEMES[DEFAULT_APPEARANCE.theme];
    return {
        accent: settings.customColor,
        tint: colorMixSupported ? `color-mix(in srgb, ${settings.customColor} 17%, #171522)` : '#292233',
        text: '#f5f2ff',
        muted: '#aaa4b8',
        border: colorMixSupported ? `color-mix(in srgb, ${settings.customColor} 34%, rgba(255, 255, 255, 0.16))` : 'rgba(173, 139, 255, 0.38)',
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

    document.querySelectorAll('.mpp-visual-crop-backdrop[data-mpp-owner="persona-panel"], .mpp-description-editor-backdrop[data-mpp-owner="persona-panel"], .mpp-backup-progress-backdrop[data-mpp-owner="persona-panel"]').forEach(backdrop => {
        applyAppearanceTokens(backdrop, tokens);
        backdrop.dataset.mppTheme = settings.theme;
        backdrop.dataset.mppIndependent = 'true';
    });

    // The launcher never follows ST themes; native uses the default palette here too.
    const launcher = document.getElementById(GLOBAL_LAUNCHER_ID);
    if (launcher) {
        const launcherSettings = settings.theme === 'native'
            ? { ...settings, theme: DEFAULT_APPEARANCE.theme }
            : settings;
        applyAppearanceTokens(launcher, getAppearanceTokens(launcherSettings));
        launcher.dataset.mppTheme = launcherSettings.theme;
        launcher.dataset.mppIndependent = 'true';
    }
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
            event.stopPropagation();
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
        panel.addEventListener('click', async event => {
            if (!statsButton || !(event.target instanceof Element) || !statsButton.contains(event.target)) return;
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
        panel.addEventListener('click', async event => {
            if (!backupButton || !(event.target instanceof Element) || !backupButton.contains(event.target)) return;
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
        let restorePending = false;
        panel.addEventListener('click', event => {
            if (!restoreButton || !(event.target instanceof Element) || !restoreButton.contains(event.target)) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            if (!restorePending) zipInput.click();
        }, { capture: true });
        zipInput.addEventListener('change', async () => {
            const file = zipInput.files?.[0];
            zipInput.value = '';
            if (!file || restorePending) return;
            restorePending = true;
            zipInput.disabled = true;
            restoreButton?.setAttribute('aria-disabled', 'true');
            try {
                if (file.name.toLocaleLowerCase().endsWith('.json') || file.type === 'application/json') await restorePersonaJson(file, panel);
                else await restorePersonasZip(file, panel);
            }
            catch (error) {
                console.error(`[${EXTENSION_NAME}] Could not restore persona backup.`, error);
                globalThis.toastr?.error?.(t(error?.mppRollbackFailed ? 'restoreRollbackFailed' : 'restoreFailed'));
            } finally {
                restorePending = false;
                zipInput.disabled = false;
                restoreButton?.removeAttribute('aria-disabled');
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
    onMediaQueryChange(desktopQuery, update);
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
    const folderAction = createIconButton('fa-folder-open', t('folderAssign'), 'mpp-spotlight-action mpp-spotlight-folder');
    const statsAction = createIconButton('fa-chart-simple', t('personaStats'), 'mpp-spotlight-action');
    actions.append(editAction, favoriteAction, defaultAction, duplicateAction, folderAction, statsAction);

    editAction.addEventListener('click', () => runSpotlightAction(editAction, openCurrentPersonaEditor));
    favoriteAction.addEventListener('click', () => runSpotlightAction(favoriteAction, async () => {
        if (favoritePersonas.has(currentAvatarId)) favoritePersonas.delete(currentAvatarId);
        else favoritePersonas.add(currentAvatarId);
        saveFavorites();
        await panel.mppRefresh?.();
    }));
    defaultAction.addEventListener('click', () => runSpotlightAction(defaultAction, async () => {
        await setServicePersonaAvatar(currentAvatarId);
        await togglePersonaLock('default');
        await panel.mppRefresh?.();
    }));
    duplicateAction.addEventListener('click', () => runSpotlightAction(duplicateAction, () => duplicatePersonaThroughSillyTavern(panel, currentAvatarId)));
    folderAction.addEventListener('click', () => runSpotlightAction(folderAction, async () => {
        if (await choosePersonaFolder(currentAvatarId)) await panel.mppRefresh?.();
    }));
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
            event.stopPropagation();
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

    const positionCropBackdrop = () => {
        // A transformed ST root also shifts fixed children when the page scrolls.
        cropModalBackdrop.style.left = '0px';
        cropModalBackdrop.style.top = '0px';
        const rect = cropModalBackdrop.getBoundingClientRect();
        cropModalBackdrop.style.left = `${-rect.left}px`;
        cropModalBackdrop.style.top = `${-rect.top}px`;
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
        positionCropBackdrop();
        requestAnimationFrame(() => {
            renderModalCrop(currentCrop);
            cropModalBackdrop.focus({ preventScroll: true });
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
    // ST's outside-drawer handler listens to touchstart separately from pointer events.
    // Keep the source portrait visible while dragging or applying a crop on phones.
    ['pointerdown', 'mousedown', 'touchstart'].forEach(eventName => {
        cropModalBackdrop.addEventListener(eventName, event => event.stopPropagation());
    });
    cropModalBackdrop.addEventListener('click', event => {
        event.stopPropagation();
        if (event.target === cropModalBackdrop) closeVisualCrop(false);
    });
    cropModalBackdrop.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            event.stopPropagation();
            closeVisualCrop(false);
        }
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
        if (!cropModalBackdrop.hidden) {
            positionCropBackdrop();
            renderModalCrop(currentCrop);
        }
    });
    window.addEventListener('scroll', () => {
        if (!cropModalBackdrop.hidden) positionCropBackdrop();
    }, { passive: true });

    image.addEventListener('load', () => applyCrop(currentCrop));
    // First applyCrop runs while the panel is still display:none: the frame measures 0px and
    // getFrameRatio() falls back to a guess, so the photo sits wrong until the next refresh.
    const refreshVisibleCrop = () => {
        if (!image.naturalWidth || !portrait.clientWidth) return;
        applyCrop(currentCrop);
    };
    observeResize(portrait, refreshVisibleCrop);
    if (typeof globalThis.ResizeObserver !== 'function') {
        new MutationObserver(refreshVisibleCrop).observe(panel, { attributes: true, attributeFilter: ['class', 'style'] });
    }

    const renderSpotlightActions = () => {
        const hasPersona = Boolean(currentAvatarId);
        [editAction, favoriteAction, defaultAction, duplicateAction, folderAction, statsAction].forEach(button => {
            button.disabled = !hasPersona;
        });
        const hasFolder = hasPersona && Boolean(getPersonaFolderId(currentAvatarId));
        folderAction.classList.toggle('is-active', hasFolder);
        folderAction.setAttribute('aria-pressed', String(hasFolder));
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
        bar.querySelectorAll('.mpp-filter:not(.mpp-folder-mode-button)').forEach(item => {
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

async function showCharacterConversionPicker() {
    const characters = globalThis.SillyTavern?.getContext?.()?.characters || [];
    if (!characters.length) {
        globalThis.toastr?.info?.(t('convertEmpty'));
        return;
    }
    const content = createElement('div', 'mpp-convert-dialog');
    const label = createElement('label', 'mpp-folder-assign-label', t('convertCharacterPrompt'));
    const select = createElement('select', 'text_pole mpp-folder-assign-select');
    select.setAttribute('aria-label', t('convertCharacterPrompt'));
    characters
        .map((character, index) => ({ index, name: character?.name || `#${index}` }))
        .sort((left, right) => left.name.localeCompare(right.name))
        .forEach(item => select.appendChild(new Option(item.name, String(item.index))));
    label.appendChild(select);
    content.appendChild(label);
    applyAppearanceTokens(content, getAppearanceTokens(getAppearance()));
    const result = await new Popup(content, POPUP_TYPE.CONFIRM, t('convertCharacter'), {
        okButton: t('convertCharacter'),
        cancelButton: t('cancelCrop'),
    }).show();
    if (result !== POPUP_RESULT.AFFIRMATIVE && result !== true) return;
    const index = Number(select.value);
    if (!Number.isInteger(index) || index < 0 || index >= characters.length) return;
    try { await convertCharacterToPersona(index); }
    catch (error) {
        console.error(`[${EXTENSION_NAME}] Could not convert character to persona.`, error);
        globalThis.toastr?.error?.(t('convertError'));
    }
}

function createSortController({ panel, avatarBlock, searchInput, sortSelect, paginationContainer, afterRender }) {
    if (!sortSelect || !paginationContainer) return null;
    const options = [
        ['asc', t('sortAz')],
        ['desc', t('sortZa')],
        ['modified', t('sortModified')],
        ['created', t('sortCreated')],
        ['recent', t('sortRecent')],
        ['oldest', t('sortOldest')],
    ];
    const saved = localStorage.getItem(SORT_KEY);
    const state = {
        sort: options.some(([value]) => value === saved) ? saved : (power_user.persona_sort_order === 'desc' ? 'desc' : 'asc'),
        page: 1,
        pageSize: Number(accountStorage.getItem('Personas_PerPage')) || 5,
    };
    sortSelect.replaceChildren(...options.map(([value, label]) => new Option(label, value)));
    /* Keep the native relevance-sort option alive: verifyPersonaSearchSortRule can only
       unhide it, never recreate it. It stays hidden unless a native search is active. */
    const relevanceOption = new Option('Search', 'search');
    relevanceOption.hidden = true;
    relevanceOption.dataset.i18n = 'Search';
    sortSelect.appendChild(relevanceOption);
    sortSelect.value = state.sort;

    const isCustom = () => ['modified', 'created', 'recent', 'oldest'].includes(state.sort);
    const ownsRender = () => isCustom() || Boolean(String(searchInput?.value || '').trim());
    const safeRender = () => render().catch(error => console.error(`[${EXTENSION_NAME}] Could not render the sorted library.`, error));
    const releaseNativePager = () => {
        paginationContainer.classList.remove('mpp-has-custom-pager');
        paginationContainer.querySelector('.mpp-custom-pager')?.remove();
    };
    const renderPager = (total, pages) => {
        const pager = createElement('div', 'mpp-custom-pager');
        const first = createIconButton('fa-angles-left', t('pageFirst'), 'mpp-pager-button');
        const previous = createIconButton('fa-chevron-left', t('pagePrevious'), 'mpp-pager-button');
        const next = createIconButton('fa-chevron-right', t('pageNext'), 'mpp-pager-button');
        const last = createIconButton('fa-angles-right', t('pageLast'), 'mpp-pager-button');
        first.dataset.mppPager = 'first';
        previous.dataset.mppPager = 'previous';
        next.dataset.mppPager = 'next';
        last.dataset.mppPager = 'last';
        const start = total ? (state.page - 1) * state.pageSize + 1 : 0;
        const end = Math.min(total, state.page * state.pageSize);
        const label = createElement('strong', 'mpp-pager-label', `${start}–${end} / ${total}`);
        const size = createElement('select', 'mpp-pager-size');
        [5, 10, 25, 50, 100, 250, 500, 1000].forEach(value => size.appendChild(new Option(`${value} ${t('perPage')}`, String(value))));
        size.value = String(state.pageSize);
        first.disabled = previous.disabled = state.page <= 1;
        next.disabled = last.disabled = state.page >= pages;
        first.addEventListener('click', () => { state.page = 1; safeRender(); });
        previous.addEventListener('click', () => { state.page = Math.max(1, state.page - 1); safeRender(); });
        next.addEventListener('click', () => { state.page = Math.min(pages, state.page + 1); safeRender(); });
        last.addEventListener('click', () => { state.page = pages; safeRender(); });
        size.addEventListener('change', () => {
            state.pageSize = Number(size.value) || 5;
            accountStorage.setItem('Personas_PerPage', String(state.pageSize));
            state.page = 1;
            safeRender();
        });
        pager.append(label, first, previous, next, last, size);
        paginationContainer.classList.add('mpp-has-custom-pager');
        paginationContainer.replaceChildren(pager);
    };
    const render = async () => {
        if (!ownsRender()) return false;
        state.pageSize = Number(accountStorage.getItem('Personas_PerPage')) || 5;
        let avatarIds = Object.keys(power_user.personas || {});
        if (!avatarIds.length) avatarIds = await getUserAvatars(false);
        if (!Array.isArray(avatarIds)) avatarIds = [];
        const firstSeen = rememberFirstSeen(avatarIds);
        const modified = loadPersonaModified();
        const usage = loadPersonaUsage();
        const nameOf = avatarId => String(power_user.personas?.[avatarId] || '');
        const timeOf = avatarId => state.sort === 'modified'
            ? Number(modified[avatarId] || personaTimestamp(avatarId, firstSeen))
            : personaTimestamp(avatarId, firstSeen);
        const query = String(searchInput?.value || '').trim().toLocaleLowerCase();
        if (query) {
            avatarIds = avatarIds.filter(avatarId => {
                const descriptor = power_user.persona_descriptions?.[avatarId] || {};
                return [nameOf(avatarId), descriptor.title || '', descriptor.description || '']
                    .join('\n').toLocaleLowerCase().includes(query);
            });
        }
        avatarIds.sort((left, right) => {
            if (state.sort === 'recent') {
                return Number(usage[right]?.lastUsed || 0) - Number(usage[left]?.lastUsed || 0)
                    || nameOf(left).localeCompare(nameOf(right));
            }
            if (state.sort === 'oldest') return timeOf(left) - timeOf(right) || nameOf(left).localeCompare(nameOf(right));
            if (state.sort === 'modified' || state.sort === 'created') {
                return timeOf(right) - timeOf(left) || nameOf(left).localeCompare(nameOf(right));
            }
            const direction = state.sort === 'desc' ? -1 : 1;
            return nameOf(left).localeCompare(nameOf(right)) * direction;
        });
        const pages = Math.max(1, Math.ceil(avatarIds.length / state.pageSize));
        state.page = Math.min(state.page, pages);
        const visible = avatarIds.slice((state.page - 1) * state.pageSize, state.page * state.pageSize);
        avatarBlock.replaceChildren(...visible.map(avatarId => createPersonaCardFromTemplate(avatarBlock, avatarId)).filter(Boolean));
        renderPager(avatarIds.length, pages);
        afterRender?.();
        return true;
    };
    panel.addEventListener('input', async event => {
        /* Native listens to input: capture it on the panel before its own target handler. */
        if (event.target !== sortSelect) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        window.clearTimeout(searchTimer);
        const wasOwned = ownsRender();
        try {
            state.sort = sortSelect.value;
            state.page = 1;
            localStorage.setItem(SORT_KEY, state.sort);
            if (ownsRender()) await render();
            else {
                releaseNativePager();
                power_user.persona_sort_order = state.sort;
                globalThis.SillyTavern?.getContext?.()?.saveSettingsDebounced?.();
                /* Custom search temporarily owns input events; resync the native filter on return. */
                if (wasOwned) searchInput?.dispatchEvent(new Event('input', { bubbles: true }));
                await getUserAvatars(true, user_avatar);
                afterRender?.();
            }
        } catch (error) {
            console.error(`[${EXTENSION_NAME}] Could not apply the sort order.`, error);
        }
    }, { capture: true });
    let searchTimer;
    searchInput?.addEventListener('input', event => {
        window.clearTimeout(searchTimer);
        if (!ownsRender()) {
            releaseNativePager();
            return;
        }
        /* Custom sort/search owns the list; keep native pagination from overwriting it. */
        event.stopImmediatePropagation();
        state.page = 1;
        searchTimer = window.setTimeout(() => {
            if (!ownsRender()) return;
            sortSelect.value = state.sort;
            safeRender();
        }, 80);
    }, { capture: true });
    return { isCustom, render, initialize: () => ownsRender() ? render() : Promise.resolve(false) };
}

function turnLibraryPage(paginationContainer, direction) {
    if (!paginationContainer) return false;
    const custom = paginationContainer.querySelector(`[data-mpp-pager="${direction > 0 ? 'next' : 'previous'}"]`);
    if (custom) {
        if (custom.disabled) return false;
        custom.click();
        return true;
    }
    const name = direction > 0 ? 'next' : 'prev';
    const item = paginationContainer.querySelector(`.paginationjs-${name}`);
    if (!item || item.closest('.disabled, [disabled], [aria-disabled="true"]')) return false;
    const control = item.querySelector('a, button') || item;
    if (control.disabled || control.getAttribute('aria-disabled') === 'true') return false;
    control.click();
    return true;
}

function createLibrarySwipe({ panel, avatarBlock, paginationContainer }) {
    const coarseQuery = window.matchMedia('(pointer: coarse)');
    let gesture = null;
    let suppressClickUntil = 0;

    /* A horizontal page gesture must not also activate the card underneath it. */
    avatarBlock.addEventListener('click', event => {
        if (performance.now() >= suppressClickUntil) return;
        event.preventDefault();
        event.stopImmediatePropagation();
    }, true);

    avatarBlock.addEventListener('pointerdown', event => {
        if (!coarseQuery.matches || event.pointerType !== 'touch' || event.button !== 0 || panel.classList.contains('mpp-folder-mode')) return;
        if (!(event.target instanceof Element) || event.target.closest('button, input, select, textarea, a')) return;
        gesture = {
            id: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            lastX: event.clientX,
            lastY: event.clientY,
            axis: 'pending',
        };
    }, { passive: true });

    avatarBlock.addEventListener('pointermove', event => {
        if (!gesture || event.pointerId !== gesture.id) return;
        gesture.lastX = event.clientX;
        gesture.lastY = event.clientY;
        const deltaX = gesture.lastX - gesture.startX;
        const deltaY = gesture.lastY - gesture.startY;
        const absoluteX = Math.abs(deltaX);
        const absoluteY = Math.abs(deltaY);
        if (gesture.axis === 'pending' && Math.max(absoluteX, absoluteY) > 8) {
            if (absoluteX > 12 && absoluteX > absoluteY * 1.3) gesture.axis = 'x';
            else if (absoluteY > 8) gesture.axis = 'y';
        }
        if (gesture.axis !== 'x') return;
        event.preventDefault();
        try { avatarBlock.setPointerCapture(event.pointerId); } catch { /* Capture is optional on older touch engines. */ }
    }, { passive: false });

    avatarBlock.addEventListener('pointerup', event => {
        if (!gesture || event.pointerId !== gesture.id) return;
        const finished = gesture;
        gesture = null;
        if (finished.axis !== 'x') return;
        const deltaX = finished.lastX - finished.startX;
        const deltaY = finished.lastY - finished.startY;
        const absoluteX = Math.abs(deltaX);
        const absoluteY = Math.abs(deltaY);
        if (absoluteX > 20) suppressClickUntil = performance.now() + 350;
        if (absoluteX < 64 || absoluteX < absoluteY * 1.3 || panel.classList.contains('mpp-folder-mode')) return;
        turnLibraryPage(paginationContainer, deltaX < 0 ? 1 : -1);
    });
    avatarBlock.addEventListener('pointercancel', event => {
        if (gesture?.id === event.pointerId) gesture = null;
    });
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
        /* Auth-protected servers reject a bare fetch; use ST's request headers. */
        const response = await fetch(personaImageUrl(avatarId), {
            cache: 'no-store',
            headers: globalThis.SillyTavern?.getContext?.()?.getRequestHeaders?.({ omitContentType: true }),
        });
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
        /* A failed <script> never fires again: remove it so a retry starts fresh. */
        const fail = (scriptEl, error) => { scriptEl?.remove(); reject(error); };
        const existing = document.querySelector('script[data-mpp-jszip]');
        if (existing) {
            if (window.JSZip) { resolve(window.JSZip); return; }
            existing.addEventListener('load', () => window.JSZip ? resolve(window.JSZip) : fail(existing, new Error('JSZip unavailable.')), { once: true });
            existing.addEventListener('error', () => fail(existing, new Error('JSZip failed to load.')), { once: true });
            return;
        }
        const script = document.createElement('script');
        script.dataset.mppJszip = 'true';
        script.src = '/lib/jszip.min.js';
        script.addEventListener('load', () => window.JSZip ? resolve(window.JSZip) : fail(script, new Error('JSZip unavailable.')), { once: true });
        script.addEventListener('error', () => fail(script, new Error('JSZip failed to load.')), { once: true });
        document.head.appendChild(script);
    });
    /* A rejected load must not poison every later attempt until a page reload. */
    zipLibraryPromise.catch(() => { zipLibraryPromise = undefined; });
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

let backupProgressState;

function startBackupProgress(total, label) {
    if (backupProgressState?.busy) return null;
    if (!backupProgressState) {
        const root = createElement('div', 'mpp-backup-progress-backdrop');
        root.dataset.mppOwner = 'persona-panel';
        root.dataset.mppIndependent = 'true';
        root.hidden = true;
        const modal = createElement('section', 'mpp-backup-progress-modal');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.tabIndex = -1;
        const title = createElement('strong', 'mpp-backup-progress-title');
        const progress = createElement('progress', 'mpp-backup-progress-bar');
        progress.max = 100;
        progress.value = 0;
        progress.setAttribute('aria-label', t('backupProgress'));
        const percent = createElement('span', 'mpp-backup-progress-percent', '0%');
        const stage = createElement('small', 'mpp-backup-progress-stage');
        modal.append(title, progress, percent, stage);
        root.appendChild(modal);
        root.addEventListener('keydown', event => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            event.stopPropagation();
        });
        backupProgressState = { root, modal, title, progress, percent, stage, busy: false };
        document.body.appendChild(root);
    }
    const state = backupProgressState;
    const appearance = getAppearance();
    state.root.dataset.mppTheme = appearance.theme;
    applyAppearanceTokens(state.root, getAppearanceTokens(appearance));
    const previousFocus = document.activeElement;
    state.busy = true;
    state.title.textContent = label;
    state.root.hidden = false;
    state.modal.focus({ preventScroll: true });

    const update = (done, currentTotal, stageLabel) => {
        const percent = Math.max(0, Math.min(100, Math.round(done / Math.max(1, currentTotal) * 100)));
        state.progress.value = percent;
        state.percent.textContent = `${percent}%`;
        if (stageLabel) state.stage.textContent = stageLabel;
    };
    update(0, total, label);
    return {
        update,
        finish: () => {
            state.root.hidden = true;
            state.busy = false;
            if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
        },
    };
}

async function exportAllPersonasZip(onlyIds = null) {
    let avatarIds = await getUserAvatars(false);
    if (!Array.isArray(avatarIds)) throw new Error('Could not load the persona avatar list.');
    if (Array.isArray(onlyIds)) {
        const requestedIds = [...new Set(onlyIds)];
        const availableIds = new Set(avatarIds);
        const missingIds = requestedIds.filter(avatarId => !availableIds.has(avatarId));
        if (missingIds.length) throw new Error(`Selected personas are missing avatar files: ${missingIds.join(', ')}`);
        avatarIds = avatarIds.filter(avatarId => requestedIds.includes(avatarId));
    }
    if (!avatarIds.length) {
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
    const progress = startBackupProgress(avatarIds.length, t('backupProgress'));
    if (!progress) {
        globalThis.toastr?.info?.(t('backupBusy'));
        return;
    }
    try {
        for (let index = 0; index < avatarIds.length; index++) {
            const avatarId = avatarIds[index];
            progress.update(index / avatarIds.length * 90, 100, t('backupImages'));
            /* Never call an incomplete archive successful: one missing portrait aborts the download. */
            const response = await fetch(personaImageUrl(avatarId), {
                headers: ctx?.getRequestHeaders?.({ omitContentType: true }),
                cache: 'no-store',
            });
            if (!response.ok) throw new Error(`Could not back up persona image (${response.status}): ${avatarId}`);
            images.file(avatarId, await response.blob());
            progress.update((index + 1) / avatarIds.length * 90, 100, t('backupImages'));
        }
        const blob = await zip.generateAsync(
            { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
            metadata => progress.update(90 + metadata.percent * 0.1, 100, t('backupCompress')),
        );
        downloadBlob(blob, `personas${Array.isArray(onlyIds) ? '-selected' : ''}-${backupTimestamp()}.zip`);
        globalThis.toastr?.success?.(t('backupReady'));
    } finally {
        progress.finish();
    }
}

async function exportAllPersonasJson(onlyIds = null) {
    let avatarIds = await getUserAvatars(false);
    if (!Array.isArray(avatarIds)) throw new Error('Could not load the persona avatar list.');
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
    const data = await response.json();
    const uploadedAvatarId = String(data?.path || avatarId);
    if (uploadedAvatarId !== avatarId) throw new Error(`Avatar upload returned an unexpected path: ${uploadedAvatarId}`);
    return uploadedAvatarId;
}

function isBackupRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function reserveRestoredAvatarId(sourceAvatarId, occupiedIds) {
    let base = String(sourceAvatarId || '')
        .replace(/[<>:"/\\|?*\u0000-\u001F\u007F]/g, '_')
        .replace(/[. ]+$/g, '')
        .trim();
    if (!base || ['__proto__', 'prototype', 'constructor'].includes(base)) throw new Error('Persona backup contains an invalid avatar id.');
    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(base)) base = `_${base}`;
    if (base.length > 180) {
        const extension = base.match(/\.[a-z0-9]{1,8}$/i)?.[0] || '';
        base = `${base.slice(0, 180 - extension.length)}${extension}`;
    }

    let avatarId = base;
    let collision = 0;
    while (occupiedIds.has(avatarId.toLowerCase())) {
        collision += 1;
        avatarId = `${Date.now()}-${collision}-${base}`;
    }
    occupiedIds.add(avatarId.toLowerCase());
    return avatarId;
}

async function deleteRestoredAvatarFile(avatarId, ctx) {
    const response = await fetch('/api/avatars/delete', {
        method: 'POST',
        headers: ctx.getRequestHeaders(),
        body: JSON.stringify({ avatar: avatarId }),
    });
    if (!response.ok && response.status !== 404) throw new Error(`Avatar rollback failed (${response.status}).`);
}

async function restorePersonaEntries(entries, panel, { defaultPersona = null, getImageBlob, onProgress = () => {} } = {}) {
    if (!entries.length || typeof getImageBlob !== 'function') throw new Error('Persona backup contains no restorable personas.');
    if (!isBackupRecord(power_user.personas) || !isBackupRecord(power_user.persona_descriptions)) {
        throw new Error('SillyTavern persona settings are unavailable.');
    }
    entries.forEach(entry => {
        if (!entry.sourceAvatarId || !isBackupRecord(entry.descriptor)) throw new Error('Persona backup contains an invalid persona entry.');
    });

    /* Settings alone do not prove that an avatar file is absent. Protect both stores from overwrite. */
    const existingFiles = await getUserAvatars(false);
    if (!Array.isArray(existingFiles)) throw new Error('Could not check existing persona avatars before restore.');
    const occupiedIds = new Set([
        ...existingFiles,
        ...Object.keys(power_user.personas),
        ...Object.keys(power_user.persona_descriptions),
    ].map(avatarId => String(avatarId).toLowerCase()));
    const prepared = entries.map(entry => ({
        ...entry,
        avatarId: reserveRestoredAvatarId(entry.sourceAvatarId, occupiedIds),
    }));
    const ctx = globalThis.SillyTavern?.getContext?.();
    if (!ctx?.getRequestHeaders) throw new Error('SillyTavern request context is unavailable.');

    onProgress(0, prepared.length);
    const previousDefault = power_user.default_persona;
    const restoredBySource = new Map();
    const uploadedIds = new Set();
    let pendingAvatarId = '';
    try {
        for (const entry of prepared) {
            const imageBlob = await getImageBlob(entry.sourceAvatarId);
            if (!(imageBlob instanceof Blob)) throw new Error(`Persona image is invalid: ${entry.sourceAvatarId}`);
            pendingAvatarId = entry.avatarId;
            await uploadAvatarBlob(entry.avatarId, imageBlob);
            uploadedIds.add(entry.avatarId);
            pendingAvatarId = '';
            power_user.personas[entry.avatarId] = String(entry.name ?? '');
            power_user.persona_descriptions[entry.avatarId] = entry.descriptor;
            restoredBySource.set(entry.sourceAvatarId, entry.avatarId);
            onProgress(restoredBySource.size, prepared.length);
        }
        if (defaultPersona && restoredBySource.has(defaultPersona)) {
            power_user.default_persona = restoredBySource.get(defaultPersona);
        }
        ctx.saveSettingsDebounced?.();
    } catch (error) {
        /* Do not leave a half-restored library or orphan settings after the k-th upload fails. */
        restoredBySource.forEach(avatarId => {
            delete power_user.personas[avatarId];
            delete power_user.persona_descriptions[avatarId];
        });
        power_user.default_persona = previousDefault;
        if (pendingAvatarId) uploadedIds.add(pendingAvatarId);
        let rollbackFailed = false;
        for (const avatarId of uploadedIds) {
            try { await deleteRestoredAvatarFile(avatarId, ctx); }
            catch (rollbackError) {
                rollbackFailed = true;
                console.warn(`[${EXTENSION_NAME}] Could not roll back restored avatar: ${avatarId}`, rollbackError);
            }
        }
        try { ctx.saveSettingsDebounced?.(); }
        catch (saveError) {
            rollbackFailed = true;
            console.warn(`[${EXTENSION_NAME}] Could not save restore rollback.`, saveError);
        }
        if (rollbackFailed) error.mppRollbackFailed = true;
        throw error;
    }

    const restored = [...restoredBySource.values()];
    rememberFirstSeen(restored);
    restored.forEach(markPersonaImageChanged);
    for (const entry of prepared) {
        const descriptor = power_user.persona_descriptions[entry.avatarId];
        try {
            await eventSource.emit(event_types.PERSONA_CREATED, {
                avatarId: entry.avatarId,
                name: power_user.personas[entry.avatarId],
                description: descriptor?.description || '',
                title: descriptor?.title || '',
            });
        } catch (error) {
            /* The files and settings are already committed; a listener must not turn that into a false rollback. */
            console.warn(`[${EXTENSION_NAME}] A persona-created listener failed after restore.`, error);
        }
    }

    const restoredAvatarId = restored.at(-1);
    let refreshFailed = false;
    try { await getUserAvatars(true, restoredAvatarId); }
    catch (error) {
        refreshFailed = true;
        console.warn(`[${EXTENSION_NAME}] Restored, but the native avatar list could not be refreshed.`, error);
    }
    try { await panel?.mppRefresh?.(); }
    catch (error) {
        refreshFailed = true;
        console.warn(`[${EXTENSION_NAME}] Restored, but the persona panel could not be refreshed.`, error);
    }
    if (panel?.classList.contains('mpp-creating')) {
        try {
            await setServicePersonaAvatar(restoredAvatarId);
            await panel.mppOpenPersonaEditor?.(restoredAvatarId, personaImageUrl(restoredAvatarId));
        } catch (error) {
            refreshFailed = true;
            console.warn(`[${EXTENSION_NAME}] Restored, but the restored persona could not be opened in the editor.`, error);
        }
    }
    if (refreshFailed) globalThis.toastr?.warning?.(t('restoreRefreshFailed'));
    else globalThis.toastr?.success?.(t('restoreReady'));
    return restored;
}

async function restorePersonasZip(file, panel) {
    const JSZip = await ensureZipLibrary();
    const zip = await JSZip.loadAsync(file);
    const manifest = zip.file('personas/personas.json');
    if (!manifest) throw new Error('Persona backup manifest is missing.');
    const data = JSON.parse(await manifest.async('string'));
    if (!isBackupRecord(data?.personas) || !isBackupRecord(data?.persona_descriptions)) {
        throw new Error('Persona backup manifest is invalid.');
    }
    const entries = Object.entries(data.personas).map(([sourceAvatarId, name]) => ({
        sourceAvatarId,
        name,
        descriptor: data.persona_descriptions[sourceAvatarId] ?? { description: '', connections: [] },
    }));
    if (!entries.length) throw new Error('Persona backup contains no personas.');
    entries.forEach(entry => {
        /* A ZIP made by this extension always contains every original portrait. Never substitute one silently. */
        if (!zip.file(`persona-images/${entry.sourceAvatarId}`)) throw new Error(`Persona image is missing: ${entry.sourceAvatarId}`);
    });
    const progress = startBackupProgress(entries.length, t('restoreProgress'));
    if (!progress) {
        globalThis.toastr?.info?.(t('backupBusy'));
        return;
    }
    try {
        return await restorePersonaEntries(entries, panel, {
            defaultPersona: data.default_persona,
            getImageBlob: async sourceAvatarId => {
                const image = zip.file(`persona-images/${sourceAvatarId}`);
                return image ? image.async('blob') : null;
            },
            onProgress: progress.update,
        });
    } finally {
        progress.finish();
    }
}

async function restorePersonaJson(file, panel) {
    const data = JSON.parse(await file.text());
    if (!isBackupRecord(data?.personas)
        || (data?.persona_descriptions !== undefined && !isBackupRecord(data.persona_descriptions))) {
        throw new Error('Persona JSON is invalid.');
    }
    const entries = Object.entries(data.personas).map(([sourceAvatarId, name]) => ({
        sourceAvatarId,
        name,
        descriptor: data.persona_descriptions?.[sourceAvatarId] ?? { description: '', connections: [] },
    }));
    if (!entries.length) throw new Error('Persona JSON contains no restorable personas.');

    let fallbackBlob;
    const progress = startBackupProgress(entries.length, t('restoreProgress'));
    if (!progress) {
        globalThis.toastr?.info?.(t('backupBusy'));
        return;
    }
    try {
        return await restorePersonaEntries(entries, panel, {
            defaultPersona: data.default_persona,
            getImageBlob: async () => {
                if (entries.length === 1 && typeof data.avatar_image === 'string' && data.avatar_image.startsWith('data:image/')) {
                    const response = await fetch(data.avatar_image);
                    if (!response.ok) throw new Error('Embedded persona image is invalid.');
                    return response.blob();
                }
                if (!fallbackBlob) {
                    const fallback = await fetch('/img/user-default.png');
                    if (!fallback.ok) throw new Error('Persona image is missing.');
                    fallbackBlob = await fallback.blob();
                }
                return fallbackBlob;
            },
            onProgress: progress.update,
        });
    } finally {
        progress.finish();
    }
}

let personaDuplicatePending = false;

async function duplicatePersonaThroughSillyTavern(panel, avatarId) {
    if (!avatarId || !panel || personaDuplicatePending) return;
    const button = panel.querySelector('#persona_duplicate_button');
    const $ = globalThis.jQuery;
    if (!button || !$) throw new Error('Native persona duplicate handler is unavailable.');
    personaDuplicatePending = true;
    try {
        await setServicePersonaAvatar(avatarId);
        /* triggerHandler returns the native async handler's Promise; DOM click() would discard it. */
        await $(button).triggerHandler('click');
    } finally {
        personaDuplicatePending = false;
    }
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
        /* Match native chat loading first: a surviving chat binding outranks default and list order. */
        const remaining = Object.keys(power_user.personas || {});
        const currentChatPersona = globalThis.SillyTavern?.getContext?.()?.chatMetadata?.persona;
        const nextAvatarId = remaining.includes(currentChatPersona) ? currentChatPersona
            : remaining.includes(power_user.default_persona) ? power_user.default_persona
                : remaining[0];
        if (nextAvatarId) await setServicePersonaAvatar(nextAvatarId);
    }
    await panel?.mppRefresh?.();
    return true;
}

async function schedulePersonaDeletion(panel, avatarId) {
    const name = power_user.personas?.[avatarId] || '';
    /* Restored backups may carry an empty name; the persona must still be deletable. */
    if (!panel || !avatarId) return false;
    const displayName = name || t('unnamedPersona');
    const confirmed = await Popup.show.confirm(t('deleteConfirm'), `${escapeHtml(displayName)}<br>${t('deleteDetails')}`);
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
    copy.append(createElement('strong', '', displayName), countdown);
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
    backupButton.addEventListener('click', async () => {
        if (backupButton.disabled) return;
        backupButton.disabled = true;
        try { await exportAllPersonasZip(); }
        catch (error) {
            console.error(`[${EXTENSION_NAME}] Could not create persona backup.`, error);
            globalThis.toastr?.error?.(t('backupFailed'));
        } finally {
            backupButton.disabled = false;
        }
    });
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
        const names = ids.map(id => escapeHtml(power_user.personas?.[id] || id)).join('<br>');
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
                await setServicePersonaAvatar(restoreId);
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
                /* Opening the editor silently activates the persona. Like the cleanup flow,
                   don't count that as usage and restore the previous persona afterwards. */
                const previousAvatarId = user_avatar !== info.id ? user_avatar : '';
                if (previousAvatarId) skipNextUsageRecord = true;
                close();
                const previousHook = panel.mppPersonaEditorClosed;
                panel.mppPersonaEditorClosed = async args => {
                    panel.mppPersonaEditorClosed = previousHook;
                    if (previousAvatarId && !args?.deliberateActivation && user_avatar === info.id) {
                        skipNextUsageRecord = true;
                        try {
                            await setServicePersonaAvatar(previousAvatarId);
                        } catch (error) {
                            skipNextUsageRecord = false;
                            console.warn(`[${EXTENSION_NAME}] Could not restore the previous persona after map inspection.`, error);
                        }
                    }
                    await previousHook?.(args);
                };
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

function ensureCardActions(card, { folderId = '' } = {}) {
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
            return card.closest(PANEL_SELECTOR)?.mppRefresh?.();
        });
        const edit = createCardAction('fa-pen-to-square', t('editPersona'), 'mpp-action-edit', async () => {
            const panel = card.closest(PANEL_SELECTOR);
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
        const remove = folderId
            ? createCardAction('fa-folder-minus', t('folderRemoveFor').replace('{name}', power_user.personas?.[avatarId] || t('unnamedPersona')), 'mpp-action-remove-folder', async () => {
                /* Folder views never invoke native deletion: this only clears our metadata link. */
                removePersonaFromFolder(avatarId, folderId);
                await card.closest(PANEL_SELECTOR)?.mppRefresh?.();
            })
            : createCardAction('fa-trash', t('deletePersona'), 'mpp-action-delete', async () => {
                const panel = card.closest(PANEL_SELECTOR);
                await schedulePersonaDeletion(panel, avatarId);
            });
        const exportButton = createCardAction('fa-file-export', t('exportPersona'), 'mpp-action-export', () => {
            return exportPersonaJson(avatarId);
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

function decorateCards(avatarBlock, { folderId = '' } = {}) {
    avatarBlock.querySelectorAll(':scope > .avatar-container').forEach(card => {
        card.classList.add('mpp-persona-card');
        card.setAttribute('role', 'button');
        card.tabIndex = 0;
        /* Native re-renders (pagination, search) write a bare thumbnail URL into img.src;
           re-apply our cache-busting revision so changed photos never go stale. */
        const cardAvatarId = getCardAvatarId(card);
        if (cardAvatarId && imageRevisions.has(cardAvatarId)) {
            const cardImage = card.querySelector('.avatar img');
            const revisedSource = personaThumbnailUrl(cardAvatarId);
            if (cardImage && cardImage.getAttribute('src') !== revisedSource) cardImage.src = revisedSource;
        }
        const name = card.querySelector('.ch_name')?.textContent?.trim() || t('title');
        const image = card.querySelector('.avatar img');
        if (image) image.alt = name;
        if (card.dataset.mppKeyboard !== 'true') {
            card.dataset.mppKeyboard = 'true';
            card.addEventListener('keydown', event => {
                if (event.target !== card) return;
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    /* ST's global keyboard handler would click the card a second time. */
                    event.stopPropagation();
                    card.click();
                }
            });
        }
        ensureCardActions(card, { folderId });
        updateCardBadges(card);
        updateCardTags(card);
    });
}

function createBulkSelectionController({ panel, avatarBlock, toggleButton }) {
    const bar = createElement('div', 'mpp-bulk-bar');
    bar.hidden = true;
    bar.setAttribute('aria-label', t('selectPersonas'));
    const count = createElement('strong', 'mpp-bulk-count');
    const selectPage = createElement('button', 'mpp-button mpp-bulk-page');
    selectPage.type = 'button';
    selectPage.title = t('selectPage');
    selectPage.setAttribute('aria-label', t('selectPage'));
    selectPage.append(createElement('i', 'fa-solid fa-check-double'), createElement('span', '', t('selectPage')));
    const move = createElement('button', 'mpp-button mpp-bulk-move');
    move.type = 'button';
    move.title = t('selectMove');
    move.setAttribute('aria-label', t('selectMove'));
    move.append(createElement('i', 'fa-solid fa-folder-open'), createElement('span', '', t('selectMove')));
    const favorite = createElement('button', 'mpp-button mpp-bulk-favorite');
    favorite.type = 'button';
    favorite.title = t('selectFavorite');
    favorite.setAttribute('aria-label', t('selectFavorite'));
    favorite.append(createElement('i', 'fa-solid fa-star'), createElement('span', '', t('selectFavorite')));
    const exportButton = createElement('button', 'mpp-button mpp-bulk-export');
    exportButton.type = 'button';
    exportButton.title = t('selectExport');
    exportButton.setAttribute('aria-label', t('selectExport'));
    exportButton.append(createElement('i', 'fa-solid fa-file-zipper'), createElement('span', '', t('selectExport')));
    const deleteButton = createElement('button', 'mpp-button mpp-bulk-delete');
    deleteButton.type = 'button';
    deleteButton.title = t('selectDelete');
    deleteButton.setAttribute('aria-label', t('selectDelete'));
    deleteButton.append(createElement('i', 'fa-solid fa-trash'), createElement('span', '', t('selectDelete')));
    const cancel = createIconButton('fa-xmark', t('selectCancel'), 'mpp-bulk-cancel');
    bar.append(count, selectPage, move, favorite, exportButton, deleteButton, cancel);
    avatarBlock.parentElement.insertBefore(bar, avatarBlock);

    const selected = new Set();
    let enabled = false;
    let operationPending = false;
    const update = () => {
        for (const avatarId of selected) {
            if (!hasPersonaRecord(avatarId)) selected.delete(avatarId);
        }
        bar.hidden = !enabled;
        panel.classList.toggle('mpp-selecting', enabled);
        toggleButton?.classList.toggle('is-active', enabled);
        toggleButton?.setAttribute('aria-pressed', String(enabled));
        count.textContent = t('cleanupSelected').replace('{count}', String(selected.size));
        [move, favorite, exportButton, deleteButton].forEach(button => { button.disabled = operationPending || !selected.size; });
        selectPage.disabled = operationPending || !avatarBlock.querySelector('.mpp-persona-card:not(.mpp-filter-hidden)');
        avatarBlock.querySelectorAll(':scope > .mpp-persona-card').forEach(card => {
            const avatarId = getCardAvatarId(card);
            const isSelected = enabled && selected.has(avatarId);
            card.classList.toggle('mpp-selection-selected', isSelected);
            if (enabled) card.setAttribute('aria-pressed', String(isSelected));
            else card.removeAttribute('aria-pressed');
            let marker = card.querySelector(':scope > .mpp-card-select-marker');
            if (!marker && enabled) {
                marker = createElement('span', 'mpp-card-select-marker');
                marker.setAttribute('aria-hidden', 'true');
                marker.appendChild(createElement('i'));
                card.appendChild(marker);
            }
            marker?.querySelector('i')?.setAttribute('class', isSelected ? 'fa-solid fa-square-check' : 'fa-regular fa-square');
        });
    };
    const setEnabled = value => {
        enabled = Boolean(value);
        if (!enabled) selected.clear();
        update();
    };
    const run = async action => {
        if (operationPending) return;
        operationPending = true;
        update();
        try { await action(); }
        catch (error) {
            console.error(`[${EXTENSION_NAME}] Bulk persona action failed.`, error);
            globalThis.toastr?.error?.(t('actionError'));
        } finally {
            operationPending = false;
            update();
        }
    };

    avatarBlock.addEventListener('click', event => {
        if (!enabled || operationPending || !(event.target instanceof Element)) return;
        const card = event.target.closest('.mpp-persona-card');
        if (!card || !avatarBlock.contains(card)) return;
        const avatarId = getCardAvatarId(card);
        if (!hasPersonaRecord(avatarId)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (selected.has(avatarId)) selected.delete(avatarId);
        else selected.add(avatarId);
        update();
    }, { capture: true });
    selectPage.addEventListener('click', () => {
        const cards = [...avatarBlock.querySelectorAll(':scope > .mpp-persona-card:not(.mpp-filter-hidden)')];
        const avatarIds = cards.map(getCardAvatarId).filter(hasPersonaRecord);
        const allSelected = avatarIds.length > 0 && avatarIds.every(avatarId => selected.has(avatarId));
        avatarIds.forEach(avatarId => {
            if (allSelected) selected.delete(avatarId);
            else selected.add(avatarId);
        });
        update();
    });
    cancel.addEventListener('click', () => setEnabled(false));
    move.addEventListener('click', () => run(async () => {
        if (!selected.size) return;
        const folderId = await requestPersonaFolderChoice('');
        if (folderId === null) return;
        let changed = false;
        selected.forEach(avatarId => { changed = setPersonaFolder(avatarId, folderId, false) || changed; });
        if (changed) savePersonaFolders();
        setEnabled(false);
        await panel.mppRefresh?.();
    }));
    favorite.addEventListener('click', () => run(async () => {
        if (!selected.size) return;
        const allFavorite = [...selected].every(avatarId => favoritePersonas.has(avatarId));
        selected.forEach(avatarId => {
            if (allFavorite) favoritePersonas.delete(avatarId);
            else favoritePersonas.add(avatarId);
        });
        saveFavorites();
        setEnabled(false);
        await panel.mppRefresh?.();
    }));
    exportButton.addEventListener('click', () => run(() => exportAllPersonasZip([...selected])));
    deleteButton.addEventListener('click', () => run(async () => {
        const avatarIds = [...selected];
        if (!avatarIds.length) return;
        const names = avatarIds.slice(0, 8).map(avatarId => escapeHtml(power_user.personas?.[avatarId] || t('unnamedPersona'))).join(', ');
        const suffix = avatarIds.length > 8 ? ` +${avatarIds.length - 8}` : '';
        const confirmed = await Popup.show.confirm(t('cleanupDeleteConfirm'), `${names}${suffix}<br><br>${t('cleanupDeleteHint')}`);
        if (!confirmed) return;
        const failed = new Set();
        for (const avatarId of avatarIds) {
            try {
                if (!(await deletePersonaNow(avatarId, panel))) failed.add(avatarId);
            } catch (error) {
                failed.add(avatarId);
                console.error(`[${EXTENSION_NAME}] Could not delete selected persona: ${avatarId}`, error);
            }
        }
        selected.clear();
        failed.forEach(avatarId => selected.add(avatarId));
        if (failed.size) globalThis.toastr?.error?.(t('actionError'));
        else setEnabled(false);
        await panel.mppRefresh?.({ refreshCount: true });
    }));
    new MutationObserver(() => {
        if (!enabled) return;
        if (['mpp-folder-mode', 'mpp-creating', 'mpp-cleaning', 'mpp-mapping'].some(className => panel.classList.contains(className))) {
            setEnabled(false);
        }
    }).observe(panel, { attributes: true, attributeFilter: ['class'] });

    return { bar, refresh: update, setEnabled, isEnabled: () => enabled };
}

function createFolderWorkspace({ panel, avatarBlock, filters, setTagFilter, searchInput, personaCounter }) {
    const workspace = createElement('section', 'mpp-folder-workspace');
    workspace.hidden = true;
    workspace.setAttribute('aria-label', t('folders'));

    const modeButton = createElement('button', 'mpp-filter mpp-folder-mode-button');
    modeButton.type = 'button';
    modeButton.title = t('folders');
    modeButton.setAttribute('aria-label', t('folders'));
    modeButton.setAttribute('aria-pressed', 'false');
    modeButton.append(createElement('i', 'fa-solid fa-folder-open'), createElement('span', '', t('folders')));
    const favoritesFilter = filters.querySelector('[data-mpp-filter="favorites"]');
    if (favoritesFilter) favoritesFilter.after(modeButton);
    else filters.appendChild(modeButton);

    const rootView = createElement('div', 'mpp-folder-view mpp-folder-root');
    const rootHead = createElement('header', 'mpp-folder-head');
    const rootTitle = createElement('span', 'mpp-folder-title');
    rootTitle.appendChild(createElement('strong', '', t('folders')));
    const newButton = createElement('button', 'mpp-button mpp-folder-new');
    newButton.type = 'button';
    newButton.title = t('folderNew');
    newButton.setAttribute('aria-label', t('folderNew'));
    newButton.append(createElement('i', 'fa-solid fa-folder-plus'), createElement('span', '', t('folderNew')));
    rootHead.append(rootTitle, newButton);
    const folderGrid = createElement('div', 'mpp-folder-grid');
    const rootEmpty = createElement('div', 'mpp-folder-empty', t('folderEmpty'));
    rootEmpty.hidden = true;
    rootView.append(rootHead, folderGrid, rootEmpty);

    const detailView = createElement('div', 'mpp-folder-view mpp-folder-detail');
    detailView.hidden = true;
    const detailHead = createElement('header', 'mpp-folder-head');
    const backButton = createElement('button', 'mpp-button mpp-folder-back');
    backButton.type = 'button';
    backButton.title = t('folderBack');
    backButton.setAttribute('aria-label', t('folderBack'));
    backButton.append(createElement('i', 'fa-solid fa-arrow-left'), createElement('span', '', t('folderBack')));
    const detailTitle = createElement('span', 'mpp-folder-title');
    const detailName = createElement('strong');
    const detailCount = createElement('small');
    detailTitle.append(detailName, detailCount);
    const detailActions = createElement('span', 'mpp-folder-head-actions');
    const addButton = createElement('button', 'mpp-button mpp-folder-add');
    addButton.type = 'button';
    addButton.title = t('folderAdd');
    addButton.setAttribute('aria-label', t('folderAdd'));
    addButton.append(createElement('i', 'fa-solid fa-user-plus'), createElement('span', '', t('folderAdd')));
    const renameButton = createIconButton('fa-pencil', t('folderRename'), 'mpp-folder-rename');
    const deleteButton = createIconButton('fa-folder-xmark', t('folderDelete'), 'mpp-folder-delete');
    detailActions.append(addButton, renameButton, deleteButton);
    detailHead.append(backButton, detailTitle, detailActions);
    const personaGrid = createElement('div', 'mpp-folder-persona-grid');
    const detailEmpty = createElement('div', 'mpp-folder-empty', t('folderEmptyPersonas'));
    detailEmpty.hidden = true;
    detailView.append(detailHead, personaGrid, detailEmpty);
    workspace.append(rootView, detailView);

    let view = 'root';
    let activeFolderId = '';
    let searchTimer;
    const searchQuery = () => String(searchInput?.value || '').trim().toLocaleLowerCase();
    const totalPersonaCount = () => Object.keys(power_user.personas || {}).length;

    const syncDensity = () => {
        personaGrid.dataset.mppDensity = avatarBlock.dataset.mppDensity || 'shelf';
        personaGrid.dataset.mppMobileColumns = avatarBlock.dataset.mppMobileColumns || '3';
    };
    new MutationObserver(syncDensity).observe(avatarBlock, {
        attributes: true,
        attributeFilter: ['data-mpp-density', 'data-mpp-mobile-columns'],
    });
    syncDensity();

    const renderRoot = () => {
        view = 'root';
        activeFolderId = '';
        workspace.dataset.view = 'root';
        rootView.hidden = false;
        detailView.hidden = true;
        personaCounter.textContent = formatPersonaCount(totalPersonaCount());
        if (searchInput) searchInput.placeholder = t('folderSearch');
        const query = searchQuery();
        const folders = [...personaFolderState.folders]
            .sort((left, right) => left.createdAt - right.createdAt)
            .filter(folder => !query || folder.name.toLocaleLowerCase().includes(query));
        rootEmpty.textContent = query ? t('noPersonasFound') : t('folderEmpty');
        folderGrid.replaceChildren(...folders.map(folder => {
            const card = createElement('button', 'mpp-folder-card');
            card.type = 'button';
            card.dataset.folderId = folder.id;
            const label = t('folderOpen').replace('{name}', folder.name);
            card.title = label;
            card.setAttribute('aria-label', label);
            const copy = createElement('span', 'mpp-folder-card-copy');
            copy.appendChild(createElement('strong', '', folder.name));
            copy.appendChild(createElement('small', '', formatPersonaCount(getFolderPersonaIds(folder.id).length)));
            card.append(createElement('i', 'fa-solid fa-folder'), copy, createElement('i', 'fa-solid fa-chevron-right mpp-folder-card-arrow'));
            card.addEventListener('click', () => openDetail(folder.id));
            return card;
        }));
        folderGrid.hidden = folders.length === 0;
        rootEmpty.hidden = folders.length > 0;
    };

    const renderDetail = () => {
        const folder = getPersonaFolder(activeFolderId);
        if (!folder) {
            renderRoot();
            return;
        }
        view = 'detail';
        workspace.dataset.view = 'detail';
        rootView.hidden = true;
        detailView.hidden = false;
        detailName.textContent = folder.name;
        const avatarIds = getFolderPersonaIds(folder.id);
        detailCount.textContent = formatPersonaCount(avatarIds.length);
        personaCounter.textContent = detailCount.textContent;
        if (searchInput) searchInput.placeholder = t('searchByPersonaContent');
        const query = searchQuery();
        const visibleAvatarIds = avatarIds.filter(avatarId => {
            if (!query) return true;
            const descriptor = power_user.persona_descriptions?.[avatarId] || {};
            return [power_user.personas?.[avatarId] || '', descriptor.title || '', descriptor.description || '']
                .join('\n').toLocaleLowerCase().includes(query);
        });
        detailEmpty.textContent = query ? t('noPersonasFound') : t('folderEmptyPersonas');
        addButton.disabled = Object.keys(power_user.personas || {}).length === 0;
        syncDensity();
        personaGrid.setAttribute('aria-label', folder.name);
        personaGrid.replaceChildren(...visibleAvatarIds
            .map(avatarId => createPersonaCardFromTemplate(avatarBlock, avatarId))
            .filter(Boolean));
        decorateCards(personaGrid, { folderId: folder.id });
        personaGrid.hidden = visibleAvatarIds.length === 0;
        detailEmpty.hidden = visibleAvatarIds.length > 0;
    };

    const render = () => {
        if (view === 'detail' && getPersonaFolder(activeFolderId)) renderDetail();
        else renderRoot();
    };

    function openDetail(folderId) {
        if (!getPersonaFolder(folderId)) return;
        window.clearTimeout(searchTimer);
        if (searchInput) searchInput.value = '';
        activeFolderId = folderId;
        view = 'detail';
        renderDetail();
    }

    const setModeActive = active => {
        modeButton.classList.toggle('is-active', active);
        modeButton.setAttribute('aria-pressed', String(active));
    };
    const showLibrary = () => {
        const wasActive = panel.classList.contains('mpp-folder-mode');
        workspace.hidden = true;
        window.clearTimeout(searchTimer);
        panel.classList.remove('mpp-folder-mode');
        setModeActive(false);
        if (!wasActive) return;
        if (searchInput) {
            searchInput.placeholder = t('searchByPersonaName');
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        void refreshPersonaCount(personaCounter);
    };
    const openRoot = () => {
        workspace.hidden = false;
        panel.classList.add('mpp-folder-mode');
        setModeActive(true);
        renderRoot();
    };
    modeButton.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        if (panel.classList.contains('mpp-folder-mode')) showLibrary();
        else openRoot();
    });
    filters.addEventListener('click', event => {
        if (!(event.target instanceof Element)) return;
        const filter = event.target.closest('.mpp-filter');
        if (filter && filter !== modeButton) showLibrary();
    }, true);
    panel.addEventListener('input', event => {
        if (event.target !== searchInput || !panel.classList.contains('mpp-folder-mode')) return;
        /* Folder search must never invoke ST's native library search and re-render its grid. */
        event.preventDefault();
        event.stopImmediatePropagation();
        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(() => {
            if (view === 'detail') renderDetail();
            else renderRoot();
        }, 60);
    }, true);

    newButton.addEventListener('click', async () => {
        const name = await requestPersonaFolderName(t('folderNew'));
        if (!name) return;
        const folder = createPersonaFolder(name);
        if (!folder) return;
        openDetail(folder.id);
        panel.mppRefreshPersonaEditor?.();
    });
    backButton.addEventListener('click', renderRoot);
    addButton.addEventListener('click', async () => {
        const folderId = activeFolderId;
        if (!folderId || addButton.disabled) return;
        addButton.disabled = true;
        try {
            if (await editFolderPersonas(folderId)) await panel.mppRefresh?.();
        } catch (error) {
            console.error(`[${EXTENSION_NAME}] Could not edit folder members.`, error);
            globalThis.toastr?.error?.(t('actionError'));
        } finally {
            addButton.disabled = Object.keys(power_user.personas || {}).length === 0;
        }
    });
    renameButton.addEventListener('click', async () => {
        const folder = getPersonaFolder(activeFolderId);
        if (!folder) return;
        const name = await requestPersonaFolderName(t('folderRename'), folder.name);
        if (!name || !renamePersonaFolder(folder.id, name)) return;
        renderDetail();
        panel.mppRefreshPersonaEditor?.();
    });
    deleteButton.addEventListener('click', async () => {
        const folder = getPersonaFolder(activeFolderId);
        if (!folder) return;
        const confirmed = await Popup.show.confirm(t('folderDelete'), `${escapeHtml(folder.name)}<br>${t('folderDeleteHint')}`);
        if (!confirmed) return;
        /* This deletes metadata only. No persona API, file, lock or active-persona state is touched. */
        deletePersonaFolder(folder.id);
        renderRoot();
        await panel.mppRefresh?.();
    });
    personaGrid.addEventListener('click', async event => {
        if (!(event.target instanceof Element)) return;
        const tag = event.target.closest('.mpp-card-tag');
        if (tag && personaGrid.contains(tag)) {
            event.preventDefault();
            event.stopPropagation();
            showLibrary();
            setTagFilter(tag.dataset.tag || '');
            return;
        }
        if (event.target.closest('button')) return;
        const card = event.target.closest('.mpp-persona-card');
        if (!card || !personaGrid.contains(card)) return;
        const avatarId = getCardAvatarId(card);
        if (!hasPersonaRecord(avatarId)) return;
        event.preventDefault();
        event.stopPropagation();
        try {
            await setUserAvatar(avatarId);
            await panel.mppRefresh?.();
        } catch (error) {
            console.error(`[${EXTENSION_NAME}] Could not activate a persona from a folder.`, error);
            globalThis.toastr?.error?.(t('actionError'));
        }
    });

    return {
        workspace,
        showLibrary,
        refresh: () => { if (!workspace.hidden) render(); },
    };
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
    const saveStatus = createElement('span', 'mpp-creator-save-status');
    saveStatus.setAttribute('role', 'status');
    saveStatus.setAttribute('aria-live', 'polite');
    top.append(backButton, saveStatus, saveButton);

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
    const titleInput = createElement('input', 'text_pole mpp-creator-title-input');
    titleInput.type = 'text';
    titleInput.maxLength = 120;
    titleInput.placeholder = t('creatorTitle');
    titleInput.setAttribute('aria-label', t('creatorTitle'));
    const identityMeta = createElement('span', 'mpp-creator-meta');
    identityMeta.hidden = true;
    identityCopy.append(nameDisplay, nameInput, titleInput, identityMeta);
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
    descriptionCounter.title = t('creatorTokenCount');
    descriptionCounter.setAttribute('aria-label', t('creatorTokenCount'));
    const expandDescription = createIconButton('fa-expand', t('creatorExpandDescription'), 'mpp-creator-description-expand');
    descriptionHead.append(descriptionTitle, descriptionCounter, expandDescription);
    const description = createElement('textarea', 'text_pole mpp-creator-description-input');
    description.rows = 12;
    descriptionField.append(descriptionHead, description);
    expandDescription.setAttribute('aria-haspopup', 'dialog');
    expandDescription.setAttribute('aria-expanded', 'false');

    const descriptionEditorBackdrop = createElement('div', 'mpp-description-editor-backdrop');
    descriptionEditorBackdrop.dataset.mppOwner = 'persona-panel';
    descriptionEditorBackdrop.dataset.mppIndependent = 'true';
    descriptionEditorBackdrop.hidden = true;
    descriptionEditorBackdrop.tabIndex = -1;
    const descriptionEditorModal = createElement('section', 'mpp-description-editor-modal');
    descriptionEditorModal.setAttribute('role', 'dialog');
    descriptionEditorModal.setAttribute('aria-modal', 'true');
    descriptionEditorModal.setAttribute('aria-label', t('creatorDescription'));
    const descriptionEditorHeader = createElement('header', 'mpp-description-editor-header');
    const descriptionEditorTitle = createElement('strong', '', t('creatorDescription'));
    descriptionEditorTitle.prepend(createElement('i', 'fa-solid fa-align-left'));
    const descriptionEditorClose = createIconButton('fa-xmark', t('descriptionEditorClose'), 'mpp-description-editor-close');
    descriptionEditorHeader.append(descriptionEditorTitle, descriptionEditorClose);
    const descriptionEditorBody = createElement('div', 'mpp-description-editor-body');
    const descriptionEditorFooter = createElement('footer', 'mpp-description-editor-footer');
    const descriptionEditorDone = createElement('button', 'mpp-button mpp-description-editor-done');
    descriptionEditorDone.type = 'button';
    descriptionEditorDone.append(createElement('i', 'fa-solid fa-check'), createElement('span', '', t('folderSave')));
    descriptionEditorFooter.appendChild(descriptionEditorDone);
    descriptionEditorModal.append(descriptionEditorHeader, descriptionEditorBody, descriptionEditorFooter);
    descriptionEditorBackdrop.appendChild(descriptionEditorModal);
    const descriptionEditorAppearance = getAppearance();
    descriptionEditorBackdrop.dataset.mppTheme = descriptionEditorAppearance.theme;
    applyAppearanceTokens(descriptionEditorBackdrop, getAppearanceTokens(descriptionEditorAppearance));
    document.body.appendChild(descriptionEditorBackdrop);

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

    const folderPreview = createElement('section', 'mpp-creator-linked mpp-creator-folder');
    folderPreview.hidden = true;
    folderPreview.appendChild(createElement('strong', 'mpp-creator-linked-title', t('folderEditor')));
    const folderSelect = createElement('select', 'text_pole mpp-creator-folder-select');
    folderSelect.setAttribute('aria-label', t('folderEditor'));
    folderPreview.appendChild(folderSelect);
    left.appendChild(folderPreview);

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
    let titleTimer;
    let descriptionTokenTimer;
    let descriptionDirty = false;
    let editorDirty = false;
    let settingsSavePending = false;
    let descriptionCountGeneration = 0;
    const markEditorDirty = () => {
        editorDirty = true;
        if (state.avatarId) saveStatus.textContent = t('editorSaving');
    };
    const updateDescriptionCounter = () => {
        const text = description.value;
        const generation = ++descriptionCountGeneration;
        window.clearTimeout(descriptionTokenTimer);
        if (!text) {
            descriptionCounter.textContent = '0';
            return;
        }
        descriptionCounter.textContent = '…';
        descriptionTokenTimer = window.setTimeout(async () => {
            let count = '—';
            try {
                const getTokenCount = globalThis.SillyTavern?.getContext?.()?.getTokenCountAsync;
                if (typeof getTokenCount === 'function') count = await getTokenCount(text);
            } catch { /* Keep the unavailable token marker rather than misreporting characters. */ }
            if (generation === descriptionCountGeneration && text === description.value) {
                descriptionCounter.textContent = String(count);
            }
        }, 200);
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
    const saveSettings = () => {
        settingsSavePending = true;
        if (state.avatarId) saveStatus.textContent = t('editorSaving');
        context()?.saveSettingsDebounced?.();
    };
    if (event_types.SETTINGS_UPDATED) {
        eventSource.on(event_types.SETTINGS_UPDATED, () => {
            if (!settingsSavePending) return;
            settingsSavePending = false;
            if (!workspace.hidden) saveStatus.textContent = t('editorSaved');
        });
    }
    const descriptor = () => {
        if (!state.avatarId || power_user.personas?.[state.avatarId] === undefined) return null;
        const existing = power_user.persona_descriptions[state.avatarId];
        if (existing && typeof existing === 'object' && !Array.isArray(existing)) return existing;
        power_user.persona_descriptions[state.avatarId] = { description: '', title: '', connections: [] };
        return power_user.persona_descriptions[state.avatarId];
    };
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
    const renderFolderPreview = () => {
        folderPreview.hidden = !state.avatarId;
        folderSelect.replaceChildren();
        if (!state.avatarId) return;
        folderSelect.appendChild(new Option(t('folderUnsorted'), ''));
        getSortedPersonaFolders().forEach(folder => folderSelect.appendChild(new Option(folder.name, folder.id)));
        folderSelect.appendChild(new Option(t('folderNewOption'), FOLDER_CREATE_OPTION));
        folderSelect.value = getPersonaFolderId(state.avatarId);
    };
    const renderConnectionPreview = () => {
        renderFolderPreview();
        connectionPreview.hidden = !state.avatarId || state.avatarId !== user_avatar;
        if (!state.avatarId || state.avatarId !== user_avatar) {
            connectionPreviewInfo.replaceChildren();
            connectionPreviewList.replaceChildren();
            return;
        }
        updatePersonaConnectionsAvatarList();
        const nativeInfo = panel.querySelector('#persona_connections_info_block');
        const nativeList = panel.querySelector('#persona_connections_list');
        connectionPreviewInfo.replaceChildren(...[...(nativeInfo?.childNodes || [])].map(node => node.cloneNode(true)));
        connectionPreviewList.replaceChildren(...[...(nativeList?.childNodes || [])].map(node => node.cloneNode(true)));
        connectionPreview.classList.toggle('is-empty', !connectionPreviewList.querySelector('.avatar'));
    };
    const updateDescriptor = () => {
        window.clearTimeout(titleTimer);
        window.clearTimeout(descriptionTimer);
        descriptionDirty = false;
        editorDirty = false;
        const value = descriptor();
        if (!value) {
            saveStatus.textContent = '';
            return;
        }
        value.title = titleInput.value.trim();
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
        /* Native code and third-party extensions listen for this event on every edit. */
        void eventSource.emit(event_types.PERSONA_UPDATED, state.avatarId);
    };
    const flushEditorChanges = () => {
        window.clearTimeout(titleTimer);
        window.clearTimeout(descriptionTimer);
        if (editorDirty || descriptionDirty) updateDescriptor();
        /* Flush the native debounce too: descriptor edits may already be written while settings are still pending. */
        if (settingsSavePending && state.avatarId) saveSillyTavernSettings();
    };
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flushEditorChanges();
    });
    window.addEventListener('pagehide', flushEditorChanges);
    window.addEventListener('beforeunload', flushEditorChanges);

    const closeDescriptionEditor = ({ restoreFocus = true } = {}) => {
        if (descriptionEditorBackdrop.hidden) return;
        window.clearTimeout(descriptionTimer);
        if (descriptionDirty) updateDescriptor();
        /* The same textarea goes back: no duplicate state, stale copies or lost input listeners. */
        descriptionField.appendChild(description);
        descriptionEditorBackdrop.hidden = true;
        expandDescription.classList.remove('is-active');
        expandDescription.setAttribute('aria-expanded', 'false');
        if (restoreFocus && !workspace.hidden) expandDescription.focus();
    };
    const openDescriptionEditor = () => {
        if (!descriptionEditorBackdrop.hidden) return;
        descriptionEditorBody.appendChild(description);
        descriptionEditorBackdrop.hidden = false;
        expandDescription.classList.add('is-active');
        expandDescription.setAttribute('aria-expanded', 'true');
        requestAnimationFrame(() => {
            description.focus();
            const end = description.value.length;
            description.setSelectionRange(end, end);
        });
    };
    descriptionEditorClose.addEventListener('click', () => closeDescriptionEditor());
    descriptionEditorDone.addEventListener('click', () => closeDescriptionEditor());
    descriptionEditorBackdrop.addEventListener('pointerdown', event => event.stopPropagation());
    descriptionEditorBackdrop.addEventListener('mousedown', event => event.stopPropagation());
    descriptionEditorBackdrop.addEventListener('touchstart', event => event.stopPropagation(), { passive: true });
    descriptionEditorBackdrop.addEventListener('click', event => {
        if (event.target === descriptionEditorBackdrop) closeDescriptionEditor();
        event.stopPropagation();
    });

    let descriptionEditorEscapeHandled = false;
    window.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || (descriptionEditorBackdrop.hidden && !descriptionEditorEscapeHandled)) return;
        /* ST closes the whole drawer on Escape. While this dialog is open, Escape belongs only to it. */
        event.preventDefault();
        event.stopImmediatePropagation();
        if (descriptionEditorBackdrop.hidden) return;
        descriptionEditorEscapeHandled = true;
        closeDescriptionEditor();
    }, { capture: true });
    window.addEventListener('keyup', event => {
        if (event.key !== 'Escape' || !descriptionEditorEscapeHandled) return;
        /* Do not let the matching keyup close the parent after the dialog is already hidden. */
        descriptionEditorEscapeHandled = false;
        event.preventDefault();
        event.stopImmediatePropagation();
    }, { capture: true });
    window.addEventListener('blur', () => { descriptionEditorEscapeHandled = false; });

    descriptionEditorBackdrop.addEventListener('keydown', event => {
        if (event.key !== 'Tab') return;
        const focusable = [descriptionEditorClose, description, descriptionEditorDone];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

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
        /* Capture now: closing the editor mid-upload resets state, and setUserAvatar('')
           would corrupt the active persona (native code falls back to $(this).attr()). */
        const avatarId = state.avatarId;
        const file = state.file;
        const cropData = state.cropData;
        if (!avatarId || !file) return;
        await uploadPortrait(avatarId, file, cropData);
        markPersonaImageChanged(avatarId);
        markPersonaModified(avatarId);
        await bustPersonaImageCache(avatarId);
        await getUserAvatars(true, avatarId);
        if (workspace.hidden || state.avatarId !== avatarId) return;
        /* The user may have switched via the launcher during upload; never switch back here. */
        reloadUserChatAvatars(avatarId);
        await eventSource.emit(event_types.PERSONA_UPDATED, avatarId);
        refreshPersonaImages(panel, avatarId);
        photoImage.src = personaImageUrl(avatarId);
        state.file = null;
        state.cropData = null;
        if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
        state.objectUrl = '';
        await panel.mppRefresh?.();
        updateSpotlight();
    };
    const recropExistingPortrait = async () => {
        if (!state.avatarId) return;
        try {
            const response = await fetch(personaImageUrl(state.avatarId), {
                cache: 'no-store',
                headers: context()?.getRequestHeaders?.({ omitContentType: true }),
            });
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
        closeDescriptionEditor({ restoreFocus: false });
        flushEditorChanges();
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
        titleInput.value = '';
        settingsSavePending = false;
        saveStatus.textContent = '';
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
            await setServicePersonaAvatar(avatarId);
        }
        if (power_user.personas?.[avatarId] === undefined) return; // deleted while switching
        reset();
        state.avatarId = avatarId;
        nameDisplay.textContent = existingName || t('creatorName');
        const value = power_user.persona_descriptions?.[avatarId] || {};
        titleInput.value = value.title || '';
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

    /* Intercept in the panel's capture phase, not on the target: at-target listeners run in
       registration order, and we must win even if the extension loads after initPersonas. */
    panel.addEventListener('click', event => {
        if (!(event.target instanceof Element) || !createButton.contains(event.target)) return;
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
        if (!editorDirty && document.activeElement !== titleInput) {
            titleInput.value = power_user.persona_descriptions?.[state.avatarId]?.title || '';
        }
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
        await setServicePersonaAvatar(state.avatarId);
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
    folderSelect.addEventListener('change', async () => {
        const avatarId = state.avatarId;
        if (!avatarId) return;
        folderSelect.disabled = true;
        try {
            let folderId = folderSelect.value;
            if (folderId === FOLDER_CREATE_OPTION) {
                const name = await requestPersonaFolderName(t('folderNew'));
                if (!name) return;
                folderId = createPersonaFolder(name)?.id || '';
                if (!folderId) return;
            }
            if (setPersonaFolder(avatarId, folderId)) await panel.mppRefresh?.();
        } catch (error) {
            console.error(`[${EXTENSION_NAME}] Could not assign the editor persona to a folder.`, error);
            notify(t('actionError'));
        } finally {
            folderSelect.disabled = false;
            renderFolderPreview();
        }
    });
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
            /* Esc here cancels the rename — it must not bubble up and close the panel. */
            event.stopPropagation();
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
    expandDescription.addEventListener('click', openDescriptionEditor);
    const canWheelScroll = (element, direction) => {
        if (!element || element.scrollHeight <= element.clientHeight + 1) return false;
        const overflowY = getComputedStyle(element).overflowY;
        if (overflowY !== 'auto' && overflowY !== 'scroll') return false;
        if (direction > 0) return element.scrollTop < element.scrollHeight - element.clientHeight - 1;
        return element.scrollTop > 0;
    };
    const wheelAnimations = new WeakMap();
    const reducedWheelMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const scrollWheelSmoothly = (scroller, delta) => {
        let animation = wheelAnimations.get(scroller);
        const currentTarget = animation?.target ?? scroller.scrollTop;
        const next = Math.max(0, Math.min(scroller.scrollHeight - scroller.clientHeight, currentTarget + delta));
        if (next === currentTarget) return Boolean(animation);
        scroller.style.scrollBehavior = 'auto';
        if (reducedWheelMotion.matches) {
            if (animation) cancelAnimationFrame(animation.frame);
            wheelAnimations.delete(scroller);
            scroller.scrollTop = next;
            return true;
        }
        if (!animation) {
            animation = { target: next, frame: 0 };
            wheelAnimations.set(scroller, animation);
        } else {
            animation.target = next;
        }
        if (animation.frame) return true;
        const tick = () => {
            const current = scroller.scrollTop;
            const distance = animation.target - current;
            if (Math.abs(distance) < 0.6) {
                scroller.scrollTop = animation.target;
                wheelAnimations.delete(scroller);
                return;
            }
            scroller.scrollTop = current + distance * 0.24;
            animation.frame = requestAnimationFrame(tick);
        };
        animation.frame = requestAnimationFrame(tick);
        return true;
    };
    workspace.addEventListener('wheel', event => {
        if (event.defaultPrevented || event.ctrlKey || Math.abs(event.deltaY) < 1 || !(event.target instanceof Element)) return;
        const target = event.target;
        if (target.closest('select, input[type="range"]')) return;
        /* Use the innermost real scroll area, then its column, then the mobile body.
           Manual scrolling avoids hosts that cancel wheel events outside the scrollbar. */
        const candidates = [
            target.closest('textarea'),
            target.closest('.mpp-creator-tool-panel, .mpp-creator-linked-list'),
            target.closest('.mpp-creator-left, .mpp-creator-right'),
            target.closest('.mpp-creator-body'),
        ];
        const scroller = candidates.find(element => canWheelScroll(element, event.deltaY));
        if (!scroller) return;
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scroller.clientHeight : 1;
        if (!scrollWheelSmoothly(scroller, event.deltaY * unit)) return;
        event.preventDefault();
        event.stopPropagation();
    }, { passive: false });
    positionButtons.forEach((button, value) => button.addEventListener('click', () => {
        position.value = value;
        renderPositionDetails();
        updateDescriptor();
    }));
    depth.addEventListener('input', updateDescriptor);
    role.addEventListener('change', updateDescriptor);
    titleInput.addEventListener('input', () => {
        markEditorDirty();
        window.clearTimeout(titleTimer);
        titleTimer = window.setTimeout(updateDescriptor, 250);
    });
    description.addEventListener('input', () => {
        descriptionDirty = true;
        markEditorDirty();
        updateDescriptionCounter();
        window.clearTimeout(descriptionTimer);
        descriptionTimer = window.setTimeout(updateDescriptor, 250);
    });
    notes.addEventListener('input', writeNotes);
    connectionButtons.forEach((button, type) => button.addEventListener('click', () => runEditorAction(button, async () => {
        if (!state.avatarId) return;
        /* Native lock helpers always act on user_avatar. The global launcher can switch the
           active persona while the editor is open, so realign before touching locks. */
        if (user_avatar !== state.avatarId) await setServicePersonaAvatar(state.avatarId);
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
        const safeName = name.replace(/[^a-zA-Z0-9]/g, '') || 'persona';
        const avatarId = state.avatarId || `${Date.now()}-${safeName}.png`;
        let shouldClose = false;
        try {
            state.busy = true;
            saveButton.disabled = true;
            saveButton.querySelector('span').textContent = t('creatorSaving');
            saveButton.querySelector('i').className = 'fa-solid fa-hourglass-half';
            if (isNew) {
                let portraitFile = state.file;
                if (!portraitFile) {
                    const response = await fetch('/img/user-default.png');
                    if (!response.ok) throw new Error(`Default persona image is unavailable (${response.status}).`);
                    portraitFile = await response.blob();
                }
                await initPersona(avatarId, name, description.value, titleInput.value.trim(), {
                    position: Number(position.value),
                    depth: Number(depth.value) || 0,
                    role: Number(role.value),
                    lorebook: lorebook.value,
                });
                state.avatarId = avatarId;
                power_user.persona_descriptions[avatarId].connections = [];
                await uploadPortrait(avatarId, portraitFile, state.cropData);
                markPersonaImageChanged(avatarId);
                markPersonaModified(avatarId);
                rememberFirstSeen([avatarId]);
            } else {
                power_user.personas[avatarId] = name;
                updateDescriptor();
                markPersonaModified(avatarId);
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
                const orphanId = state.avatarId;
                setPersonaTags(orphanId, []);
                delete power_user.personas?.[orphanId];
                delete power_user.persona_descriptions?.[orphanId];
                state.avatarId = '';
                saveSettings();
                /* Roll back the uploaded file too, not just the settings (404 = never uploaded). */
                try {
                    const ctx = context();
                    await fetch('/api/avatars/delete', {
                        method: 'POST',
                        headers: ctx?.getRequestHeaders?.(),
                        body: JSON.stringify({ avatar: orphanId }),
                    });
                } catch (cleanupError) {
                    console.warn(`[${EXTENSION_NAME}] Could not remove the orphan avatar file.`, cleanupError);
                }
                try {
                    /* initPersona already announced the draft; compensate listeners after rollback. */
                    await eventSource.emit(event_types.PERSONA_DELETED, { avatarId: orphanId, name });
                    await panel.mppRefresh?.();
                } catch (eventError) {
                    console.warn(`[${EXTENSION_NAME}] Could not announce creation rollback.`, eventError);
                }
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
    /* The native grid-view toggle is hidden by this extension, but its saved state still
       collapses cards to ~100px and squeezes the card action buttons out of sight. */
    avatarBlock.classList.remove('gridView');

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
    const selectButton = createIconButton('fa-square-check', t('selectPersonas'), 'mpp-select-toggle');
    selectButton.setAttribute('aria-pressed', 'false');
    const convertButton = createIconButton('fa-wand-magic-sparkles', t('convertCharacter'), 'mpp-convert-character');
    const mapOpenButton = createIconButton('fa-map', t('mapTitle'), 'mpp-map-open');
    const cleanupOpenButton = createIconButton('fa-broom', t('cleanupTitle'), 'mpp-cleanup-open');
    const libraryActions = createElement('span', 'mpp-library-actions');
    libraryActions.append(selectButton, convertButton, mapOpenButton, cleanupOpenButton, densityControls);
    libraryHeader.append(libraryCopy, libraryActions);
    leftColumn.prepend(libraryHeader);
    const { bar: filters, apply: applyFilter, renderTags: renderTagFilters, setTagFilter } = createFilterBar(avatarBlock);
    // Tag chips on cards double as filter shortcuts. Capture phase beats the card's own activation click.
    avatarBlock.addEventListener('click', event => {
        if (panel.classList.contains('mpp-selecting')) return;
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
    if (createButton) {
        createButton.classList.add('mpp-button', 'mpp-create-persona');
        const createIcon = createElement('i', 'fa-solid fa-user-plus');
        createIcon.setAttribute('aria-hidden', 'true');
        createButton.replaceChildren(createIcon);
        createButton.title = t('creatorSave');
        createButton.setAttribute('aria-label', t('creatorSave'));
        spotlight.append(createButton);
    }
    if (searchInput) searchInput.placeholder = t('searchByPersonaContent');
    nativeToolbar?.after(filters);
    // Keep the native controls and listeners when the panel crosses the phone breakpoint.
    // Pagination follows the cards in the phone's single scrolling library.
    const shortTouchQuery = window.matchMedia('(max-height: 540px) and (pointer: coarse)');
    const syncLibraryLayout = () => {
        const width = panel.getBoundingClientRect().width;
        if (!width || !nativeToolbar) return;
        const narrow = width <= 562 || shortTouchQuery.matches; // Content box excludes borders.
        const pagerParent = narrow ? leftColumn : nativeToolbar;
        if (paginationContainer && paginationContainer.parentElement !== pagerParent) pagerParent.appendChild(paginationContainer);
    };
    observeResize(panel, syncLibraryLayout);
    if (typeof globalThis.ResizeObserver !== 'function') {
        new MutationObserver(syncLibraryLayout).observe(panel, { attributes: true, attributeFilter: ['class', 'style'] });
    }
    onMediaQueryChange(shortTouchQuery, syncLibraryLayout);
    syncLibraryLayout();

    const folderWorkspace = createFolderWorkspace({ panel, avatarBlock, filters, setTagFilter, searchInput, personaCounter });
    leftColumn.appendChild(folderWorkspace.workspace);

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
    createLibrarySwipe({ panel, avatarBlock, paginationContainer });
    const bulkSelection = createBulkSelectionController({ panel, avatarBlock, toggleButton: selectButton });
    selectButton.addEventListener('click', () => bulkSelection.setEnabled(!bulkSelection.isEnabled()));
    convertButton.addEventListener('click', async () => {
        if (convertButton.disabled) return;
        convertButton.disabled = true;
        try { await showCharacterConversionPicker(); }
        catch (error) {
            console.error(`[${EXTENSION_NAME}] Character conversion failed.`, error);
            globalThis.toastr?.error?.(t('convertError'));
        } finally { convertButton.disabled = false; }
    });
    const refreshRenderedLibrary = () => {
        decorateCards(avatarBlock);
        applyFilter();
        bulkSelection.refresh();
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
        folderWorkspace.refresh();
    };
    panel.mppRefresh({ refreshCount: true }).catch(error => console.error(`[${EXTENSION_NAME}] Initial library refresh failed.`, error));

    let updateQueued = false;
    let pendingCardsChanged = false;
    let countTimer;
    const pendingBadgeCards = new Set();
    /* Native "Change Persona Image" emits no event we can hook; its flow always ends with
       a list re-render, which is where we re-mark the image revision. */
    let nativePhotoChangePending = false;
    panel.querySelector('#persona_set_image_button')?.addEventListener('click', () => {
        nativePhotoChangePending = true;
    });
    const avatarObserver = new MutationObserver(mutations => {
        if (avatarBlock.classList.contains('gridView')) avatarBlock.classList.remove('gridView');
        const cardsChanged = mutations.some(mutation =>
            mutation.type === 'childList' && mutation.target === avatarBlock);
        const cardStateChanged = mutations.some(mutation =>
            mutation.type === 'attributes'
            && mutation.target instanceof HTMLElement
            && mutation.target.parentElement === avatarBlock);
        if (!cardsChanged && !cardStateChanged) return;
        pendingCardsChanged ||= cardsChanged;
        /* Native lock buttons only toggle classes on cards and emit nothing. */
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.target instanceof HTMLElement && mutation.target.parentElement === avatarBlock) {
                pendingBadgeCards.add(mutation.target);
            }
        });

        if (!updateQueued) {
            updateQueued = true;
            requestAnimationFrame(() => {
                updateQueued = false;
                const shouldDecorate = pendingCardsChanged;
                pendingCardsChanged = false;
                if (shouldDecorate) {
                    decorateCards(avatarBlock);
                    if (nativePhotoChangePending) {
                        nativePhotoChangePending = false;
                        if (user_avatar) {
                            markPersonaImageChanged(user_avatar);
                            refreshPersonaImages(panel, user_avatar);
                        }
                    }
                }
                if (pendingBadgeCards.size) {
                    pendingBadgeCards.forEach(card => updateCardBadges(card));
                    pendingBadgeCards.clear();
                }
                applyFilter();
                bulkSelection.refresh();
                updateSpotlight();
            });
        }
        if (cardsChanged) {
            window.clearTimeout(countTimer);
            countTimer = window.setTimeout(() => {
                if (panel.classList.contains('mpp-folder-mode')) folderWorkspace.refresh();
                else refreshPersonaCount(personaCounter);
            }, 250);
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
    let refreshTimer;
    const refresh = () => {
        /* Bulk restore emits one native event per persona; coalesce those into one UI refresh. */
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(() => {
            const result = document.querySelector(`${PANEL_SELECTOR}[data-mpp-enhanced='true']`)?.mppRefresh?.();
            result?.catch(error => console.warn(`[${EXTENSION_NAME}] Refresh after a persona event failed.`, error));
            updateGlobalPersonaLauncher();
        }, 0);
    };
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
    eventSource.on(event_types.PERSONA_DELETED, payload => {
        /* Personas deleted outside this extension would otherwise leave orphan tag chips
           in the library filters. */
        const deletedId = avatarIdFrom(payload);
        if (deletedId && personaTags[deletedId] !== undefined) {
            delete personaTags[deletedId];
            savePersonaTags();
        }
        if (deletedId && personaFolderState.assignments[deletedId] !== undefined) {
            delete personaFolderState.assignments[deletedId];
            savePersonaFolders();
        }
        refresh();
    });
    eventSource.on(event_types.PERSONA_RENAMED, payload => {
        markPersonaModified(avatarIdFrom(payload));
        refresh();
    });
    /* Extensions initialize before user_avatar is set; without this the launcher shows
       its '?' fallback until the first persona switch. */
    if (event_types.SETTINGS_LOADED) eventSource.on(event_types.SETTINGS_LOADED, refresh);
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
