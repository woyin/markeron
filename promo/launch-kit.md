# MarkerOn v1.0 Launch Kit

Use this as the source of truth for public posts, replies, bios, and listing forms.

## Positioning

MarkerOn is a lightweight open-source screen annotation tool for demos, teaching, meetings, and recordings. It starts instantly from a hotkey, draws over any app, and now includes click-through mode so annotations can stay visible while you interact with the apps underneath.

## One-Liners

- Lightweight open-source screen annotation with click-through mode.
- Draw anywhere on your desktop, then keep annotations visible while you click through to the app below.
- A tiny keyboard-first alternative for people who want fast annotation without a heavy presentation suite.
- Screen annotation, whiteboard mode, and click-through drawing in a 1.5 MB Tauri app.

## Short Description

MarkerOn is a small, open-source desktop app for screen annotation. Press a hotkey, draw over any app, switch to click-through mode when you need to operate the screen below, and jump back to drawing whenever the explanation needs another mark. It supports 8 annotation tools, whiteboard mode, keyboard shortcuts, and official builds for Windows and macOS.

## Long Description

MarkerOn is a lightweight screen annotation tool built with Tauri v2, Rust, Vue, and Canvas. It is designed for people who explain things live: teachers, trainers, meeting hosts, demo presenters, screen recorders, and developers.

The app runs silently in the system tray. Press Ctrl+Shift+D to enter annotation mode, draw over any desktop app, use number keys to switch tools, and press X or Ctrl+Shift+X to switch between drawing and click-through mode. In click-through mode, annotations remain visible, but your mouse clicks, scrolling, and typing go to the apps underneath.

MarkerOn also includes a whiteboard mode, undo/redo, text, arrows, shapes, eraser modes, angle snapping, copy-to-clipboard, expandable toolbar panel, and content preservation between sessions.

Official downloads:

- GitHub Releases: https://github.com/ifer47/markeron/releases/latest
- Microsoft Store: https://get.microsoft.com/installer/download/9n6623x973jv?referrer=appbadge
- Source: https://github.com/ifer47/markeron

## Product Hunt Draft

### Name

MarkerOn

### Tagline

Lightweight screen annotation with click-through mode

### Topics

Productivity, Developer Tools, Education, Open Source, Meetings

### Description

MarkerOn is a tiny open-source desktop app for drawing over your screen during demos, teaching, meetings, and recordings. v1.0 adds click-through mode: keep annotations visible while mouse events pass to the apps underneath, then switch back to drawing instantly.

### Maker Comment

Hi Product Hunt! I built MarkerOn because I wanted a fast screen annotation tool that did not feel like a heavy presentation suite.

It runs in the tray, wakes up from a hotkey, and lets you draw over any desktop app. The v1.0 release adds the feature users asked for most: click-through mode. Your annotations can stay visible while you interact with the app below, then you can switch back to drawing without leaving the session.

Highlights:

- around 1.5 MB installer
- open source and local-first
- 8 annotation tools
- click-through mode
- whiteboard mode
- full keyboard control
- Windows and macOS builds
- Microsoft Store download for Windows

I'd love feedback from teachers, trainers, people who record tutorials, and anyone who uses tools like ZoomIt or Epic Pen.

## Show HN Draft

Title:

Show HN: MarkerOn - lightweight open-source screen annotation with click-through

Post:

Hi HN, I built MarkerOn, a lightweight open-source desktop app for screen annotation.

It is meant for demos, teaching, meetings, and recordings: press a hotkey, draw over any app, and switch tools from the keyboard. The v1.0 release adds click-through mode, so annotations can remain visible while mouse events pass to the apps underneath. That makes it closer to the Epic Pen / ZoomIt-style workflow, while keeping the app small and local-first.

Tech stack: Tauri v2, Rust, Vue 3, TypeScript, Canvas.

Downloads: https://github.com/ifer47/markeron/releases/latest
Source: https://github.com/ifer47/markeron

I'd especially appreciate feedback on multi-monitor behavior, macOS tablet/stylus input, and whether the keyboard-first workflow feels natural.

## V2EX Draft

标题：

MarkerOn v1.0：开源轻量屏幕标注工具，新增穿透模式

正文：

大家好，我做的屏幕标注工具 MarkerOn 发布 v1.0 了。

MarkerOn 是一个开源、轻量、快捷键优先的桌面标注工具。按快捷键进入标注，可以在任意应用上画线、箭头、矩形、文字，也支持白板模式。

v1.0 最大更新是「穿透模式」：标注内容可以继续留在屏幕上，同时鼠标点击、滚动和输入会传递给下面的应用。适合讲课、演示、录屏、远程会议里那种「边标注边操作软件」的场景。

