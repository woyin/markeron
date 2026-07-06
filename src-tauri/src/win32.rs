#![cfg(target_os = "windows")]

#[allow(clippy::upper_case_acronyms)]
#[repr(C)]
#[derive(Copy, Clone)]
pub struct POINT {
    pub x: i32,
    pub y: i32,
}

#[allow(clippy::upper_case_acronyms)]
#[repr(C)]
#[derive(Copy, Clone)]
pub struct RECT {
    pub left: i32,
    pub top: i32,
    pub right: i32,
    pub bottom: i32,
}

#[allow(clippy::upper_case_acronyms)]
#[repr(C)]
pub struct MONITORINFO {
    pub cb_size: u32,
    pub rc_monitor: RECT,
    pub rc_work: RECT,
    pub dw_flags: u32,
}

pub const MONITOR_DEFAULTTONEAREST: u32 = 2;

pub const HWND_TOPMOST: isize = -1;
pub const SWP_NOMOVE: u32 = 0x0002;
pub const SWP_NOSIZE: u32 = 0x0001;
pub const SWP_NOACTIVATE: u32 = 0x0010;

extern "system" {
    pub fn GetCursorPos(lp_point: *mut POINT) -> i32;
    pub fn MonitorFromPoint(pt: POINT, dw_flags: u32) -> isize;
    pub fn GetMonitorInfoW(h_monitor: isize, lpmi: *mut MONITORINFO) -> i32;
    pub fn ClipCursor(lp_rect: *const RECT) -> i32;
    pub fn SetWindowPos(
        h_wnd: isize,
        h_wnd_insert_after: isize,
        x: i32,
        y: i32,
        cx: i32,
        cy: i32,
        u_flags: u32,
    ) -> i32;
}

/// Raise a window to the top of the topmost group without stealing keyboard focus.
pub fn raise_window_topmost_no_activate(hwnd: isize) {
    unsafe {
        SetWindowPos(
            hwnd,
            HWND_TOPMOST,
            0,
            0,
            0,
            0,
            SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE,
        );
    }
}

/// Move and resize a topmost window in one Win32 call so per-monitor DPI updates
/// before the WebView relayouts (avoids pointer/canvas offset on mixed-DPI setups).
pub fn position_window_on_monitor(hwnd: isize, x: i32, y: i32, width: u32, height: u32) {
    let w = width.max(1) as i32;
    let h = height.saturating_sub(1).max(1) as i32;
    unsafe {
        SetWindowPos(hwnd, HWND_TOPMOST, x, y, w, h, SWP_NOACTIVATE);
    }
}

fn monitor_rect_from_point(x: i32, y: i32) -> Option<(i32, i32, u32, u32)> {
    unsafe {
        let pt = POINT { x, y };
        let hmon = MonitorFromPoint(pt, MONITOR_DEFAULTTONEAREST);
        if hmon == 0 {
            return None;
        }

        let mut info: MONITORINFO = std::mem::zeroed();
        info.cb_size = std::mem::size_of::<MONITORINFO>() as u32;
        if GetMonitorInfoW(hmon, &mut info) == 0 {
            return None;
        }

        let rc = &info.rc_monitor;
        Some((
            rc.left,
            rc.top,
            (rc.right - rc.left) as u32,
            (rc.bottom - rc.top) as u32,
        ))
    }
}

/// Confine the cursor to a screen rectangle (physical pixels). Pass `None` to release.
pub fn clip_cursor_to_rect(rect: Option<&RECT>) -> bool {
    unsafe {
        match rect {
            Some(rc) => ClipCursor(rc) != 0,
            None => ClipCursor(std::ptr::null()) != 0,
        }
    }
}

pub fn release_cursor_clip() {
    let _ = clip_cursor_to_rect(None);
}

/// Returns (x, y, width, height) of the monitor containing the cursor.
pub fn get_cursor_monitor_rect_win32() -> Option<(i32, i32, u32, u32)> {
    unsafe {
        let mut pt = POINT { x: 0, y: 0 };
        if GetCursorPos(&mut pt) == 0 {
            return None;
        }
        monitor_rect_from_point(pt.x, pt.y)
    }
}

pub fn get_monitor_rect_at_point_win32(x: i32, y: i32) -> Option<(i32, i32, u32, u32)> {
    monitor_rect_from_point(x, y)
}
