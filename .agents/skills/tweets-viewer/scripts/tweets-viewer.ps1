#Requires -Version 7.0
<#
  tweets-viewer.ps1 — 推文 / Instagram 归档阅读器命令行封装（PowerShell 版）
  ==========================================================================
  纯 PowerShell，无需 curl/python3；后端为公开只读 API，无需 API Key。

  用法：
    pwsh -NoProfile -File tweets-viewer.ps1 <命令> [参数...]
    pwsh -NoProfile -File tweets-viewer.ps1 help

  命令：
    tweets    <name>                             用户推文列表（全量归档，分页/游标）
    medias    <name>                             用户媒体推文（仅图片/视频，排除转推）
    search    "q" [--name U]                     关键词搜索（缺省全库，--name 限定用户）
    today     <name>                             单用户「那年今日」（历史同月同日）
    today-all                                    全量「那年今日」（跨用户，排除转推）
    stats     <name>                             归档按年统计（年份 + 条数）
    users                                        全部归档用户
    user      <name>                             单个归档用户信息
    ins       <name>                             Instagram 用户信息 + 帖子（name 为 X 用户名）
    image     [--name U] [--out FILE]            随机归档图片（+ 来源推文）
    status                                        服务状态与缓存条数

  通用开关：
    --page N       页码，从 1 开始（默认 1）
    --size N       每页条数 1-100（默认 10）
    --cursor C     keyset 游标，滚动续载（优先于 --page）
    --reverse      排序方向：旧→新（默认新→旧）
    --start DATE   起始日期 YYYY-MM-DD
    --end DATE     结束日期 YYYY-MM-DD
    --no-replies   排除回复推文（仅 tweets）
    --name U       限定用户（仅 search / image）
    --out FILE     图片落盘路径（仅 image）
    --json         直接输出原始 JSON

  环境变量：
    TWEETS_VIEWER_BASE_URL   覆盖 API 地址（默认 https://tweet-api.chilfish.top）
#>
$ErrorActionPreference = 'Stop'
$OutputEncoding = [Console]::InputEncoding = [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

# 入口刻意不声明 param() / [CmdletBinding()]：一旦成为「进阶脚本」就会自动启用通用参数，
# `--out` 会被当成 -OutVariable / -OutBuffer 的前缀而报 "parameter name 'out' is ambiguous"，
# 命令根本进不来。简单脚本则把所有参数原样交给 $args，正好配这种 `--flag` 风格 CLI。
$AllArgs = @($args)
$Command = if ($AllArgs.Count -gt 0 -and $AllArgs[0]) { [string]$AllArgs[0] } else { 'help' }
$Rest = @()
if ($AllArgs.Count -gt 1) { $Rest = @($AllArgs[1..($AllArgs.Count - 1)]) }

# 输出策略：交互式终端保留颜色；被重定向/被上层捕获时改走 stdout。
# Write-Host 写入的是 PowerShell 信息流，一旦输出被捕获就会序列化成 "#< CLIXML" 噪音。
$script:UseColor = -not [Console]::IsOutputRedirected

function Write-Ui {
  param([Parameter(Position = 0)][AllowEmptyString()][string]$Text = '', [System.ConsoleColor]$Color)
  if ($script:UseColor -and $PSBoundParameters.ContainsKey('Color')) {
    Write-Host $Text -ForegroundColor $Color
  }
  else {
    Write-Output $Text
  }
}

# skill 版本单源：从同级 SKILL.md 的 frontmatter 读取，避免 UA 里的手写副本漂移。
function Get-SkillVersion {
  $skill = Join-Path $PSScriptRoot '..' 'SKILL.md'
  if (-not (Test-Path -LiteralPath $skill)) { return 'unknown' }
  $m = Select-String -LiteralPath $skill -Pattern '^\s*version:\s*"?([0-9]+\.[0-9]+\.[0-9]+)"?\s*$' | Select-Object -First 1
  if ($m) { return $m.Matches.Groups[1].Value }
  return 'unknown'
}

$script:BaseUrl = if ($env:TWEETS_VIEWER_BASE_URL) { $env:TWEETS_VIEWER_BASE_URL.TrimEnd('/') } else { 'https://tweet-api.chilfish.top' }
$script:UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) tweets-viewer-skill/$(Get-SkillVersion)"
$script:ValueFlags = @('--page', '--size', '--cursor', '--name', '--start', '--end', '--out')
$script:JstOffset = [timespan]::FromHours(9)

