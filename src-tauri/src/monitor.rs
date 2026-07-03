use serde::Serialize;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OverlayPointerPosition {
    pub x: f64,
    pub y: f64,
    pub screen_x: i32,
    pub screen_y: i32,
}

/// Screen-space cursor position in physical/global pixels (or platform equivalent).
#[cfg(target_os = "windows")]
pub fn get_cursor_screen_pos() -> Option<(i32, i32)> {
    use crate::win32::{GetCursorPos, POINT};
    unsafe {
        let mut pt = POINT { x: 0, y: 0 };
        if GetCursorPos(&mut pt) == 0 {
            return None;
        }
        Some((pt.x, pt.y))
    }
}

#[cfg(target_os = "macos")]
pub fn get_cursor_screen_pos() -> Option<(i32, i32)> {
    #[repr(C)]
    struct CGPoint {
        x: f64,
        y: f64,
    }
    extern "C" {
        fn CGEventCreate(source: *const std::ffi::c_void) -> *mut std::ffi::c_void;
        fn CGEventGetLocation(event: *const std::ffi::c_void) -> CGPoint;
        fn CFRelease(cf: *const std::ffi::c_void);
    }

    unsafe {
        let event = CGEventCreate(std::ptr::null());
        if event.is_null() {
            return None;
        }
        let pt = CGEventGetLocation(event);
        CFRelease(event);
        Some((pt.x as i32, pt.y as i32))
    }
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
pub fn get_cursor_screen_pos() -> Option<(i32, i32)> {
    let (x, y, w, h) = get_cursor_monitor_rect()?;
    Some((x + w as i32 / 2, y + h as i32 / 2))
}

/// Cursor position in overlay client coordinates (CSS pixels in the webview).
pub fn get_overlay_client_pointer(app: &AppHandle) -> Option<OverlayPointerPosition> {
    let (screen_x, screen_y) = get_cursor_screen_pos()?;
    let (mon_x, mon_y, _, _) = get_cursor_monitor_rect()?;
    let window = app.get_webview_window("overlay")?;
    let scale = window.scale_factor().ok()?;
    let dx = (screen_x - mon_x) as f64;
    let dy = (screen_y - mon_y) as f64;
    #[cfg(not(target_os = "macos"))]
    let (x, y) = (dx / scale, dy / scale);
    #[cfg(target_os = "macos")]
    let (x, y) = (dx, dy);
    Some(OverlayPointerPosition {
        x,
        y,
        screen_x,
        screen_y,
    })
}

/// Returns (x, y, width, height) of the monitor containing the cursor.
#[cfg(target_os = "windows")]
pub fn get_cursor_monitor_rect() -> Option<(i32, i32, u32, u32)> {
    crate::win32::get_cursor_monitor_rect_win32()
}

#[cfg(target_os = "macos")]
pub fn get_cursor_monitor_rect() -> Option<(i32, i32, u32, u32)> {
    #[repr(C)]
    struct CGPoint {
        x: f64,
        y: f64,
    }
    extern "C" {
        fn CGEventCreate(source: *const std::ffi::c_void) -> *mut std::ffi::c_void;
        fn CGEventGetLocation(event: *const std::ffi::c_void) -> CGPoint;
        fn CFRelease(cf: *const std::ffi::c_void);
    }

    let (cx, cy) = unsafe {
        let event = CGEventCreate(std::ptr::null());
        if event.is_null() {
            return None;
        }
        let pt = CGEventGetLocation(event);
        CFRelease(event);
        (pt.x as i32, pt.y as i32)
    };

    let monitor = xcap::Monitor::from_point(cx, cy).ok()?;
    let x = monitor.x().ok()?;
    let y = monitor.y().ok()?;
    let w = monitor.width().ok()?;
    let h = monitor.height().ok()?;
    Some((x, y, w, h))
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
pub fn get_cursor_monitor_rect() -> Option<(i32, i32, u32, u32)> {
    let monitors = std::panic::catch_unwind(xcap::Monitor::all).ok()?.ok()?;
    let m = monitors.first()?;
    let x = m.x().ok()?;
    let y = m.y().ok()?;
    let w = m.width().ok()?;
    let h = m.height().ok()?;
    Some((x, y, w, h))
}
