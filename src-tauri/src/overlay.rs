use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tracing::{info, warn};

use crate::config::{lock_or_recover, AppState, ToolbarVisibility};
use crate::monitor;
use std::time::{Duration, Instant};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OverlayMode {
    Hidden,
    Drawing,
    Penetration,
}

impl OverlayMode {
    pub fn as_str(self) -> &'static str {
        match self {
            OverlayMode::Hidden => "hidden",
            OverlayMode::Drawing => "drawing",
            OverlayMode::Penetration => "penetration",
        }
    }
}

pub fn current_mode(state: &AppState) -> OverlayMode {
    *lock_or_recover(&state.overlay_mode)
}

pub fn set_mode(state: &AppState, mode: OverlayMode) {
    *lock_or_recover(&state.overlay_mode) = mode;
}

fn begin_activation_guard(state: &AppState) {
    *lock_or_recover(&state.suppress_penetration_until) =
        Some(Instant::now() + Duration::from_millis(600));
}

fn should_suppress_penetration(state: &AppState) -> bool {
    lock_or_recover(&state.suppress_penetration_until)
        .map(|deadline| Instant::now() < deadline)
        .unwrap_or(false)
}

pub fn suppress_penetration_for(state: &AppState, duration_ms: u64) {
    *lock_or_recover(&state.suppress_penetration_until) =
        Some(Instant::now() + Duration::from_millis(duration_ms));
}

fn is_toolbar_focused(app: &AppHandle) -> bool {
    app.get_webview_window("toolbar")
        .and_then(|w| w.is_focused().ok())
        .unwrap_or(false)
}

fn emit_mode(app: &AppHandle, mode: OverlayMode) {
    let payload = mode.as_str();
    if let Err(e) = app.emit("overlay-mode-changed", payload) {
        warn!("Failed to emit overlay-mode-changed: {}", e);
    }
    let is_active = mode != OverlayMode::Hidden;
    if let Err(e) = app.emit("toggle-drawing", is_active) {
        warn!("Failed to emit toggle-drawing({}): {}", is_active, e);
    }
}

pub fn setup_overlay_size(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("overlay") {
        if let Some((x, y, w, h)) = monitor::get_cursor_monitor_rect() {
            #[cfg(target_os = "macos")]
            {
                window.set_size(tauri::LogicalSize::new(w, h)).ok();
                window.set_position(tauri::LogicalPosition::new(x, y)).ok();
            }
            #[cfg(not(target_os = "macos"))]
            {
                window
                    .set_size(tauri::PhysicalSize::new(w, h.saturating_sub(1)))
                    .ok();
                window.set_position(tauri::PhysicalPosition::new(x, y)).ok();
            }
        } else if let Some(mon) = app.primary_monitor().ok().flatten() {
            let size = mon.size();
            let pos = mon.position();
            #[cfg(target_os = "macos")]
            {
                let scale = mon.scale_factor();
                window
                    .set_size(tauri::LogicalSize::new(
                        size.width as f64 / scale,
                        size.height as f64 / scale,
                    ))
                    .ok();
                window
                    .set_position(tauri::LogicalPosition::new(
                        pos.x as f64 / scale,
                        pos.y as f64 / scale,
                    ))
                    .ok();
            }
            #[cfg(not(target_os = "macos"))]
            {
                window
                    .set_size(tauri::PhysicalSize::new(
                        size.width,
                        size.height.saturating_sub(1),
                    ))
                    .ok();
                window
                    .set_position(tauri::PhysicalPosition::new(pos.x, pos.y))
                    .ok();
            }
        }
        window.set_ignore_cursor_events(true).ok();
    }
}

const TOOLBAR_WIDTH: f64 = 320.0;