function Fail {
  param([string]$Message, [int]$Code = 2)
  Write-Ui $Message -Color Red
  exit $Code
}

function Split-Args {
  param([string[]]$Tokens)
  $pos = [System.Collections.Generic.List[string]]::new()
  $flags = @{}
  for ($i = 0; $i -lt $Tokens.Count; $i++) {
    $t = $Tokens[$i]
    if ($t -match '^(--[a-z][a-z0-9-]*)=(.*)$') { $flags[$Matches[1]] = $Matches[2] }
    elseif ($t.StartsWith('--')) {
      if ($script:ValueFlags -contains $t) {
        if ($i + 1 -ge $Tokens.Count) { Fail "参数 $t 缺少值" }
        $flags[$t] = $Tokens[$i + 1]; $i++
      }
      else { $flags[$t] = $true }
    }
    else { [void]$pos.Add($t) }
  }
  return [pscustomobject]@{ Positional = $pos.ToArray(); Flags = $flags }
}

# 允许直接粘贴链接/带 @ 的句柄：https://x.com/ttisrn_0710 → ttisrn_0710
# 路径参数约束为 ^\w+$（无点号），因此只取最后一段的合法字符。
function Resolve-Name {
  param([string]$Value, [string]$Flag = 'name')
  if (-not $Value) { return $Value }
  $v = $Value.Trim()
  if ($v -match '^https?://') {
    $v = ($v -split '\?')[0].TrimEnd('/')
    $v = $v.Substring($v.LastIndexOf('/') + 1)
  }
  $v = $v.TrimStart('@')
  if ($v -notmatch '^[A-Za-z0-9_]+$') {
    Fail "非法 $Flag `"$Value`"：路径参数只接受 [A-Za-z0-9_]+（不能含点号/连字符），可直接粘贴 x.com 链接或 @句柄"
  }
  return $v
}

function Invoke-TweetsApi {
  param(
    [string]$Path,
    [string]$OutFile,
    [int]$TimeoutSec = 45
  )
  $uri = "$($script:BaseUrl)$Path"
  $p = @{
    Uri        = $uri
    Method     = 'Get'
    Headers    = @{ 'User-Agent' = $script:UA; Accept = 'application/json' }
    TimeoutSec = $TimeoutSec
  }
  if ($OutFile) { $p.OutFile = $OutFile }
  try {
    if ($OutFile) { Invoke-WebRequest @p; return $null }
    $raw = (Invoke-WebRequest @p).Content
    if ($raw -is [byte[]]) { $raw = [System.Text.Encoding]::UTF8.GetString($raw) }
    try { return $raw | ConvertFrom-Json -DateKind String }
    catch { return $raw | ConvertFrom-Json }
  }
  catch {
    $resp = $_.Exception.Response
    $code = if ($resp) { [int]$resp.StatusCode } else { 0 }
    Fail ("请求失败 HTTP {0}：{1}`n{2}" -f $code, $_.Exception.Message, $uri) 1
  }
}

function Build-Query {
  param([hashtable]$Pairs)
  $parts = [System.Collections.Generic.List[string]]::new()
  foreach ($k in @('q', 'name', 'page', 'pageSize', 'reverse', 'cursor', 'start', 'end', 'noReplies')) {
    if (-not $Pairs.ContainsKey($k)) { continue }
    $v = $Pairs[$k]
    if ($null -eq $v -or "$v" -eq '') { continue }
    [void]$parts.Add("$k=$([uri]::EscapeDataString("$v"))")
  }
  if ($parts.Count -eq 0) { return '' }
  return '?' + ($parts -join '&')
}

function Format-Stamp {
  param($Value)
  if ($null -eq $Value) { return '' }
  $dto = [datetimeoffset]::MinValue
  if ($Value -is [datetimeoffset]) { $dto = $Value }
  elseif ($Value -is [datetime]) { $dto = [datetimeoffset]::new($Value) }
  else {
    $s = "$Value".Trim()
    if (-not $s) { return '' }
    $inv = [System.Globalization.CultureInfo]::InvariantCulture
    $styles = [System.Globalization.DateTimeStyles]::AllowWhiteSpaces
    # 推文时间戳是 Twitter 原生格式（Tue Sep 15 08:00:02 +0000 2026），不是 ISO；IG/用户是 ISO 8601
    if (-not [datetimeoffset]::TryParseExact($s, 'ddd MMM dd HH:mm:ss zzz yyyy', $inv, $styles, [ref]$dto)) {
      if (-not [datetimeoffset]::TryParse($s, $inv, $styles, [ref]$dto)) { return $s }
    }
  }
  return $dto.ToOffset($script:JstOffset).ToString('yyyy-MM-dd HH:mm')
}

