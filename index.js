import { getUserAvatars, initPersona, isPersonaLocked, setUserAvatar, togglePersonaLock } from '../../../personas.js';
import { power_user } from '../../../power-user.js';
import { world_names } from '../../../world-info.js';
import { POPUP_TYPE, Popup } from '../../../popup.js';

const EXTENSION_NAME = 'MistraelSL Persona Panel';
const PANEL_SELECTOR = '#PersonaManagement';
const STORAGE_KEY = 'mistraelsl-persona-panel:appearance';
const GLOBAL_SECTION_KEY = 'mistraelsl-persona-panel:global-expanded';
const EDITOR_SECTION_KEY = 'mistraelsl-persona-panel:editor-expanded-v3';
const DENSITY_KEY = 'MistraelSL_PersonaPanel_density';
const MOBILE_COLUMNS_KEY = 'MistraelSL_PersonaPanel_mobileColumns';
const FAVORITES_KEY = 'MistraelSL_PersonaPanel_favorites';
const WINDOW_MODE_KEY = 'MistraelSL_PersonaPanel_windowMode';
const PORTRAIT_CROP_KEY = 'MistraelSL_PersonaPanel_portraitCrop_v2';
const PERSONA_NOTES_KEY = 'MistraelSL_PersonaPanel_privateNotes_v1';