fn position_toolbar_window(app: &AppHandle) {
    let Some(window) = app.get_webview_window("toolbar") else {
        return;
    };

    if let Some((x, y, w, _h)) = monitor::get_cursor_monitor_rect() {
        #[cfg(target_os = "macos")]
        {
            let left = x as f64 + w as f64 - TOOLBAR_WIDTH - 16.0;
            let top = y as f64 + 40.0;
            window
                .set_position(tauri::LogicalPosition::new(left, top))
                .ok();
        }
        #[cfg(not(target_os = "macos"))]
        {
            let left = x + w as i32 - TOOLBAR_WIDTH as i32 - 16;
            let top = y + 40;
            window
                .set_position(tauri::PhysicalPosition::new(left, top))
                .ok();
        }
    }
}

fn toolbar_always_visible(state: &AppState) -> bool {
    lock_or_recover(&state.config).general.toolbar_visibility == ToolbarVisibility::Always
}

fn create_toolbar_window(app: &AppHandle) {
    if app.get_webview_window("toolbar").is_some() {
        return;
    }

    let url = WebviewUrl::App("index.html#toolbar".into());
    let builder = WebviewWindowBuilder::new(app, "toolbar", url)
        .title("MarkerOn")
        .inner_size(TOOLBAR_WIDTH, 480.0)
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .visible(false)
        .focused(false)
        .shadow(false);

    match builder.build() {
        Ok(window) => {
            position_toolbar_window(app);
            #[cfg(target_os = "macos")]
            crate::macos::configure_toolbar_window(&window);
            window.set_always_on_top(true).ok();
            window.set_ignore_cursor_events(false).ok();
        }
        Err(e) => warn!("Failed to create toolbar window: {}", e),
    }
}

fn raise_toolbar_above_overlay(app: &AppHandle) {
    let Some(toolbar) = app.get_webview_window("toolbar") else {
        return;
    };
    if !toolbar.is_visible().unwrap_or(false) {
        return;
    }
    toolbar.set_always_on_top(true).ok();
    #[cfg(windows)]
    if let Ok(hwnd) = toolbar.hwnd() {
        crate::win32::raise_window_topmost_no_activate(hwnd.0 as isize);
    }
    #[cfg(target_os = "macos")]
    {
        toolbar.show().ok();
    }
}

pub fn set_toolbar_window_visible(app: &AppHandle, visible: bool) {
    create_toolbar_window(app);
    if let Some(window) = app.get_webview_window("toolbar") {
        if visible {
            window.show().ok();
            window.set_always_on_top(true).ok();
            window.set_ignore_cursor_events(false).ok();
            raise_toolbar_above_overlay(app);
        } else {
            window.hide().ok();
        }
    }
}

pub fn position_toolbar_at(app: &AppHandle, x: f64, y: f64) {
    create_toolbar_window(app);
    let Some(window) = app.get_webview_window("toolbar") else {
        return;
    };
    window.set_position(tauri::LogicalPosition::new(x, y)).ok();
}

pub fn set_toolbar_popup(
    app: &AppHandle,
    state: &AppState,
    visible: bool,
    x: Option<f64>,
    y: Option<f64>,
) {
    if visible {
        if let (Some(x), Some(y)) = (x, y) {
            position_toolbar_at(app, x, y);
        }
        set_toolbar_window_visible(app, true);
        suppress_penetration_for(state, 800);
    } else {
        set_toolbar_window_visible(app, false);
    }
}

pub fn ensure_toolbar_window(app: &AppHandle, state: &AppState) {
    set_toolbar_window_visible(app, toolbar_always_visible(state));
}

pub fn hide_toolbar_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("toolbar") {
        window.hide().ok();
    }
}

pub fn deactivate_drawing(app: &AppHandle, state: &AppState) {
    if current_mode(state) == OverlayMode::Hidden {
        return;
    }

    set_mode(state, OverlayMode::Hidden);
    *lock_or_recover(&state.whiteboard_mode) = false;

    if let Some(window) = app.get_webview_window("overlay") {
        window.set_ignore_cursor_events(true).ok();
        window.hide().ok();
    }
    hide_toolbar_window(app);
    emit_mode(app, OverlayMode::Hidden);
}