# 归档里的正文保留了 HTML 实体（&amp; 等），人读模式下解码；--json 仍输出原始值。
function Format-Text {
  param($Text)
  $s = "$Text"
  if (-not $s) { return '' }
  return [System.Net.WebUtility]::HtmlDecode($s)
}

function Format-Tweet {
  param($Tweet, [int]$Index = 0)
  $who = if ($Tweet.user) { "@$($Tweet.user.screen_name) ($($Tweet.user.name))" } else { '?' }
  $head = if ($Index -gt 0) { "[$Index] $who" } else { $who }
  Write-Ui $head -Color Cyan
  $meta = [System.Collections.Generic.List[string]]::new()
  $stamp = Format-Stamp "$($Tweet.created_at)"
  if ($stamp) { [void]$meta.Add("$stamp JST") }
  if ($Tweet.lang) { [void]$meta.Add("lang=$($Tweet.lang)") }
  foreach ($pair in @(@('like_count', 'likes'), @('retweet_count', 'rt'), @('reply_count', 'replies'), @('view_count', 'views'))) {
    $n = $Tweet.($pair[0])
    if ($null -ne $n) { [void]$meta.Add("$($pair[1])=$n") }
  }
  if ($meta.Count -gt 0) { Write-Ui ('    ' + ($meta -join '  ')) -Color DarkGray }
  $text = Format-Text $Tweet.text
  if ($text) { Write-Ui "    $text" }
  if ($Tweet.url) { Write-Ui "    $($Tweet.url)" -Color DarkGray }
  $media = if ($null -eq $Tweet.media_details) { @() } else { @($Tweet.media_details) }
  if ($media.Count -gt 0) {
    Write-Ui "    media x$($media.Count)" -Color DarkGray
    $i = 0
    foreach ($m in $media) {
      $i++
      $mu = if ($m.media_url_https) { $m.media_url_https } else { $m.media_url }
      Write-Ui "      [$i] [$($m.type)] $mu" -Color DarkGray
    }
  }
  if ($Tweet.retweeted_original_id) { Write-Ui "    RT of $($Tweet.retweeted_original_id)" -Color DarkGray }
  if ($Tweet.quoted_tweet_id) { Write-Ui "    quote $($Tweet.quoted_tweet_id)" -Color DarkGray }
  Write-Ui ''
}

function Show-Page {
  param($Data, [string]$Label)
  $tweets = if ($null -eq $Data.data) { @() } else { @($Data.data) }
  $meta = $Data.meta
  Write-Ui "# $Label  → 本页 $($tweets.Count) 条" -Color Cyan
  if ($meta) {
    Write-Ui "    total=$($meta.total)  page=$($meta.page)  pageSize=$($meta.pageSize)  hasMore=$($meta.hasMore)" -Color DarkGray
  }
  Write-Ui ''
  $i = 0
  foreach ($t in $tweets) { $i++; Format-Tweet $t $i }
  if ($meta -and $meta.nextCursor) { Write-Ui "nextCursor: $($meta.nextCursor)" -Color Yellow }
  elseif ($meta -and $tweets.Count -gt 0) { Write-Ui '(无更多：nextCursor=null)' -Color DarkGray }
  if ($tweets.Count -eq 0) { Write-Ui '本页无结果（该用户可能未归档，或过滤条件过窄）' -Color Yellow }
}

function Show-TweetArray {
  param($Data, [string]$Label)
  $tweets = if ($null -eq $Data) { @() } else { @($Data) }
  Write-Ui "# $Label  → $($tweets.Count) 条" -Color Cyan
  Write-Ui ''
  $i = 0
  foreach ($t in $tweets) { $i++; Format-Tweet $t $i }
  if ($tweets.Count -eq 0) { Write-Ui '无结果' -Color Yellow }
}

