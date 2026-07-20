use std::ffi::c_void;

use tauri::window::Color;
use tauri::{ActivationPolicy, AppHandle, Manager, Theme, TitleBarStyle, WebviewWindow};

const SETTINGS_BG: Color = Color(30, 30, 32, 255);

/// `NSWindowAbove` — place the receiver above the window identified by `relativeTo:`.
const NS_WINDOW_ABOVE: isize = 1;

type Sel = *const c_void;

extern "C" {
    fn sel_registerName(name: *const std::ffi::c_char) -> Sel;
    fn objc_msgSend();
}

unsafe fn msg_send_isize(receiver: *mut c_void, sel: Sel) -> isize {
    let f: unsafe extern "C" fn(*mut c_void, Sel) -> isize =
        std::mem::transmute(objc_msgSend as *const c_void);
    f(receiver, sel)
}

unsafe fn msg_send_void(receiver: *mut c_void, sel: Sel) {
    let f: unsafe extern "C" fn(*mut c_void, Sel) =
        std::mem::transmute(objc_msgSend as *const c_void);
    f(receiver, sel);
}

unsafe fn msg_send_order(receiver: *mut c_void, sel: Sel, place: isize, other_win: isize) {
    let f: unsafe extern "C" fn(*mut c_void, Sel, isize, isize) =
        std::mem::transmute(objc_msgSend as *const c_void);
    f(receiver, sel, place, other_win);
}

fn order_toolbar_above_overlay_now(toolbar: &WebviewWindow, overlay: Option<&WebviewWindow>) {
    let Ok(toolbar_ns) = toolbar.ns_window() else {
        let _ = toolbar.show();
        return;
    };
    if toolbar_ns.is_null() {
        let _ = toolbar.show();
        return;
    }

    unsafe {
        if let Some(overlay) = overlay {
            if let Ok(overlay_ns) = overlay.ns_window() {
                if !overlay_ns.is_null() {
                    let window_number_sel = sel_registerName(c"windowNumber".as_ptr());
                    let order_sel = sel_registerName(c"orderWindow:relativeTo:".as_ptr());
                    let overlay_number = msg_send_isize(overlay_ns, window_number_sel);
                    msg_send_order(toolbar_ns, order_sel, NS_WINDOW_ABOVE, overlay_number);
                    return;
                }
            }
        }

        // Fallback when overlay handle is missing: front of its level, no key focus.
        let regardless_sel = sel_registerName(c"orderFrontRegardless".as_ptr());
        msg_send_void(toolbar_ns, regardless_sel);
    }
}

/// Re-stack the toolbar **NSWindow** above the overlay without activating it.
///
/// Both windows are `alwaysOnTop` / floating level; clicking the overlay canvas can
/// promote it above the toolbar. `WebviewWindow::show()` is often a no-op when the
/// toolbar is already visible, so we call AppKit directly:
/// `-[NSWindow orderWindow:NSWindowAbove relativeTo:]`.
///
/// Only NSWindow selectors are used — never WKWebView / WryWebView (those crash).
/// AppKit window ordering runs on the main thread.
pub fn raise_toolbar_ns_window_above_overlay(
    toolbar: &WebviewWindow,
    overlay: Option<&WebviewWindow>,
) {
    let toolbar = toolbar.clone();
    let overlay = overlay.cloned();
    let _ = toolbar.run_on_main_thread(move || {
        order_toolbar_above_overlay_now(&toolbar, overlay.as_ref());
    });
}

/// Tray apps run as Accessory; a Regular policy is required to surface the settings window.
pub fn activate_for_settings(app: &AppHandle) {
    app.set_activation_policy(ActivationPolicy::Regular).ok();
}

pub fn restore_accessory_policy(app: &AppHandle) {
    app.set_activation_policy(ActivationPolicy::Accessory).ok();
}

pub fn style_settings_builder(
    builder: tauri::WebviewWindowBuilder<'_, tauri::Wry, AppHandle>,
) -> tauri::WebviewWindowBuilder<'_, tauri::Wry, AppHandle> {
    builder
        .title_bar_style(TitleBarStyle::Transparent)
        .theme(Some(Theme::Dark))
        .background_color(SETTINGS_BG)
}

pub fn configure_settings_window(window: &WebviewWindow) {
    window.set_theme(Some(Theme::Dark)).ok();
    window.set_background_color(Some(SETTINGS_BG)).ok();
}

pub fn configure_overlay_window(app: &AppHandle) {
    let Some(window) = app.get_webview_window("overlay") else {
        return;
    };

    // Use Tauri's API only. Wry already disables WKWebView's white background for
    // transparent windows; calling Objective-C selectors on WryWebView will crash.
    window.set_background_color(Some(Color(0, 0, 0, 0))).ok();
}

pub fn configure_toolbar_window(window: &WebviewWindow) {
    window.set_background_color(Some(Color(0, 0, 0, 0))).ok();
}
