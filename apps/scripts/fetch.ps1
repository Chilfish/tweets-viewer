<#
.SYNOPSIS
    执行 Timeline 获取任务的自动化调度脚本。
#>
param (
    [Parameter(Position = 0, HelpMessage = "最大迭代任务数")]
    [int]$MaxTasks = 50,

    [Parameter(Position = 1, HelpMessage = "目标脚本路径")]
    [string]$ScriptPath = "src\fetchTimeline.ts",

    [Parameter()]
    [int]$MaxRetries = 3,

    [Parameter()]
    [int]$TimeoutMs = 20000
)

function Invoke-FetchTimeline {
    [CmdletBinding()]
    param (
        [int]$MaxTasks,
        [string]$ScriptPath,
        [int]$MaxRetries,
        [int]$TimeoutMs
    )

    process {
        $ScriptPath = Join-Path -Path $PSScriptRoot -ChildPath $ScriptPath
        # 验证文件物理存在性
        if (-not (Test-Path $ScriptPath)) {
            Write-Error "CRITICAL: Target script not found at [$ScriptPath]"
            return
        }

        Write-Host "Configuration Loaded:" -ForegroundColor Gray
        Write-Host " - ScriptPath: $ScriptPath"
        Write-Host " - MaxTasks: $MaxTasks"

        :MainLoop foreach ($iteration in 1..$MaxTasks) {
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

                    # 同步等待并处理超时
                    if (-not $proc.WaitForExit($TimeoutMs)) {
                        $proc.Kill()
                        Write-Warning " -> Result: Timeout. Terminating process."
                    }
                    else {
                        $exitCode = $proc.ExitCode

                        if ($exitCode -eq 0) {
                            Write-Host " -> Result: Success." -ForegroundColor Green
                            $success = $true
                            break
                        }
                        elseif ($exitCode -eq 104) {
                            Write-Error " -> Result: Fatal Error 404 (No Data). Aborting."
                            return
                        }
                        elseif ($exitCode -eq 129) {
                            Write-Error " -> Result: Fatal Error 429 (Rate Limit Exceeded). Aborting."
                            return
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
                    if ($null -ne $proc) { $proc.Dispose() }
                }

                # 失败重试间隔（Exponential Backoff 的简化实现）
                if (-not $success) {
                    if ($retryCount -ge $MaxRetries) {
                        Write-Error "CRITICAL: Task $iteration failed after $MaxRetries attempts."
                        return
                    }
                    Start-Sleep -Seconds 1
                }
            }
        }
    }
}

# 执行逻辑
Invoke-FetchTimeline `
    -MaxTasks $MaxTasks `
    -ScriptPath $ScriptPath `
    -MaxRetries $MaxRetries `
    -TimeoutMs $TimeoutMs