function Show-User {
  param($User, [int]$Index = 0)
  $mark = if ($Index -gt 0) { "[$Index] " } else { '' }
  Write-Ui "$mark@$($User.userName)  $($User.fullName)" -Color Cyan
  Write-Ui "    followers=$($User.followersCount)  following=$($User.followingsCount)  statuses=$($User.statusesCount)  likes=$($User.likeCount)  verified=$($User.isVerified)" -Color DarkGray
  $extra = [System.Collections.Generic.List[string]]::new()
  if ($User.location) { [void]$extra.Add("location=$($User.location)") }
  $stamp = Format-Stamp $User.createdAt
  if ($stamp) { [void]$extra.Add("created=$stamp JST") }
  if ($extra.Count -gt 0) { Write-Ui "    $($extra -join '  ')" -Color DarkGray }
  $desc = Format-Text $User.description
  if ($desc) { Write-Ui "    $desc" }
  if ($User.pinnedTweets) { Write-Ui "    pinned: $(@($User.pinnedTweets) -join ', ')" -Color DarkGray }
}

function Invoke-Json {
  param($Data)
  $Data | ConvertTo-Json -Depth 12
}

function Show-TweetsViewerHelp {
  Write-Ui @'
用法: tweets-viewer.ps1 <命令> [参数...]

命令:
  tweets    <name>                              用户推文列表（全量归档，分页/游标）
  medias    <name>                              用户媒体推文（仅图片/视频，排除转推）
  search    "q" [--name U]                      关键词搜索（缺省全库，--name 限定用户）
  today     <name>                              单用户「那年今日」（历史同月同日）
  today-all                                     全量「那年今日」（跨用户，排除转推）
  stats     <name>                              归档按年统计（年份 + 条数）
  users                                         全部归档用户
  user      <name>                              单个归档用户信息
  ins       <name>                              Instagram 用户信息 + 帖子（name 为 X 用户名）
  image     [--name U] [--out FILE]             随机归档图片（+ 来源推文）
  status                                        服务状态与缓存条数
  help                                          显示本帮助

通用开关:
  --page N       页码，从 1 开始（默认 1）
  --size N       每页条数 1-100（默认 10）
  --cursor C     keyset 游标，滚动续载（优先于 --page）
  --reverse      排序方向：旧→新（默认新→旧）
  --start DATE   起始日期 YYYY-MM-DD
  --end DATE     结束日期 YYYY-MM-DD
  --no-replies   排除回复推文（仅 tweets）
  --name U       限定用户（仅 search / image）
  --out FILE     图片落盘路径（仅 image）
  --json         直接输出原始 JSON

参数说明:
  <name> 为 X Screen Name，约束 [A-Za-z0-9_]+；可直接粘贴 x.com 链接或 @句柄，脚本自动取出。
  时间戳默认按 JST（UTC+9）渲染；需要原始 UTC 字符串请加 --json。

示例:
  pwsh tweets-viewer.ps1 tweets ttisrn_0710 --size 20
  pwsh tweets-viewer.ps1 tweets https://x.com/ttisrn_0710 --start 2026-01-01 --end 2026-09-17
  pwsh tweets-viewer.ps1 medias ttisrn_0710 --size 30 --json
  pwsh tweets-viewer.ps1 search "こんびず" --name ttisrn_0710
  pwsh tweets-viewer.ps1 today-all --size 20
  pwsh tweets-viewer.ps1 stats ttisrn_0710
  pwsh tweets-viewer.ps1 user ttisrn_0710
  pwsh tweets-viewer.ps1 ins ttisrn_0710
  pwsh tweets-viewer.ps1 image --name ttisrn_0710 --out "$env:TEMP/random.jpg"
'@ -Color Gray
}

# ---------------------------------------------------------------- 分页开关

