# Scoop Distribution Notes

Scoop is strongest when the app has a portable `.zip` release that can be extracted into Scoop's app directory without running a traditional installer.

Windows GitHub Release assets include:

- `MarkerOn_X.Y.Z_x64-setup.exe` (NSIS)
- `MarkerOn_X.Y.Z_x64_zh-CN.msi`
- `MarkerOn_X.Y.Z_x64.msix`
- `MarkerOn_X.Y.Z_x64_portable.zip` (green / portable)

Portable zip contents:

- `MarkerOn.exe`
- `WebView2Loader.dll` (required for windows-gnu builds)
- `markeron.portable` marker file (config / logs / WebView data → `./data/`)
- `README.txt`

Recommended next step for Scoop Extras:

1. Use `MarkerOn_X.Y.Z_x64_portable.zip` as the download URL.
2. Ensure it can run from the extracted folder without writing installation metadata.
3. Generate SHA256 for the zip and add an autoupdate block.

Draft metadata:

- App name: `markeron`
- Description: `Lightweight screen annotation tool with click-through mode`
- Homepage: `https://github.com/ifer47/markeron`
- License: `MIT`
- Architecture: `64bit`
- Bin/shortcut target: `MarkerOn.exe`
