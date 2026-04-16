' Inicia Fazenda - Controle de Rebanho sem mostrar janelas
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
sh.CurrentDirectory = "C:\Users\Pichau\fazenda-app"

' Mata processos anteriores na porta 3001 (oculto, espera terminar)
sh.Run "cmd /c ""for /f ""tokens=5"" %a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do taskkill /F /PID %a >nul 2>&1""", 0, True

' Inicia o backend (oculto, em background)
sh.Run "cmd /c node server/index.js", 0, False

' Aguarda o servidor subir
WScript.Sleep 2000

' Abre no navegador padrao
sh.Run "http://localhost:3001", 1, False

' Inicia tunel Cloudflare se existir (oculto)
cfPath = sh.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe\cloudflared.exe"
If fso.FileExists(cfPath) Then
    sh.Run """" & cfPath & """ tunnel --url http://localhost:3001", 0, False
End If
