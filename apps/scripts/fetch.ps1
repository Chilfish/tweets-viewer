$ScriptPath = Join-Path -Path (Get-Location).Path -ChildPath "src\fetchTimeline.ts"
$MaxRetries = 5               # 最大重试次数
$TimeoutMs  = 20000           # 超时阈值 (20s)
$FatalCode  = 104               # 业务定义的致命错误码

# 安全性检查：确认脚本存在
if (-not (Test-Path $ScriptPath)) {
    Write-Error "CRITICAL: Target script not found at [$ScriptPath]"
    exit 1
}

:MainLoop foreach ($iteration in 1..50) {
    $retryCount = 0
    $success = $false

    while ($retryCount -lt $MaxRetries) {
        $retryCount++
        Write-Host "[Task $iteration][Attempt $retryCount] Executing..." -ForegroundColor Cyan

        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = "bun"
        $psi.Arguments = "`"$ScriptPath`""
        $psi.UseShellExecute = $false
        $psi.RedirectStandardOutput = $false
        $psi.RedirectStandardError = $false

        $proc = New-Object System.Diagnostics.Process
        $proc.StartInfo = $psi

        try {
            [void]$proc.Start()

            # 等待进程信号并判定超时
            if (-not $proc.WaitForExit($TimeoutMs)) {
                $proc.Kill()
                Write-Warning " -> Result: Timeout. Terminating process."
            }
            else {
                $exitCode = $proc.ExitCode

                if ($exitCode -eq 0) {
                    Write-Host " -> Result: Success." -ForegroundColor Green
                    $success = $true
                    break # 跳出 while 重试循环
                }
                elseif ($exitCode -eq $FatalCode) {
                    Write-Error " -> Result: Fatal Error $FatalCode (No Data). Aborting entire sequence."
                    $proc.Dispose()
                    exit $FatalCode # 彻底退出 PowerShell 脚本
                }
                else {
                    Write-Warning " -> Result: Non-zero Exit Code ($exitCode)."
                }
            }
        }
        catch {
            Write-Error " -> Exception: $($_.Exception.Message)"
        }
        finally {
            $proc.Dispose()
        }

        # 重放保护：如果重试仍未成功且已达上限，则中止
        if (-not $success -and $retryCount -ge $MaxRetries) {
            Write-Error "CRITICAL: Task $iteration failed after $MaxRetries attempts. Sequence halted."
            exit 1 # 触发整体失败退出
        }

        # 退避算法：重试前短暂休眠以等候 I/O 稳态
        if (-not $success) { Start-Sleep -Seconds 1 }
    }
}