const DEFAULT_APPEARANCE = Object.freeze({
    theme: 'native',
    customColor: '#a78bfa',
    glassOpacity: 86,
    fontScale: 100,
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
        themeHint: 'SillyTavern follows the app theme. Other schemes are independent.',
        native: 'SillyTavern',
        imperial: 'Imperial',
        amethyst: 'Amethyst',
        nord: 'Nord',
        custom: 'Custom',
        customColor: 'Custom accent color',
        glass: 'Glass visibility',
        font: 'Text size',
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
    },
    ru: {
        title: 'Панель персон',
        library: 'Библиотека персон',
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
        themeHint: 'SillyTavern наследует тему приложения. Остальные схемы независимы.',
        native: 'SillyTavern',
        imperial: 'Имперская',
        amethyst: 'Аметист',
        nord: 'Нордическая',
        custom: 'Свой цвет',
        customColor: 'Свой цвет акцента',
        glass: 'Видимость стекла',
        font: 'Размер текста',
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

function applyAppearance(panel, settings) {
    const theme = getSelectedTheme(settings);
    const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const fontAdjustment = rootFontSize * ((settings.fontScale - 100) / 100);

    panel.style.setProperty('--mpp-accent', theme.accent);
    panel.style.setProperty('--mpp-tint', theme.tint);
    panel.style.setProperty('--mpp-text', theme.text);
    panel.style.setProperty('--mpp-muted', theme.muted);
    panel.style.setProperty('--mpp-border', theme.border);
    panel.style.setProperty('--mpp-positive', theme.positive);
    panel.style.setProperty('--mpp-warning', theme.warning);
    panel.style.setProperty('--mpp-danger', theme.danger);
    panel.style.setProperty('--mpp-glass-opacity', `${settings.glassOpacity}%`);
    panel.style.setProperty('--mpp-glass-strong-opacity', `${Math.min(100, settings.glassOpacity + 9)}%`);
    panel.style.setProperty('--mpp-font-adjust', `${fontAdjustment.toFixed(2)}px`);
    panel.dataset.mppTheme = settings.theme;
    if (settings.theme === 'native') delete panel.dataset.mppIndependent;
    else panel.dataset.mppIndependent = 'true';
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
    const resetButton = createElement('button', 'mpp-button mpp-reset');
    resetButton.type = 'button';
    resetButton.append(createElement('i', 'fa-solid fa-arrow-rotate-left'), createElement('span', '', t('reset')));
    resetButton.addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEY);
        const defaults = getAppearance();
        Object.assign(settings, defaults);
        applyAppearance(panel, settings);
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

    settingsPanel.append(header, themeCopy, themeGrid, colorRow, glassRange, fontRange, resetButton);
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
    const desktopQuery = window.matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)');
    const update = () => {
        dimmer.classList.toggle('is-visible', desktopQuery.matches && panel.classList.contains('openDrawer'));
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
    const hint = createElement('span', '', t('noSelection'));
    copy.append(kicker, name, hint);

    const visualCropButton = createIconButton('fa-crop-simple', t('visualCropPortrait'), 'mpp-spotlight-visual-crop-button');
    const slidersButton = createIconButton('fa-sliders', t('fineTunePortrait'), 'mpp-spotlight-crop-button');
    slidersButton.setAttribute('aria-expanded', 'false');
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
    openEditor.addEventListener('click', () => {
        if (panel.classList.contains('mpp-editor-collapsed')) editorButton.click();
        panel.querySelector('.mpp-editor-column')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    spotlight.append(portrait, copy, visualCropButton, slidersButton, openEditor, cropPanel);

    let currentAvatarId = '';
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
            cropModalBackdrop.style.setProperty(property, panelStyle.getPropertyValue(property));
        });
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

    const update = () => {
        const selected = panel.querySelector('#user_avatar_block > .avatar-container.selected')
            || panel.querySelector('#user_avatar_block > .avatar-container');
        const selectedImage = selected?.querySelector('.avatar img');
        const selectedName = panel.querySelector('#your_name')?.textContent?.trim()
            || selected?.querySelector('.ch_name')?.textContent?.trim();
        currentAvatarId = selected ? getCardAvatarId(selected) : '';
        const nextSource = selectedImage?.src || '';
        if (image.src !== nextSource) image.src = nextSource;
        portrait.hidden = !selectedImage?.src;
        visualCropButton.hidden = !selectedImage?.src || !currentAvatarId;
        slidersButton.hidden = !selectedImage?.src || !currentAvatarId;
        applyCrop(getPortraitCrop(currentAvatarId));
        name.textContent = selectedName || t('noSelection');
        hint.textContent = selected?.classList.contains('default_persona')
            ? t('default')
            : selected?.classList.contains('locked_to_chat') || selected?.classList.contains('locked_to_character')
                ? t('linked')
                : t('active');
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
    ];
    let activeFilter = 'all';

    const apply = () => {
        const predicate = definitions.find(([id]) => id === activeFilter)?.[2] || (() => true);
        avatarBlock.querySelectorAll(':scope > .avatar-container').forEach(card => {
            card.classList.toggle('mpp-filter-hidden', !predicate(card));
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
            bar.querySelectorAll('.mpp-filter').forEach(item => {
                const active = item.dataset.mppFilter === activeFilter;
                item.classList.toggle('is-active', active);
                item.setAttribute('aria-pressed', String(active));
            });
            apply();
        });
        button.setAttribute('aria-pressed', String(id === activeFilter));
        bar.appendChild(button);
    });

    return { bar, apply };
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
        mobile.querySelectorAll('button').forEach(button => {
            button.classList.toggle('is-active', Number(button.textContent) === state.mobileColumns);
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
        button.addEventListener('click', () => {
            state.mobileColumns = columns;
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

function exportPersonaJson(avatarId) {
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

function createCardAction(icon, label, className, handler) {
    const button = createElement('button', `mpp-card-action ${className}`);
    button.type = 'button';
    button.title = label;
    button.setAttribute('aria-label', label);
    button.appendChild(createElement('i', `fa-solid ${icon}`));
    button.addEventListener('click', async event => {
        event.preventDefault();
        event.stopPropagation();
        await handler(button);
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
        });
        const edit = createCardAction('fa-pen-to-square', t('editPersona'), 'mpp-action-edit', async () => {
            const panel = card.closest(PANEL_SELECTOR);
            await setUserAvatar(avatarId, { toastPersonaNameChange: false });
            if (typeof panel?.mppOpenPersonaEditor === 'function') {
                panel.mppOpenPersonaEditor(avatarId, card.querySelector('.avatar img')?.src || '');
                return;
            }
            if (panel?.classList.contains('mpp-editor-collapsed')) panel.querySelector('.mpp-editor-button')?.click();
            panel?.querySelector('.mpp-editor-column')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        const remove = createCardAction('fa-trash', t('deletePersona'), 'mpp-action-delete', async () => {
            const panel = card.closest(PANEL_SELECTOR);
            await setUserAvatar(avatarId, { toastPersonaNameChange: false });
            panel?.querySelector('#persona_delete_button')?.click();
        });
        const exportButton = createCardAction('fa-file-export', t('exportPersona'), 'mpp-action-export', () => {
            exportPersonaJson(avatarId);
        });
        actions.append(favorite, edit, remove, exportButton);
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
        badge.append(createElement('i', `fa-solid ${iconClass}`), createElement('span', '', t(labelKey)));
        badges.appendChild(badge);
    });
    badges.hidden = badges.childElementCount === 0;
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
    identityCopy.append(nameDisplay, nameInput);
    const renameButton = createIconButton('fa-pencil', t('creatorRename'), 'mpp-creator-rename');
    identity.append(identityCopy, renameButton);

    const descriptionField = createElement('section', 'mpp-creator-field mpp-creator-description');
    const descriptionHead = createElement('header', 'mpp-creator-field-head');
    descriptionHead.appendChild(createElement('strong', '', t('creatorDescription')));
    const expandDescription = createIconButton('fa-expand', t('creatorExpandDescription'), 'mpp-creator-description-expand');
    descriptionHead.appendChild(expandDescription);
    const description = createElement('textarea', 'text_pole mpp-creator-description-input');
    description.rows = 12;
    descriptionField.append(descriptionHead, description);

    const toolStage = createElement('section', 'mpp-creator-tool-stage');
    toolStage.hidden = true;

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
    lorebookPanel.append(lorebook, lorebookChoices);
    toolStage.append(positionPanel, connectionsPanel, lorebookPanel);
    left.appendChild(toolStage);

    const notesField = createElement('label', 'mpp-creator-field mpp-creator-notes');
    const notesTitle = createElement('strong', '', t('creatorNotes'));
    const notesHint = createElement('small', '', t('creatorNotesHint'));
    const notes = createElement('textarea', 'text_pole');
    notes.rows = 5;
    notesField.append(notesTitle, notesHint, notes);
    right.append(identity, descriptionField, notesField);
    body.append(left, right);
    workspace.append(top, body);

    const state = {
        activeTool: '',
        avatarId: '',
        busy: false,
        file: null,
        objectUrl: '',
        cropData: null,
        previousWindowMode: 'standard',
        locks: new Set(),
    };
    let descriptionTimer;

    const context = () => globalThis.SillyTavern?.getContext?.();
    const notify = (message, type = 'error') => {
        const toast = globalThis.toastr?.[type];
        if (typeof toast === 'function') toast(message);
        else console[type === 'error' ? 'error' : 'info'](`[${EXTENSION_NAME}] ${message}`);
    };
    const saveSettings = () => context()?.saveSettingsDebounced?.();
    const descriptor = () => state.avatarId ? power_user.persona_descriptions?.[state.avatarId] : null;
    const updateDescriptor = () => {
        const value = descriptor();
        if (!value) return;
        value.description = description.value;
        value.position = Number(position.value);
        value.depth = Number(depth.value) || 0;
        value.role = Number(role.value);
        value.lorebook = lorebook.value;
        saveSettings();
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
        nameInput.value = nameDisplay.textContent === t('creatorName') ? '' : nameDisplay.textContent;
        requestAnimationFrame(() => nameInput.focus());
    };
    const finishNameEdit = () => {
        const nextName = nameInput.value.trim();
        nameInput.hidden = true;
        nameDisplay.hidden = false;
        nameDisplay.textContent = nextName || t('creatorName');
        if (state.avatarId && nextName) {
            power_user.personas[state.avatarId] = nextName;
            context()?.setUserName?.(nextName);
            saveSettings();
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
    const applyLocks = async () => {
        for (const type of connectionButtons.keys()) {
            const desired = state.locks.has(type);
            if (Boolean(isPersonaLocked(type)) !== desired) await togglePersonaLock(type);
        }
    };
    const reset = () => {
        state.activeTool = '';
        state.avatarId = '';
        state.busy = false;
        state.file = null;
        state.cropData = null;
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
        description.value = '';
        position.value = '0';
        depth.value = '2';
        role.value = '0';
        notes.value = '';
        lorebook.value = '';
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
    };
    const showWorkspace = () => {
        state.previousWindowMode = panel.dataset.mppWindowMode || 'standard';
        panel.dataset.mppWindowMode = 'tall';
        panel.classList.add('mpp-creating');
        workspace.hidden = false;
        panel.querySelector('.mpp-appearance')?.setAttribute('hidden', '');
    };
    const open = () => {
        reset();
        showWorkspace();
    };
    const openExisting = (avatarId, imageSource = '') => {
        const existingName = power_user.personas?.[avatarId];
        if (!avatarId || existingName === undefined) return;
        reset();
        state.avatarId = avatarId;
        nameDisplay.textContent = existingName || t('creatorName');
        const value = power_user.persona_descriptions?.[avatarId] || {};
        description.value = value.description || '';
        position.value = String(value.position ?? 0);
        depth.value = String(value.depth ?? 2);
        role.value = String(value.role ?? 0);
        lorebook.value = String(value.lorebook || '');
        fillLorebooks();
        notes.value = readNotes(avatarId);
        connectionButtons.forEach((button, type) => {
            const active = Boolean(isPersonaLocked(type));
            if (active) state.locks.add(type);
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', String(active));
        });
        if (imageSource) {
            photoImage.src = imageSource;
            photoImage.hidden = false;
            photoEmpty.hidden = true;
        }
        saveButton.querySelector('span').textContent = t('creatorSaveChanges');
        renderPositionDetails();
        showWorkspace();
    };
    const close = () => {
        if (state.busy) return;
        workspace.hidden = true;
        panel.classList.remove('mpp-creating');
        panel.dataset.mppWindowMode = state.previousWindowMode;
        reset();
    };

    createButton.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        open();
    }, { capture: true });
    panel.mppOpenPersonaEditor = openExisting;
    backButton.addEventListener('click', close);
    photoButton.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', async () => {
        const file = photoInput.files?.[0];
        photoInput.value = '';
        if (!file) return;
        try {
            if (!(await preparePortrait(file))) return;
            if (state.avatarId) {
                await uploadPortrait(state.avatarId, state.file, state.cropData);
                await getUserAvatars(true, state.avatarId);
                await setUserAvatar(state.avatarId);
                state.file = null;
                state.cropData = null;
                updateSpotlight();
            }
        } catch (error) {
            console.error(`[${EXTENSION_NAME}] Could not prepare persona portrait.`, error);
            notify(t('creatorError'));
        }
    });
    renameButton.addEventListener('click', () => nameInput.hidden ? startNameEdit() : finishNameEdit());
    nameInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            finishNameEdit();
        }
        if (event.key === 'Escape') {
            nameInput.hidden = true;
            nameDisplay.hidden = false;
        }
    });
    nameInput.addEventListener('blur', finishNameEdit);
    toolButtons.forEach((button, key) => button.addEventListener('click', () => {
        state.activeTool = state.activeTool === key ? '' : key;
        if (key === 'lorebook') fillLorebooks();
        renderActiveTool();
    }));
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
        window.clearTimeout(descriptionTimer);
        descriptionTimer = window.setTimeout(updateDescriptor, 250);
    });
    notes.addEventListener('input', writeNotes);
    connectionButtons.forEach((button, type) => button.addEventListener('click', async () => {
        const active = !state.locks.has(type);
        if (active) state.locks.add(type);
        else state.locks.delete(type);
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
        if (state.avatarId) {
            try { await applyLocks(); }
            catch (error) { console.warn(`[${EXTENSION_NAME}] Could not update persona connection.`, error); }
        }
    }));
    saveButton.addEventListener('click', async () => {
        if (state.busy) return;
        if (!nameInput.hidden) finishNameEdit();
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
            } else {
                power_user.personas[avatarId] = name;
                updateDescriptor();
            }
            saveSettings();
            await getUserAvatars(true, avatarId);
            await setUserAvatar(avatarId);
            await applyLocks();
            writeNotes();
            state.file = null;
            state.cropData = null;
            workspace.classList.add('is-saved');
            saveButton.querySelector('span').textContent = t(isNew ? 'creatorSaved' : 'creatorChangesSaved');
            saveButton.querySelector('i').className = 'fa-solid fa-circle-check';
            await refreshPersonaCount(personaCounter);
            updateSpotlight();
            notify(t(isNew ? 'creatorSaved' : 'creatorChangesSaved'), 'success');
        } catch (error) {
            console.error(`[${EXTENSION_NAME}] Could not create persona.`, error);
            if (isNew && state.avatarId) {
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
    });

    reset();
    return workspace;
}

