@echo off
setlocal
REM ============================================================
REM  Sunlite Signs website - backup of the code from GitHub
REM  Put this file in a OneDrive folder and double-click it.
REM  First run: copies everything. After that: only fetches changes.
REM  Result: website27-files (normal folder), website27-mirror.git (full history),
REM  and a dated website27-....bundle (one-file copy).
REM  Needs Git for Windows (https://git-scm.com/download/win).
REM  GitHub asks you to sign in once (private repo); Windows remembers it.
REM ============================================================

set "REPO=https://github.com/ozzi82/website27"
set "BACKUP_REPO=https://github.com/ozzi82/website27-backup"
set "HERE=%~dp0"
set "MIRROR=%HERE%website27-mirror.git"
set "FILES=%HERE%website27-files"

where git >nul 2>&1
if errorlevel 1 (
  echo Git is not installed. Get it from https://git-scm.com/download/win and run this again.
  pause
  exit /b 1
)

if not exist "%MIRROR%\HEAD" (
  echo First run: copying the full history. This takes a minute...
  git clone --mirror "%REPO%" "%MIRROR%"
  if errorlevel 1 goto :failed
) else (
  echo Fetching the latest changes...
  git -C "%MIRROR%" remote update --prune
  if errorlevel 1 goto :failed
)

REM Plain, browsable copy of the current files (no git needed to open it). Rebuilt on every run.
if exist "%FILES%" rmdir /s /q "%FILES%"
mkdir "%FILES%"
git -C "%MIRROR%" archive --format=zip -o "%TEMP%\website27-files.zip" HEAD
if errorlevel 1 goto :failed
tar -xf "%TEMP%\website27-files.zip" -C "%FILES%"
if errorlevel 1 goto :failed
del "%TEMP%\website27-files.zip" >nul 2>&1

REM One dated single-file copy (.bundle) with the complete history; restore with: git clone file.bundle
for /f %%d in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd"') do set "TODAY=%%d"
git -C "%MIRROR%" bundle create "%HERE%website27-%TODAY%.bundle" --all
if errorlevel 1 goto :failed

REM Optional: also refresh the second GitHub repo (remove the next 4 lines if you do not want this).
git -C "%MIRROR%" push --force --all "%BACKUP_REPO%"
if errorlevel 1 goto :backupnote
git -C "%MIRROR%" push --force --tags "%BACKUP_REPO%"
if errorlevel 1 goto :backupnote
goto :done

:backupnote
echo Note: the website27-backup repo was not updated (sign-in or permission problem). The local copy is fine.

:done

echo.
echo Done.
echo Browsable files: "%FILES%"
echo Full history: "%MIRROR%"
echo Single-file copy: "%HERE%website27-%TODAY%.bundle"
pause
exit /b 0

:failed
echo.
echo Something went wrong. Check your internet connection and GitHub sign-in, then run it again.
pause
exit /b 1
