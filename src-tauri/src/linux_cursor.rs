//! Linux-only helpers for overlay cursor passthrough (tao / Wayland compatibility).

use tauri::WebviewWindow;
use tracing::warn;

/// Whether `set_ignore_cursor_events(true)` must be skipped to avoid a tao panic on Wayland.
///
/// tao 0.35.x unwraps an X11-only `GdkWindow` when enabling passthrough; on Wayland that
/// handle is `None` and the process aborts (markeron #31).
pub(crate) fn should_skip_ignore_cursor_events(ignore: bool, wayland_display: bool, forced_x11: bool) -> bool {
    if !ignore {
        return false;
    }
    if forced_x11 {
        return false;
    }
    wayland_display
}

fn is_forced_x11_backend() -> bool {
    matches!(
        std::env::var("GDK_BACKEND").as_deref(),
        Ok("x11") | Ok("xcb")
    ) || std::env::var("WINIT_UNIX_BACKEND").as_deref() == Ok("x11")
}

pub fn set_ignore_cursor_events(window: &WebviewWindow, ignore: bool) {
    let wayland_display = std::env::var_os("WAYLAND_DISPLAY").is_some();
    if should_skip_ignore_cursor_events(ignore, wayland_display, is_forced_x11_backend()) {
        warn!(
            "Skipping set_ignore_cursor_events(true) on Wayland (tao X11-only API; penetration mode unavailable)"
        );
        return;
    }
    window.set_ignore_cursor_events(ignore).ok();
}

#[cfg(test)]
mod tests {
    use super::should_skip_ignore_cursor_events;

    #[test]
    fn never_skips_when_not_ignoring() {
        assert!(!should_skip_ignore_cursor_events(false, true, false));
        assert!(!should_skip_ignore_cursor_events(false, false, true));
    }

    #[test]
    fn skips_ignore_on_wayland() {
        assert!(should_skip_ignore_cursor_events(true, true, false));
    }

    #[test]
    fn does_not_skip_on_x11_session() {
        assert!(!should_skip_ignore_cursor_events(true, false, false));
    }

    #[test]
    fn does_not_skip_when_x11_backend_forced() {
        assert!(!should_skip_ignore_cursor_events(true, true, true));
    }
}