特点：

- 安装包约 1.5 MB
- 开源，本地使用，不需要账号
- 支持画笔、荧光笔、箭头、矩形、椭圆、直线、橡皮擦、文字
- 支持穿透模式和白板模式
- 工具栏可常驻，也可按 Space 呼出
- 支持 Windows / macOS
- Windows 可从 Microsoft Store 安装

GitHub: https://github.com/ifer47/markeron
下载: https://github.com/ifer47/markeron/releases/latest

欢迎反馈多屏、macOS 数位板等实际使用问题。

## X / Twitter Drafts

1.

MarkerOn v1.0 is out.

It is a tiny open-source screen annotation app with click-through mode:

- draw over any desktop app
- keep annotations visible
- click/scroll/type in the app underneath
- switch back to drawing instantly

https://github.com/ifer47/markeron

2.

I built MarkerOn because I wanted screen annotation to feel instant:

Ctrl+Shift+D -> draw
X -> click-through
W -> whiteboard
Esc -> done

Open source, local-first, around 1.5 MB.

https://github.com/ifer47/markeron

3.

Teachers, demo presenters, and tutorial makers: I would love feedback on MarkerOn v1.0.

It is a lightweight screen annotation tool with click-through mode, whiteboard mode, and full keyboard control.

https://github.com/ifer47/markeron/releases/latest

## Dev.to / Medium Draft

Title:

Building a 1.5 MB Screen Annotation Tool with Tauri, Rust, Vue, and Canvas

Outline:

1. Why screen annotation tools matter during live demos.
2. Why MarkerOn is keyboard-first.
3. The overlay problem: transparent always-on-top windows.
4. The v1.0 click-through mode: drawing window, toolbar window, and event bridging.
5. Rendering strategy: canvas, history, preview, and cached completed drawings.
6. Platform notes: Windows, macOS, and multi-monitor edge cases.
7. What I would like feedback on.

Closing CTA:

If you teach, record tutorials, run demos, or use ZoomIt / Epic Pen-style tools, I would love your feedback on MarkerOn v1.0.

## Chinese Technical Article Draft

标题：

我用 Tauri 做了一个 1.5 MB 的开源屏幕标注工具：MarkerOn v1.0

提纲：

1. 为什么要做屏幕标注工具，而不是继续用截图/画图/会议白板。
2. MarkerOn 的核心体验：快捷键进入、键盘切工具、轻量常驻托盘。
3. v1.0 的穿透模式：标注层保持可见，鼠标事件传给下层窗口。
4. Tauri 多窗口设计：透明 overlay + 独立工具栏窗口。
5. Canvas 绘制和撤销/重做/白板模式。
6. 体积和性能取舍。
7. 当前希望大家帮忙测试的点：多显示器、macOS 数位板。

## Short Video Scripts

### 10 Seconds: Hotkey to Draw

Shot 1: Desktop with a document or browser open.
Text: "Need to explain something live?"
Action: Press Ctrl+Shift+D.
Shot 2: MarkerOn overlay appears; draw arrow and highlight.
Text: "Draw anywhere, instantly."
End card: "MarkerOn - open-source screen annotation"

### 15 Seconds: Click-Through Mode

Shot 1: Draw a circle around a button in an app.
Text: "Keep annotations on screen."
Shot 2: Press X or click pointer button.
Action: Click the underlying app while the annotation remains visible.
Text: "Click through to the app below."
Shot 3: Press X again and add another arrow.
Text: "Switch back to drawing anytime."

### 20 Seconds: Whiteboard Mode

Shot 1: Enter annotation mode.
Shot 2: Press W to switch to whiteboard.
Action: Draw a quick flow diagram with arrow, rectangle, and text.
Shot 3: Press Ctrl+C and paste into chat/doc.
Text: "Whiteboard, copy, continue."

## Screenshot Captions

- "Draw over any app, including the taskbar."
- "Switch between drawing and click-through mode without leaving the session."
- "Use the floating toolbar or keyboard shortcuts."
- "Whiteboard mode for quick explanation and teaching."
- "Local-first, open source, and lightweight."

## Comparison Angles

### MarkerOn vs ZoomIt

MarkerOn focuses on lightweight annotation, whiteboard mode, and click-through drawing. ZoomIt remains excellent for zooming; MarkerOn pairs well with system magnifiers when zoom is needed.

### MarkerOn vs Epic Pen

MarkerOn provides an open-source, local-first alternative with a small installer, keyboard-first controls, and v1.0 click-through mode for persistent annotations while interacting with apps below.

### MarkerOn vs meeting whiteboards

Meeting whiteboards are tied to a meeting app. MarkerOn works over any desktop app, offline, and without account setup.