function enhancePanel(panel) {
    if (!(panel instanceof HTMLElement) || panel.dataset.mppEnhanced === 'true') return;
    panel.dataset.mppEnhanced = 'true';
    panel.classList.add('mpp-panel');

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
    const desktopLibraryLayout = window.matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)').matches;
    libraryTitle.append(document.createTextNode(': '), personaCounter);
    libraryCopy.appendChild(libraryTitle);
    const densityControls = createDensityControls(avatarBlock);
    libraryHeader.append(libraryCopy, densityControls);
    leftColumn.prepend(libraryHeader);
    const { bar: filters, apply: applyFilter } = createFilterBar(avatarBlock);
    const createButton = nativeToolbar?.querySelector(':scope > .menu_button:not(#persona_grid_toggle), :scope > button:not(#persona_grid_toggle)');
    const searchInput = nativeToolbar?.querySelector('input[type="search"], input[type="text"]');
    createButton?.classList.add('mpp-create-persona');
    if (searchInput) searchInput.placeholder = t('searchByPersonaName');
    if (desktopLibraryLayout && nativeToolbar) {
        if (createButton) {
            filters.appendChild(createButton);
        }
    }
    nativeToolbar?.after(filters);

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
    decorateCards(avatarBlock);
    applyFilter();
    updateSpotlight();
    refreshPersonaCount(personaCounter);

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

function scan(node = document) {
    if (node instanceof Element && node.matches(PANEL_SELECTOR)) enhancePanel(node);
    node.querySelectorAll?.(PANEL_SELECTOR).forEach(enhancePanel);
}

function init() {
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
