# Registra o backup do CondoPlus no Agendador de Tarefas do Windows
# Execute UMA VEZ como Administrador

$scriptPath = "D:\sige-condo\backup-api-condoplus.mjs"
$taskName   = "CondoPlus-Backup-Diario"
$hora       = "02:00"

$action = New-ScheduledTaskAction `
    -Execute "node.exe" `
    -Argument "`"$scriptPath`""

$trigger = New-ScheduledTaskTrigger -Daily -At $hora

$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
    -StartWhenAvailable `
    -WakeToRun

Register-ScheduledTask `
    -TaskName $taskName `
    -Action   $action `
    -Trigger  $trigger `
    -Settings $settings `
    -RunLevel Highest `
    -Force

Write-Host "Tarefa '$taskName' registrada - executa todos os dias as $hora"
