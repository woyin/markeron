use serde::{Deserialize, Serialize};
use std::fs;
use std::sync::{Mutex, MutexGuard};
use tauri::{AppHandle, Manager};
use tracing::{info, warn};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Shortcuts {
    #[serde(rename = "toggleDrawing")]
    pub toggle_drawing: String,
    #[serde(rename = "clearDrawing")]
    pub clear_drawing: String,
    #[serde(default = "default_toggle_penetration", rename = "togglePenetration")]
    pub toggle_penetration: String,
}

fn default_toggle_penetration() -> String {
    #[cfg(target_os = "macos")]
    {
        "Command+Shift+X".into()
    }
    #[cfg(not(target_os = "macos"))]
    {
        "Ctrl+Shift+X".into()
    }
}

fn default_angle_snap_step() -> u16 {
    15
}

fn default_auto_start() -> bool {
    true
}

fn default_keyboard_copy_enabled() -> bool {
    #[cfg(target_os = "macos")]
    {
        false
    }
    #[cfg(not(target_os = "macos"))]
    {
        true
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
pub enum DragMode {
    #[serde(rename = "off")]
    #[default]
    Off,
    #[serde(rename = "hover")]
    Hover,
    #[serde(rename = "modifier")]
    Modifier,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
pub enum ToolbarVisibility {
    #[serde(rename = "space")]
    #[default]
    Space,
    #[serde(rename = "always")]
    Always,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
pub enum EraserMode {
    #[serde(rename = "stroke")]
    #[default]
    Stroke,
    #[serde(rename = "object")]
    Object,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
pub enum DefaultEntryMode {
    #[serde(rename = "screen")]
    #[default]
    Screen,
    #[serde(rename = "whiteboard")]
    Whiteboard,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneralConfig {
    #[serde(default, rename = "dragMode")]
    pub drag_mode: Option<DragMode>,
    #[serde(default, rename = "enableDragging", skip_serializing)]
    pub enable_dragging: bool,
    #[serde(default, rename = "dragRequiresModifier", skip_serializing)]
    pub drag_requires_modifier: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub locale: Option<String>,
    #[serde(default, rename = "preserveDrawings")]
    pub preserve_drawings: bool,
    #[serde(default, rename = "whiteboardPreserveDrawings")]
    pub whiteboard_preserve_drawings: bool,
    #[serde(default = "default_angle_snap_step", rename = "angleSnapStep")]
    pub angle_snap_step: u16,
    #[serde(default, rename = "toolbarVisibility")]
    pub toolbar_visibility: ToolbarVisibility,
    #[serde(default, rename = "defaultEntryMode")]
    pub default_entry_mode: DefaultEntryMode,
    #[serde(default, rename = "eraserMode")]
    pub eraser_mode: EraserMode,
    #[serde(default = "default_auto_start", rename = "autoStart")]
    pub auto_start: bool,
    #[serde(
        default = "default_keyboard_copy_enabled",
        rename = "keyboardCopyEnabled"
    )]
    pub keyboard_copy_enabled: bool,
}

impl Default for GeneralConfig {
    fn default() -> Self {
        Self {
            drag_mode: None,
            enable_dragging: false,
            drag_requires_modifier: false,
            locale: None,
            preserve_drawings: false,
            whiteboard_preserve_drawings: true,
            angle_snap_step: default_angle_snap_step(),
            toolbar_visibility: ToolbarVisibility::Space,
            default_entry_mode: DefaultEntryMode::Screen,
            eraser_mode: EraserMode::Stroke,
            auto_start: default_auto_start(),
            keyboard_copy_enabled: default_keyboard_copy_enabled(),
        }
    }
}

impl GeneralConfig {
    pub fn drag_mode(&self) -> DragMode {
        self.drag_mode.unwrap_or(DragMode::Off)
    }

    pub fn normalized(mut self) -> Self {
        if !matches!(self.angle_snap_step, 15 | 30 | 45) {
            self.angle_snap_step = default_angle_snap_step();
        }
        self.drag_mode = Some(match self.drag_mode {
            Some(m) if matches!(m, DragMode::Off | DragMode::Hover | DragMode::Modifier) => m,
            Some(_) => DragMode::Off,
            None => {
                if self.drag_requires_modifier {
                    DragMode::Modifier
                } else if self.enable_dragging {
                    DragMode::Hover
                } else {
                    DragMode::Off
                }
            }
        });
        self.enable_dragging = false;
        self.drag_requires_modifier = false;
        if !matches!(
            self.toolbar_visibility,
            ToolbarVisibility::Space | ToolbarVisibility::Always
        ) {
            self.toolbar_visibility = ToolbarVisibility::Space;
        }
        if !matches!(
            self.default_entry_mode,
            DefaultEntryMode::Screen | DefaultEntryMode::Whiteboard
        ) {
            self.default_entry_mode = DefaultEntryMode::Screen;
        }
        if !matches!(self.eraser_mode, EraserMode::Stroke | EraserMode::Object) {
            self.eraser_mode = EraserMode::Stroke;
        }
        self
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub shortcuts: Shortcuts,
    #[serde(default)]
    pub general: GeneralConfig,
}

pub fn default_shortcuts() -> Shortcuts {
    #[cfg(target_os = "macos")]
    {
        Shortcuts {
            toggle_drawing: "Command+Shift+D".into(),
            clear_drawing: "Command+Shift+C".into(),
            toggle_penetration: "Command+Shift+X".into(),
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        Shortcuts {
            toggle_drawing: "Ctrl+Shift+D".into(),
            clear_drawing: "Ctrl+Shift+C".into(),
            toggle_penetration: "Ctrl+Shift+X".into(),
        }
    }
}

impl Shortcuts {
    /// Migrate legacy default penetration shortcut (Shift+P → Shift+X).
    pub fn normalized(mut self) -> Self {
        #[cfg(target_os = "macos")]
        {
            if self.toggle_penetration == "Command+Shift+P" {
                self.toggle_penetration = "Command+Shift+X".into();
            }
        }
        #[cfg(not(target_os = "macos"))]
        {
            if self.toggle_penetration == "Ctrl+Shift+P" {
                self.toggle_penetration = "Ctrl+Shift+X".into();
            }
        }
        self
    }
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            shortcuts: default_shortcuts(),
            general: GeneralConfig::default().normalized(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveResult {
    pub ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub failed: Option<Vec<String>>,
}

pub struct AppState {
    pub config: Mutex<AppConfig>,
    pub overlay_mode: Mutex<crate::overlay::OverlayMode>,
    /// Briefly suppress auto-penetration after activation (toolbar window steals focus).
    pub suppress_penetration_until: Mutex<Option<std::time::Instant>>,
    /// Frontend whiteboard mode — penetration is screen-overlay only.
    pub whiteboard_mode: Mutex<bool>,
    /// Cross-window diagnostic ring buffer (overlay + settings are separate webviews).
    pub diagnostic_events: Mutex<Vec<crate::diagnostics::DiagnosticEvent>>,
}

/// Lock a mutex with poison recovery — if a thread panicked while holding
/// the lock, we recover the inner value instead of propagating the panic.
pub fn lock_or_recover<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex.lock().unwrap_or_else(|poisoned| {
        warn!("Mutex was poisoned, recovering");
        poisoned.into_inner()
    })
}

pub fn config_path(app: &AppHandle) -> std::path::PathBuf {
    let dir = app
        .path()
        .app_config_dir()
        .expect("failed to get config dir");
    fs::create_dir_all(&dir).ok();
    dir.join("config.json")
}

pub fn load_config(app: &AppHandle) -> AppConfig {
    let path = config_path(app);
    match fs::read_to_string(&path) {
        Ok(raw) => match serde_json::from_str::<AppConfig>(&raw) {
            Ok(mut cfg) => {
                cfg.shortcuts = cfg.shortcuts.normalized();
                cfg.general = cfg.general.normalized();
                info!("Loaded config from {}", path.display());
                cfg
            }
            Err(e) => {
                warn!(
                    "Config file corrupted ({}), using defaults: {}",
                    path.display(),
                    e
                );
                AppConfig::default()
            }
        },
        Err(_) => {
            info!("No config file found, using defaults");
            AppConfig::default()
        }
    }
}

pub fn sync_autostart(app: &AppHandle, enabled: bool) {
    use tauri_plugin_autostart::ManagerExt;

    let manager = app.autolaunch();
    let current = manager.is_enabled().unwrap_or(false);
    if current == enabled {
        return;
    }
    if enabled {
        if let Err(e) = manager.enable() {
            warn!("Failed to enable autostart: {}", e);
        }
    } else if let Err(e) = manager.disable() {
        warn!("Failed to disable autostart: {}", e);
    }
}

pub fn save_config(app: &AppHandle, config: &AppConfig) {
    let path = config_path(app);
    match serde_json::to_string_pretty(config) {
        Ok(json) => {
            if let Err(e) = fs::write(&path, json) {
                warn!("Failed to write config to {}: {}", path.display(), e);
            }
        }
        Err(e) => {
            warn!("Failed to serialize config: {}", e);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_config_serializes_to_valid_json() {
        let config = AppConfig::default();
        let json = serde_json::to_string_pretty(&config).unwrap();
        assert!(json.contains("toggleDrawing"));
        assert!(json.contains("clearDrawing"));
    }

    #[test]
    fn default_config_roundtrip() {
        let config = AppConfig::default();
        let json = serde_json::to_string(&config).unwrap();
        let parsed: AppConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(
            parsed.shortcuts.toggle_drawing,
            config.shortcuts.toggle_drawing
        );
        assert_eq!(
            parsed.shortcuts.clear_drawing,
            config.shortcuts.clear_drawing
        );
        assert_eq!(parsed.general.drag_mode(), config.general.drag_mode());
        assert_eq!(
            parsed.general.preserve_drawings,
            config.general.preserve_drawings
        );
        assert_eq!(
            parsed.general.whiteboard_preserve_drawings,
            config.general.whiteboard_preserve_drawings
        );
        assert_eq!(
            parsed.general.angle_snap_step,
            config.general.angle_snap_step
        );
    }

    #[test]
    fn config_deserializes_drag_mode() {
        let json = r#"{
            "shortcuts": {
                "toggleDrawing": "Ctrl+Alt+X",
                "clearDrawing": "Ctrl+Alt+C"
            },
            "general": {
                "dragMode": "modifier",
                "locale": "zh-CN",
                "preserveDrawings": true,
                "whiteboardPreserveDrawings": false,
                "angleSnapStep": 30
            }
        }"#;
        let config: AppConfig = serde_json::from_str(json).unwrap();
        assert_eq!(config.general.drag_mode(), DragMode::Modifier);
        assert_eq!(config.general.locale, Some("zh-CN".to_string()));
        assert!(config.general.preserve_drawings);
        assert!(!config.general.whiteboard_preserve_drawings);
        assert_eq!(config.general.angle_snap_step, 30);
    }

    #[test]
    fn normalized_migrates_legacy_drag_settings() {
        let general = GeneralConfig {
            drag_mode: None,
            enable_dragging: true,
            drag_requires_modifier: true,
            ..GeneralConfig::default()
        };
        let normalized = general.normalized();
        assert_eq!(normalized.drag_mode(), DragMode::Modifier);
        assert!(!normalized.enable_dragging);
        assert!(!normalized.drag_requires_modifier);
    }

    #[test]
    fn normalized_migrates_legacy_hover_drag() {
        let general = GeneralConfig {
            drag_mode: None,
            enable_dragging: true,
            drag_requires_modifier: false,
            ..GeneralConfig::default()
        };
        assert_eq!(general.normalized().drag_mode(), DragMode::Hover);
    }

    #[test]
    fn normalized_keeps_explicit_off_when_legacy_enable_dragging_present() {
        let general = GeneralConfig {
            drag_mode: Some(DragMode::Off),
            enable_dragging: true,
            drag_requires_modifier: false,
            ..GeneralConfig::default()
        };
        assert_eq!(general.normalized().drag_mode(), DragMode::Off);
    }

    #[test]
    fn config_deserializes_explicit_off_with_legacy_fields() {
        let json = r#"{
            "shortcuts": {
                "toggleDrawing": "Ctrl+Shift+D",
                "clearDrawing": "Ctrl+Shift+C"
            },
            "general": {
                "dragMode": "off",
                "enableDragging": true
            }
        }"#;
        let config: AppConfig = serde_json::from_str(json).unwrap();
        assert_eq!(config.general.normalized().drag_mode(), DragMode::Off);
    }

    #[test]
    fn config_deserializes_with_missing_general() {
        let json = r#"{
            "shortcuts": {
                "toggleDrawing": "Ctrl+Shift+D",
                "clearDrawing": "Ctrl+Shift+C"
            }
        }"#;
        let config: AppConfig = serde_json::from_str(json).unwrap();
        assert_eq!(config.general.drag_mode(), DragMode::Off);
        assert_eq!(config.general.locale, None);
        assert!(!config.general.preserve_drawings);
        assert_eq!(config.general.whiteboard_preserve_drawings, true);
        assert_eq!(config.general.angle_snap_step, 15);
    }

    #[test]
    fn config_deserializes_legacy_enable_dragging() {
        let json = r#"{
            "shortcuts": {
                "toggleDrawing": "Ctrl+Shift+D",
                "clearDrawing": "Ctrl+Shift+C"
            },
            "general": {
                "enableDragging": true
            }
        }"#;
        let config: AppConfig = serde_json::from_str(json).unwrap();
        assert_eq!(config.general.normalized().drag_mode(), DragMode::Hover);
    }

    #[test]
    fn config_deserializes_with_missing_angle_snap_step() {
        let json = r#"{
            "shortcuts": {
                "toggleDrawing": "Ctrl+Shift+D",
                "clearDrawing": "Ctrl+Shift+C"
            },
            "general": {
                "enableDragging": true,
                "locale": "en",
                "preserveDrawings": true
            }
        }"#;
        let config: AppConfig = serde_json::from_str(json).unwrap();
        assert_eq!(
            config.general.clone().normalized().drag_mode(),
            DragMode::Hover
        );
        assert_eq!(config.general.locale, Some("en".to_string()));
        assert!(config.general.preserve_drawings);
        assert_eq!(config.general.angle_snap_step, 15);
    }

    #[test]
    fn config_deserializes_with_partial_general() {
        let json = r#"{
            "shortcuts": {
                "toggleDrawing": "Ctrl+Shift+D",
                "clearDrawing": "Ctrl+Shift+C"
            },
            "general": {
                "dragMode": "off"
            }
        }"#;
        let config: AppConfig = serde_json::from_str(json).unwrap();
        assert_eq!(config.general.drag_mode(), DragMode::Off);
        assert_eq!(config.general.locale, None);
        assert!(!config.general.preserve_drawings);
        assert_eq!(config.general.angle_snap_step, 15);
    }

    #[test]
    fn config_deserializes_toolbar_settings() {
        let json = r#"{
            "shortcuts": {
                "toggleDrawing": "Ctrl+Shift+D",
                "clearDrawing": "Ctrl+Shift+C"
            },
            "general": {
                "toolbarVisibility": "always"
            }
        }"#;
        let config: AppConfig = serde_json::from_str(json).unwrap();
        assert_eq!(config.general.toolbar_visibility, ToolbarVisibility::Always);
    }

    #[test]
    fn general_config_defaults_toolbar_visibility() {
        let general = GeneralConfig::default();
        assert_eq!(general.toolbar_visibility, ToolbarVisibility::Space);
    }

    #[test]
    fn general_config_defaults_auto_start() {
        let general = GeneralConfig::default();
        assert!(general.auto_start);
    }

    #[test]
    fn general_config_defaults_default_entry_mode() {
        let general = GeneralConfig::default();
        assert_eq!(general.default_entry_mode, DefaultEntryMode::Screen);
    }

    #[test]
    fn config_deserializes_eraser_mode() {
        let json = r#"{
            "shortcuts": {
                "toggleDrawing": "Ctrl+Shift+D",
                "clearDrawing": "Ctrl+Shift+C"
            },
            "general": {
                "eraserMode": "object"
            }
        }"#;
        let config: AppConfig = serde_json::from_str(json).unwrap();
        assert_eq!(config.general.eraser_mode, EraserMode::Object);
    }

    #[test]
    fn general_config_defaults_eraser_mode() {
        let general = GeneralConfig::default();
        assert_eq!(general.eraser_mode, EraserMode::Stroke);
    }

    #[test]
    fn config_deserializes_default_entry_mode() {
        let json = r#"{
            "shortcuts": {
                "toggleDrawing": "Ctrl+Shift+D",
                "clearDrawing": "Ctrl+Shift+C"
            },
            "general": {
                "defaultEntryMode": "whiteboard"
            }
        }"#;
        let config: AppConfig = serde_json::from_str(json).unwrap();
        assert_eq!(
            config.general.default_entry_mode,
            DefaultEntryMode::Whiteboard
        );
    }

    #[test]
    fn save_result_serializes_correctly() {
        let success = SaveResult {
            ok: true,
            failed: None,
        };
        let json = serde_json::to_string(&success).unwrap();
        assert_eq!(json, r#"{"ok":true}"#);

        let failure = SaveResult {
            ok: false,
            failed: Some(vec!["Toggle: Bad+Key".to_string()]),
        };
        let json = serde_json::to_string(&failure).unwrap();
        assert!(json.contains("\"ok\":false"));
        assert!(json.contains("Bad+Key"));
    }

    #[test]
    fn lock_or_recover_normal_mutex() {
        let mutex = Mutex::new(42);
        let guard = lock_or_recover(&mutex);
        assert_eq!(*guard, 42);
    }

    #[test]
    fn lock_or_recover_poisoned_mutex() {
        let mutex = std::sync::Arc::new(Mutex::new(99));
        let m2 = mutex.clone();
        let _ = std::thread::spawn(move || {
            let _guard = m2.lock().unwrap();
            panic!("intentional panic to poison mutex");
        })
        .join();

        // Mutex is now poisoned
        assert!(mutex.lock().is_err());
        // lock_or_recover should still work
        let guard = lock_or_recover(&mutex);
        assert_eq!(*guard, 99);
    }

    #[test]
    fn normalized_migrates_legacy_toggle_penetration_shortcut() {
        #[cfg(target_os = "macos")]
        {
            let shortcuts = Shortcuts {
                toggle_drawing: "Command+Shift+D".into(),
                clear_drawing: "Command+Shift+C".into(),
                toggle_penetration: "Command+Shift+P".into(),
            };
            assert_eq!(shortcuts.normalized().toggle_penetration, "Command+Shift+X");
        }
        #[cfg(not(target_os = "macos"))]
        {
            let shortcuts = Shortcuts {
                toggle_drawing: "Ctrl+Shift+D".into(),
                clear_drawing: "Ctrl+Shift+C".into(),
                toggle_penetration: "Ctrl+Shift+P".into(),
            };
            assert_eq!(shortcuts.normalized().toggle_penetration, "Ctrl+Shift+X");
        }
    }

    #[test]
    fn default_shortcuts_are_valid() {
        let shortcuts = default_shortcuts();
        assert!(!shortcuts.toggle_drawing.is_empty());
        assert!(!shortcuts.clear_drawing.is_empty());
        assert!(!shortcuts.toggle_penetration.is_empty());
        assert!(shortcuts.toggle_drawing.contains('+'));
        assert!(shortcuts.clear_drawing.contains('+'));
        assert!(shortcuts.toggle_penetration.contains('+'));
    }

    #[test]
    fn general_config_default_values() {
        let general = GeneralConfig::default();
        assert_eq!(general.drag_mode(), DragMode::Off);
        assert_eq!(general.locale, None);
        assert!(!general.preserve_drawings);
    }

    #[test]
    fn config_skips_none_locale_in_serialization() {
        let config = AppConfig::default();
        let json = serde_json::to_string(&config).unwrap();
        assert!(!json.contains("locale"));
    }

    #[test]
    fn config_includes_locale_when_set() {
        let mut config = AppConfig::default();
        config.general.locale = Some("en".to_string());
        let json = serde_json::to_string(&config).unwrap();
        assert!(json.contains("\"locale\":\"en\""));
    }
}