function Get-PageQuery {
  param($Flags, [switch]$AllowNoReplies, [switch]$AllowDate)
  $q = @{}
  if ($Flags['--page']) {
    $n = 0
    if (-not [int]::TryParse($Flags['--page'], [ref]$n) -or $n -lt 1) { Fail "--page 需为 >= 1 的整数（收到 $($Flags['--page'])）" }
    $q.page = $n
  }
  if ($Flags['--size']) {
    $n = 0
    if (-not [int]::TryParse($Flags['--size'], [ref]$n) -or $n -lt 1 -or $n -gt 100) { Fail "--size 需为 1-100 的整数（收到 $($Flags['--size'])）" }
    $q.pageSize = $n
  }
  if ($Flags['--cursor']) { $q.cursor = $Flags['--cursor'] }
  if ($Flags['--reverse']) { $q.reverse = 'true' }
  if ($AllowDate) {
    if ($Flags['--start']) { $q.start = $Flags['--start'] }
    if ($Flags['--end']) { $q.end = $Flags['--end'] }
  }
  if ($AllowNoReplies -and $Flags['--no-replies']) { $q.noReplies = 'true' }
  return $q
}

function Assert-DateRange {
  param($Flags)
  $s = [datetime]::MinValue
  $e = [datetime]::MinValue
  if ($Flags['--start'] -and -not [datetime]::TryParse($Flags['--start'], [ref]$s)) {
    Fail "--start 日期格式应为 YYYY-MM-DD（收到 $($Flags['--start'])）"
  }
  if ($Flags['--end'] -and -not [datetime]::TryParse($Flags['--end'], [ref]$e)) {
    Fail "--end 日期格式应为 YYYY-MM-DD（收到 $($Flags['--end'])）"
  }
  if ($Flags['--start'] -and $Flags['--end'] -and $s -gt $e) {
    Fail "--start 晚于 --end（$($Flags['--start']) > $($Flags['--end'])）"
  }
}

# ---------------------------------------------------------------- 命令

function Invoke-Tweets {
  param([string]$Name, $Flags)
  if (-not $Name) { Fail '用法: tweets-viewer.ps1 tweets <name> [--page N|--cursor C] [--size N] [--reverse] [--start D --end D] [--no-replies]' }
  $Name = Resolve-Name $Name
  Assert-DateRange $Flags
  $q = Get-PageQuery $Flags -AllowNoReplies -AllowDate
  $data = Invoke-TweetsApi -Path "/v3/tweets/get/$Name$(Build-Query $q)"
  if ($Flags['--json']) { Invoke-Json $data; return }
  Show-Page $data "推文 @$Name"
}

function Invoke-Medias {
  param([string]$Name, $Flags)
  if (-not $Name) { Fail '用法: tweets-viewer.ps1 medias <name> [--page N|--cursor C] [--size N] [--reverse] [--start D --end D]' }
  $Name = Resolve-Name $Name
  Assert-DateRange $Flags
  $q = Get-PageQuery $Flags -AllowDate
  $data = Invoke-TweetsApi -Path "/v3/tweets/medias/$Name$(Build-Query $q)"
  if ($Flags['--json']) { Invoke-Json $data; return }
  Show-Page $data "媒体 @$Name"
}

function Invoke-Search {
  param([string]$Query, $Flags)
  if (-not $Query) { Fail '用法: tweets-viewer.ps1 search "q" [--name U] [--page N|--cursor C] [--size N] [--reverse]' }
  $q = @{ q = $Query }
  if ($Flags['--name']) { $q.name = Resolve-Name $Flags['--name'] }
  foreach ($k in (Get-PageQuery $Flags).GetEnumerator()) { $q[$k.Key] = $k.Value }
  $data = Invoke-TweetsApi -Path "/v3/tweets/search$(Build-Query $q)"
  if ($Flags['--json']) { Invoke-Json $data; return }
  $scope = if ($q.name) { "@$($q.name)" } else { '全库' }
  Show-Page $data "搜索 [$scope] $Query"
}

function Invoke-Today {
  param([string]$Name, $Flags)
  if (-not $Name) { Fail '用法: tweets-viewer.ps1 today <name> [--page N|--cursor C] [--size N]' }
  $Name = Resolve-Name $Name
  $q = Get-PageQuery $Flags
  $data = Invoke-TweetsApi -Path "/v3/tweets/get/$Name/last-years-today$(Build-Query $q)"
  if ($Flags['--json']) { Invoke-Json $data; return }
  Show-Page $data "那年今日 @$Name"
}

function Invoke-TodayAll {
  param($Flags)
  $q = Get-PageQuery $Flags
  $data = Invoke-TweetsApi -Path "/v3/tweets/last-years-today$(Build-Query $q)"
  if ($Flags['--json']) { Invoke-Json $data; return }
  Show-Page $data '那年今日（全量）'
}

