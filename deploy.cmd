@echo off
REM Wrapper so Windows users can run `deploy` the same way. The real pipeline
REM is deploy.js, which runs identically on macOS, Linux and Windows.
node "%~dp0deploy.js" %*
