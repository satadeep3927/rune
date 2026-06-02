; ============================================================
; Rune Editor – NSIS Installer Hooks
; Adds "Open with Rune" to the Windows Explorer context menu
; for ALL files and folders (in addition to per-extension
; associations registered automatically by Tauri via fileAssociations).
; ============================================================

; Called right after the app files are installed
!macro NSIS_HOOK_POSTINSTALL
  ; --- "Open with Rune" on any file ---
  WriteRegStr HKCR "*\shell\Open with Rune" "" "Open with Rune"
  WriteRegStr HKCR "*\shell\Open with Rune" "Icon" "$INSTDIR\Rune.exe,0"
  WriteRegStr HKCR "*\shell\Open with Rune\command" "" '"$INSTDIR\Rune.exe" "%1"'

  ; --- "Open as Rune Project" on any folder ---
  WriteRegStr HKCR "Directory\shell\Open as Rune Project" "" "Open as Rune Project"
  WriteRegStr HKCR "Directory\shell\Open as Rune Project" "Icon" "$INSTDIR\Rune.exe,0"
  WriteRegStr HKCR "Directory\shell\Open as Rune Project\command" "" '"$INSTDIR\Rune.exe" "%V"'

  ; --- "Open as Rune Project" when right-clicking a folder background ---
  WriteRegStr HKCR "Directory\Background\shell\Open as Rune Project" "" "Open as Rune Project"
  WriteRegStr HKCR "Directory\Background\shell\Open as Rune Project" "Icon" "$INSTDIR\Rune.exe,0"
  WriteRegStr HKCR "Directory\Background\shell\Open as Rune Project\command" "" '"$INSTDIR\Rune.exe" "%V"'
!macroend

; Called right before app files are removed
!macro NSIS_HOOK_PREUNINSTALL
  ; --- Remove file context menu ---
  DeleteRegKey HKCR "*\shell\Open with Rune"

  ; --- Remove folder context menus ---
  DeleteRegKey HKCR "Directory\shell\Open as Rune Project"
  DeleteRegKey HKCR "Directory\Background\shell\Open as Rune Project"
!macroend