function Invoke-Stats {
  param([string]$Name, $Flags)
  if (-not $Name) { Fail '用法: tweets-viewer.ps1 stats <name>' }
  $Name = Resolve-Name $Name
  $data = Invoke-TweetsApi -Path "/v3/tweets/stats/$Name"
  if ($Flags['--json']) { Invoke-Json $data; return }
  $rows = if ($null -eq $data) { @() } else { @($data) }
  if ($rows.Count -eq 0) { Write-Ui "无归档记录（@$Name）" -Color Yellow; return }
  $total = ($rows | Measure-Object -Property count -Sum).Sum
  Write-Ui "# @$Name 归档统计  → $($rows.Count) 年 / 共 $total 条" -Color Cyan
  foreach ($r in $rows) {
    $bar = '*' * [Math]::Min(40, [Math]::Ceiling($r.count / [Math]::Max(1, $total / 40)))
    Write-Ui ("    {0}  {1,6}  {2}" -f $r.year, $r.count, $bar)
  }
}

function Invoke-Users {
  param($Flags)
  $data = Invoke-TweetsApi -Path '/v3/users/all'
  if ($Flags['--json']) { Invoke-Json $data; return }
  $users = if ($null -eq $data) { @() } else { @($data) }
  Write-Ui "# 归档用户  → $($users.Count) 个" -Color Cyan
  Write-Ui ''
  $i = 0
  foreach ($u in $users) { $i++; Show-User $u $i }
}

function Invoke-User {
  param([string]$Name, $Flags)
  if (-not $Name) { Fail '用法: tweets-viewer.ps1 user <name>' }
  $Name = Resolve-Name $Name
  $data = Invoke-TweetsApi -Path "/v3/users/get/$Name"
  if ($Flags['--json']) { Invoke-Json $data; return }
  if ($null -eq $data) { Write-Ui "无记录（@$Name，可能未归档）" -Color Yellow; return }
  Show-User $data
}

function Invoke-Ins {
  param([string]$Name, $Flags)
  if (-not $Name) { Fail '用法: tweets-viewer.ps1 ins <name>   （name 为 X 用户名，非 IG 用户名）' }
  $Name = Resolve-Name $Name
  $q = @{}
  if ($Flags['--page']) {
    $n = 0
    if (-not [int]::TryParse($Flags['--page'], [ref]$n) -or $n -lt 1) { Fail "--page 需为 >= 1 的整数（收到 $($Flags['--page'])）" }
    $q.page = $n
  }
  $data = Invoke-TweetsApi -Path "/v3/ins/$Name$(Build-Query $q)"
  if ($Flags['--json']) { Invoke-Json $data; return }
  $u = $data.user
  if ($u) {
    $counts = @()
    foreach ($pair in @(@('posts_count', 'posts'), @('followers_count', 'followers'), @('following_count', 'following'))) {
      $n = $u.($pair[0])
      if ($null -ne $n) { $counts += "$($pair[1])=$n" }
    }
    Write-Ui "@$($u.username)  $($u.fullname)  verified=$($u.verified)" -Color Cyan
    if ($counts.Count -gt 0) { Write-Ui "    $($counts -join '  ')" -Color DarkGray }
    if ($u.bio) { Write-Ui "    $(Format-Text $u.bio)" }
    if ($u.external_url) { Write-Ui "    $($u.external_url)" -Color DarkGray }
  }
  else {
    Write-Ui "无 IG 用户信息（@$Name 未映射 ins_json_data）" -Color Yellow
  }
  Write-Ui ''
  $posts = if ($null -eq $data.posts) { @() } else { @($data.posts.data) }
  $meta = $data.posts.meta
  Write-Ui "# IG 帖子 @$Name  → 本页 $($posts.Count) 条" -Color Cyan
  if ($meta) { Write-Ui "    total=$($meta.total)  page=$($meta.page)  pageSize=$($meta.pageSize)  hasMore=$($meta.hasMore)" -Color DarkGray }
  Write-Ui ''
  $i = 0
  foreach ($p in $posts) {
    $i++
    $stamp = Format-Stamp $p.created_at
    Write-Ui "[$i] $($p.type)  $stamp $(if ($stamp) { 'JST' })  $($p.url)" -Color Cyan
    Write-Ui "    likes=$($p.likes)  verified=$($p.verified)" -Color DarkGray
    if ($p.location_name) { Write-Ui "    location=$($p.location_name)" -Color DarkGray }
    if ($p.tags) { Write-Ui "    tags: $(@($p.tags) -join ', ')" -Color DarkGray }
    $desc = Format-Text $p.description
    if ($desc) { Write-Ui "    $desc" }
    $media = if ($null -eq $p.media) { @() } else { @($p.media) }
    foreach ($m in $media) {
      $mu = if ($m.video_url) { $m.video_url } else { $m.display_url }
      Write-Ui "    - [$($m.type)] $mu" -Color DarkGray
    }
    if ($p.audio) { Write-Ui "    audio: $($p.audio.title) — $($p.audio.artist)" -Color DarkGray }
    Write-Ui ''
  }
  if ($posts.Count -eq 0) { Write-Ui '无 IG 帖子（该用户未归档 IG 数据）' -Color Yellow }
  if ($meta -and $meta.nextCursor) { Write-Ui "nextCursor: $($meta.nextCursor)" -Color Yellow }
  elseif ($meta -and $posts.Count -gt 0) { Write-Ui '(无更多：nextCursor=null)' -Color DarkGray }
}