pub fn activate_drawing(app: &AppHandle, state: &AppState) {
    begin_activation_guard(state);
    set_mode(state, OverlayMode::Drawing);

    let preserve = lock_or_recover(&state.config).general.preserve_drawings;

    if let Some(window) = app.get_webview_window("overlay") {
        setup_overlay_size(app);
        if !preserve {
            if let Err(e) = app.emit("clear-drawing", ()) {
                warn!("Failed to emit clear-drawing: {}", e);
            }
        }
        window.show().ok();
        window.set_ignore_cursor_events(false).ok();
        window.set_always_on_top(true).ok();
    }

    ensure_toolbar_window(app, state);

    if let Some(window) = app.get_webview_window("overlay") {
        window.set_focus().ok();
    }
    raise_toolbar_above_overlay(app);

    emit_mode(app, OverlayMode::Drawing);
    info!("Drawing mode activated");
}

pub fn enter_penetration_mode(app: &AppHandle, state: &AppState) {
    if current_mode(state) != OverlayMode::Drawing {
        return;
    }
    if *lock_or_recover(&state.whiteboard_mode) {
        return;
    }

    set_mode(state, OverlayMode::Penetration);

    if let Some(window) = app.get_webview_window("overlay") {
        window.set_ignore_cursor_events(true).ok();
    }

    // Respect toolbar visibility: only show when configured as always-on.
    ensure_toolbar_window(app, state);
    raise_toolbar_above_overlay(app);
    emit_mode(app, OverlayMode::Penetration);
}

pub fn exit_penetration_mode(app: &AppHandle, state: &AppState) {
    if current_mode(state) != OverlayMode::Penetration {
        return;
    }

    set_mode(state, OverlayMode::Drawing);

    if let Some(window) = app.get_webview_window("overlay") {
        window.set_ignore_cursor_events(false).ok();
        window.set_always_on_top(true).ok();
        window.set_focus().ok();
    }

    ensure_toolbar_window(app, state);
    raise_toolbar_above_overlay(app);
    emit_mode(app, OverlayMode::Drawing);
}

pub fn toggle_penetration_mode(app: &AppHandle, state: &AppState) {
    match current_mode(state) {
        OverlayMode::Drawing => enter_penetration_mode(app, state),
        OverlayMode::Penetration => exit_penetration_mode(app, state),
        OverlayMode::Hidden => {}
    }
}

pub fn toggle_drawing(app: &AppHandle) {
    let state = app.state::<AppState>();
    match current_mode(&state) {
        OverlayMode::Hidden => activate_drawing(app, &state),
        OverlayMode::Drawing | OverlayMode::Penetration => deactivate_drawing(app, &state),
    }
}

pub fn clear_drawing(app: &AppHandle, state: &AppState) {
    if current_mode(state) == OverlayMode::Hidden {
        return;
    }
    if let Err(e) = app.emit("clear-drawing", ()) {
        warn!("Failed to emit clear-drawing: {}", e);
    }
}

pub fn on_overlay_focus_lost(app: &AppHandle, state: &AppState) {
    if current_mode(state) != OverlayMode::Drawing {
        return;
    }
    if should_suppress_penetration(state) || is_toolbar_focused(app) {
        return;
    }

    // Defer so toolbar pointerdown can set suppression before we enter penetration.
    let app = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(Duration::from_millis(120));
        let app_for_thread = app.clone();
        let _ = app.run_on_main_thread(move || {
            let state = app_for_thread.state::<AppState>();
            if current_mode(&state) != OverlayMode::Drawing {
                return;
            }
            if should_suppress_penetration(&state) || is_toolbar_focused(&app_for_thread) {
                return;
            }
            enter_penetration_mode(&app_for_thread, &state);
        });
    });
}