function Invoke-Image {
  param($Flags)
  $q = @{}
  if ($Flags['--name']) { $q.name = Resolve-Name $Flags['--name'] }
  $data = Invoke-TweetsApi -Path "/v3/image/get$(Build-Query $q)"
  if ($Flags['--json']) { Invoke-Json $data; return }
  if ($null -eq $data -or -not $data.url) { Write-Ui '未取到图片' -Color Yellow; return }
  Write-Ui "随机图片: $($data.url)" -Color Cyan
  if ($data.tweet) { Format-Tweet $data.tweet }
  if ($Flags['--out']) {
    $out = $Flags['--out']
    try {
      Invoke-WebRequest -Uri $data.url -OutFile $out -Headers @{ 'User-Agent' = $script:UA } -TimeoutSec 60
      Write-Ui "已保存: $out" -Color Green
    }
    catch { Fail "图片下载失败：$($_.Exception.Message)" 1 }
  }
}

function Invoke-Status {
  param($Flags)
  $data = Invoke-TweetsApi -Path '/'
  if ($Flags['--json']) { Invoke-Json $data; return }
  Write-Ui "$($data.message)  today=$(Format-Stamp $data.today) JST" -Color Cyan
  $props = @($data.tweetsSize.PSObject.Properties)
  if ($props.Count -eq 0) {
    Write-Ui '    tweetsSize 为空（该实例未暴露缓存统计）' -Color DarkGray
    return
  }
  Write-Ui "# 缓存用户  → $($props.Count) 个" -Color Cyan
  foreach ($p in ($props | Sort-Object Name)) { Write-Ui ("    {0,-24} {1,6}" -f $p.Name, $p.Value) }
}

$cmd = $Command.ToLower()
switch ($cmd) {
  'tweets' { $p = Split-Args $Rest; Invoke-Tweets $p.Positional[0] $p.Flags }
  'medias' { $p = Split-Args $Rest; Invoke-Medias $p.Positional[0] $p.Flags }
  'search' { $p = Split-Args $Rest; Invoke-Search $p.Positional[0] $p.Flags }
  'today' { $p = Split-Args $Rest; Invoke-Today $p.Positional[0] $p.Flags }
  'today-all' { $p = Split-Args $Rest; Invoke-TodayAll $p.Flags }
  'stats' { $p = Split-Args $Rest; Invoke-Stats $p.Positional[0] $p.Flags }
  'users' { $p = Split-Args $Rest; Invoke-Users $p.Flags }
  'user' { $p = Split-Args $Rest; Invoke-User $p.Positional[0] $p.Flags }
  'ins' { $p = Split-Args $Rest; Invoke-Ins $p.Positional[0] $p.Flags }
  'image' { $p = Split-Args $Rest; Invoke-Image $p.Flags }
  'status' { $p = Split-Args $Rest; Invoke-Status $p.Flags }
  'help' { Show-TweetsViewerHelp }
  '-h' { Show-TweetsViewerHelp }
  '--help' { Show-TweetsViewerHelp }
  default { Write-Ui "未知命令: $Command" -Color Red; Show-TweetsViewerHelp; exit 2 }
}
